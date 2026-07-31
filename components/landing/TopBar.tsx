// components/landing/TopBar.tsx
'use client';

import { Mail, Phone, Globe, ChevronDown } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { useState, useTransition } from 'react';

export function TopBar() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
  ];

  const handleLanguageChange = (newLocale: 'en' | 'fr' | 'es') => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const currentLanguageLabel = languages.find((l) => l.code === locale)?.label || 'English';

  return (
    <div className="sticky top-0 w-full bg-[#070A10]/95 backdrop-blur-md border-b border-[#263346]/40 text-slate-400 text-xs py-2 px-6 lg:px-12 z-100">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Contact Info */}
        <div className="flex items-center gap-6">
          <a
            href="mailto:support@apexbank.com"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Mail size={14} className="text-[#8B5CF6]" />
            <span>support@apexbank.com</span>
          </a>
          <a
            href="tel:+18005550199"
            className="hidden md:flex items-center gap-2 hover:text-white transition-colors"
          >
            <Phone size={14} className="text-[#8B5CF6]" />
            <span>+1 (800) 555-0199</span>
          </a>
        </div>

        {/* Right Side: Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#1E293B] border border-[#263346] px-3 py-1.5 rounded-lg text-slate-300 transition-all font-medium cursor-pointer"
          >
            <Globe size={14} className="text-[#8B5CF6]" />
            <span>{currentLanguageLabel}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-[#121824] border border-[#263346] rounded-xl shadow-2xl py-1 z-110 backdrop-blur-xl">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as 'en' | 'fr' | 'es')}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-[#8B5CF6]/10 hover:text-white transition-colors flex items-center justify-between ${
                    locale === lang.code ? 'text-[#8B5CF6] font-bold bg-[#8B5CF6]/5' : 'text-slate-300'
                  }`}
                >
                  <span>{lang.label}</span>
                  {locale === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}