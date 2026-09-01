// Curated set of major world timezones (one recognizable city per region/offset),
// with search keywords so a searchable picker can match on city, country, US zone
// name, or UTC offset. Not the full 400+ IANA list — this covers everyone without
// the obscure duplicates.

interface TzEntry { value: string; label: string; keywords: string; }

// label is the friendly base name; a UTC offset gets prefixed at runtime.
const CURATED: TzEntry[] = [
  // --- United States ---
  { value: 'America/New_York', label: 'Eastern Time (New York)', keywords: 'eastern et us usa america new york' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', keywords: 'central ct us usa america chicago' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', keywords: 'mountain mt us usa america denver' },
  { value: 'America/Phoenix', label: 'Arizona (Phoenix)', keywords: 'arizona phoenix us usa no dst mountain' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', keywords: 'pacific pt us usa america los angeles california' },
  { value: 'America/Anchorage', label: 'Alaska (Anchorage)', keywords: 'alaska anchorage us usa' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Honolulu)', keywords: 'hawaii honolulu us usa' },
  // --- Canada ---
  { value: 'America/Toronto', label: 'Toronto (Eastern)', keywords: 'canada toronto ontario eastern' },
  { value: 'America/Winnipeg', label: 'Winnipeg (Central)', keywords: 'canada winnipeg manitoba central' },
  { value: 'America/Edmonton', label: 'Edmonton (Mountain)', keywords: 'canada edmonton alberta mountain' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific)', keywords: 'canada vancouver british columbia pacific' },
  { value: 'America/Halifax', label: 'Halifax (Atlantic)', keywords: 'canada halifax atlantic nova scotia' },
  { value: 'America/St_Johns', label: "St. John's (Newfoundland)", keywords: 'canada st johns newfoundland' },
  // --- Mexico / Central America / Caribbean ---
  { value: 'America/Mexico_City', label: 'Mexico City', keywords: 'mexico city cdmx' },
  { value: 'America/Tijuana', label: 'Tijuana', keywords: 'mexico tijuana baja pacific' },
  { value: 'America/Guatemala', label: 'Guatemala City', keywords: 'guatemala central america' },
  { value: 'America/Panama', label: 'Panama', keywords: 'panama central america' },
  { value: 'America/Havana', label: 'Havana', keywords: 'cuba havana caribbean' },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico', keywords: 'puerto rico san juan caribbean' },
  // --- South America ---
  { value: 'America/Bogota', label: 'Bogota', keywords: 'colombia bogota south america' },
  { value: 'America/Lima', label: 'Lima', keywords: 'peru lima south america' },
  { value: 'America/Caracas', label: 'Caracas', keywords: 'venezuela caracas south america' },
  { value: 'America/Santiago', label: 'Santiago', keywords: 'chile santiago south america' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', keywords: 'argentina buenos aires south america' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo', keywords: 'brazil brasil sao paulo rio south america' },
  { value: 'America/La_Paz', label: 'La Paz', keywords: 'bolivia la paz south america' },
  // --- UK / Ireland / Western Europe ---
  { value: 'Europe/London', label: 'London', keywords: 'uk united kingdom england london britain gmt bst' },
  { value: 'Europe/Dublin', label: 'Dublin', keywords: 'ireland dublin' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik', keywords: 'iceland reykjavik' },
  { value: 'Europe/Lisbon', label: 'Lisbon', keywords: 'portugal lisbon' },
  { value: 'Europe/Madrid', label: 'Madrid', keywords: 'spain madrid barcelona' },
  { value: 'Europe/Paris', label: 'Paris', keywords: 'france paris central european cet' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', keywords: 'netherlands holland amsterdam' },
  { value: 'Europe/Brussels', label: 'Brussels', keywords: 'belgium brussels' },
  { value: 'Europe/Berlin', label: 'Berlin', keywords: 'germany berlin frankfurt munich central european cet' },
  { value: 'Europe/Zurich', label: 'Zurich', keywords: 'switzerland zurich geneva' },
  { value: 'Europe/Rome', label: 'Rome', keywords: 'italy rome milan' },
  { value: 'Europe/Vienna', label: 'Vienna', keywords: 'austria vienna' },
  { value: 'Europe/Stockholm', label: 'Stockholm', keywords: 'sweden stockholm' },
  { value: 'Europe/Oslo', label: 'Oslo', keywords: 'norway oslo' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen', keywords: 'denmark copenhagen' },
  { value: 'Europe/Warsaw', label: 'Warsaw', keywords: 'poland warsaw' },
  { value: 'Europe/Prague', label: 'Prague', keywords: 'czech prague' },
  { value: 'Europe/Budapest', label: 'Budapest', keywords: 'hungary budapest' },
  // --- Eastern Europe / Middle East ---
  { value: 'Europe/Athens', label: 'Athens', keywords: 'greece athens eastern european' },
  { value: 'Europe/Helsinki', label: 'Helsinki', keywords: 'finland helsinki' },
  { value: 'Europe/Bucharest', label: 'Bucharest', keywords: 'romania bucharest' },
  { value: 'Europe/Kyiv', label: 'Kyiv', keywords: 'ukraine kyiv kiev' },
  { value: 'Europe/Istanbul', label: 'Istanbul', keywords: 'turkey istanbul' },
  { value: 'Europe/Moscow', label: 'Moscow', keywords: 'russia moscow' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem', keywords: 'israel jerusalem tel aviv' },
  { value: 'Asia/Beirut', label: 'Beirut', keywords: 'lebanon beirut' },
  { value: 'Asia/Baghdad', label: 'Baghdad', keywords: 'iraq baghdad' },
  { value: 'Asia/Riyadh', label: 'Riyadh', keywords: 'saudi arabia riyadh gulf' },
  { value: 'Asia/Dubai', label: 'Dubai', keywords: 'uae united arab emirates dubai abu dhabi' },
  { value: 'Asia/Tehran', label: 'Tehran', keywords: 'iran tehran' },
  // --- Africa ---
  { value: 'Africa/Casablanca', label: 'Casablanca', keywords: 'morocco casablanca' },
  { value: 'Africa/Lagos', label: 'Lagos', keywords: 'nigeria lagos west africa' },
  { value: 'Africa/Algiers', label: 'Algiers', keywords: 'algeria algiers' },
  { value: 'Africa/Cairo', label: 'Cairo', keywords: 'egypt cairo' },
  { value: 'Africa/Nairobi', label: 'Nairobi', keywords: 'kenya nairobi east africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', keywords: 'south africa johannesburg cape town' },
  { value: 'Africa/Accra', label: 'Accra', keywords: 'ghana accra' },
  // --- South / Central Asia ---
  { value: 'Asia/Karachi', label: 'Karachi', keywords: 'pakistan karachi islamabad' },
  { value: 'Asia/Kolkata', label: 'India (Kolkata)', keywords: 'india kolkata mumbai delhi bangalore chennai ist' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu', keywords: 'nepal kathmandu' },
  { value: 'Asia/Colombo', label: 'Colombo', keywords: 'sri lanka colombo' },
  { value: 'Asia/Dhaka', label: 'Dhaka', keywords: 'bangladesh dhaka' },
  { value: 'Asia/Tashkent', label: 'Tashkent', keywords: 'uzbekistan tashkent' },
  // --- Southeast / East Asia ---
  { value: 'Asia/Bangkok', label: 'Bangkok', keywords: 'thailand bangkok' },
  { value: 'Asia/Jakarta', label: 'Jakarta', keywords: 'indonesia jakarta' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City', keywords: 'vietnam ho chi minh saigon hanoi' },
  { value: 'Asia/Singapore', label: 'Singapore', keywords: 'singapore' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', keywords: 'malaysia kuala lumpur' },
  { value: 'Asia/Manila', label: 'Manila', keywords: 'philippines manila' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', keywords: 'hong kong' },
  { value: 'Asia/Shanghai', label: 'China (Shanghai)', keywords: 'china shanghai beijing' },
  { value: 'Asia/Taipei', label: 'Taipei', keywords: 'taiwan taipei' },
  { value: 'Asia/Seoul', label: 'Seoul', keywords: 'south korea seoul' },
  { value: 'Asia/Tokyo', label: 'Tokyo', keywords: 'japan tokyo osaka' },
  // --- Oceania ---
  { value: 'Australia/Perth', label: 'Perth', keywords: 'australia perth western' },
  { value: 'Australia/Adelaide', label: 'Adelaide', keywords: 'australia adelaide' },
  { value: 'Australia/Brisbane', label: 'Brisbane', keywords: 'australia brisbane queensland' },
  { value: 'Australia/Sydney', label: 'Sydney', keywords: 'australia sydney melbourne canberra' },
  { value: 'Pacific/Auckland', label: 'Auckland', keywords: 'new zealand auckland wellington' },
  { value: 'Pacific/Fiji', label: 'Fiji', keywords: 'fiji' },
  { value: 'Pacific/Guam', label: 'Guam', keywords: 'guam' },
  // --- UTC ---
  { value: 'UTC', label: 'UTC', keywords: 'utc gmt universal coordinated' },
];

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

function offsetShort(zone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value || '';
  } catch {
    return '';
  }
}

export interface TimezoneOption { value: string; label: string; keywords: string; }

let _cache: TimezoneOption[] | null = null;

// The curated list, each with a UTC-offset prefix in the label and offset folded
// into the search keywords. Built once per page load.
export function allTimezones(): TimezoneOption[] {
  if (_cache) return _cache;
  _cache = CURATED.map((t) => {
    const off = offsetShort(t.value);
    return {
      value: t.value,
      label: off ? `(${off}) ${t.label}` : t.label,
      keywords: `${t.label} ${t.keywords} ${off} ${t.value}`.toLowerCase().replace(/_/g, ' '),
    };
  });
  return _cache;
}

export function getTimezoneLabel(tz: string): string {
  return allTimezones().find((t) => t.value === tz)?.label || tz;
}

// Options list; if `current` isn't curated it's prepended so it stays selectable.
export function timezoneOptions(current?: string | null): TimezoneOption[] {
  const all = allTimezones();
  if (current && !all.some((t) => t.value === current)) {
    return [{ value: current, label: current, keywords: current.toLowerCase() }, ...all];
  }
  return all;
}

// Filter by a free-text query against label + keywords (city, country, offset).
export function searchTimezones(query: string, current?: string | null): TimezoneOption[] {
  const opts = timezoneOptions(current);
  const q = query.trim().toLowerCase();
  if (!q) return opts;
  const terms = q.split(/\s+/);
  return opts.filter((o) => terms.every((term) => o.keywords.includes(term)));
}