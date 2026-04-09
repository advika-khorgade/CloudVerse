import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/store';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  markNotificationRead(id);
  return NextResponse.json({ ok: true });
}
