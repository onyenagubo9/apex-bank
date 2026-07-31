// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { SessionProvider } from 'next-auth/react';
import { TawkToChat } from '@/components/landing/TawkToChat'; // Adjust path if necessary

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>
        {/* Global live chat widget available across all localized pages */}
        <TawkToChat />
        {children}
      </SessionProvider>
    </NextIntlClientProvider>
  );
}