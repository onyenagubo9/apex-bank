'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { cards, ledgerAccounts, journalEntries, ledgerLines } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const CARD_PRICES = {
  virtual: 5.00,
  metal: 50.00,
};

// Fetch user's saved cards from database 💳
export async function getUserCards() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userCards = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, session.user.id));

    return userCards.map((card) => ({
      id: card.id,
      type: card.type as 'metal' | 'virtual',
      cardNumber: card.cardNumber,
      cardholderName: card.cardholderName,
      expiry: card.expiry,
      cvv: card.cvv,
      status: card.status as 'active' | 'frozen',
      spendLimit: parseFloat(card.spendLimit),
      spentThisMonth: parseFloat(card.spentThisMonth),
    }));
  } catch (err) {
    console.error('Failed to fetch user cards:', err);
    return [];
  }
}

// Fetch real user vaults from database 🏦
export async function getUserVaults() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userAccounts = await db
      .select({
        id: ledgerAccounts.id,
        name: ledgerAccounts.name,
        currency: ledgerAccounts.currency,
        balance: ledgerAccounts.balance,
      })
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.userId, session.user.id));

    return userAccounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      currency: acc.currency,
      balance: parseFloat(acc.balance),
    }));
  } catch (err) {
    console.error('Failed to fetch user vaults:', err);
    return [];
  }
}

// Purchase card, deduct balance, & log transaction 💳
export async function purchaseCard(formData: {
  ledgerAccountId: string;
  type: 'virtual' | 'metal';
  cardholderName: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized session. Please log in.' };
    }

    const userId = session.user.id;
    const { ledgerAccountId, type, cardholderName } = formData;
    const cardCost = CARD_PRICES[type];

    const [account] = await db
      .select()
      .from(ledgerAccounts)
      .where(
        and(
          eq(ledgerAccounts.id, ledgerAccountId),
          eq(ledgerAccounts.userId, userId)
        )
      );

    if (!account) {
      return { success: false, error: 'Selected vault account was not found.' };
    }

    const currentBalance = parseFloat(account.balance);
    if (currentBalance < cardCost) {
      return { 
        success: false, 
        error: `Insufficient balance in ${account.currency} vault. Required: $${cardCost.toFixed(2)}, Available: $${currentBalance.toFixed(2)}.` 
      };
    }

    // 1. Generate full 16-digit card number 🔢
    const prefix = type === 'metal' ? '4532' : '5412';
    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const rawNumber = `${prefix}${randomDigits}`;
    
    // 2. Format into 4-digit groupings (e.g., "4532 1234 5678 9012") 💳
    const formattedCardNumber = rawNumber.match(/.{1,4}/g)?.join(' ') || rawNumber;

    const cvv = Math.floor(100 + Math.random() * 900).toString();
    
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 3);
    const expiry = `${(expDate.getMonth() + 1).toString().padStart(2, '0')}/${expDate.getFullYear().toString().slice(-2)}`;

    await db.transaction(async (tx) => {
      // Deduct balance from vault 💰
      await tx
        .update(ledgerAccounts)
        .set({
          balance: sql`${ledgerAccounts.balance} - ${cardCost}`
        })
        .where(eq(ledgerAccounts.id, ledgerAccountId));

      // Log Journal Entry 📝
      const [journal] = await tx
        .insert(journalEntries)
        .values({
          idempotencyKey: crypto.randomUUID(),
          description: `Card Issuance Fee - ${type.toUpperCase()} Card`,
          status: 'posted',
        })
        .returning();

      // Log Ledger Line 📊
      await tx.insert(ledgerLines).values({
        journalEntryId: journal.id,
        ledgerAccountId: ledgerAccountId,
        type: 'debit',
        amount: cardCost.toFixed(4),
      });

      // Issue Card with visible card number 💳
      await tx.insert(cards).values({
        userId,
        ledgerAccountId,
        type,
        cardNumber: formattedCardNumber, // Full 16-digit formatted string stored
        cardholderName: cardholderName.toUpperCase(),
        expiry,
        cvv,
        status: 'active',
        spendLimit: type === 'metal' ? '50000.00' : '5000.00',
        spentThisMonth: '0.00',
      });
    });

    revalidatePath('/dashboard/cards');
    return { success: true, message: `Successfully purchased ${type} card for $${cardCost.toFixed(2)}!` };
  } catch (err) {
    console.error('Purchase card error:', err);
    return { success: false, error: 'Failed to complete card purchase. Please try again.' };
  }
}