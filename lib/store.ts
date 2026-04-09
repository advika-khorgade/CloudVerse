/**
 * In-memory store that simulates DynamoDB for local development.
 * In production, replace all functions here with actual DynamoDB SDK calls.
 * Each function mirrors the Lambda handler logic exactly.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Donor, Recipient, Allocation,
  BLOOD_COMPATIBILITY, ORGAN_VIABILITY_HOURS,
  OrganType,
} from './types';

// ─── Tables (in-memory) ───────────────────────────────────────────────────────
let donors: Donor[] = [];
let recipients: Recipient[] = [];
let allocations: Allocation[] = [];

// ─── Donors ───────────────────────────────────────────────────────────────────
export function getDonors(): Donor[] {
  checkExpiry(); // lazily expire donors on every read
  return donors;
}

export function addDonor(data: Omit<Donor, 'donorId' | 'timestamp' | 'expiryTime' | 'status'>): Donor {
  const now = new Date();
  const expiryMs = ORGAN_VIABILITY_HOURS[data.organType as OrganType] * 60 * 60 * 1000;
  const donor: Donor = {
    ...data,
    donorId: uuidv4(),
    timestamp: now.toISOString(),
    expiryTime: new Date(now.getTime() + expiryMs).toISOString(),
    status: 'available',
  };
  donors.push(donor);
  return donor;
}

// ─── Recipients ───────────────────────────────────────────────────────────────
export function getRecipients(): Recipient[] {
  return recipients;
}

export function addRecipient(data: Omit<Recipient, 'recipientId' | 'timestamp' | 'status'>): Recipient {
  const recipient: Recipient = {
    ...data,
    recipientId: uuidv4(),
    timestamp: new Date().toISOString(),
    status: 'waiting',
  };
  recipients.push(recipient);
  return recipient;
}

// ─── Allocations ──────────────────────────────────────────────────────────────
export function getAllocations(): Allocation[] {
  return allocations;
}

/**
 * Core matching + allocation engine (rule-based, deterministic).
 * Mirrors the Lambda allocateOrgan handler.
 */
export function allocateOrgan(donorId: string): Allocation {
  checkExpiry();

  // 1. Find the donor
  const donor = donors.find(d => d.donorId === donorId);
  if (!donor) throw new Error('Donor not found');
  if (donor.status !== 'available') throw new Error(`Donor is ${donor.status}`);

  // 2. Find compatible recipients
  const compatibleBloodGroups = BLOOD_COMPATIBILITY[donor.bloodGroup];
  const candidates = recipients.filter(r =>
    r.status === 'waiting' &&
    r.requiredOrgan === donor.organType &&
    compatibleBloodGroups.includes(r.bloodGroup) &&
    Math.abs(r.age - donor.age) <= 15
  );

  if (candidates.length === 0) throw new Error('No compatible recipients found');

  // 3. Priority sort: urgency DESC, then timestamp ASC (longest wait first)
  const sorted = [...candidates].sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const winner = sorted[0];

  // 4. Atomic update (conditional – simulate DynamoDB conditional write)
  const donorIdx = donors.findIndex(d => d.donorId === donorId && d.status === 'available');
  const recipIdx = recipients.findIndex(r => r.recipientId === winner.recipientId && r.status === 'waiting');
  if (donorIdx === -1 || recipIdx === -1) throw new Error('Concurrent allocation conflict – retry');

  donors[donorIdx] = { ...donors[donorIdx], status: 'allocated' };
  recipients[recipIdx] = { ...recipients[recipIdx], status: 'allocated' };

  // 5. Build compatibility reason
  const factors: string[] = [];
  factors.push(`Blood group compatible (${donor.bloodGroup} → ${winner.bloodGroup})`);
  factors.push(`Organ type match (${donor.organType})`);
  factors.push(`Age difference: ${Math.abs(winner.age - donor.age)} years`);
  if (donor.location === winner.location) factors.push(`Same location (${donor.location})`);

  const allocation: Allocation = {
    allocationId: uuidv4(),
    donorId: donor.donorId,
    recipientId: winner.recipientId,
    organType: donor.organType,
    timestamp: new Date().toISOString(),
    reason: {
      urgency: winner.urgency,
      waitingTime: winner.timestamp,
      compatibilityFactors: factors,
    },
    donor: donors[donorIdx],
    recipient: recipients[recipIdx],
  };

  allocations.push(allocation);
  return allocation;
}

// ─── Expiry checker (simulates EventBridge/CloudWatch trigger) ────────────────
export function checkExpiry(): void {
  const now = Date.now();
  donors = donors.map(d => {
    if (d.status === 'available' && new Date(d.expiryTime).getTime() <= now) {
      return { ...d, status: 'expired' };
    }
    return d;
  });
}
