// Timezone options for setting a client's business-hours timezone.
// value is the IANA zone (what the backend stores and evaluates against).
//
// The full list comes from Intl.supportedValuesOf('timeZone') so every
// international zone is available. The curated COMMON list below is pinned to
// the top (with friendly labels) since most clients are US-based.

export const COMMON_TIMEZONES: { value: string; label: string }[] = [
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

// Back-compat alias (older imports used TIMEZONES).
export const TIMEZONES = COMMON_TIMEZONES;

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export function getTimezoneLabel(tz: string): string {
  return COMMON_TIMEZONES.find((t) => t.value === tz)?.label || tz;
}

// Current UTC offset for a zone, e.g. "(GMT-5)". Empty string if unavailable.
function offsetPrefix(zone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value ? `(${part.value}) ` : '';
  } catch {
    return '';
  }
}

// Built once per page load (offsets are "current"; fine for a picker).
let _allCache: { value: string; label: string }[] | null = null;

// Every IANA zone, common ones first (friendly labels), then the rest
// alphabetically with a UTC-offset prefix. Falls back to the common list on
// browsers without Intl.supportedValuesOf.
export function allTimezones(): { value: string; label: string }[] {
  if (_allCache) return _allCache;

  let zones: string[] = [];
  try {
    // @ts-expect-error - supportedValuesOf is newer than some TS lib targets
    zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []) || [];
  } catch {
    zones = [];
  }

  if (!zones.length) {
    _allCache = [...COMMON_TIMEZONES];
    return _allCache;
  }

  const commonSet = new Set(COMMON_TIMEZONES.map((t) => t.value));
  const common = COMMON_TIMEZONES.filter((t) => zones.includes(t.value));
  const rest = zones
    .filter((z) => !commonSet.has(z))
    .sort()
    .map((z) => ({ value: z, label: `${offsetPrefix(z)}${z.replace(/_/g, ' ')}` }));

  _allCache = [...common, ...rest];
  return _allCache;
}

// The full option list. If `current` is a zone not in the list (rare), it's
// prepended so it stays selectable.
export function timezoneOptions(current?: string | null): { value: string; label: string }[] {
  const all = allTimezones();
  if (current && !all.some((t) => t.value === current)) {
    return [{ value: current, label: current }, ...all];
  }
  return all;
}