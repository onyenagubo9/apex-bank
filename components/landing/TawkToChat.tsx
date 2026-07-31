// components/landing/TawkToChat.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToChat() {
  useEffect(() => {
    // Prevent duplicate script insertion
    if (document.getElementById('tawkto-script')) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.id = 'tawkto-script';
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6a6c74d301120d1d462ed42e/1jurqgn6a';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    const s0 = document.getElementsByTagName('script')[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }
  }, []);

  return null;
}