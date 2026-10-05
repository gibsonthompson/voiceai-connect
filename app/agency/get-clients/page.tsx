'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import MissedCallCalculator from '@/components/MissedCallCalculator';
import { Rocket, Copy, Check, ExternalLink, Phone, Link2 } from 'lucide-react';

const CFG_KEY = 'vac_getclients_cfg';

// Ready-to-send assets. These mirror the marketing-kit blueprint so an agency
// can grab proven copy without leaving the dashboard.
const SCRIPTS: { title: string; body: string }[] = [
  { title: 'Cold text to a local business', body: "Hi {{owner}}, {{myname}} here, local to {{city}}. Quick one, how many calls does {{business}} miss when the crew's out? Most {{trade}} shops lose $5 to 10k/month to voicemail. I've got an AI receptionist that answers 24/7 and books jobs straight to your calendar. Want a number you can call to hear it? No pitch, just hear it." },
  { title: 'Cold email', body: "Hey {{owner}},\n\nQuick math. A {{trade}} shop your size probably misses 20 to 30% of calls when the crew's out, and about 8 in 10 of those callers just dial the next shop. That's real money walking.\n\nI set up AI receptionists for {{city}} {{trade}} businesses. They answer every call 24/7, sound human, and book the job to your calendar. Here's a number you can call right now and hear one: {{demo_number}}\n\nIf it's a fit it runs {{price}}/mo. Want me to set one up on your business for a few days so you can watch it work?\n\n{{myname}}" },
  { title: 'Follow-up (no reply)', body: "Hey {{owner}}, did you get a chance to call that number? Curious what you thought. Happy to just set one up on your line for a few days, free, so you can see the bookings come in." },
];
const SOCIAL: string[] = [
  "62% of calls to small businesses go unanswered during the day. If you run a {{trade}} shop, that's your paycheck going to voicemail.",
  "8 out of 10 people who hit your voicemail never call back. They call the next guy. Every single time.",
  "The average missed call to a home-services business is worth about $1,200. How many did you miss this week?",
  "An AI receptionist that answers every call 24/7, books the job, and costs less than missing one call a month. Call {{demo_number}} and hear it.",
  "Stop paying for leads you can't answer. Catch the calls you're already getting first.",
];

export default function GetClientsPage() {
  const { agency, branding } = useAgency();
  const theme = useTheme();

  const [price, setPrice] = useState(297);
  const [ctaText, setCtaText] = useState('Set up a test line you can call');
  const [ctaUrl, setCtaUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (raw) { const c = JSON.parse(raw); if (c.price != null) setPrice(c.price); if (c.ctaText) setCtaText(c.ctaText); if (c.ctaUrl) setCtaUrl(c.ctaUrl); }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CFG_KEY, JSON.stringify({ price, ctaText, ctaUrl })); } catch { /* ignore */ }
  }, [price, ctaText, ctaUrl]);

  const shareLink = useMemo(() => {
    const dom = (agency as any)?.domain_verified ? ((agency as any)?.marketing_domain || '') : '';
    const base = dom ? `https://${dom}` : (typeof window !== 'undefined' ? window.location.origin : '');
    const p = new URLSearchParams();
    if (agency?.id) p.set('a', agency.id);
    if (price) p.set('price', String(price));
    if (ctaText) p.set('ctatext', ctaText);
    if (ctaUrl) p.set('ctaurl', ctaUrl);
    const qs = p.toString();
    return `${base}/calculator${qs ? '?' + qs : ''}`;
  }, [agency, price, ctaText, ctaUrl]);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key); setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1600);
  };

  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as const;
  const cardStyle = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as const;
  const labelCls = 'block text-xs font-medium mb-1.5';

  const priceNum = Number(String(price).replace(/[^\d]/g, '')) || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="h-5 w-5" style={{ color: theme.primary }} />
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text }}>Get Clients</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        Everything you need to land your first client. Branded as you, ready to send. All of it is free to use.
      </p>

      {/* CALCULATOR */}
      <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
        <h2 className="font-semibold text-base sm:text-lg mb-1" style={{ color: theme.text }}>Your missed-call calculator</h2>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
          Share the link with a prospect, or run it live on a call. It shows them exactly what missed calls are costing, branded as your business.
        </p>

        {/* config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={labelCls} style={{ color: theme.text }}>Your price to the client ($/mo)</label>
            <input value={price} onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0))} inputMode="numeric" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: theme.text }}>Button text</label>
            <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} maxLength={48} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: theme.text }}>Button link (your booking page or tel:)</label>
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://… or tel:+1…" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </div>
        </div>

        {/* share link */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5 p-3 rounded-xl" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <Link2 className="h-4 w-4 flex-shrink-0 hidden sm:block" style={{ color: theme.textMuted }} />
          <span className="text-xs sm:text-sm flex-1 truncate" style={{ color: theme.textMuted }}>{shareLink}</span>
          <div className="flex gap-2">
            <button onClick={() => copy('link', shareLink)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}>
              {copiedKey === 'link' ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
            </button>
            <a href={shareLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          </div>
        </div>

        {/* live branded preview */}
        <MissedCallCalculator
          businessName={branding?.name || agency?.name || 'Your Business'}
          accentColor={branding?.accentColor || '#3B82F6'}
          logoUrl={branding?.logoUrl || null}
          clientPrice={priceNum}
          ctaText={ctaText}
          ctaUrl={ctaUrl || undefined}
        />
      </div>

      {/* READY TO SEND */}
      <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
        <h2 className="font-semibold text-base sm:text-lg mb-1" style={{ color: theme.text }}>Ready to send</h2>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
          Fill in the <span style={{ color: theme.text }}>{'{{ }}'}</span> blanks and send. These are proven, just add your details.
        </p>

        <div className="space-y-3">
          {SCRIPTS.map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{s.title}</span>
                <button onClick={() => copy('s' + i, s.body)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium flex-shrink-0" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
                  {copiedKey === 's' + i ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <p className="text-[13px] whitespace-pre-line" style={{ color: theme.textMuted }}>{s.body}</p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold mt-6 mb-3" style={{ color: theme.text }}>Social posts</h3>
        <div className="space-y-2">
          {SOCIAL.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <p className="text-[13px] flex-1" style={{ color: theme.textMuted }}>{p}</p>
              <button onClick={() => copy('p' + i, p)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium flex-shrink-0" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
                {copiedKey === 'p' + i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
