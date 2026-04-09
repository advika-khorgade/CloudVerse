import { NextRequest, NextResponse } from 'next/server';
import { deleteRecipient } from '@/lib/store';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteRecipient(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
