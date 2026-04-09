/**
 * Lambda: POST /addDonor
 * Stores a new donor in DynamoDB with auto-generated ID, timestamp, and expiry.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { getExpiryTime } = require('./shared/compatibility');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DONORS_TABLE || 'Donors';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { organType, bloodGroup, age, location } = body;

    if (!organType || !bloodGroup || !age || !location) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing required fields' }) };
    }

    const now = new Date();
    const donor = {
      donorId:    uuidv4(),
      organType,
      bloodGroup,
      age:        Number(age),
      location,
      timestamp:  now.toISOString(),
      expiryTime: getExpiryTime(organType, now),
      status:     'available',
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: donor }));

    return { statusCode: 201, headers, body: JSON.stringify(donor) };
  } catch (err) {
    console.error('addDonor error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: err.message }) };
  }
};
