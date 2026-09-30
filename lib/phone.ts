// Single source of truth for turning a stored phone number into a tel: link.
// Demo/support numbers are stored in E.164 (e.g. +14046490065), so blindly
// prepending "+1" to the digits double-adds the US country code and produces
// the "+11..." that silently fails to dial. Normalize by length instead.
export function telHref(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return 'tel:';
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`; // already has US country code
  if (digits.length === 10) return `tel:+1${digits}`;                      // bare US 10-digit
  if ((phone || '').trim().startsWith('+')) return `tel:+${digits}`;       // already E.164 (intl)
  return `tel:+1${digits}`;                                                // fallback: assume US
}

// Single source of truth for signup phone validation. A fake or malformed entry
// (an 11-digit US number, "0000000", "idonthaveone") silently breaks every
// downstream SMS: the activation cron can't send, marks the agency complete, and
// they never hear from us. The dial code comes from the country selector, so the
// field holds the national number only. The backend mirrors this in
// agency-signup.js isValidPhone.
export function isValidPhone(rawPhone: string, iso: string): boolean {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // all identical: 0000000, 5555555
  const c = String(iso || 'US').toUpperCase();
  if (c === 'US' || c === 'CA') {
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    // NANP: 10 digits, area code and exchange code both start 2-9
    return /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(digits);
  }
  // Other countries: plausible national-number length.
  return digits.length >= 6 && digits.length <= 14;
}