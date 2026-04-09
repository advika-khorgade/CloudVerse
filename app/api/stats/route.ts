import { NextResponse } from 'next/server';
import { getStats } from '@/lib/store';

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
