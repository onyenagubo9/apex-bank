'use client';

import { useState } from 'react';
import { Wallet, ArrowDownRight, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Vault {
  id: string;
  name: string;
  currency: string;
  balance: string;
}

interface DepositFormProps {
  vaults: Vault[];
  userId: string;
}

export function DepositForm({ vaults, userId }: DepositFormProps) {
  const [selectedVaultId, setSelectedVaultId] = useState(vaults[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wire');
  const [referenceNote, setReferenceNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ message: string; ledgerLineId?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Find currently selected vault currency 💱
  const activeVault = vaults.find((v) => v.id === selectedVaultId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessData(null);
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      setIsSubmitting(false);
      return;
    }

    // Simulate secure processing or call your deposit server action here
    try {
      // Placeholder for your deposit server action execution:
      // const result = await executeDeposit({ userId, vaultId: selectedVaultId, amount: parsedAmount, paymentMethod });
      
      // Simulating a successful response for demonstration:
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessData({
        message: `Successfully initiated deposit of ${activeVault?.currency || 'USD'} ${parsedAmount.toFixed(2)} to ${activeVault?.name || 'Vault'}.`,
      });
      setAmount('');
      setReferenceNote('');
    } catch (error: any) {
      setErrorMessage(error.message || 'Deposit processing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-[#151C28] border border-[#263346] rounded-2xl p-6 space-y-5 shadow-xl text-center">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Deposit Request Logged 🧾</h3>
          <p className="text-xs text-slate-400 mt-1">{successData.message}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard/transactions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl transition shadow-lg shadow-[#8B5CF6]/20"
          >
            <ExternalLink size={16} />
            <span>View Transaction History</span>
          </Link>
          <button
            type="button"
            onClick={() => setSuccessData(null)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0B0F17] border border-[#263346] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            <RefreshCw size={16} />
            <span>Make Another Deposit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#151C28] border border-[#263346] rounded-2xl p-6 space-y-5 shadow-xl"
    >
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowDownRight className="text-emerald-400" size={22} />
          Log Direct Deposit
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select your target vault and submit your transfer confirmation details.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {/* Target Vault Selection 🏦 */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Target Vault 🏛️
        </label>
        <select
          value={selectedVaultId}
          onChange={(e) => setSelectedVaultId(e.target.value)}
          className="w-full bg-[#0B0F17] border border-[#263346] rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#8B5CF6]"
        >
          {vaults.map((vault) => (
            <option key={vault.id} value={vault.id}>
              {vault.name} ({vault.currency}) — Balance: {vault.currency} {vault.balance}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Method Selector 💳 */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Funding Method 💳
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('wire')}
            className={`p-3 rounded-xl border text-xs font-semibold transition text-left ${
              paymentMethod === 'wire'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                : 'bg-[#0B0F17] border-[#263346] text-slate-400 hover:border-slate-700'
            }`}
          >
            Bank Wire Transfer 🏦
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 rounded-xl border text-xs font-semibold transition text-left ${
              paymentMethod === 'card'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                : 'bg-[#0B0F17] border-[#263346] text-slate-400 hover:border-slate-700'
            }`}
          >
            Linked Debit Card 💳
          </button>
        </div>
      </div>

      {/* Deposit Amount 💰 */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Deposit Amount ({activeVault?.currency || 'USD'}) 💰
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">
            {activeVault?.currency || 'USD'}
          </span>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full bg-[#0B0F17] border border-[#263346] rounded-xl pl-16 pr-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
      </div>

      {/* Reference Note 📝 */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Reference / Sender Name 📝
        </label>
        <input
          type="text"
          value={referenceNote}
          onChange={(e) => setReferenceNote(e.target.value)}
          placeholder="e.g. Acme Corp Wire / John Doe"
          className="w-full bg-[#0B0F17] border border-[#263346] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition duration-200"
      >
        <Wallet size={18} />
        {isSubmitting ? 'Processing Deposit...' : 'Confirm & Submit Deposit'}
      </button>
    </form>
  );
}