'use client';

// ============================================================================
// /cc/businesses/[id] - configure a business from inside the call-center console.
//
// The full per-business setup the call-center manager controls without leaving
// /cc: identity + location, how the AI sounds (tone), greeting, business hours
// and after-hours handling, booking, call-handling toggles (spam, caller
// recognition, transfers, caller texts), live escalation, the post-call recap
// text, compliance (HIPAA + recording), and service areas. Every field writes a
// `clients` column the assistant config builder reads fresh per call, so a save
// takes effect on the next call with no VAPI rebuild. Agency-scoped server-side.
//
// Theme-aware (useTheme). All dropdowns are the themed CustomSelect, never a
// native <select>. Managers only (agents never reach /cc businesses).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Phone, Clock, MessageSquare, PhoneForwarded,
  Building2, Check, PhoneCall, CheckCircle2, AlertCircle, Bell, Bot,
  CalendarCheck, ShieldCheck, Mic, MapPin, Plus, X, Sparkles, Globe, Lock, Star, DollarSign,
} from 'lucide-react';
import { useAgency } from '../../../agency/context';
import { useTheme } from '../../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';
import CcKnowledgeBase from '@/components/cc/CcKnowledgeBase';
import CcVoiceSelection from '@/components/cc/CcVoiceSelection';
import CcCalendar from '@/components/cc/CcCalendar';
import ClientServicesSection from '@/components/client/ClientServicesSection';
import StaffMembersSection from '@/components/client/StaffMembersSection';

interface Cfg {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  email: string;
  businessCity: string;
  businessState: string;
  businessWebsite: string;
  industry: string;
  transferPhone: string;
  timezone: string;
  greeting: string;
  businessHours: Record<string, { open: string; close: string; closed: boolean }> | null;
  forwardingMode: 'all' | 'missed';
  humanHandoff: 'transfer' | 'message';
  overflowAction: 'message' | 'callback' | 'ring_business';
  aiDirectRouting: boolean;
  serviceAreas: string[];
  aiTone: 'professional' | 'friendly' | 'casual' | 'clinical';
  bookingMode: 'auto_book' | 'collect_request' | 'disabled';
  minBookingNotice: number | null;
  maxBookingDays: number | null;
  spamDetection: boolean;
  callerRecognition: boolean;
  transferCall: boolean;
  afterHoursRouting: boolean;
  smsToCaller: boolean;
  smsPresets: Record<string, { enabled: boolean; value: string }>;
  smsSnippets: { label: string; value: string }[];
  smsInstructions: string;
  apptOwnerSmsEnabled: boolean;
  apptCustomerSmsEnabled: boolean;
  apptCustomerSmsTemplate: string;
  hipaaMode: boolean;
  recordingEnabled: boolean;
  vapiPhoneNumber: string | null;
  forwardingConfirmed: boolean;
  postCallSms: boolean;
  notificationPhone: string;
  optOut?: { optedOut: boolean; phone: string; since?: string | null } | null;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' }, { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' }, { key: 'saturday', label: 'Saturday' }, { key: 'sunday', label: 'Sunday' },
];

const OVERFLOW_OPTIONS = [
  { value: 'message', label: 'Take a message' },
  { value: 'callback', label: 'Offer a callback' },
  { value: 'ring_business', label: 'Ring the business line' },
];
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver',
];
const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'clinical', label: 'Clinical' },
];
const BOOKING_MODES = [
  { value: 'auto_book', label: 'Book appointments automatically' },
  { value: 'collect_request', label: 'Collect the request, no auto-booking' },
  { value: 'disabled', label: 'Do not handle booking' },
];
// What the AI can text a caller mid-call (same set as the client level). The
// trigger is fixed server-side; the manager just turns one on and adds the value.
const SMS_PRESETS: { key: string; label: string; desc: string; placeholder: string; icon: any }[] = [
  { key: 'address', label: 'Address', desc: 'When a caller asks where the business is', placeholder: '123 Main St, City, ST', icon: MapPin },
  { key: 'website', label: 'Website', desc: 'When a caller wants more info', placeholder: 'https://business.com', icon: Globe },
  { key: 'review', label: 'Review link', desc: 'To ask for a review after a good call', placeholder: 'https://g.page/r/...', icon: Star },
  { key: 'payment', label: 'Payment link', desc: 'When a caller needs to pay', placeholder: 'https://...', icon: DollarSign },
];

