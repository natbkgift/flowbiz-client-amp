'use client';

import { useEffect, useState } from 'react';

export const CURRENCIES = {
  THB: { symbol: '฿', rate: 1, decimals: 0, locale: 'th-TH', label: 'THB (฿)' },
  USD: { symbol: '$', rate: 1 / 36, decimals: 0, locale: 'en-US', label: 'USD ($)' },
  EUR: { symbol: '€', rate: 1 / 39, decimals: 0, locale: 'en-US', label: 'EUR (€)' },
  CNY: { symbol: '¥', rate: 1 / 5, decimals: 0, locale: 'en-US', label: 'CNY (¥)' },
  RUB: { symbol: '₽', rate: 1 / 0.4, decimals: 0, locale: 'ru-RU', label: 'RUB (₽)' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

const CURRENCY_COOKIE_NAME = 'amp_currency';

export function getCurrencyCookie(): CurrencyCode {
  if (typeof window === 'undefined') return 'THB';
  const match = document.cookie.match(new RegExp('(^| )' + CURRENCY_COOKIE_NAME + '=([^;]+)'));
  const value = match ? match[2] : null;
  return (value && value in CURRENCIES) ? (value as CurrencyCode) : 'THB';
}

export function setCurrencyCookie(code: CurrencyCode) {
  if (typeof window === 'undefined') return;
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CURRENCY_COOKIE_NAME}=${code}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
  // Dispatch custom event to sync other client components
  window.dispatchEvent(new CustomEvent('amp_currency_change', { detail: code }));
}

export function convertAndFormatPrice(
  thbAmount: number | string | null | undefined,
  currencyCode: CurrencyCode = 'THB',
  options: { short?: boolean; locale?: 'en' | 'th' } = {}
): string {
  if (thbAmount == null) return '';
  const numericThb = typeof thbAmount === 'number' ? thbAmount : parseFloat(String(thbAmount).replace(/,/g, '').trim());
  if (isNaN(numericThb) || numericThb <= 0) return '';

  const c = CURRENCIES[currencyCode] || CURRENCIES.THB;
  const converted = numericThb * c.rate;

  if (options.short) {
    if (converted >= 1_000_000) {
      const millionVal = converted / 1_000_000;
      const dec = millionVal >= 10 ? 0 : 1;
      return `${c.symbol}${millionVal.toFixed(dec)}M`;
    }
    if (converted >= 1_000) {
      return `${c.symbol}${Math.round(converted / 1_000)}k`;
    }
    return `${c.symbol}${Math.round(converted)}`;
  }

  // Formatting for full display
  return `${c.symbol}${Math.round(converted).toLocaleString(c.locale)}`;
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>('THB');

  useEffect(() => {
    // Initial load
    setCurrencyState(getCurrencyCookie());

    // Event listener for synchronization
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<CurrencyCode>;
      if (customEvent.detail && customEvent.detail in CURRENCIES) {
        setCurrencyState(customEvent.detail);
      }
    };

    window.addEventListener('amp_currency_change', handleCurrencyChange);
    return () => {
      window.removeEventListener('amp_currency_change', handleCurrencyChange);
    };
  }, []);

  const changeCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    setCurrencyCookie(code);
  };

  return {
    currency,
    setCurrency: changeCurrency,
    formatPrice: (thb: number | string | null | undefined, options?: { short?: boolean }) =>
      convertAndFormatPrice(thb, currency, options),
  };
}
