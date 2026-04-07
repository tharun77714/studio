"use server";

import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { createSession, destroySession, getSessionUser, type SessionUser } from '@/lib/session';
import type { Profile } from '@/contexts/AuthContext';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapProfile(profileDoc: Record<string, any> | null): Profile | null {
  if (!profileDoc) {
    return null;
  }

  return ({
    ...profileDoc,
    id: String(profileDoc._id),
    _id: undefined,
  } as unknown) as Profile;
}

export async function signInWithEmailAction(email: string, password: string) {
  const db = await getDb();
  const normalizedEmail = normalizeEmail(email);
  const user = await db.collection<any>('users').findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return { error: { message: 'Invalid email or password.' } };
  }

  let passwordMatches = false;

  if (typeof user.passwordHash === 'string' && user.passwordHash.length > 0) {
    passwordMatches = await bcrypt.compare(password, user.passwordHash);
  } else if (typeof user.password === 'string') {
    passwordMatches = user.password === password;

    if (passwordMatches) {
      const newHash = await bcrypt.hash(password, 12);
      await db.collection<any>('users').updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash: newHash,
            updated_at: new Date().toISOString(),
          },
          $unset: {
            password: "",
          },
        }
      );
    }
  }

  if (!passwordMatches) {
    return { error: { message: 'Invalid email or password.' } };
  }

  await createSession({
    id: user._id.toHexString(),
    email: user.email,
    role: user.role,
  });

  return { error: null };
}

export async function signOutAction() {
  await destroySession();
}

export async function getCurrentSessionAction(): Promise<{ session: { user: SessionUser } | null; profile: Profile | null }> {
  const user = await getSessionUser();
  if (!user) {
    return { session: null, profile: null };
  }

  const db = await getDb();
  const profileDoc = await db.collection<any>('profiles').findOne({ _id: user.id });
  return {
    session: { user },
    profile: mapProfile(profileDoc),
  };
}
