'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  CreditCard, 
  Plus, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Zap, 
  Copy, 
  Check, 
  ArrowLeft,
  X,
  Wallet,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { purchaseCard, getUserVaults, getUserCards } from '@/actions/cards';

interface Card {
  id: string;
  type: 'metal' | 'virtual';
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  status: 'active' | 'frozen';
  spendLimit: number;
  spentThisMonth: number;
}

interface Vault {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showSensitiveDetails, setShowSensitiveDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Vault state from DB 🏦
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');

  // Purchase Modal State 🛍️
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [cardType, setCardType] = useState<'virtual' | 'metal'>('virtual');
  const [cardholderInput, setCardholderInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const t = useTranslations('CardsPage');

  // Load user cards & vaults on mount 🔄
  useEffect(() => {
    async function loadData() {
      const [vaultData, cardData] = await Promise.all([
        getUserVaults(),
        getUserCards(),
      ]);
      setVaults(vaultData);
      if (vaultData.length > 0) {
        setSelectedVaultId(vaultData[0].id);
      }
      setCards(cardData);
      if (cardData.length > 0) {
        setSelectedCardId(cardData[0].id);
      }
    }
    loadData();
  }, []);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const toggleFreeze = (id: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, status: card.status === 'active' ? 'frozen' : 'active' }
          : card
      )
    );
  };

  const copyCardNumber = () => {
    if (selectedCard) {
      navigator.clipboard.writeText(selectedCard.cardNumber.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);

    if (!selectedVaultId) {
      setPurchaseError(t('errors.selectVault'));
      return;
    }

    setIsSubmitting(true);

    const result = await purchaseCard({
      ledgerAccountId: selectedVaultId,
      type: cardType,
      cardholderName: cardholderInput || 'CARDHOLDER',
    });

    if (result.success) {
      setIsModalOpen(false);
      setCardholderInput('');

      // Refetch updated cards and vaults from DB 🔄
      const [updatedCards, updatedVaults] = await Promise.all([
        getUserCards(),
        getUserVaults(),
      ]);
      setCards(updatedCards);
      setVaults(updatedVaults);

      if (updatedCards.length > 0) {
        setSelectedCardId(updatedCards[updatedCards.length - 1].id);
      }
    } else {
      setPurchaseError(result.error || t('errors.purchaseFailed'));
    }

    setIsSubmitting(false);
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft size={16} />
            <span>{t('backToDashboard')}</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {t('pageTitle')} 💳
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('pageDescription')}
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#7C3AED] transition shadow-lg shadow-[#8B5CF6]/20"
        >
          <Plus size={18} />
          <span>{t('issueNewCard')}</span>
        </button>
      </div>

      {/* Empty State View 📭 */}
      {cards.length === 0 ? (
        <div className="bg-[#151C28] border border-[#263346] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-2xl flex items-center justify-center mx-auto border border-[#8B5CF6]/20">
            <CreditCard size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">{t('empty.title')}</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t('empty.description')}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-5 py-3 text-xs font-bold text-white hover:bg-[#7C3AED] transition shadow-lg shadow-[#8B5CF6]/20 mt-2"
          >
            <Plus size={16} />
            <span>{t('empty.button')}</span>
          </button>
        </div>
      ) : (
        /* Active Cards Display */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[1.586/1] w-full max-w-md mx-auto rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 border border-white/10 bg-linear-to-br from-[#1E1233] via-[#121824] to-[#0B0F17]">
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                selectedCard.type === 'metal' ? 'bg-[#8B5CF6]/30' : 'bg-blue-500/20'
              }`} />

              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Apex Vault
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/10">
                    {selectedCard.type}
                  </span>
                </div>
                <Zap size={24} className="text-[#8B5CF6]" />
              </div>

              <div className="space-y-4 z-10">
                <div className="w-11 h-8 rounded-md bg-linear-to-tr from-amber-200 to-amber-400/80 border border-amber-100/40 opacity-90" />
                
                <div className="space-y-1">
                  <p className="font-mono text-lg sm:text-xl tracking-widest text-white font-semibold">
                    {selectedCard.cardNumber}
                  </p>
                  <div className="flex gap-6 text-xs text-slate-300 font-mono">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">{t('card.expires')}</span>
                      <span>{selectedCard.expiry}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">CVV</span>
                      <span>{showSensitiveDetails ? selectedCard.cvv : '•••'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end z-10">
                <p className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                  {selectedCard.cardholderName}
                </p>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-red-500/80" />
                  <div className="w-6 h-6 rounded-full bg-amber-500/80 -ml-3" />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() => setShowSensitiveDetails(!showSensitiveDetails)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#151C28] hover:bg-[#1C2638] text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-[#263346] transition"
              >
                {showSensitiveDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSensitiveDetails ? t('card.hideDetails') : t('card.showDetails')}</span>
              </button>

              <button
                onClick={copyCardNumber}
                className="flex-1 flex items-center justify-center gap-2 bg-[#151C28] hover:bg-[#1C2638] text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-[#263346] transition"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copied ? t('card.copied') : t('card.copyNumber')}</span>
              </button>

              <button
                onClick={() => toggleFreeze(selectedCard.id)}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl border transition ${
                  selectedCard.status === 'frozen'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {selectedCard.status === 'frozen' ? <Unlock size={16} /> : <Lock size={16} />}
                <span>{selectedCard.status === 'frozen' ? t('card.unfreeze') : t('card.freezeCard')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151C28] border border-[#263346] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">{t('issuedList.title')}</h3>
              
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedCardId === card.id
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                        : 'border-[#263346] bg-[#0B0F17]/50 hover:bg-[#1C2638]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-[#151C28] border border-[#263346] text-[#8B5CF6]">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white capitalize">
                          {card.type} {t('issuedList.cardLabel')} •••• {card.cardNumber.slice(-4)}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                          {t('issuedList.statusLabel')}: <span className={card.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>{card.status}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-semibold text-slate-300">
                      ${card.spentThisMonth.toLocaleString()} / ${(card.spendLimit / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE CARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151C28] border border-[#263346] rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#263346] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {t('modal.title')} 💳
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('modal.subtitle')}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {purchaseError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{purchaseError}</span>
              </div>
            )}

            <form onSubmit={handlePurchaseSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  {t('modal.tierLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCardType('virtual')}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      cardType === 'virtual'
                        ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]'
                        : 'bg-[#0B0F17]/50 border-[#263346] hover:bg-[#1C2638]'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{t('modal.virtualTitle')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{t('modal.virtualDesc')}</p>
                    <p className="text-xs font-bold text-[#8B5CF6] mt-3">{t('modal.virtualFee')}</p>
                  </div>

                  <div
                    onClick={() => setCardType('metal')}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      cardType === 'metal'
                        ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]'
                        : 'bg-[#0B0F17]/50 border-[#263346] hover:bg-[#1C2638]'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{t('modal.metalTitle')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{t('modal.metalDesc')}</p>
                    <p className="text-xs font-bold text-[#8B5CF6] mt-3">{t('modal.metalFee')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  {t('modal.vaultLabel')}
                </label>
                <div className="space-y-2">
                  {vaults.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('modal.noVaults')}</p>
                  ) : (
                    vaults.map((vault) => (
                      <div
                        key={vault.id}
                        onClick={() => setSelectedVaultId(vault.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          selectedVaultId === vault.id
                            ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]'
                            : 'bg-[#0B0F17]/50 border-[#263346] hover:bg-[#1C2638]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Wallet size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-white">{vault.name}</p>
                            <p className="text-[10px] text-slate-400">{vault.currency} {t('modal.accountLabel')}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-200">
                          ${vault.balance.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  {t('modal.holderLabel')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. ALEX MORGAN"
                  value={cardholderInput}
                  onChange={(e) => setCardholderInput(e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-[#263346] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-[#8B5CF6]/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('modal.processing')}</span>
                  </>
                ) : (
                  <span>
                    {cardType === 'metal' ? t('modal.confirmMetal') : t('modal.confirmVirtual')}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}