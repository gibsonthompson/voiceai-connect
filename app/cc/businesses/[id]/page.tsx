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
  CalendarCheck, ShieldCheck, Mic, MapPin, Plus, X, Sparkles,
} from 'lucide-react';
import { useAgency } from '../../../agency/context';
import { useTheme } from '../../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';
import CcKnowledgeBase from '@/components/cc/CcKnowledgeBase';
import CcVoiceSelection from '@/components/cc/CcVoiceSelection';
import CcServices from '@/components/cc/CcServices';
import CcStaff from '@/components/cc/CcStaff';
import CcCalendar from '@/components/cc/CcCalendar';

interface Cfg {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  email: string;
  businessCity: string;
  businessState: string;
  businessWebsite: string;
  transferPhone: string;
  timezone: string;
  greeting: string;
  businessHours: Record<string, { open: string; close: string; closed: boolean }> | null;
  forwardingMode: 'all' | 'missed';
  humanHandoff: 'transfer' | 'message';
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
  hipaaMode: boolean;
  recordingEnabled: boolean;
  vapiPhoneNumber: string | null;
  forwardingConfirmed: boolean;
  postCallSms: boolean;
  notificationPhone: string;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' }, { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' }, { key: 'saturday', label: 'Saturday' }, { key: 'sunday', label: 'Sunday' },
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [areaDraft, setAreaDraft] = useState('');

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
        if (d.success) setCfg({ ...d.config, businessHours: normalizeHours(d.config.businessHours) });
        else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [agency?.id, clientId]);

  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((c) => (c ? { ...c, [k]: v } : c));
  const setDay = (day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    setCfg((c) => (c && c.businessHours ? { ...c, businessHours: { ...c.businessHours, [day]: { ...c.businessHours[day], ...patch } } } : c));

  const addArea = () => {
    const v = areaDraft.trim();
    if (!v || !cfg) return;
    if (!cfg.serviceAreas.includes(v)) set('serviceAreas', [...cfg.serviceAreas, v].slice(0, 50));
    setAreaDraft('');
  };

  const save = useCallback(async () => {
    if (!cfg || !agency?.id) return;
    setSaving(true); setErr(null); setSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/agency/${agency.id}/cc/businesses/${clientId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: cfg.businessName, ownerName: cfg.ownerName, ownerPhone: cfg.ownerPhone,
          businessCity: cfg.businessCity, businessState: cfg.businessState, businessWebsite: cfg.businessWebsite,
          transferPhone: cfg.transferPhone, timezone: cfg.timezone, greeting: cfg.greeting,
          businessHours: cfg.businessHours, forwardingMode: cfg.forwardingMode, humanHandoff: cfg.humanHandoff,
          serviceAreas: cfg.serviceAreas,
          aiTone: cfg.aiTone, bookingMode: cfg.bookingMode, minBookingNotice: cfg.minBookingNotice, maxBookingDays: cfg.maxBookingDays,
          spamDetection: cfg.spamDetection, callerRecognition: cfg.callerRecognition, transferCall: cfg.transferCall,
          afterHoursRouting: cfg.afterHoursRouting, smsToCaller: cfg.smsToCaller,
          hipaaMode: cfg.hipaaMode, recordingEnabled: cfg.recordingEnabled,
          postCallSms: cfg.postCallSms, notificationPhone: cfg.notificationPhone,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setErr(d.error || 'Could not save.');
    } catch { setErr('Could not save.'); }
    finally { setSaving(false); }
  }, [cfg, agency?.id, clientId]);

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
        <a href={`/live/${clientId}?mode=monitor`} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
          <PhoneCall className="h-4 w-4" /> Watch live
        </a>
      </div>

      <div className="max-w-2xl space-y-4 sm:space-y-5">
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
        </div>

        {/* Voice & tone */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Bot} title="How the AI sounds" sub="The personality the receptionist uses on calls for this business." />
          <Label>Tone</Label>
          <CustomSelect value={cfg.aiTone} onChange={(v) => set('aiTone', v as Cfg['aiTone'])} options={TONES} ui={ddUI} />
        </div>

        {/* Voice selection */}
        <CcVoiceSelection clientId={clientId} theme={theme} />

        {/* Greeting */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={MessageSquare} title="Greeting" sub="The first thing the AI says when it answers for this business." />
          <textarea value={cfg.greeting} onChange={(e) => set('greeting', e.target.value)} rows={3} maxLength={600}
            placeholder="Thanks for calling Bella's Salon, this is the front desk. How can I help?"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={field} />
        </div>

        {/* Knowledge base */}
        <CcKnowledgeBase agencyId={agency?.id || ''} clientId={clientId} theme={theme} />

        {/* Hours */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Clock} title="Business hours" sub="Used for after-hours handling below." />
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
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
            <ToggleRow title="After-hours mode" sub="When closed, take a message or book instead of transferring to a person." on={cfg.afterHoursRouting} onClick={() => set('afterHoursRouting', !cfg.afterHoursRouting)} />
          </div>
        </div>

        {/* Booking */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={CalendarCheck} title="Booking" sub="How the AI handles appointment requests." />
          <Label>Booking behavior</Label>
          <CustomSelect value={cfg.bookingMode} onChange={(v) => set('bookingMode', v as Cfg['bookingMode'])} options={BOOKING_MODES} ui={ddUI} />
          {cfg.bookingMode !== 'disabled' && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div><Label>Minimum notice (minutes)</Label><input type="number" min={0} value={cfg.minBookingNotice ?? ''} onChange={(e) => set('minBookingNotice', e.target.value === '' ? null : Number(e.target.value))} placeholder="Agency default" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
              <div><Label>How far ahead (days)</Label><input type="number" min={1} value={cfg.maxBookingDays ?? ''} onChange={(e) => set('maxBookingDays', e.target.value === '' ? null : Number(e.target.value))} placeholder="Agency default" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            </div>
          )}
        </div>

        {/* Google Calendar */}
        <CcCalendar clientId={clientId} theme={theme} />

        {/* Services */}
        <CcServices clientId={clientId} theme={theme} />

        {/* Staff */}
        <CcStaff clientId={clientId} theme={theme} />

        {/* Call handling */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Sparkles} title="Call handling" sub="What the AI does on every call for this business." />
          <div className="divide-y" style={{ borderColor: theme.borderSubtle }}>
            <ToggleRow title="Block spam and robocalls" sub="Detect telemarketers and solicitors and end those calls. They never count against limits." on={cfg.spamDetection} onClick={() => set('spamDetection', !cfg.spamDetection)} />
            <ToggleRow title="Recognize returning callers" sub="Greet a known caller by name and carry their history into the call." on={cfg.callerRecognition} onClick={() => set('callerRecognition', !cfg.callerRecognition)} disabled={cfg.hipaaMode} />
            <ToggleRow title="Allow transfers to a person" sub="Let the AI hand a caller to an agent or the escalation number." on={cfg.transferCall} onClick={() => set('transferCall', !cfg.transferCall)} />
            <ToggleRow title="Let the AI text the caller" sub="Send the caller a text during the call (address, booking link, and so on)." on={cfg.smsToCaller} onClick={() => set('smsToCaller', !cfg.smsToCaller)} />
          </div>
          {cfg.hipaaMode && <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>Caller recognition is off while HIPAA mode is on.</p>}
        </div>

        {/* Escalation */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={PhoneForwarded} title="Live escalation" sub="What happens when a caller asks for a person during open hours." />
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
              <Label>Escalation phone (where to ring if no call-center agent takes it)</Label>
              <input value={cfg.transferPhone} onChange={(e) => set('transferPhone', e.target.value)} placeholder={fmtPhone(cfg.ownerPhone) || '(555) 555-5555'}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Leave blank to fall back to the owner phone. Your available agents are always offered the call first.</p>
            </>
          )}
        </div>

        {/* Service areas */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={MapPin} title="Service areas" sub="Cities or regions this business serves, used by the AI when a caller asks." />
          <div className="flex items-center gap-2 mb-3">
            <input value={areaDraft} onChange={(e) => setAreaDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
              placeholder="Add a city or region, then Enter" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
            <button onClick={addArea} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.text }}><Plus className="h-4 w-4" /> Add</button>
          </div>
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
        </div>

        {/* Post-call recap SMS */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Bell} title="Post-call text" sub="A recap text to the business owner after each call: who called, what they needed, the summary." />
          <ToggleRow title="Text the owner a recap after every call" sub={cfg.postCallSms ? 'On: this business gets a recap text after each call.' : 'Off: this business gets no recap text. You can still watch calls live.'} on={cfg.postCallSms} onClick={() => set('postCallSms', !cfg.postCallSms)} />
          {cfg.postCallSms && (
            <div className="mt-2">
              <Label>Send the recap to (optional)</Label>
              <input value={cfg.notificationPhone} onChange={(e) => set('notificationPhone', e.target.value)} placeholder={fmtPhone(cfg.ownerPhone) || '(555) 555-5555'}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Goes to the business owner. Leave blank to use the owner phone. Set this to the owner&apos;s own cell so the recap never lands on a call-center line.</p>
            </div>
          )}
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
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-between gap-3 sticky bottom-3">
          <span className="text-[13px]" style={{ color: err ? theme.error : theme.textMuted }}>
            {err ? err : saved ? <span className="inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-4 w-4" /> Saved</span> : ''}
          </span>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
}