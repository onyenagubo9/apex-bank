'use server';

import { db } from '@/lib/db';
import { kycVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface SubmitKycParams {
  userId: string;
  fullName: string;
  idType: string;
  idNumber: string;
  documentUrl: string;
  userImageUrl: string;
}

// 1. Fetch KYC status for a user 📥
export async function getKycStatus(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is missing.');
    }

    const [record] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId));

    return { success: true, kyc: record || null };
  } catch (error: any) {
    console.error('Error fetching KYC status:', error);
    return { success: false, error: error.message || 'Failed to load KYC status.' };
  }
}

// 2. Submit or update KYC request 🛡️
export async function submitKyc(params: SubmitKycParams) {
  try {
    if (!params.userId) {
      throw new Error('User ID is required for KYC submission.');
    }

    const [existing] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, params.userId));

    if (existing) {
      // Update existing submission (e.g., if re-submitting after a rejection)
      await db
        .update(kycVerifications)
        .set({
          fullName: params.fullName,
          idType: params.idType,
          idNumber: params.idNumber,
          documentUrl: params.documentUrl,
          userImageUrl: params.userImageUrl,
          status: 'pending',
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(kycVerifications.userId, params.userId));
    } else {
      // Insert new KYC submission
      await db.insert(kycVerifications).values({
        userId: params.userId,
        fullName: params.fullName,
        idType: params.idType,
        idNumber: params.idNumber,
        documentUrl: params.documentUrl,
        userImageUrl: params.userImageUrl,
        status: 'pending',
      });
    }

    revalidatePath('/dashboard/kyc');
    return { success: true, message: 'KYC documents submitted successfully!' };
  } catch (error: any) {
    console.error('Error in submitKyc:', error);
    return { success: false, error: error.message || 'Failed to submit KYC.' };
  }
}