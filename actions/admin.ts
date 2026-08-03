// actions/admin.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateKycStatus(userId: string, status: 'approved' | 'rejected') {
  try {
    const session = await auth();

    // Guard: Only admin users can perform KYC updates
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    await db
      .update(users)
      .set({ kycStatus: status })
      .where(eq(users.id, userId));

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('KYC Update Error:', err);
    return { success: false, error: err.message || 'Failed to update KYC status.' };
  }
}

export async function getAuditLogs() {
  try {
    const session = await auth();

    // Guard: Only admin users can view security logs
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, logs: [], error: 'Unauthorized: Admin privileges required.' };
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userEmail: users.email,
        action: auditLogs.action,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    return { success: true, logs };
  } catch (err: any) {
    console.error('Audit Logs Fetch Error:', err);
    return { success: false, logs: [], error: err.message || 'Could not load audit trails.' };
  }
}

export async function toggleUserSuspension(userId: string, suspend: boolean) {
  try {
    const session = await auth();

    // Guard: Only admin users can suspend or activate user accounts
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    await db
      .update(users)
      .set({ isSuspended: suspend })
      .where(eq(users.id, userId));

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('Suspension Error:', err);
    return { success: false, error: err.message || 'Failed to update account status.' };
  }
}