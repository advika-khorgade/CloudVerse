import { NextResponse } from 'next/server';
import { markAllRead } from '@/lib/store';

export async function POST() {
  markAllRead();
  return NextResponse.json({ ok: true });
}
