'use client';

// ============================================================================
// /cc/businesses/[id] - configure a business from inside the call-center console.
//
// The call-center manager sets how the AI answers for this business without
// leaving /cc: the greeting, business hours (which drive after-hours handling),
// where to escalate a live caller, and the basics. Everything saves to the same
// client fields the assistant reads at call time, so changes take effect on the
// next call. Agency-scoped server-side.
//
// Theme-aware (useTheme inline styles). Managers only (agents never reach /cc
// businesses).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Phone, Clock, MessageSquare, PhoneForwarded,
  Building2, Check, PhoneCall, CheckCircle2, AlertCircle, Bell,
} from 'lucide-react';
import { useAgency } from '../../../agency/context';
import { useTheme } from '../../../../hooks/useTheme';

interface Cfg {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  transferPhone: string;
  timezone: string;
  greeting: string;
  businessHours: Record<string, { open: string; close: string; closed: boolean }> | null;
  forwardingMode: 'all' | 'missed';
  humanHandoff: 'transfer' | 'message';
  serviceAreas: string[];
  vapiPhoneNumber: string | null;
  forwardingConfirmed: boolean;
  // Post-call recap SMS to the business owner after each call.
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
];
// Normalize whatever is stored (closed days are `null`, open days `{open,close}`,
// or the whole thing is null for "not set") into a full 7-day working shape of
// { open, close, closed } the editor renders. Unset hours default to Mon-Fri 9-5.
function normalizeHours(raw: any): NonNullable<Cfg['businessHours']> {
  const out: NonNullable<Cfg['businessHours']> = {};
  const hasAny = raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length > 0;
  for (const d of DAYS) {
    const v = hasAny ? raw[d.key] : undefined;
    if (v && typeof v === 'object' && v.open && v.close && v.closed !== true) {
      out[d.key] = { open: v.open, close: v.close, closed: false };
    } else if (hasAny) {
      // present but null / closed / missing times -> closed
      out[d.key] = { open: (v && v.open) || '09:00', close: (v && v.close) || '17:00', closed: true };
    } else {
      // nothing stored -> sensible default (weekdays open)
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
          transferPhone: cfg.transferPhone, timezone: cfg.timezone, greeting: cfg.greeting,
          businessHours: cfg.businessHours, forwardingMode: cfg.forwardingMode, humanHandoff: cfg.humanHandoff,
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
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>
  );
  const SectionHead = ({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Icon className="h-4 w-4" style={{ color: theme.primary }} /></div>
      <div><h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>{title}</h2>{sub && <p className="text-[12px]" style={{ color: theme.textMuted }}>{sub}</p>}</div>
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
            <div><Label>Business name</Label><input value={cfg.businessName} onChange={(e) => set('businessName', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Time zone</Label>
              <select value={cfg.timezone || ''} onChange={(e) => set('timezone', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field}>
                <option value="">Not set</option>
                {!TIMEZONES.includes(cfg.timezone) && cfg.timezone ? <option value={cfg.timezone}>{cfg.timezone}</option> : null}
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><Label>Owner name</Label><input value={cfg.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Owner phone</Label><input value={cfg.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
          </div>
        </div>

        {/* Greeting */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={MessageSquare} title="Greeting" sub="The first thing the AI says when it answers for this business." />
          <textarea value={cfg.greeting} onChange={(e) => set('greeting', e.target.value)} rows={3} maxLength={600}
            placeholder="Thanks for calling Bella's Salon, this is the front desk. How can I help?"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={field} />
        </div>

        {/* Hours */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Clock} title="Business hours" sub="Outside these hours the AI takes a message instead of transferring." />
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

        {/* Post-call recap SMS */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Bell} title="Post-call text" sub="A recap text to the business owner after each call: who called, what they needed, the summary." />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: theme.text }}>Text the owner a recap after every call</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: theme.textSubtle }}>
                {cfg.postCallSms ? 'On: this business gets a recap text after each call.' : 'Off: this business gets no recap text. You can still watch calls live.'}
              </p>
            </div>
            <button type="button" onClick={() => set('postCallSms', !cfg.postCallSms)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none"
              style={{ backgroundColor: cfg.postCallSms ? theme.primary : theme.hover }}>
              <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200" style={{ transform: cfg.postCallSms ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
            </button>
          </div>
          {cfg.postCallSms && (
            <div className="mt-4">
              <Label>Send the recap to (optional)</Label>
              <input value={cfg.notificationPhone} onChange={(e) => set('notificationPhone', e.target.value)} placeholder={fmtPhone(cfg.ownerPhone) || '(555) 555-5555'}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Goes to the business owner. Leave blank to use the owner phone. Set this to the owner&apos;s own cell so the recap never lands on a call-center line.</p>
            </div>
          )}
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