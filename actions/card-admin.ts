'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { cards, users, ledgerAccounts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm'; // 👈 Added 'sql' import here
import { revalidatePath } from 'next/cache';

// 1. Fetch ALL issued cards for Admin view 🛡️
export async function getAllCardsForAdmin() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return [];
    }

    const allCards = await db
      .select({
        id: cards.id,
        userId: cards.userId,
        userName: users.name,
        userEmail: users.email,
        ledgerAccountId: cards.ledgerAccountId,
        ledgerAccountName: ledgerAccounts.name,
        type: cards.type,
        cardNumber: cards.cardNumber,
        cardholderName: cards.cardholderName,
        expiry: cards.expiry,
        cvv: cards.cvv,
        status: cards.status,
        spendLimit: cards.spendLimit,
        spentThisMonth: cards.spentThisMonth,
        createdAt: cards.createdAt,
      })
      .from(cards)
      .innerJoin(users, eq(cards.userId, users.id))
      .innerJoin(
        ledgerAccounts, 
        eq(sql`CAST(${cards.ledgerAccountId} AS uuid)`, ledgerAccounts.id)
      );

    return allCards.map((card) => ({
      ...card,
      type: card.type as 'metal' | 'virtual',
      status: card.status as 'active' | 'frozen',
      spendLimit: parseFloat(card.spendLimit),
      spentThisMonth: parseFloat(card.spentThisMonth),
      createdAt: card.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch admin cards:', err);
    return [];
  }
}

// 2. Admin Freeze or Unfreeze Card 🔒
export async function toggleCardFreezeAdmin(cardId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized session.' };
    }

    const [existingCard] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId));

    if (!existingCard) {
      return { success: false, error: 'Card record not found.' };
    }

    const newStatus = existingCard.status === 'active' ? 'frozen' : 'active';

    await db
      .update(cards)
      .set({ status: newStatus })
      .where(eq(cards.id, cardId));

    revalidatePath('/admin/cards');
    return { success: true, message: `Card status updated to ${newStatus}.` };
  } catch (err) {
    console.error('Toggle card status error:', err);
    return { success: false, error: 'Failed to update card status.' };
  }
}