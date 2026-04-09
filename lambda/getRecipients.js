/**
 * Lambda: GET /getRecipients
 * Returns all recipients from DynamoDB.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.RECIPIENTS_TABLE || 'Recipients';

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async () => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
    return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
  } catch (err) {
    console.error('getRecipients error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: err.message }) };
  }
};
