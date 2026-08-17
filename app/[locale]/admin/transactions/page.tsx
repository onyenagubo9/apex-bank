// app/admin/transactions/page.tsx
import { auth } from '@/auth';
import { getAllSystemTransactions } from '@/actions/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ShieldAlert, Clock } from 'lucide-react';
import ReverseButton from './ReverseButton'; // 👈 Import the action button

export default async function AdminTransactionsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { transactions, success } = await getAllSystemTransactions();

  return (
    <div className="min-h-screen bg-obsidian text-[#E2E8F0] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263346] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-2">
              <ShieldAlert size={14} /> Global Financial Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              All System Transactions
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time telemetry tracking multi-currency debits and credits across all user vaults.
            </p>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-xl border border-[#263346] bg-[#151C28] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#263346] transition w-fit"
          >
            <ArrowLeft size={14} /> Back to Admin Dashboard
          </Link>
        </div>

        {/* Transactions Table Card */}
        <div className="rounded-2xl border border-[#263346] bg-[#151C28] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#263346] flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Transaction History</h2>
            <span className="text-xs text-slate-400 font-mono">{transactions.length} Records Loaded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F17] uppercase font-bold text-slate-400 tracking-wider border-b border-[#263346]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Account / Vault</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263346]/60">
                {!success || transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No system transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#263346]/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{tx.userName || 'Unknown Name'}</div>
                        <div className="font-mono text-[11px] text-slate-400">{tx.userEmail || 'Unknown Email'}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {tx.accountNumber}
                      </td>
                      <td className="px-6 py-4 text-white font-medium max-w-xs truncate" title={tx.description}>
                        {tx.description || 'System Transfer'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.type === 'credit'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${
                        tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}{Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-500" />
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ReverseButton transactionId={tx.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}