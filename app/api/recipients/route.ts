import { NextRequest, NextResponse } from 'next/server';
import { getRecipients, addRecipient } from '@/lib/store';
import { linkRecipientToUser } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json(await getRecipients());
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actorName, userId, ...data } = body;
    const recipient = await addRecipient({ ...data, userId }, actorName);
    if (userId) linkRecipientToUser(userId, recipient.recipientId);
    return NextResponse.json(recipient, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