function normalizeHours(raw: any): NonNullable<Cfg['businessHours']> {
  const out: NonNullable<Cfg['businessHours']> = {};
  const hasAny = raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length > 0;
  for (const d of DAYS) {
    const v = hasAny ? raw[d.key] : undefined;
    if (v && typeof v === 'object' && v.open && v.close && v.closed !== true) {
      out[d.key] = { open: v.open, close: v.close, closed: false };
    } else if (hasAny) {
      out[d.key] = { open: (v && v.open) || '09:00', close: (v && v.close) || '17:00', closed: true };
    } else {
      out[d.key] = { open: '09:00', close: '17:00', closed: d.key === 'saturday' || d.key === 'sunday' };
    }
  }
  return out;
}
function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

export default function BusinessConfig() {
  const params = useParams();
  const clientId = params.id as string;
  const { agency, loading: agencyLoading } = useAgency();
  const theme = useTheme();

  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [areaDraft, setAreaDraft] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  // Whether this call center may offer the customer booking-confirmation SMS
  // (a distinct upgrade). Gates the toggle below; owner alert is always available.
  const [apptSmsUnlocked, setApptSmsUnlocked] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{ minNotice: number; maxDays: number }>({ minNotice: 30, maxDays: 60 });
  // Per-section save: each card saves only its own fields (partial PUT) with its
  // own saving/saved/dirty state. No settings-wide save button.
  const [orig, setOrig] = useState<Cfg | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [errKey, setErrKey] = useState<{ key: string; msg: string } | null>(null);
  // Desktop layout: 'list' is the normal single-column scroll; 'grid' packs
  // sections into columns so more fit on screen at once. Persisted per browser.
  const [view, setView] = useState<'list' | 'grid'>('list');
  useEffect(() => { try { const v = localStorage.getItem('cc_config_view'); if (v === 'grid' || v === 'list') setView(v); } catch {} }, []);
  const setViewPersist = (v: 'list' | 'grid') => { setView(v); try { localStorage.setItem('cc_config_view', v); } catch {} };

  useEffect(() => {
    if (!agency?.id || !clientId) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const r = await fetch(`${base}/api/agency/${agency.id}/cc/businesses/${clientId}/config`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { setNotFound(true); return; }
        const d = await r.json();
        if (d.success) { const normalized = { ...d.config, businessHours: normalizeHours(d.config.businessHours), smsPresets: (d.config.smsPresets && typeof d.config.smsPresets === 'object') ? d.config.smsPresets : {}, smsSnippets: Array.isArray(d.config.smsSnippets) ? d.config.smsSnippets : [], smsInstructions: d.config.smsInstructions || '' }; setCfg(normalized); setOrig(normalized); if (d.agencyDefaults) setBookingDefaults(d.agencyDefaults); setApptSmsUnlocked(d.apptCustomerSmsUnlocked === true); }
        else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [agency?.id, clientId]);

  // Website-scraped "found on your website" service-area suggestions. Same
  // client-scoped endpoint the end-client My Business page uses (reachable with
  // the manager's token), so the call center gets the same suggestions.
  const loadAreaSuggestions = useCallback(async () => {
    if (!clientId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/client/${clientId}/scrape-suggestions`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setAreaSuggestions(Array.isArray(d.areas) ? d.areas : []); }
    } catch { /* suggestions are best-effort */ }
  }, [clientId]);
  useEffect(() => { loadAreaSuggestions(); }, [loadAreaSuggestions]);

  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((c) => (c ? { ...c, [k]: v } : c));
  // Caller-text preset + custom-link handlers (mirror the client level).
  const togglePreset = (key: string) => setCfg((c) => { if (!c) return c; const cur = (c.smsPresets && c.smsPresets[key]) || { enabled: false, value: '' }; return { ...c, smsPresets: { ...(c.smsPresets || {}), [key]: { ...cur, enabled: !cur.enabled } } }; });
  const setPresetValue = (key: string, value: string) => setCfg((c) => { if (!c) return c; const cur = (c.smsPresets && c.smsPresets[key]) || { enabled: true, value: '' }; return { ...c, smsPresets: { ...(c.smsPresets || {}), [key]: { ...cur, value } } }; });
  const addSnippet = () => setCfg((c) => (c ? { ...c, smsSnippets: [ ...(c.smsSnippets || []), { label: '', value: '' } ] } : c));
  const updateSnippet = (i: number, patch: Partial<{ label: string; value: string }>) => setCfg((c) => { if (!c) return c; const sn = [...(c.smsSnippets || [])]; sn[i] = { ...sn[i], ...patch }; return { ...c, smsSnippets: sn }; });
  const removeSnippet = (i: number) => setCfg((c) => (c ? { ...c, smsSnippets: (c.smsSnippets || []).filter((_, j) => j !== i) } : c));
  const setDay = (day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    setCfg((c) => (c && c.businessHours ? { ...c, businessHours: { ...c.businessHours, [day]: { ...c.businessHours[day], ...patch } } } : c));

  const addArea = () => {
    const v = areaDraft.trim();
    if (!v || !cfg) return;
    if (!cfg.serviceAreas.includes(v)) set('serviceAreas', [...cfg.serviceAreas, v].slice(0, 50));
    setAreaDraft('');
  };

  // Accept a scraped area suggestion: add it to the list, drop it from the
  // suggestions, and tell the backend not to surface it again. Still needs Save.
  const addAreaSuggestion = (name: string) => {
    if (!cfg) return;
    if (!cfg.serviceAreas.includes(name)) set('serviceAreas', [...cfg.serviceAreas, name].slice(0, 50));
    setAreaSuggestions((prev) => prev.filter((a) => a !== name));
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${base}/api/client/${clientId}/scrape-suggestions/dismiss`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'area', name }),
      });
    } catch { /* best-effort */ }
  };

  // Save just one section's fields. The backend PUT whitelists each field
  // behind `if (b.x !== undefined)` and merges tool_config, so a partial body
  // never clobbers fields from other sections.
  const saveFields = useCallback(async (fields: (keyof Cfg)[], sectionKey: string) => {
    if (!cfg || !agency?.id) return;
    setSavingKey(sectionKey); setErrKey(null); setSavedKey(null);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const body: Record<string, unknown> = {};
      fields.forEach((f) => { body[f as string] = (cfg as any)[f]; });
      const r = await fetch(`${base}/api/agency/${agency.id}/cc/businesses/${clientId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) {
        setOrig((o) => { if (!o) return o; const next = { ...o } as any; fields.forEach((f) => { next[f] = (cfg as any)[f]; }); return next; });
        setSavedKey(sectionKey); setTimeout(() => setSavedKey((k) => (k === sectionKey ? null : k)), 2500);
      } else setErrKey({ key: sectionKey, msg: d.error || 'Could not save.' });
    } catch { setErrKey({ key: sectionKey, msg: 'Could not save.' }); }
    finally { setSavingKey((k) => (k === sectionKey ? null : k)); }
  }, [cfg, agency?.id, clientId]);

  const dirty = (fields: (keyof Cfg)[]) => !!orig && !!cfg && fields.some((f) => JSON.stringify((cfg as any)[f]) !== JSON.stringify((orig as any)[f]));

  if (agencyLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>;
  }
  if (notFound || !cfg) {
    return (
      <div className="p-6 text-center min-h-screen" style={{ backgroundColor: theme.bg }}>
        <p style={{ color: theme.textMuted }}>Business not found, or not one of yours.</p>
        <a href="/cc/businesses" className="text-sm mt-2 inline-block" style={{ color: theme.primary }}>Back to Businesses</a>
      </div>
    );
  }

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: field, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>
  );
  const SectionHead = ({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Icon className="h-4 w-4" style={{ color: theme.primary }} /></div>
      <div><h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>{title}</h2>{sub && <p className="text-[12px]" style={{ color: theme.textMuted }}>{sub}</p>}</div>
    </div>
  );
  const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: on ? theme.primary : theme.hover, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200" style={{ transform: on ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
    </button>
  );
  const ToggleRow = ({ title, sub, on, onClick, disabled }: { title: string; sub: string; on: boolean; onClick: () => void; disabled?: boolean }) => (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: theme.text }}>{title}</p>
        <p className="text-[11.5px] mt-0.5" style={{ color: theme.textSubtle }}>{sub}</p>
      </div>
      <Toggle on={on} onClick={onClick} disabled={disabled} />
    </div>
  );
  // Per-section save button. Enabled only when that section has unsaved edits.
  const SK_LABELS: Record<string, string> = { business: 'Business', tone: 'Tone', greeting: 'Greeting', hours: 'Hours', booking: 'Booking', handling: 'Call Handling', escalation: 'Escalation', areas: 'Service Areas', postcall: 'Texts & Notifications', compliance: 'Compliance' };
  const SaveBtn = ({ fields, sk }: { fields: (keyof Cfg)[]; sk: string }) => {
    const isDirty = dirty(fields);
    const isSaving = savingKey === sk;
    const isSaved = savedKey === sk;
    const e = errKey && errKey.key === sk ? errKey.msg : null;
    return (
      <div className="flex items-center justify-end gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
        {e ? <span className="text-[12px] mr-auto" style={{ color: theme.error }}>{e}</span>
          : isSaved ? <span className="text-[12px] mr-auto inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-3.5 w-3.5" /> Saved</span>
          : isDirty ? <span className="text-[12px] mr-auto" style={{ color: theme.textMuted }}>Unsaved changes</span> : null}
        <button onClick={() => saveFields(fields, sk)} disabled={isSaving || !isDirty} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {SK_LABELS[sk] || ''}
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <a href="/cc/businesses" className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 mb-4" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Businesses
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>{cfg.businessName || 'Business'}</h1>
          <p className="mt-0.5 text-xs sm:text-[13px] flex items-center gap-1.5 flex-wrap" style={{ color: theme.textMuted }}>
            {cfg.vapiPhoneNumber && <><Phone className="h-3.5 w-3.5" /> {fmtPhone(cfg.vapiPhoneNumber)} <span style={{ color: theme.textSubtle }}>(AI line)</span></>}
            {cfg.forwardingConfirmed
              ? <span className="inline-flex items-center gap-1" style={{ color: theme.success }}><CheckCircle2 className="h-3.5 w-3.5" /> Forwarding active</span>
              : <span className="inline-flex items-center gap-1" style={{ color: theme.warning }}><AlertCircle className="h-3.5 w-3.5" /> Forwarding not confirmed</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden lg:inline-flex rounded-xl p-0.5" style={{ backgroundColor: theme.hover }}>
            {(['list', 'grid'] as const).map((v) => (
              <button key={v} onClick={() => setViewPersist(v)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition" style={v === view ? { backgroundColor: theme.card, color: theme.text } : { color: theme.textMuted }}>{v === 'list' ? 'Scroll' : 'Compact'}</button>
            ))}
          </div>
          <a href={`/live/${clientId}?mode=monitor&back=/cc/live-calls`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
            <PhoneCall className="h-4 w-4" /> Watch live
          </a>
        </div>
      </div>

      <div className={view === 'grid' ? 'max-w-5xl lg:columns-2 lg:gap-5 [&>*]:mb-4 sm:[&>*]:mb-5 [&>*]:break-inside-avoid' : 'max-w-2xl space-y-4 sm:space-y-5'}>
        {/* Basics */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Building2} title="Business" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Business name</Label><input value={cfg.businessName} onChange={(e) => set('businessName', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Owner name</Label><input value={cfg.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Owner phone</Label><input value={cfg.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>City</Label><input value={cfg.businessCity} onChange={(e) => set('businessCity', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>State</Label><input value={cfg.businessState} onChange={(e) => set('businessState', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Time zone</Label>
              <CustomSelect value={cfg.timezone || 'America/New_York'} onChange={(v) => set('timezone', v)}
                options={[...(cfg.timezone && !TIMEZONES.includes(cfg.timezone) ? [{ value: cfg.timezone, label: cfg.timezone }] : []), ...TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('America/', '').replace('Pacific/', '').replace('_', ' ') }))]}
                ui={ddUI} />
            </div>
            <div><Label>Website</Label><input value={cfg.businessWebsite} onChange={(e) => set('businessWebsite', e.target.value)} placeholder="https://" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
          </div>
          {cfg.email && <p className="text-[11.5px] mt-3" style={{ color: theme.textSubtle }}>Owner login: {cfg.email}</p>}
          <SaveBtn fields={['businessName', 'ownerName', 'ownerPhone', 'businessCity', 'businessState', 'timezone', 'businessWebsite']} sk="business" />
        </div>

        {/* Voice & tone */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Bot} title="How the AI Sounds" sub="The personality the receptionist uses on calls for this business." />
          <Label>Tone</Label>
          <CustomSelect value={cfg.aiTone} onChange={(v) => set('aiTone', v as Cfg['aiTone'])} options={TONES} ui={ddUI} />
          <SaveBtn fields={['aiTone']} sk="tone" />
        </div>

        {/* Voice selection */}
        <CcVoiceSelection clientId={clientId} theme={theme} greeting={cfg.greeting} />

        {/* Greeting */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={MessageSquare} title="Greeting" sub="The first thing the AI says when it answers for this business." />
          <textarea value={cfg.greeting} onChange={(e) => set('greeting', e.target.value)} rows={3} maxLength={600}
            placeholder={`Thanks for calling ${cfg.businessName || 'your business'}. This call may be recorded for quality. How can I help?`}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={field} />
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={() => set('greeting', `Thanks for calling ${cfg.businessName || 'your business'}. This call may be recorded for quality assurance. How can I help you today?`)} className="text-[12px] font-semibold flex-shrink-0" style={{ color: theme.primary }}>Use suggested greeting</button>
            <span className="text-[11px]" style={{ color: theme.textMuted }}>Includes a call-recording notice, recommended for two-party-consent states.</span>
          </div>
          <SaveBtn fields={['greeting']} sk="greeting" />
        </div>

        {/* Knowledge base */}
        <CcKnowledgeBase agencyId={agency?.id || ''} clientId={clientId} theme={theme} />

        {/* Service areas (kept with the knowledge base: both are "what the AI knows") */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={MapPin} title="Service Areas" sub="Cities or regions this business serves, used by the AI when a caller asks." />
          <div className="flex items-center gap-2 mb-3">
            <input value={areaDraft} onChange={(e) => setAreaDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
              placeholder="Add a city or region, then Enter" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
            <button onClick={addArea} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.text }}><Plus className="h-4 w-4" /> Add</button>
          </div>
          {areaSuggestions.filter((a) => !cfg.serviceAreas.includes(a)).length > 0 && (
            <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-1.5 mb-2"><Globe className="h-3.5 w-3.5" style={{ color: theme.primary }} /><span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>Found on your website</span></div>
              <div className="flex flex-wrap gap-1.5">
                {areaSuggestions.filter((a) => !cfg.serviceAreas.includes(a)).map((a) => (
                  <button key={a} onClick={() => addAreaSuggestion(a)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition hover:opacity-90" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} title="Add this service area">
                    <Plus className="h-3 w-3" style={{ color: theme.primary }} /> {a}
                  </button>
                ))}
              </div>
            </div>
          )}
          {cfg.serviceAreas.length === 0 ? (
            <p className="text-[12px]" style={{ color: theme.textSubtle }}>None set. The AI will not claim a specific service area.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cfg.serviceAreas.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                  {a}<button onClick={() => set('serviceAreas', cfg.serviceAreas.filter((x) => x !== a))} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <SaveBtn fields={['serviceAreas']} sk="areas" />
        </div>

        {/* Hours */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Clock} title="Business Hours" sub="The business's own open hours. The AI books appointments into these times and can tell callers when the office is open. This does NOT affect reaching your agents, callers can be connected to a person around the clock (see Live Escalation)." />
          <div className="space-y-2">
            {DAYS.map((d) => {
              const h = cfg.businessHours?.[d.key] || { open: '09:00', close: '17:00', closed: true };
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-[13px] w-24 flex-shrink-0" style={{ color: theme.text }}>{d.label}</span>
                  <button onClick={() => setDay(d.key, { closed: !h.closed })} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium flex-shrink-0 w-24 justify-center"
                    style={h.closed ? { backgroundColor: theme.hover, color: theme.textMuted } : { backgroundColor: theme.primary15, color: theme.primary }}>
                    {h.closed ? 'Closed' : 'Open'}
                  </button>
                  {!h.closed && (
                    <div className="flex items-center gap-1.5">
                      <input type="time" value={h.open} onChange={(e) => setDay(d.key, { open: e.target.value })} className="rounded-lg px-2 py-1.5 text-[13px] outline-none" style={field} />
                      <span style={{ color: theme.textSubtle }}>to</span>
                      <input type="time" value={h.close} onChange={(e) => setDay(d.key, { close: e.target.value })} className="rounded-lg px-2 py-1.5 text-[13px] outline-none" style={field} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <SaveBtn fields={['businessHours']} sk="hours" />
        </div>

        {/* Booking */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={CalendarCheck} title="Booking" sub="How the AI handles appointment requests." />
          <Label>Booking behavior</Label>
          <CustomSelect value={cfg.bookingMode} onChange={(v) => set('bookingMode', v as Cfg['bookingMode'])} options={BOOKING_MODES} ui={ddUI} />
          {cfg.bookingMode !== 'disabled' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div><Label>Minimum notice (minutes)</Label><input type="number" min={0} value={cfg.minBookingNotice ?? ''} onChange={(e) => set('minBookingNotice', e.target.value === '' ? null : Number(e.target.value))} placeholder={`Agency default: ${bookingDefaults.minNotice}`} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
                <div><Label>How far ahead (days)</Label><input type="number" min={1} value={cfg.maxBookingDays ?? ''} onChange={(e) => set('maxBookingDays', e.target.value === '' ? null : Number(e.target.value))} placeholder={`Agency default: ${bookingDefaults.maxDays}`} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
              </div>
              <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>Leave either blank to use the agency default ({bookingDefaults.minNotice} min notice, {bookingDefaults.maxDays} days ahead), set in agency Settings. A value here overrides it for just this business.</p>
            </>
          )}
          <SaveBtn fields={['bookingMode', 'minBookingNotice', 'maxBookingDays']} sk="booking" />
        </div>

        {/* Google Calendar */}
        <CcCalendar clientId={clientId} theme={theme} />

        {/* Services (shared industry-aware editor, same as the client level) */}
        <ClientServicesSection clientId={clientId} industry={cfg.industry} theme={theme} />

        {/* Staff (shared industry-aware editor, same as the client level) */}
        <StaffMembersSection clientId={clientId} industry={cfg.industry} theme={theme} />

        {/* Call handling */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Sparkles} title="Call Handling" sub="What the AI does on every call for this business." />
          <div className="divide-y" style={{ borderColor: theme.borderSubtle }}>
            <ToggleRow title="Block spam and robocalls" sub="Detect telemarketers and solicitors and end those calls. They never count against limits." on={cfg.spamDetection} onClick={() => set('spamDetection', !cfg.spamDetection)} />
            <ToggleRow title="Recognize returning callers" sub="Greet a known caller by name and carry their history into the call." on={cfg.callerRecognition} onClick={() => set('callerRecognition', !cfg.callerRecognition)} disabled={cfg.hipaaMode} />
            <ToggleRow title="Allow transfers to a person" sub="Let the AI hand a caller to an agent or the escalation number." on={cfg.transferCall} onClick={() => set('transferCall', !cfg.transferCall)} />
            <ToggleRow title="Let the AI text the caller" sub="Send the caller a text during the call (address, booking link, and so on)." on={cfg.smsToCaller} onClick={() => set('smsToCaller', !cfg.smsToCaller)} />
          </div>
          {cfg.smsToCaller && (
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
              <p className="text-[11.5px]" style={{ color: theme.textSubtle }}>Turn on what the AI can text callers during a call, then add the link or info. It only ever texts the person on the call.</p>
              {SMS_PRESETS.map((preset) => {
                const pr = (cfg.smsPresets && cfg.smsPresets[preset.key]) || { enabled: false, value: '' };
                const Icon = preset.icon;
                return (
                  <div key={preset.key} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${pr.enabled ? theme.primary : theme.inputBorder}` }}>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: pr.enabled ? theme.primary : theme.textMuted }} />
                        <div className="min-w-0"><p className="text-[13px] font-medium" style={{ color: theme.text }}>{preset.label}</p><p className="text-[11px]" style={{ color: theme.textSubtle }}>{preset.desc}</p></div>
                      </div>
                      <Toggle on={pr.enabled} onClick={() => togglePreset(preset.key)} />
                    </div>
                    {pr.enabled && (
                      <div className="px-3 pb-2.5"><input value={pr.value} onChange={(e) => setPresetValue(preset.key, e.target.value)} placeholder={preset.placeholder} className="w-full rounded-lg px-2.5 py-2 text-[13px] outline-none" style={field} /></div>
                    )}
                  </div>
                );
              })}
              {(cfg.smsSnippets || []).map((snip, i) => (
                <div key={`snip-${i}`} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${(snip.label || snip.value) ? theme.primary : theme.inputBorder}` }}>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" style={{ color: (snip.label || snip.value) ? theme.primary : theme.textMuted }} />
                      <input value={snip.label} onChange={(e) => updateSnippet(i, { label: e.target.value })} placeholder="Label (e.g. Booking link)" className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none" style={{ color: theme.text }} />
                    </div>
                    <button type="button" onClick={() => removeSnippet(i)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:opacity-70 flex-shrink-0" style={{ color: theme.textMuted }} title="Remove"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="px-3 pb-2.5"><input value={snip.value} onChange={(e) => updateSnippet(i, { value: e.target.value })} placeholder="Exact text or link, sent word-for-word" className="w-full rounded-lg px-2.5 py-2 text-[13px] outline-none" style={field} /></div>
                </div>
              ))}
              <button type="button" onClick={addSnippet} className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: theme.primary }}><Plus className="h-3.5 w-3.5" /> Add a custom text</button>
              <div className="pt-1">
                <Label>Extra instructions (optional)</Label>
                <textarea value={cfg.smsInstructions} onChange={(e) => set('smsInstructions', e.target.value)} rows={2} placeholder="Fine-tune when or how the AI texts, e.g. always send the booking link after scheduling." className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-y" style={field} />
              </div>
            </div>
          )}
          {cfg.hipaaMode && <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>Caller recognition is off while HIPAA mode is on.</p>}
          <SaveBtn fields={['spamDetection', 'callerRecognition', 'transferCall', 'smsToCaller', 'smsPresets', 'smsSnippets', 'smsInstructions']} sk="handling" />
        </div>

        {/* Escalation */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={PhoneForwarded} title="Live Escalation" sub="How a caller reaches a person. This runs around the clock, not just during the business's open hours. Who is actually available is decided by your agents' own working hours and online status (set under Agents), and what happens when none are free is the overflow below, that is your call center's real after-hours." />
          <Label>When a caller wants a human</Label>
          <div className="flex gap-2 mb-4">
            {([['transfer', 'Connect them to a person'], ['message', 'Always take a message']] as const).map(([v, lbl]) => (
              <button key={v} onClick={() => set('humanHandoff', v)} className="flex-1 rounded-xl px-3 py-2.5 text-[13px] font-medium transition"
                style={cfg.humanHandoff === v ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.textMuted }}>
                {lbl}
              </button>
            ))}
          </div>
          {cfg.humanHandoff === 'transfer' && (
            <>
              <div className="rounded-xl p-3.5" style={{ backgroundColor: theme.hover }}>
                <p className="text-[12px] font-medium mb-1.5" style={{ color: theme.text }}>How a handoff works</p>
                <p className="text-[11.5px] leading-relaxed" style={{ color: theme.textMuted }}>The AI answers and handles everything it can: questions, bookings, texts. It only reaches for a human when a caller truly needs one. At that point the call is offered to your available agents first. The settings below decide what happens when no agent is free, and whether the AI may skip your agents for a specific department.</p>
              </div>

              <div className="mt-4">
                <Label>When no agent is available</Label>
                <CustomSelect value={cfg.overflowAction} onChange={(v) => set('overflowAction', v as Cfg['overflowAction'])} options={OVERFLOW_OPTIONS} ui={ddUI} />
                <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>
                  {cfg.overflowAction === 'ring_business'
                    ? 'The AI rings the escalation phone below. Use this only if the business wants calls sent straight to them when your team is unavailable.'
                    : cfg.overflowAction === 'callback'
                    ? 'The AI tells the caller a team member will call them back, takes their number and reason, and sends it to your team. The business is never rung.'
                    : 'The AI takes a message (name, number, reason) and sends it to your team. The business is never rung, so you stay in front of it, the way a call center should.'}
                </p>
              </div>

              {cfg.overflowAction === 'ring_business' && (
                <div className="mt-4">
                  <Label>Escalation phone (where to ring the business)</Label>
                  <input value={cfg.transferPhone} onChange={(e) => set('transferPhone', e.target.value)} placeholder={fmtPhone(cfg.ownerPhone) || '(555) 555-5555'}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
                  <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Rung only when no agent takes the call. Leave blank to fall back to the business owner&apos;s phone.</p>
                </div>
              )}

              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                <ToggleRow
                  title="Let the AI route straight to a department"
                  sub={cfg.aiDirectRouting
                    ? 'On: when a caller clearly needs a specific department you set up under Staff (say, billing), the AI connects them straight there and skips your agents. A generic "I need a person" still goes to your agents first.'
                    : 'Off (recommended): every handoff goes to your agents first, and the agent decides where it goes next. Turn this on only for a larger business that wants certain callers sent straight to a named department.'}
                  on={cfg.aiDirectRouting}
                  onClick={() => set('aiDirectRouting', !cfg.aiDirectRouting)}
                />
              </div>

            </>
          )}
          <SaveBtn fields={['humanHandoff', 'transferPhone', 'overflowAction', 'aiDirectRouting']} sk="escalation" />
        </div>

        {/* Texts & Notifications: recap + booking-owner alert + customer confirmation, one shared owner recipient */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Bell} title="Texts & Notifications" sub="Every text this business sends: the post-call recap, the booking alert to the owner, and the customer's booking confirmation. All owner texts go to the one number set below." />
          {cfg.optOut?.optedOut && (
            <div className="rounded-xl p-3 mb-3 flex items-start gap-2.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
              <div className="text-[12px] leading-relaxed" style={{ color: theme.warning }}>
                <span className="font-semibold">{fmtPhone(cfg.optOut.phone) || cfg.optOut.phone} replied STOP and has opted out of texts.</span> While opted out they get no texts from the platform at all, including these, until they text <span className="font-semibold">START</span> to the same number to opt back in. The toggles below have no effect until then.
              </div>
            </div>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textSubtle }}>To the business owner</p>
          <ToggleRow title="Text the owner a recap after every call" sub={cfg.postCallSms ? 'On: a recap after each call (who called, what they needed, the summary).' : 'Off: no recap text. You can still watch calls live.'} on={cfg.postCallSms} onClick={() => set('postCallSms', !cfg.postCallSms)} />
          {cfg.bookingMode === 'auto_book' && (
            <ToggleRow title="Text the owner when an appointment is booked" sub="A separate alert the moment the AI books, on top of the post-call recap. Goes to the business, not your call center." on={cfg.apptOwnerSmsEnabled} onClick={() => set('apptOwnerSmsEnabled', !cfg.apptOwnerSmsEnabled)} />
          )}
          {(cfg.postCallSms || (cfg.bookingMode === 'auto_book' && cfg.apptOwnerSmsEnabled)) && (
            <div className="mt-2">
              <Label>Send owner texts to (optional)</Label>
              <input value={cfg.notificationPhone} onChange={(e) => set('notificationPhone', e.target.value)} placeholder={fmtPhone(cfg.ownerPhone) || '(555) 555-5555'}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Applies to the recap and the booking alert above. Leave blank to use the owner phone. Set the owner&apos;s own cell so these never land on a call-center line.</p>
            </div>
          )}

          {cfg.bookingMode === 'auto_book' && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textSubtle }}>To the customer</p>
              {apptSmsUnlocked ? (
                <>
                  <ToggleRow title="Text the customer a booking confirmation" sub="Texts the caller a confirmation from this business's number right after they book, which cuts no-shows." on={cfg.apptCustomerSmsEnabled} onClick={() => set('apptCustomerSmsEnabled', !cfg.apptCustomerSmsEnabled)} />
                  {cfg.apptCustomerSmsEnabled && (
                    <div className="pt-2">
                      <Label>Confirmation message</Label>
                      <textarea value={cfg.apptCustomerSmsTemplate} onChange={(e) => set('apptCustomerSmsTemplate', e.target.value.slice(0, 320))} rows={3} placeholder="Hi {name}, your {service} with {business} is confirmed for {date} at {time}. Reply here if you need to change anything." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-y" style={field} />
                      <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Placeholders: {'{name}'}, {'{business}'}, {'{service}'}, {'{date}'}, {'{time}'}, {'{staff}'}. Leave blank for the default. Sent from this business&apos;s AI number.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-xl px-3.5 py-3" style={{ backgroundColor: theme.input, border: `1px dashed ${theme.inputBorder}` }}>
                  <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.textMuted }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: theme.text }}>Text the customer a booking confirmation</p>
                    <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>A premium add-on: an automatic booking confirmation sent to the caller. Contact us to enable it for your call center.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <SaveBtn fields={['postCallSms', 'notificationPhone', 'apptOwnerSmsEnabled', 'apptCustomerSmsEnabled', 'apptCustomerSmsTemplate']} sk="postcall" />
        </div>

        {/* Compliance */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={ShieldCheck} title="Compliance" sub="Recording and healthcare handling for this business." />
          <div className="divide-y" style={{ borderColor: theme.borderSubtle }}>
            <ToggleRow title="Record calls" sub={cfg.hipaaMode ? 'Forced off by HIPAA mode.' : 'Store a recording and transcript of each call.'} on={cfg.recordingEnabled && !cfg.hipaaMode} onClick={() => set('recordingEnabled', !cfg.recordingEnabled)} disabled={cfg.hipaaMode} />
            <ToggleRow title="HIPAA mode" sub="No recordings or transcripts, caller recognition off, booking limited to collecting the request. Use for healthcare clients." on={cfg.hipaaMode} onClick={() => set('hipaaMode', !cfg.hipaaMode)} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11.5px]" style={{ color: theme.textSubtle }}>
            <Mic className="h-3.5 w-3.5" /> Recording changes take effect on the next call.
          </div>
          <SaveBtn fields={['hipaaMode', 'recordingEnabled']} sk="compliance" />
        </div>

      </div>
    </div>
  );
}