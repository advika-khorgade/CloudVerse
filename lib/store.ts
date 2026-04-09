/**
 * Data layer — all reads/writes go to AWS DynamoDB.
 * Matching engine logic is identical to the Lambda functions.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand, GetCommand, ScanCommand,
  UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './db';
import {
  Donor, Recipient, Allocation, Notification, ActivityLog,
  BLOOD_COMPATIBILITY, ORGAN_VIABILITY_HOURS, isAgeCompatible,
  OrganType, NotificationType,
} from './types';
import { calculateCityDistance, formatDistance, getDistanceCategory } from './geography';

// ─── In-memory only: notifications + activity logs ───────────────────────────
// These are ephemeral UI helpers — no need to persist in DynamoDB for local dev
let notifications: Notification[] = [];
let activityLogs:  ActivityLog[]  = [];

function pushNotification(
  type: NotificationType, title: string, message: string,
  severity: Notification['severity'], targetUserId?: string,
) {
  notifications.unshift({
    id: uuidv4(), type, title, message,
    timestamp: new Date().toISOString(),
    read: false, severity, targetUserId,
  });
  if (notifications.length > 100) notifications = notifications.slice(0, 100);
}

function pushLog(action: string, actor: string, details: string, severity: ActivityLog['severity'] = 'info') {
  activityLogs.unshift({
    logId: uuidv4(), action, actor, details,
    timestamp: new Date().toISOString(), severity,
  });
  if (activityLogs.length > 200) activityLogs = activityLogs.slice(0, 200);
}

// ─── Donors ───────────────────────────────────────────────────────────────────

export async function getDonors(): Promise<Donor[]> {
  await checkExpiry();
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.donors }));
  return (result.Items || []) as Donor[];
}

export async function addDonor(
  data: Omit<Donor, 'donorId' | 'timestamp' | 'expiryTime' | 'status'>,
  actorName = 'System',
): Promise<Donor> {
  const now = new Date();
  const expiryMs = ORGAN_VIABILITY_HOURS[data.organType as OrganType] * 3600 * 1000;
  const donor: Donor = {
    ...data,
    donorId:    uuidv4(),
    timestamp:  now.toISOString(),
    expiryTime: new Date(now.getTime() + expiryMs).toISOString(),
    status:     'available',
  };
  await ddb.send(new PutCommand({ TableName: TABLES.donors, Item: donor }));
  pushNotification('new_donor', 'New Organ Available',
    `${donor.organType} (${donor.bloodGroup}) registered in ${donor.location}`, 'info');
  pushLog('DONOR_REGISTERED', actorName, `${donor.organType} ${donor.bloodGroup} from ${donor.location}`);
  return donor;
}

export async function deleteDonor(donorId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.donors, Key: { donorId } }));
  pushLog('DONOR_DELETED', 'Admin', `Donor ${donorId} removed`);
}

// ─── Recipients ───────────────────────────────────────────────────────────────

export async function getRecipients(): Promise<Recipient[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.recipients }));
  return (result.Items || []) as Recipient[];
}

export async function addRecipient(
  data: Omit<Recipient, 'recipientId' | 'timestamp' | 'status'>,
  actorName = 'System',
): Promise<Recipient> {
  const recipient: Recipient = {
    ...data,
    recipientId: uuidv4(),
    timestamp:   new Date().toISOString(),
    status:      'waiting',
  };
  await ddb.send(new PutCommand({ TableName: TABLES.recipients, Item: recipient }));
  if (recipient.urgency >= 8) {
    pushNotification('new_recipient', '🚨 Critical Patient Added',
      `${recipient.requiredOrgan} needed urgently (${recipient.urgency}/10) in ${recipient.location}`, 'critical');
  }
  pushLog('RECIPIENT_ADDED', actorName, `${recipient.requiredOrgan} ${recipient.bloodGroup}, urgency ${recipient.urgency}`);
  return recipient;
}

export async function deleteRecipient(recipientId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.recipients, Key: { recipientId } }));
  pushLog('RECIPIENT_DELETED', 'Admin', `Recipient ${recipientId} removed`);
}

// ─── Allocations ──────────────────────────────────────────────────────────────

export async function getAllocations(): Promise<Allocation[]> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLES.allocations }));
  return (result.Items || []) as Allocation[];
}

/**
 * Core matching engine — rule-based, deterministic, no ML.
 *
 * Priority Score = (urgency × 1000) - (waitingHours × 10) - (distanceKm × 0.1)
 * Uses DynamoDB conditional writes to prevent race conditions.
 */
