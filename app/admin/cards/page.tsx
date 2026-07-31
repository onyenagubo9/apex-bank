'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  ArrowLeft, 
  Search, 
  Lock, 
  Unlock, 
  User, 
  ShieldCheck, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { getAllCardsForAdmin, toggleCardFreezeAdmin } from '@/actions/card-admin';

interface AdminCard {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ledgerAccountId: string;
  ledgerAccountName: string;
  type: 'metal' | 'virtual';
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  status: 'active' | 'frozen';
  spendLimit: number;
  spentThisMonth: number;
  createdAt: string;
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCards() {
      const data = await getAllCardsForAdmin();
      setCards(data);
    }
    loadCards();
  }, []);

  const handleToggleFreeze = async (cardId: string) => {
    setProcessingId(cardId);
    setErrorMessage(null);

    const result = await toggleCardFreezeAdmin(cardId);

    if (result.success) {
      const updatedCards = await getAllCardsForAdmin();
      setCards(updatedCards);
    } else {
      setErrorMessage(result.error || 'Failed to update card status.');
    }

    setProcessingId(null);
  };

  const filteredCards = cards.filter((card) => {
    const matchesType = filterType === 'all' || card.type === filterType;
    const matchesSearch = 
      card.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.cardholderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.cardNumber.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Issued Cards Directory 💳
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor active cards, view cardholders, and override card status.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filters & Search 🔍 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cardholder, email, or card #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151C28] border border-[#263346] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'metal', 'virtual'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filterType === type
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-[#151C28] border border-[#263346] text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Table 📊 */}
      <div className="bg-[#151C28] border border-[#263346] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 uppercase border-b border-[#263346]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Cardholder Name</th>
                <th className="p-4">Card Details</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Spend Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263346] text-slate-200">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No issued cards found.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-[#1C2638]/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <User size={14} className="text-[#8B5CF6]" />
                        {card.userName}
                      </div>
                      <div className="text-[10px] text-slate-400">{card.userEmail}</div>
                    </td>

                    <td className="p-4 font-semibold text-slate-200 uppercase">
                      {card.cardholderName}
                    </td>

                    <td className="p-4 font-mono">
                      <div className="text-white font-bold">{card.cardNumber}</div>
                      <div className="text-[10px] text-slate-400">Exp: {card.expiry} | CVV: {card.cvv}</div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        card.type === 'metal' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {card.type}
                      </span>
                    </td>

                    <td className="p-4 font-mono">
                      ${card.spentThisMonth.toFixed(2)} / ${card.spendLimit.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        card.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {card.status === 'active' ? 'Active' : 'Frozen'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleFreeze(card.id)}
                        disabled={processingId === card.id}
                        className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition flex items-center gap-1 ml-auto ${
                          card.status === 'active'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {processingId === card.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : card.status === 'active' ? (
                          <>
                            <Lock size={12} /> Freeze
                          </>
                        ) : (
                          <>
                            <Unlock size={12} /> Unfreeze
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}