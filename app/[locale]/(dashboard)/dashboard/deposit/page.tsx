import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ledgerAccounts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import { DepositForm } from '@/components/dashboard/DepositForm';

export default async function DepositPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // 1. Initialize server-side translations 🌐
  const t = await getTranslations('DepositPage');

  // Fetch user vaults and profile details 🏦
  const userVaults = await db
    .select()
    .from(ledgerAccounts)
    .where(eq(ledgerAccounts.userId, session.user.id));

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  return (
    <main className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Back Link 🔙 */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        <span>{t('backToDashboard')}</span>
      </Link>

      {/* Page Header 📄 */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">{t('title')}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Virtual Account Details for Wire/Bank Transfer 📋 */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#151C28] border border-[#263346] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#263346]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('wireInstructions.title')}</h3>
                <p className="text-[10px] text-slate-400">{t('wireInstructions.partnerBank')}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">{t('wireInstructions.bankNameLabel')}</span>
                <span className="font-medium text-slate-200">Apex Global Trust Bank</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">{t('wireInstructions.accountNameLabel')}</span>
                <span className="font-medium text-slate-200">{dbUser?.name || t('wireInstructions.defaultClientName')}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">{t('wireInstructions.accountNumberLabel')}</span>
                <div className="flex items-center justify-between bg-[#0B0F17] border border-[#263346] rounded-xl px-3 py-2 mt-1">
                  <span className="font-mono text-white font-bold">{userVaults[0]?.accountNumber || 'ACC-99823411'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">{t('wireInstructions.routingLabel')}</span>
                <span className="font-mono text-slate-200">APEXUS33XXX</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#263346] flex items-center gap-2 text-[11px] text-amber-400">
              <ShieldCheck size={14} />
              <span>{t('wireInstructions.notice')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Deposit Logging Form 💳 */}
        <div className="md:col-span-2">
          <DepositForm vaults={userVaults} userId={session.user.id} />
        </div>
      </div>
    </main>
  );
}