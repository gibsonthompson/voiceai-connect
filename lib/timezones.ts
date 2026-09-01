// Curated timezone list for setting a client's business-hours timezone.
// value is the IANA zone (what the backend stores and evaluates against);
// label is a friendly name. US zones first since that's the primary market.

export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Phoenix', label: 'Arizona (Phoenix, no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Honolulu)' },
  { value: 'America/Toronto', label: 'Toronto (Eastern, Canada)' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific, Canada)' },
  { value: 'America/Halifax', label: 'Atlantic (Halifax, Canada)' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Dublin', label: 'Dublin (Ireland)' },
  { value: 'Europe/Paris', label: 'Paris (Central European)' },
  { value: 'Europe/Berlin', label: 'Berlin (Central European)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
  { value: 'Pacific/Auckland', label: 'Auckland (New Zealand)' },
];

// The browser's own timezone, a good default suggestion for a client setting
// their own hours.
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export function getTimezoneLabel(tz: string): string {
  return TIMEZONES.find((t) => t.value === tz)?.label || tz;
}

// Returns TIMEZONES, but if the current value isn't in the curated list
// (e.g. an uncommon IANA zone), prepends it so it's still selectable.
export function timezoneOptions(current?: string | null): { value: string; label: string }[] {
  if (current && !TIMEZONES.some((t) => t.value === current)) {
    return [{ value: current, label: current }, ...TIMEZONES];
  }
  return TIMEZONES;
}