import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ledgerAccounts, ledgerLines, journalEntries } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck
} from 'lucide-react';
import { ReceiptActions } from '@/components/dashboard/ReceiptActions';

interface TransactionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Custom SVG Monogram Crest Logo 🏛️
function ApexLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <path d="M100 15 L165 45 V105 C165 150 100 180 100 180 C100 180 35 150 35 105 V45 L100 15 Z" stroke="url(#apexGrad)" strokeWidth="8" fill="#0B0F17" />
      <path d="M100 45 L135 125 H116 L100 88 L84 125 H65 L100 45 Z" fill="url(#apexGrad)" />
      <path d="M75 100 L100 150 L125 100 L112 100 L100 124 L88 100 H75 Z" fill="url(#vaultGrad)" />
    </svg>
  );
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const [tx] = await db
    .select({
      id: ledgerLines.id,
      amount: ledgerLines.amount,
      type: ledgerLines.type,
      createdAt: ledgerLines.createdAt,
      description: journalEntries.description,
      journalId: journalEntries.id,
      currency: ledgerAccounts.currency,
      accountName: ledgerAccounts.name,
      accountNumber: ledgerAccounts.accountNumber,
    })
    .from(ledgerLines)
    .innerJoin(journalEntries, eq(ledgerLines.journalEntryId, journalEntries.id))
    .innerJoin(ledgerAccounts, eq(ledgerLines.ledgerAccountId, ledgerAccounts.id))
    .where(
      and(
        eq(ledgerLines.id, id),
        eq(ledgerAccounts.userId, session.user.id)
      )
    );

  if (!tx) {
    notFound();
  }

  const isCredit = tx.type === 'credit';
  const formattedAmount = `${isCredit ? '+' : '-'}${tx.currency} ${parseFloat(tx.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <main className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 🧭 Navigation & Export Controls */}
      <div className="flex items-center justify-between print:hidden">
        <Link 
          href="/dashboard/transactions" 
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Transactions</span>
        </Link>
        <ReceiptActions />
      </div>

      {/* 🧾 Main Statement Card */}
      <div className="bg-[#151C28] border border-[#263346] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none">
        
        {/* 🏛️ Brand Logo Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#263346] print:border-slate-300">
          <div className="flex items-center gap-3">
            <ApexLogo />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white print:text-black tracking-wide">Apex Vault</span>
              <span className="text-[10px] text-[#A78BFA] font-mono">Private Wealth Ledger</span>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 print:text-slate-600">Official Statement</span>
        </div>

        {/* 📊 Header Status Badge */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-[#263346] print:border-slate-300">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
            isCredit 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
          }`}>
            {isCredit ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-600 block mb-1">
              {tx.type} Transaction
            </span>
            <h1 className="text-3xl font-extrabold text-white print:text-black">
              {formattedAmount}
            </h1>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={14} />
            <span>Settled & Confirmed</span>
          </div>
        </div>

        {/* 📝 Transaction Metadata Breakdown */}
        <div className="space-y-4 text-xs">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600">
            Transaction Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0B0F17] print:bg-slate-50 border border-[#263346] print:border-slate-300 rounded-xl p-4">
            <div>
              <p className="text-slate-400 print:text-slate-600 font-medium">Description / Memo</p>
              <p className="text-white print:text-black font-semibold mt-1">{tx.description}</p>
            </div>

            <div>
              <p className="text-slate-400 print:text-slate-600 font-medium">Vault Account</p>
              <p className="text-white print:text-black font-semibold mt-1">{tx.accountName} ({tx.currency})</p>
            </div>

            <div>
              <p className="text-slate-400 print:text-slate-600 font-medium">Posting Timestamp</p>
              <p className="text-white print:text-black font-semibold mt-1">
                {new Date(tx.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-slate-400 print:text-slate-600 font-medium">Ledger Entry Reference</p>
              <p className="text-slate-300 print:text-slate-700 font-mono text-[11px] mt-1 truncate">{tx.id}</p>
            </div>
          </div>
        </div>

        {/* 🛡️ Security & Verification Footer */}
        <div className="pt-4 border-t border-[#263346] print:border-slate-300 flex items-center justify-between text-[11px] text-slate-400 print:text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#8B5CF6]" />
            <span>Immutable Ledger Record</span>
          </div>
          <span className="font-mono text-slate-500 print:text-slate-600">Journal #{tx.journalId.slice(0, 8)}</span>
        </div>

      </div>
    </main>
  );
}