// app/api/transfers/international/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  ledgerAccounts,
  journalEntries,
  ledgerLines,
  internationalTransfers,
} from '@/lib/db/schema';
import { InternationalWireSchema } from '@/lib/validations/transfer';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session 🔒
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();

    // 2. Extract and validate source account ID 🆔
    const { sourceAccountId, ...wireData } = body;
    if (!sourceAccountId) {
      return NextResponse.json(
        { message: 'Source vault is required' },
        { status: 400 }
      );
    }

    // 3. Validate wire details using Zod 🛡️
    const validatedData = InternationalWireSchema.parse(wireData);
    const transferAmount = parseFloat(validatedData.amount);

    // 4. Execute atomic database transaction ⚛️
    const result = await db.transaction(async (tx) => {
      // Step A: Fetch and lock source vault account
      const [sourceAccount] = await tx
        .select()
        .from(ledgerAccounts)
        .where(eq(ledgerAccounts.id, sourceAccountId));

      if (!sourceAccount || sourceAccount.userId !== userId) {
        throw new Error('Invalid source vault selected');
      }

      const currentBalance = parseFloat(sourceAccount.balance || '0');
      if (currentBalance < transferAmount) {
        throw new Error('Insufficient funds in the selected vault');
      }

      // Step B: Deduct balance from source vault 📉
      const newBalance = (currentBalance - transferAmount).toFixed(2);
      await tx
        .update(ledgerAccounts)
        .set({ balance: newBalance })
        .where(eq(ledgerAccounts.id, sourceAccountId));

     // Step C: Create master journal entry record 📖
    const [journal] = await tx
      .insert(journalEntries)
      .values({
        description: `Outbound Wire: ${validatedData.recipientName} (${validatedData.swiftBic})`,
        idempotencyKey: crypto.randomUUID(), // 👈 Added unique idempotency key
      })
      .returning({ id: journalEntries.id });
      // Step D: Create debit ledger line entry 📊
      await tx.insert(ledgerLines).values({
        journalEntryId: journal.id,
        ledgerAccountId: sourceAccountId,
        amount: transferAmount.toFixed(2),
        type: 'debit',
      });

      // Step E: Store international wire routing metadata 🌐
      await tx.insert(internationalTransfers).values({
        journalEntryId: journal.id,
        recipientName: validatedData.recipientName,
        recipientAddress: validatedData.recipientAddress,
        recipientCountry: validatedData.recipientCountry,
        swiftBic: validatedData.swiftBic,
        ibanAccountNumber: validatedData.ibanAccountNumber,
        bankName: validatedData.bankName,
        bankAddress: validatedData.bankAddress || null,
        routingNumber: validatedData.routingNumber || null,
      });

      return { journalId: journal.id, newBalance };
    });

    return NextResponse.json(
      {
        message: 'Wire transfer processed successfully',
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Wire transfer error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to process international wire' },
      { status: 400 }
    );
  }
}