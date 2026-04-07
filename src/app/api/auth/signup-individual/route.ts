import { NextResponse } from 'next/server';
import authDb from '@/lib/auth-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await authDb.createIndividualUser(body);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign up.' },
      { status: 400 }
    );
  }
}
