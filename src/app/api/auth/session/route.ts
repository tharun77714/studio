import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ session: null, profile: null });
  }

  const db = await getDb();
  const profileDoc = await db.collection<any>('profiles').findOne({ _id: user.id });

  return NextResponse.json({
    session: { user },
    profile: profileDoc
      ? {
          ...profileDoc,
          id: String(profileDoc._id),
          _id: undefined,
        }
      : null,
  });
}
