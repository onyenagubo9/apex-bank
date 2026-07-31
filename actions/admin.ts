// actions/admin.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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