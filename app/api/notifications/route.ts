import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/store';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  return NextResponse.json(getNotifications(userId));
}
