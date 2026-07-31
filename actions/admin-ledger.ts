'use server';

import { db } from '@/lib/db';
import { journalEntries, ledgerLines, ledgerAccounts, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addFundsToUserAccount(formData: {
  userId: string;
  amount: string;
  description?: string;
}) {
  try {
    const numericAmount = parseFloat(formData.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: 'Please enter a valid amount greater than zero.' };
    }

    // 1. Locate or create target user's ledger account
    let [userLedgerAccount] = await db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.userId, formData.userId));

    if (!userLedgerAccount) {
      const [user] = await db.select().from(users).where(eq(users.id, formData.userId));
      if (!user) return { success: false, error: 'User does not exist.' };

      [userLedgerAccount] = await db
        .insert(ledgerAccounts)
        .values({
          userId: user.id,
          accountNumber: user.accountNumber,
          name: `${user.name}'s Primary Account`,
          category: 'liability',
          currency: 'USD',
          balance: '0.00',
        })
        .returning();
    }

    // 2. Perform atomic transaction: Add journal entry, ledger line, AND update balance 🛡️
    await db.transaction(async (tx) => {
      // Create journal entry 📝
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          idempotencyKey: `admin-credit-${formData.userId}-${Date.now()}`,
          description: formData.description || 'Admin Balance Adjustment',
          status: 'posted',
        })
        .returning();

      // Record credit ledger line 📈
      await tx.insert(ledgerLines).values({
        journalEntryId: entry.id,
        ledgerAccountId: userLedgerAccount.id,
        type: 'credit',
        amount: formData.amount,
      });

      // Increment cached balance on ledger_accounts 💰
      await tx
        .update(ledgerAccounts)
        .set({
          balance: sql`${ledgerAccounts.balance} + ${formData.amount}::numeric`,
        })
        .where(eq(ledgerAccounts.id, userLedgerAccount.id));
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding funds:', err);
    return { success: false, error: err.message || 'Failed to deposit funds.' };
  }
}