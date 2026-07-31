'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ArrowDownLeft, CreditCard, ChevronRight } from 'lucide-react';

export interface Transaction {
  id: string;
  description: string;
  createdAt: Date;
  amount: string;
  type: 'debit' | 'credit';
  currency: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number, currency: string) {
  const symbolMap: Record<string, string> = {
    USD: '$',
    NGN: '₦',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '$';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const t = useTranslations('TransactionTable');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t('title')}</h2>
        <Link
          href="/dashboard/transactions"
          className="text-xs font-semibold text-[#A78BFA] hover:underline"
        >
          {t('viewAll')}
        </Link>
      </div>

      <div className="rounded-2xl border border-[#263346] bg-[#151C28] shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300 text-sm">
              {t('emptyState.title')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t('emptyState.description')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0B0F17] text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#263346]">
                <tr>
                  <th className="px-6 py-4">{t('headers.description')}</th>
                  <th className="px-6 py-4">{t('headers.type')}</th>
                  <th className="px-6 py-4">{t('headers.date')}</th>
                  <th className="px-6 py-4 text-right">{t('headers.amount')}</th>
                  <th className="px-4 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263346]">
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  const amountVal = parseFloat(tx.amount);

                  return (
                    <tr
                      key={tx.id}
                      className="group hover:bg-[#263346]/40 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-white">
                        <Link 
                          href={`/dashboard/transactions/${tx.id}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-[#263346] text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </div>
                          <span className="group-hover:text-[#A78BFA] transition">
                            {tx.description}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/transactions/${tx.id}`}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              isCredit
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-[#263346] text-slate-300'
                            }`}
                          >
                            {isCredit ? t('types.credit') : t('types.debit')}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        <Link href={`/dashboard/transactions/${tx.id}`}>
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Link>
                      </td>
                      <td
                        className={`px-6 py-4 font-bold text-right font-mono ${
                          isCredit ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        <Link href={`/dashboard/transactions/${tx.id}`}>
                          {isCredit ? '+' : '-'} {formatCurrency(amountVal, tx.currency)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500 group-hover:text-white transition">
                        <Link href={`/dashboard/transactions/${tx.id}`}>
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}