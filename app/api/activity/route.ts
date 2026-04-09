import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getActivityLogs());
}
