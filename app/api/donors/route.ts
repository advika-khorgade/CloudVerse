import { NextRequest, NextResponse } from 'next/server';
import { getDonors, addDonor } from '@/lib/store';
import { linkDonorToUser } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json(await getDonors());
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actorName, userId, ...data } = body;
    const donor = await addDonor({ ...data, userId }, actorName);
    if (userId) linkDonorToUser(userId, donor.donorId);
    return NextResponse.json(donor, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
