import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ledgerAccounts, ledgerLines, journalEntries } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Download } from 'lucide-react';
import { TransactionTable, Transaction } from '@/components/dashboard/TransactionTable';

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 1. Initialize server-side translations 🌐
  const t = await getTranslations('TransactionsPage');

  // 2. Fetch user account IDs 🏦
  const accounts = await db
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(eq(ledgerAccounts.userId, userId));

  const userAccountIds = accounts.map((acc) => acc.id);

  // 3. Fetch all ledger transactions 📜
  let transactions: Transaction[] = [];

  if (userAccountIds.length > 0) {
    const rawTx = await db
      .select({
        id: ledgerLines.id,
        description: journalEntries.description,
        createdAt: ledgerLines.createdAt,
        amount: ledgerLines.amount,
        type: ledgerLines.type,
        currency: ledgerAccounts.currency,
      })
      .from(ledgerLines)
      .innerJoin(journalEntries, eq(ledgerLines.journalEntryId, journalEntries.id))
      .innerJoin(ledgerAccounts, eq(ledgerLines.ledgerAccountId, ledgerAccounts.id))
      .where(or(...userAccountIds.map((id) => eq(ledgerLines.ledgerAccountId, id))))
      .orderBy(desc(ledgerLines.createdAt));

    transactions = rawTx.map((tx) => ({
      ...tx,
      type: tx.type as 'debit' | 'credit',
    }));
  }

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Navigation 🔙 */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        <span>{t('backToOverview')}</span>
      </Link>

      {/* Header 📑 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {t('title')} 📜
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('description')}
          </p>
        </div>

        <button 
          type="button"
          className="self-start sm:self-auto px-4 py-2.5 bg-[#151C28] border border-[#263346] hover:border-[#8B5CF6]/40 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition flex items-center gap-2"
        >
          <Download size={14} className="text-[#8B5CF6]" />
          <span>{t('exportCsv')}</span>
        </button>
      </div>

      {/* Transactions Table 📑 */}
      <TransactionTable transactions={transactions} />
    </main>
  );
}