export async function allocateOrgan(donorId: string, actorName = 'System'): Promise<Allocation> {
  await checkExpiry();

  // 1. Fetch donor
  const donorResult = await ddb.send(new GetCommand({ TableName: TABLES.donors, Key: { donorId } }));
  const donor = donorResult.Item as Donor | undefined;
  if (!donor) throw new Error('Donor not found');
  if (donor.status !== 'available') throw new Error(`Donor is ${donor.status}`);

  // 2. Scan for compatible recipients
  const recipResult = await ddb.send(new ScanCommand({
    TableName: TABLES.recipients,
    FilterExpression: '#s = :waiting',
    ExpressionAttributeNames:  { '#s': 'status' },
    ExpressionAttributeValues: { ':waiting': 'waiting' },
  }));

  const compatibleBloodGroups = BLOOD_COMPATIBILITY[donor.bloodGroup];
  const candidates = ((recipResult.Items || []) as Recipient[]).filter(r =>
    r.requiredOrgan === donor.organType &&
    compatibleBloodGroups.includes(r.bloodGroup) &&
    isAgeCompatible(donor.age, r.age),
  );

  if (candidates.length === 0) throw new Error('No compatible recipients found');

  // 3. Score each candidate
  const now = Date.now();
  const scored = candidates.map(r => {
    const waitingHours = (now - new Date(r.timestamp).getTime()) / 3600000;
    const distanceKm   = calculateCityDistance(donor.location, r.location) ?? 9999;
    const score        = (r.urgency * 1000) - (waitingHours * 10) - (distanceKm * 0.1);
    return { recipient: r, score, distanceKm, waitingHours };
  });
  scored.sort((a, b) => b.score - a.score);
  const { recipient: winner, score: winnerScore, distanceKm: winnerDistance } = scored[0];

  // 4. Atomic conditional writes — prevent double allocation
  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLES.donors,
      Key: { donorId },
      UpdateExpression:    'SET #s = :allocated',
      ConditionExpression: '#s = :available',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: { ':allocated': 'allocated', ':available': 'available' },
    }));
    await ddb.send(new UpdateCommand({
      TableName: TABLES.recipients,
      Key: { recipientId: winner.recipientId },
      UpdateExpression:    'SET #s = :allocated',
      ConditionExpression: '#s = :waiting',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: { ':allocated': 'allocated', ':waiting': 'waiting' },
    }));
  } catch {
    throw new Error('Concurrent allocation conflict – retry');
  }

  // 5. Build allocation record with full transparency
  const ageDiff = winner.age - donor.age;
  const ageNote = ageDiff >= 0
    ? `Younger donor (${donor.age}) → older recipient (${winner.age}), gap ${ageDiff}yr`
    : `Older donor (${donor.age}) → younger recipient (${winner.age}), gap ${Math.abs(ageDiff)}yr ≤ 10yr`;

  const distCat  = getDistanceCategory(winnerDistance);
  const distNote = winnerDistance >= 9999
    ? 'Distance: unknown (city not in database)'
    : distCat === 'same'
    ? `Same location (${donor.location})`
    : `Distance: ${formatDistance(winnerDistance)} (${distCat})`;

  const updatedDonor     = { ...donor,  status: 'allocated' as const };
  const updatedRecipient = { ...winner, status: 'allocated' as const };

  const allocation: Allocation = {
    allocationId: uuidv4(),
    donorId:      donor.donorId,
    recipientId:  winner.recipientId,
    organType:    donor.organType,
    timestamp:    new Date().toISOString(),
    reason: {
      urgency:              winner.urgency,
      waitingTime:          winner.timestamp,
      distanceKm:           winnerDistance < 9999 ? Math.round(winnerDistance) : undefined,
      priorityScore:        Math.round(winnerScore),
      compatibilityFactors: [
        `Blood group compatible (${donor.bloodGroup} → ${winner.bloodGroup})`,
        `Organ type match (${donor.organType})`,
        ageNote,
        distNote,
        `Priority score: ${Math.round(winnerScore)}`,
      ],
    },
    donor:     updatedDonor,
    recipient: updatedRecipient,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.allocations, Item: allocation }));

  const distDisplay = winnerDistance < 9999 ? ` · ${formatDistance(winnerDistance)} away` : '';
  pushNotification('allocation', '✅ Organ Allocated',
    `${donor.organType} matched to recipient in ${winner.location}${distDisplay} (urgency ${winner.urgency}/10)`,
    'success', winner.userId);
  pushLog('ORGAN_ALLOCATED', actorName,
    `${donor.organType} ${donor.bloodGroup} → ${winner.location}${distDisplay}, urgency ${winner.urgency}, score ${Math.round(winnerScore)}`,
    'info');

  return allocation;
}

