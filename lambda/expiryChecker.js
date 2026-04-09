/**
 * Lambda: Expiry Checker
 * Triggered by EventBridge rule (e.g., every 15 minutes).
 * Scans all available donors and marks expired ones.
 *
 * EventBridge rule (CloudFormation / console):
 *   Schedule: rate(15 minutes)
 *   Target: this Lambda ARN
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DONORS_TABLE || 'Donors';

exports.handler = async () => {
  const now = new Date().toISOString();

  // Scan for available donors whose expiryTime has passed
  const result = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: '#s = :available AND expiryTime <= :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':available': 'available', ':now': now },
  }));

  const expired = result.Items || [];
  console.log(`Expiry check: ${expired.length} organ(s) to expire`);

  // Mark each as expired (conditional to avoid overwriting allocated)
  await Promise.all(expired.map(donor =>
    ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { donorId: donor.donorId },
      UpdateExpression: 'SET #s = :expired',
      ConditionExpression: '#s = :available',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':expired': 'expired', ':available': 'available' },
    })).catch(e => console.warn(`Skipped ${donor.donorId}: ${e.message}`))
  ));

  return { expired: expired.length };
};
