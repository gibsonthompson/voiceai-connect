// hooks/usePrice.ts
// Hook for displaying prices in the visitor's local currency
// Reads the vc_country cookie (set by middleware via Vercel geo headers)
// Falls back to USD if no cookie is set

'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice as formatPriceFn, getCurrencyForCountry } from '@/lib/currency';
import { getCountryFromCookie } from '@/lib/geo';

interface UsePriceReturn {
  /**
   * Format a USD dollar amount to the visitor's local currency
   * @param usdDollars - Price in USD dollars (e.g. 99, 199, 499)
   * @returns Formatted string (e.g. "$99", "CA$135", "£79")
   */
  formatPrice: (usdDollars: number) => string;

  /**
   * Format a USD cents amount to the visitor's local currency
   * @param usdCents - Price in USD cents (e.g. 9900, 19900, 49900)
   * @returns Formatted string (e.g. "$99", "CA$135", "£79")
   */
  formatPriceCents: (usdCents: number) => string;

  /**
   * The detected country code (e.g. 'US', 'CA', 'GB')
   */
  countryCode: string;

  /**
   * The currency code (e.g. 'USD', 'CAD', 'GBP')
   */
  currencyCode: string;

  /**
   * Whether the price is ready (cookie has been read)
   * Prices default to USD during SSR, so this is mainly for
   * avoiding a flash if you want to wait
   */
  ready: boolean;
}

export function usePrice(): UsePriceReturn {
  const [countryCode, setCountryCode] = useState('US');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detected = getCountryFromCookie();
    if (detected) {
      setCountryCode(detected);
    }
    setReady(true);
  }, []);

  const formatPrice = useCallback(
    (usdDollars: number): string => {
      return formatPriceFn(usdDollars, countryCode);
    },
    [countryCode]
  );

  const formatPriceCents = useCallback(
    (usdCents: number): string => {
      const usdDollars = usdCents / 100;
      return formatPriceFn(usdDollars, countryCode);
    },
    [countryCode]
  );

  const currencyConfig = getCurrencyForCountry(countryCode);

  return {
    formatPrice,
    formatPriceCents,
    countryCode,
    currencyCode: currencyConfig.code,
    ready,
  };
}