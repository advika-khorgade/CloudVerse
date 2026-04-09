# Deployment Guide — OrganMatch

## Local Development (runs fully without AWS)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

The app uses an in-memory store (`lib/store.ts`) that mirrors DynamoDB logic exactly.
Data resets on server restart — perfect for demos and hackathons.

---

## AWS Production Deployment

### Prerequisites
- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`brew install aws-sam-cli` or https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20+

### Step 1 — Install Lambda dependencies

```bash
cd lambda
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
```

### Step 2 — Deploy backend with SAM

```bash
cd infrastructure
sam build
sam deploy --guided
# Follow prompts: stack name = organ-match, region = us-east-1 (or your choice)
# Note the ApiUrl output
```

### Step 3 — Point frontend to AWS API

Create `.env.local` in the project root:

```
NEXT_PUBLIC_API_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com/prod
```

Then update `lib/api.ts` — change:
```ts
const BASE = '/api';
```
to:
```ts
const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
```

### Step 4 — Deploy frontend (Vercel)

```bash
npm install -g vercel
vercel --prod
# Set NEXT_PUBLIC_API_URL in Vercel environment variables
```

---

## DynamoDB Tables Created Automatically

| Table        | Partition Key  |
|--------------|----------------|
| Donors       | donorId (S)    |
| Recipients   | recipientId (S)|
| Allocations  | allocationId (S)|

## EventBridge Expiry Checker

The `ExpiryCheckerFunction` runs every 15 minutes automatically via EventBridge.
It scans available donors and marks expired ones — no manual trigger needed.

## API Endpoints (AWS)

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| POST   | /addDonor       | Register a new donor     |
| POST   | /addRecipient   | Add recipient to waitlist|
| GET    | /getDonors      | List all donors          |
| GET    | /getRecipients  | List all recipients      |
| POST   | /allocateOrgan  | Run matching engine      |
| GET    | /allocations    | List all allocations     |
