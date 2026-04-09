/**
 * Lambda: POST /addRecipient
 * Adds a recipient to the waiting list in DynamoDB.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.RECIPIENTS_TABLE || 'Recipients';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { requiredOrgan, bloodGroup, age, location, urgency } = body;

    if (!requiredOrgan || !bloodGroup || !age || !location || urgency === undefined) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing required fields' }) };
    }

    const recipient = {
      recipientId:  uuidv4(),
      requiredOrgan,
      bloodGroup,
      age:          Number(age),
      location,
      urgency:      Number(urgency),
      timestamp:    new Date().toISOString(),
      status:       'waiting',
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: recipient }));

    return { statusCode: 201, headers, body: JSON.stringify(recipient) };
  } catch (err) {
    console.error('addRecipient error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: err.message }) };
  }
};
