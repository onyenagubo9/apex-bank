'use server';

import { db } from '@/lib/db';
import { users, ledgerAccounts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getAllUsersWithBalance() {
  try {
    const records = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        accountNumber: users.accountNumber,
        kycStatus: users.kycStatus,
        // COALESCE ensures users without accounts display '0.00' instead of null 💰
        balance: sql<string>`COALESCE(SUM(${ledgerAccounts.balance}), '0.00')`,
      })
      .from(users)
      .leftJoin(ledgerAccounts, eq(users.id, ledgerAccounts.userId))
      .groupBy(users.id); // Groups duplicate rows by unique user ID 🔑

    return { success: true, data: records };
  } catch (error: any) {
    console.error('Error fetching users with balances:', error);
    return { success: false, data: [] };
  }
}