// ─── Notifications (in-memory) ────────────────────────────────────────────────

export function getNotifications(userId?: string): Notification[] {
  if (!userId) return notifications;
  return notifications.filter(n => !n.targetUserId || n.targetUserId === userId);
}

export function markNotificationRead(id: string): void {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) notifications[idx] = { ...notifications[idx], read: true };
}

export function markAllRead(): void {
  notifications = notifications.map(n => ({ ...n, read: true }));
}

// ─── Activity Log (in-memory) ─────────────────────────────────────────────────

export function getActivityLogs(): ActivityLog[] {
  return activityLogs;
}

// ─── Expiry checker ───────────────────────────────────────────────────────────

export async function checkExpiry(): Promise<void> {
  const now = new Date().toISOString();

  // Scan for available donors whose expiryTime has passed
  const result = await ddb.send(new ScanCommand({
    TableName: TABLES.donors,
    FilterExpression: '#s = :available AND expiryTime <= :now',
    ExpressionAttributeNames:  { '#s': 'status' },
    ExpressionAttributeValues: { ':available': 'available', ':now': now },
  }));

  const expired = (result.Items || []) as Donor[];
  await Promise.all(expired.map(d =>
    ddb.send(new UpdateCommand({
      TableName: TABLES.donors,
      Key: { donorId: d.donorId },
      UpdateExpression:    'SET #s = :expired',
      ConditionExpression: '#s = :available',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: { ':expired': 'expired', ':available': 'available' },
    })).catch(() => null), // ignore if already changed
  ));

  expired.forEach(d => {
    pushNotification('expiry', '⏰ Organ Expired',
      `${d.organType} (${d.bloodGroup}) from ${d.location} has expired`, 'warning');
    pushLog('ORGAN_EXPIRED', 'System', `${d.organType} ${d.bloodGroup} from ${d.location}`, 'warning');
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
  await checkExpiry();
  const [donorResult, recipResult, allocResult] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: TABLES.donors })),
    ddb.send(new ScanCommand({ TableName: TABLES.recipients })),
    ddb.send(new ScanCommand({ TableName: TABLES.allocations })),
  ]);

  const donors     = (donorResult.Items  || []) as Donor[];
  const recipients = (recipResult.Items  || []) as Recipient[];
  const allocs     = (allocResult.Items  || []) as Allocation[];

  return {
    totalDonors:          donors.length,
    availableDonors:      donors.filter(d => d.status === 'available').length,
    allocatedDonors:      donors.filter(d => d.status === 'allocated').length,
    expiredDonors:        donors.filter(d => d.status === 'expired').length,
    totalRecipients:      recipients.length,
    waitingRecipients:    recipients.filter(r => r.status === 'waiting').length,
    allocatedRecipients:  recipients.filter(r => r.status === 'allocated').length,
    totalAllocations:     allocs.length,
    criticalRecipients:   recipients.filter(r => r.status === 'waiting' && r.urgency >= 8).length,
    allocationRate:       donors.length > 0
      ? Math.round((allocs.length / donors.length) * 100) : 0,
  };
}
