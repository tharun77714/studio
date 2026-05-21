import { NextResponse } from 'next/server';
import authDb from '@/lib/auth-db';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.expectedRole) {
      return NextResponse.json({ error: 'expectedRole is required.' }, { status: 400 });
    }
    const user = await authDb.signInUser(body.email, body.password, body.expectedRole);
    
    // Fetch profile to return along with session to prevent client-side race conditions
    const db = await getDb();
    const profileDoc = await db.collection<any>('profiles').findOne({ _id: user.id });
    const profile = profileDoc
      ? {
          ...profileDoc,
          id: String(profileDoc._id),
          _id: undefined,
        }
      : null;

    return NextResponse.json({
      session: { user },
      profile
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign in.' },
      { status: 400 }
    );
  }
}
