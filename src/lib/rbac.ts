import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/session';

export async function requireRole(expectedRole: 'individual' | 'business') {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('You must be signed in to perform this action.');
  }

  if (sessionUser.role !== expectedRole) {
    throw new Error(`Unauthorized. This action requires ${expectedRole} privileges.`);
  }

  return sessionUser;
}

export async function auditLogCrossPortal(
  identifier: string,
  provider: 'email' | 'google' | 'phone',
  expectedRole: string,
  actualRole: string
) {
  try {
    const db = await getDb();
    await db.collection<any>('audit_logs').insertOne({
      event: 'CROSS_PORTAL_ATTEMPT',
      identifier,
      provider,
      expected_role: expectedRole,
      actual_role: actualRole,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log for cross-portal attempt:', err);
  }
}

export function getRoleMismatchErrorMessage(expectedRole: string): string {
  if (expectedRole === 'business') {
    return 'This account belongs to an Individual account. Please use the Individual login portal.';
  }
  return 'This account belongs to a Business account. Please use the Business login portal.';
}
