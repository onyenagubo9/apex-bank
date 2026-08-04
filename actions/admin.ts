// actions/admin.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, auditLogs, siteVisitors } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function updateKycStatus(userId: string, status: 'approved' | 'rejected') {
  try {
    const session = await auth();

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
      .leftJoin(users, eq(sql`${auditLogs.userId}::text`, sql`${users.id}::text`))
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

// 🌐 Track site visitors for traffic telemetry
export async function trackVisitor(path: string) {
  try {
    const headerList = await headers();
    const rawUserAgent = headerList.get('user-agent') || '';
    
    const ipAddress = 
      headerList.get('cf-connecting-ip') || 
      headerList.get('x-client-ip') || 
      headerList.get('x-forwarded-for')?.split(',')[0].trim() || 
      headerList.get('x-real-ip') || 
      '127.0.0.1';

    await db.insert(siteVisitors).values({
      ipAddress,
      userAgent: rawUserAgent,
      path,
    });

    return { success: true };
  } catch (err) {
    // Fail silently to prevent disrupting site browsing experience
    return { success: false };
  }
}

// 📊 Fetch live site visitors for the admin visitor panel
export async function getSiteVisitors() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, visitors: [], error: 'Unauthorized: Admin privileges required.' };
    }

    const visitors = await db
      .select()
      .from(siteVisitors)
      .orderBy(desc(siteVisitors.createdAt))
      .limit(50);

    return { success: true, visitors };
  } catch (err: any) {
    console.error('Visitors Fetch Error:', err);
    return { success: false, visitors: [], error: err.message || 'Could not load visitor analytics.' };
  }
}