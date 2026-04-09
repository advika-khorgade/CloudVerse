import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const session = loginUser(email, password);
    return NextResponse.json(session);
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Login failed' }, { status: 401 });
  }
}
