/**
 * Shared DynamoDB client — used by all store functions.
 * Credentials come from .env.local (local dev) or IAM role (production).
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  // In local dev, credentials are picked up from .env.local automatically
  // In production (Lambda/EC2), IAM role is used — no keys needed
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export const TABLES = {
  donors:      process.env.DYNAMODB_DONORS_TABLE      || 'Donors',
  recipients:  process.env.DYNAMODB_RECIPIENTS_TABLE  || 'Recipients',
  allocations: process.env.DYNAMODB_ALLOCATIONS_TABLE || 'Allocations',
};
