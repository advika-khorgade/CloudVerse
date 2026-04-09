import { NextRequest, NextResponse } from 'next/server';
import { allocateOrgan } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { donorId, actorName } = await req.json();
    if (!donorId) return NextResponse.json({ message: 'donorId required' }, { status: 400 });
    const allocation = await allocateOrgan(donorId, actorName);
    return NextResponse.json(allocation, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
