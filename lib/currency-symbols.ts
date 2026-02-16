// ============================================================================
// CURRENCY SYMBOL MAPPING
// Used by agency-site page.tsx to pass the correct symbol to MarketingPage
// ============================================================================

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  JPY: '¥',
  CHF: 'CHF ',
  SGD: 'S$',
  HKD: 'HK$',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł',
  CZK: 'Kč ',
  HUF: 'Ft ',
  RON: 'lei ',
  BGN: 'лв ',
  BRL: 'R$',
  MXN: 'MX$',
  INR: '₹',
  THB: '฿',
  MYR: 'RM ',
  AED: 'AED ',
};

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || '$';
}