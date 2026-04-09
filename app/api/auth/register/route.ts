import { NextRequest, NextResponse } from 'next/server';
import { registerUser, toSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = registerUser(body);
    return NextResponse.json(toSession(user), { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Registration failed' }, { status: 400 });
  }
}
