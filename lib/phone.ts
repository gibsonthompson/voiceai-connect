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