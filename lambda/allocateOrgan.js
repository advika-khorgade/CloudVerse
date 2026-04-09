/**
 * Lambda: POST /allocateOrgan
 *
 * Core matching engine — rule-based, deterministic, no ML.
 *
 * Priority Score Formula:
 *   score = (urgency × 1000) - (waitingHours × 10) - (distanceKm × 0.1)
 *
 * Urgency dominates. Waiting time is second. Distance is a soft tiebreaker.
 * A 1-point urgency difference = 1000 score points.
 * 100km distance difference = 10 score points (only matters in ties).
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { isBloodCompatible, isAgeCompatible } = require('./shared/compatibility');
const { calculateCityDistance, formatDistance, getDistanceCategory } = require('./shared/geography');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const DONORS_TABLE      = process.env.DONORS_TABLE      || 'Donors';
const RECIPIENTS_TABLE  = process.env.RECIPIENTS_TABLE  || 'Recipients';
const ALLOCATIONS_TABLE = process.env.ALLOCATIONS_TABLE || 'Allocations';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  try {
    const { donorId } = JSON.parse(event.body || '{}');
    if (!donorId) return { statusCode: 400, headers, body: JSON.stringify({ message: 'donorId required' }) };

    // ── Step 1: Get donor ──────────────────────────────────────────────────────
    const donorResult = await ddb.send(new GetCommand({ TableName: DONORS_TABLE, Key: { donorId } }));
    const donor = donorResult.Item;
    if (!donor) return { statusCode: 404, headers, body: JSON.stringify({ message: 'Donor not found' }) };
    if (donor.status !== 'available') {
      return { statusCode: 400, headers, body: JSON.stringify({ message: `Donor is ${donor.status}` }) };
    }

    // ── Step 2: Scan for compatible recipients ─────────────────────────────────
    const recipResult = await ddb.send(new ScanCommand({
      TableName: RECIPIENTS_TABLE,
      FilterExpression: '#s = :waiting',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':waiting': 'waiting' },
    }));

    const candidates = (recipResult.Items || []).filter(r =>
      r.requiredOrgan === donor.organType &&
      isBloodCompatible(donor.bloodGroup, r.bloodGroup) &&
      isAgeCompatible(donor.age, r.age)
    );

    if (candidates.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'No compatible recipients found' }) };
    }

    // ── Step 3: Score each candidate ──────────────────────────────────────────
    // Formula: score = (urgency × 1000) - (waitingHours × 10) - (distanceKm × 0.1)
    const now = Date.now();
    const scored = candidates.map(r => {
      const waitingHours = (now - new Date(r.timestamp).getTime()) / 3600000;
      const distanceKm = calculateCityDistance(donor.location, r.location) ?? 9999;
      const score = (r.urgency * 1000) - (waitingHours * 10) - (distanceKm * 0.1);
      return { recipient: r, score, distanceKm, waitingHours };
    });

    // Sort by score DESC — highest score wins
    scored.sort((a, b) => b.score - a.score);
    const { recipient: winner, score: winnerScore, distanceKm: winnerDistance } = scored[0];

    // ── Step 4: Atomic conditional writes ─────────────────────────────────────
    try {
      await ddb.send(new UpdateCommand({
        TableName: DONORS_TABLE,
        Key: { donorId },
        UpdateExpression: 'SET #s = :allocated',
        ConditionExpression: '#s = :available',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':allocated': 'allocated', ':available': 'available' },
      }));

      await ddb.send(new UpdateCommand({
        TableName: RECIPIENTS_TABLE,
        Key: { recipientId: winner.recipientId },
        UpdateExpression: 'SET #s = :allocated',
        ConditionExpression: '#s = :waiting',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':allocated': 'allocated', ':waiting': 'waiting' },
      }));
    } catch {
      return { statusCode: 409, headers, body: JSON.stringify({ message: 'Concurrent allocation conflict – retry' }) };
    }

    // ── Step 5: Build allocation record with full transparency ─────────────────
    const ageDiff = winner.age - donor.age;
    const ageNote = ageDiff >= 0
      ? `Younger donor (${donor.age}) → older recipient (${winner.age}), gap ${ageDiff}yr`
      : `Older donor (${donor.age}) → younger recipient (${winner.age}), gap ${Math.abs(ageDiff)}yr ≤ 10yr`;

    const distCat = getDistanceCategory(winnerDistance);
    const distNote = winnerDistance >= 9999
      ? 'Distance: unknown (city not in database)'
      : distCat === 'same'
      ? `Same location (${donor.location})`
      : `Distance: ${formatDistance(winnerDistance)} (${distCat})`;

    const factors = [
      `Blood group compatible (${donor.bloodGroup} → ${winner.bloodGroup})`,
      `Organ type match (${donor.organType})`,
      ageNote,
      distNote,
      `Priority score: ${Math.round(winnerScore)}`,
    ];

    const allocation = {
      allocationId: uuidv4(),
      donorId:      donor.donorId,
      recipientId:  winner.recipientId,
      organType:    donor.organType,
      timestamp:    new Date().toISOString(),
      reason: {
        urgency:              winner.urgency,
        waitingTime:          winner.timestamp,
        compatibilityFactors: factors,
        distanceKm:           winnerDistance < 9999 ? Math.round(winnerDistance) : undefined,
        priorityScore:        Math.round(winnerScore),
      },
      donor,
      recipient: winner,
    };

    await ddb.send(new PutCommand({ TableName: ALLOCATIONS_TABLE, Item: allocation }));

    return { statusCode: 201, headers, body: JSON.stringify(allocation) };
  } catch (err) {
    console.error('allocateOrgan error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: err.message }) };
  }
};
