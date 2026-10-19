'use client';

// /cc/settings - call-center settings landing. Covers the settings a call-center
// manager actually touches (account + support contact), quick links to agents
// and billing, growth add-on status, and an inline Help section (the "help UI")
// that explains how the call center works. Deep/rarely-used account settings
// still live in the full /agency/settings screen, linked here.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, Save, Loader2, Check, Headset, Building2, ChevronRight, HelpCircle, ChevronDown, Phone, PlusCircle, Palette } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import ApiKeysTab from '@/components/agency/ApiKeysTab';
import WebhooksTab from '@/components/agency/WebhooksTab';
import CcManagersSection from '@/components/cc/CcManagersSection';
import CcAgentSettings from '@/components/cc/CcAgentSettings';

const HELP = [
  { q: 'How do calls reach the AI? Do businesses keep their number?', a: 'Yes. Each business keeps its existing public number and forwards it to the AI number we provision. It is call forwarding, not porting, so their number never changes, including during a trial. Caller-ID recovery is built in, so you and the AI still see the real caller even on a forwarded call.' },
  { q: 'How do I add an agent and limit what they see?', a: 'Go to Agents, add the person, and check the businesses you want them to handle. An agent only sees those businesses on the live board and can only open or take their calls. You can change their businesses anytime.' },
  { q: 'How does live monitoring and taking over a call work?', a: 'Open Live Calls to see every call happening right now. Click a call to listen in live, then jump in to take over the conversation, or hand it back to the AI. The caller never hears the switch.' },
  { q: 'What do the analytics mean?', a: 'AI deflection is the share of real calls the AI handled without a person. Escalation is the share that went to a human (a transfer or an agent taking over). Booking rate is the share that booked an appointment. Everything is call insight, there is no revenue here since call centers do not bill through us.' },
  { q: 'Something is wrong with a live call. What do I do?', a: 'Use the support link below or contact us directly. For a call in progress, you can always jump in from Live Calls and take it over while we look into it.' },
];

// Managers/owners get the call-center account settings below; a call-center
// agent gets their own settings (account + password, availability + override,
// notifications, call delivery). One route, split by role.
export default function CallCenterSettingsPage() {
  const { isAgent } = useAgency();
  return isAgent ? <CcAgentSettings /> : <ManagerSettings />;
}

function ManagerSettings() {
  const { agency, refreshAgency } = useAgency();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openHelp, setOpenHelp] = useState<number | null>(0);

  useEffect(() => {
    if (!agency) return;
    setName(agency.name || '');
    setSupportEmail((agency as any).support_email || '');
    setSupportPhone((agency as any).support_phone || '');
    setPhone(agency.phone || '');
  }, [agency?.id]);

  const save = async () => {
    if (!agency?.id) return;
    setSaving(true); setErr(null); setSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), support_email: supportEmail.trim() || null, support_phone: supportPhone.trim() || null, phone: phone.trim() || null }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Failed to save'); }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      try { await refreshAgency(); } catch {}
    } catch (e: any) { setErr(e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const field = (label: string, value: string, setter: (v: string) => void, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>{label}</label>
      <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
    </div>
  );

  const quickLink = (href: string, Icon: any, title: string, sub: string, external?: boolean) => (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.input; }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Icon className="h-4 w-4" style={{ color: theme.primary }} /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate" style={{ color: theme.text }}>{title}</span><span className="block text-[12px] truncate" style={{ color: theme.textMuted }}>{sub}</span></span>
      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
    </Link>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><SettingsIcon className="h-5 w-5" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Settings</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Your call center account, team, and help.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-5 sm:space-y-6">
        {/* Account */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Account</h2>
          <div className="space-y-3.5">
            {field('Call center name', name, setName, 'text', 'Acme Answering')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {field('Support email', supportEmail, setSupportEmail, 'email', 'help@acme.com')}
              {field('Support phone', supportPhone, setSupportPhone, 'tel', '+1 (555) 123-4567')}
            </div>
            {field('Account phone', phone, setPhone, 'tel', '+1 (555) 123-4567')}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </button>
            {err && <span className="text-xs" style={{ color: theme.error }}>{err}</span>}
          </div>
          <div className="mt-4 pt-4 text-[12px]" style={{ borderTop: `1px solid ${theme.borderSubtle}`, color: theme.textMuted }}>
            Your call center account is invoiced directly, so there is no self-serve billing here. For custom domains, line capacity, or billing questions, reach us at {supportEmail || 'your account contact'}.
          </div>
        </div>

        {/* Managers (owner / manage-team only; self-gates, renders nothing otherwise) */}
        <CcManagersSection theme={theme} />

        {/* Branding (deep-links to its own page) */}
        <Link href="/cc/branding" className="flex items-center gap-3 rounded-2xl p-5 sm:p-6 transition-colors" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.card; }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Palette className="h-4 w-4" style={{ color: theme.primary }} /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Branding</span>
            <span className="block text-[12px]" style={{ color: theme.textMuted }}>Logo, colors, fonts, and nav icons. Upload a logo and we match the rest.</span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
        </Link>

        {/* API access */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <ApiKeysTab agency={agency} theme={theme} />
        </div>

        {/* Webhooks */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <WebhooksTab agency={agency} theme={theme} />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLink('/cc/agents', Headset, 'Agents', 'Add agents, assign businesses')}
          {quickLink('/cc/businesses', Building2, 'Businesses', 'The businesses you answer for')}
        </div>

        {/* Growth add-on status */}
        <div className="rounded-2xl p-4 sm:p-5 flex items-start gap-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><PlusCircle className="h-4 w-4" style={{ color: theme.primary }} /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: theme.text }}>Growth tools {(agency as any)?.cc_growth_addon ? 'enabled' : 'add-on'}</p>
            <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>
              {(agency as any)?.cc_growth_addon
                ? 'Lead finder, outreach, referrals, demo phone and the marketing site are enabled on your account.'
                : 'Lead finder, outreach, referrals, demo phone and the marketing site are not included. They can be turned on as an add-on, contact us to enable them.'}
            </p>
          </div>
        </div>

        {/* Help */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <HelpCircle className="h-4 w-4" style={{ color: theme.textMuted }} />
            <h2 className="text-sm font-semibold" style={{ color: theme.text }}>Help & getting started</h2>
          </div>
          {HELP.map((h, i) => {
            const open = openHelp === i;
            return (
              <div key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                <button onClick={() => setOpenHelp(open ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left">
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{h.q}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" style={{ color: theme.textMuted, transform: open ? 'rotate(180deg)' : 'none' }} />
                </button>
                {open && <div className="px-5 pb-4 text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{h.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
