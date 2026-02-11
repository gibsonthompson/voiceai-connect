// lib/currency.ts
// Master currency configuration for VoiceAI Connect
// Update exchange rates monthly

export interface CurrencyConfig {
  code: string;       // ISO 4217 currency code
  symbol: string;     // Display symbol
  symbolPosition: 'before' | 'after';
  rate: number;       // Exchange rate vs USD (1 USD = X of this currency)
  decimals: number;   // Decimal places for display
  name: string;
}

export interface CountryConfig {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  currency: string;   // ISO 4217 currency code
  flag: string;       // Emoji flag
}

// ============================================================================
// CURRENCIES
// ============================================================================
export const currencies: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', symbolPosition: 'before', rate: 1.00, decimals: 0, name: 'US Dollar' },
  CAD: { code: 'CAD', symbol: 'CA$', symbolPosition: 'before', rate: 1.36, decimals: 0, name: 'Canadian Dollar' },
  GBP: { code: 'GBP', symbol: '£', symbolPosition: 'before', rate: 0.79, decimals: 0, name: 'British Pound' },
  EUR: { code: 'EUR', symbol: '€', symbolPosition: 'before', rate: 0.92, decimals: 0, name: 'Euro' },
  AUD: { code: 'AUD', symbol: 'A$', symbolPosition: 'before', rate: 1.55, decimals: 0, name: 'Australian Dollar' },
  NZD: { code: 'NZD', symbol: 'NZ$', symbolPosition: 'before', rate: 1.70, decimals: 0, name: 'New Zealand Dollar' },
  JPY: { code: 'JPY', symbol: '¥', symbolPosition: 'before', rate: 152, decimals: 0, name: 'Japanese Yen' },
  SGD: { code: 'SGD', symbol: 'S$', symbolPosition: 'before', rate: 1.34, decimals: 0, name: 'Singapore Dollar' },
  CHF: { code: 'CHF', symbol: 'CHF', symbolPosition: 'before', rate: 0.88, decimals: 0, name: 'Swiss Franc' },
  HKD: { code: 'HKD', symbol: 'HK$', symbolPosition: 'before', rate: 7.82, decimals: 0, name: 'Hong Kong Dollar' },
  SEK: { code: 'SEK', symbol: 'kr', symbolPosition: 'after', rate: 10.5, decimals: 0, name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', symbolPosition: 'after', rate: 10.8, decimals: 0, name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', symbolPosition: 'after', rate: 6.87, decimals: 0, name: 'Danish Krone' },
  PLN: { code: 'PLN', symbol: 'zł', symbolPosition: 'after', rate: 4.02, decimals: 0, name: 'Polish Zloty' },
  BRL: { code: 'BRL', symbol: 'R$', symbolPosition: 'before', rate: 5.85, decimals: 0, name: 'Brazilian Real' },
  MXN: { code: 'MXN', symbol: 'MX$', symbolPosition: 'before', rate: 17.2, decimals: 0, name: 'Mexican Peso' },
  INR: { code: 'INR', symbol: '₹', symbolPosition: 'before', rate: 83.5, decimals: 0, name: 'Indian Rupee' },
  THB: { code: 'THB', symbol: '฿', symbolPosition: 'before', rate: 34.5, decimals: 0, name: 'Thai Baht' },
  MYR: { code: 'MYR', symbol: 'RM', symbolPosition: 'before', rate: 4.42, decimals: 0, name: 'Malaysian Ringgit' },
  CZK: { code: 'CZK', symbol: 'Kč', symbolPosition: 'after', rate: 23.5, decimals: 0, name: 'Czech Koruna' },
  HUF: { code: 'HUF', symbol: 'Ft', symbolPosition: 'after', rate: 375, decimals: 0, name: 'Hungarian Forint' },
  RON: { code: 'RON', symbol: 'lei', symbolPosition: 'after', rate: 4.58, decimals: 0, name: 'Romanian Leu' },
  BGN: { code: 'BGN', symbol: 'лв', symbolPosition: 'after', rate: 1.80, decimals: 0, name: 'Bulgarian Lev' },
  AED: { code: 'AED', symbol: 'AED', symbolPosition: 'before', rate: 3.67, decimals: 0, name: 'UAE Dirham' },
};

// ============================================================================
// STRIPE-SUPPORTED COUNTRIES → CURRENCIES
// ============================================================================
export const countries: CountryConfig[] = [
  // North America
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽' },

  // UK
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },

  // Eurozone
  { code: 'AT', name: 'Austria', currency: 'EUR', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', flag: '🇧🇪' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR', flag: '🇨🇾' },
  { code: 'EE', name: 'Estonia', currency: 'EUR', flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', currency: 'EUR', flag: '🇫🇮' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', currency: 'EUR', flag: '🇬🇷' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  { code: 'LV', name: 'Latvia', currency: 'EUR', flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', currency: 'EUR', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', currency: 'EUR', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', currency: 'EUR', flag: '🇲🇹' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', flag: '🇵🇹' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR', flag: '🇸🇮' },
  { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  { code: 'HR', name: 'Croatia', currency: 'EUR', flag: '🇭🇷' },

  // Europe (non-Euro)
  { code: 'BG', name: 'Bulgaria', currency: 'BGN', flag: '🇧🇬' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', flag: '🇩🇰' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', flag: '🇭🇺' },
  { code: 'NO', name: 'Norway', currency: 'NOK', flag: '🇳🇴' },
  { code: 'PL', name: 'Poland', currency: 'PLN', flag: '🇵🇱' },
  { code: 'RO', name: 'Romania', currency: 'RON', flag: '🇷🇴' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },

  // Asia-Pacific
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', flag: '🇭🇰' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', currency: 'THB', flag: '🇹🇭' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },

  // Middle East
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },

  // South America
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get currency config for a country code
 */
export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  const country = countries.find(c => c.code === countryCode);
  if (!country) return currencies.USD;
  return currencies[country.currency] || currencies.USD;
}

/**
 * Convert USD amount to local currency and format for display
 */
export function formatPrice(usdAmount: number, countryCode: string): string {
  const currency = getCurrencyForCountry(countryCode);
  const converted = Math.round(usdAmount * currency.rate);

  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${converted.toLocaleString()}`;
  } else {
    return `${converted.toLocaleString()} ${currency.symbol}`;
  }
}

/**
 * Get raw converted amount (for Stripe)
 */
export function convertToLocalCurrency(usdAmount: number, countryCode: string): number {
  const currency = getCurrencyForCountry(countryCode);
  return Math.round(usdAmount * currency.rate);
}

/**
 * Get country config by code
 */
export function getCountry(countryCode: string): CountryConfig | undefined {
  return countries.find(c => c.code === countryCode);
}