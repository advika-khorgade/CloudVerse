import { NextRequest, NextResponse } from 'next/server';
import { deleteDonor } from '@/lib/store';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteDonor(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
