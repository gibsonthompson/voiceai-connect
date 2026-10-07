'use client';

// ============================================================================
// MISSED-CALL REVENUE CALCULATOR (Marketing Kit tool)
//
// Agency-facing closing tool: plug in a prospect's numbers and show what missed
// calls are costing them, then print a branded result sheet to hand over. Pure
// frontend, brands from the agency's logo/colors/demo number. A later phase can
// expose a public, QR-scannable version for prospects to self-serve.
// ============================================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Calculator } from 'lucide-react';
import { useAgency } from '../../context';
import { useTheme } from '@/hooks/useTheme';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

function qrImg(data: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));

export default function MissedCallCalculatorPage() {
  const { agency, branding } = useAgency();
  const theme = useTheme();

  const [prospect, setProspect] = useState('');
  const [avgJob, setAvgJob] = useState(500);
  const [callsPerWeek, setCallsPerWeek] = useState(50);
  const [missedPct, setMissedPct] = useState(25);
  const [closeRate, setCloseRate] = useState(40);

  const r = useMemo(() => {
    const missedWeek = callsPerWeek * (missedPct / 100);
    const missedMonth = missedWeek * 4.33;
    const lostJobsMonth = missedMonth * (closeRate / 100);
    const lostMonth = lostJobsMonth * avgJob;
    return {
      missedWeek: Math.round(missedWeek),
      missedMonth: Math.round(missedMonth),
      lostJobsMonth: Math.round(lostJobsMonth),
      lostMonth,
      lostYear: lostMonth * 12,
    };
  }, [avgJob, callsPerWeek, missedPct, closeRate]);

  const name = branding.name || agency?.name || 'Your Agency';
  const primary = branding.primaryColor || '#10b981';
  const logoUrl = branding.logoUrl || agency?.logo_url || null;
  const demo = agency?.demo_phone_number || null;
  const base = agency?.marketing_domain && agency?.domain_verified
    ? `https://${agency.marketing_domain}`
    : `https://${agency?.slug || 'app'}.${PLATFORM_DOMAIN}`;
  const signupUrl = `${base}/signup`;

  const cardStyle: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16 };
  const inputStyle: React.CSSProperties = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  const field = (label: string, value: number, setter: (n: number) => void, opts: { min?: number; max?: number; step?: number; prefix?: string; suffix?: string } = {}) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>{label}</label>
      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
        {opts.prefix && <span className="px-3 text-sm" style={{ color: theme.textMuted, backgroundColor: theme.hover }}>{opts.prefix}</span>}
        <input type="number" value={Number.isFinite(value) ? value : 0} min={opts.min ?? 0} max={opts.max} step={opts.step ?? 1}
          onChange={(e) => setter(Math.max(opts.min ?? 0, Math.min(opts.max ?? Infinity, Number(e.target.value))))}
          className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none" style={{ backgroundColor: theme.input, border: 'none', color: theme.text }} />
        {opts.suffix && <span className="px-3 text-sm" style={{ color: theme.textMuted, backgroundColor: theme.hover }}>{opts.suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px]">
      <style>{`@media print { body * { visibility: hidden !important; } #mcalc-result, #mcalc-result * { visibility: visible !important; } #mcalc-result { position: absolute !important; inset: 0 !important; margin: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; } @page { margin: 0.5in; } }`}</style>

      <Link href="/agency/marketing-kit" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Marketing Kit
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}>
          <Calculator className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Missed-Call Revenue Calculator</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>Plug in a prospect&apos;s numbers to show what missed calls are costing them, then print a branded sheet to hand over.</p>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Inputs */}
        <div className="p-5" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Their numbers</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Business name (optional)</label>
              <input type="text" value={prospect} onChange={(e) => setProspect(e.target.value)} placeholder="e.g. Ridgeline Plumbing"
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            {field('Average job value', avgJob, setAvgJob, { prefix: '$', min: 0, step: 25 })}
            {field('Calls per week', callsPerWeek, setCallsPerWeek, { min: 0 })}
            {field('Percent of calls missed', missedPct, setMissedPct, { min: 0, max: 100, suffix: '%' })}
            {field('Close rate on answered calls', closeRate, setCloseRate, { min: 0, max: 100, suffix: '%' })}
          </div>
          <p className="text-[11px] mt-4" style={{ color: theme.textMuted }}>Defaults are typical for local service businesses. Adjust to match the prospect.</p>
        </div>

        {/* Live result */}
        <div className="p-5 flex flex-col" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>What it&apos;s costing them</h2>
          <div className="rounded-xl p-5 text-center" style={{ background: `${primary}14`, border: `1px solid ${primary}33` }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Lost revenue / month</p>
            <p className="text-4xl font-extrabold mt-1" style={{ color: primary }}>{money(r.lostMonth)}</p>
            <p className="text-sm mt-2" style={{ color: theme.textMuted }}>{money(r.lostYear)} per year</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[['Missed calls/mo', String(r.missedMonth)], ['Lost jobs/mo', String(r.lostJobsMonth)], ['Missed calls/wk', String(r.missedWeek)]].map(([l, v]) => (
              <div key={l} className="rounded-lg p-3" style={{ backgroundColor: theme.hover }}>
                <p className="text-lg font-bold" style={{ color: theme.text }}>{v}</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>{l}</p>
              </div>
            ))}
          </div>
          <button onClick={() => window.print()} className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
            <Printer className="h-4 w-4" /> Print / download result sheet
          </button>
        </div>
      </div>

      {/* Printable branded result */}
      <div id="mcalc-result" className="mt-8" style={{ background: '#ffffff', color: '#111827', border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 820 }}>
        <div style={{ background: primary, color: '#fff', padding: '24px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {logoUrl ? <img src={logoUrl} alt={name} style={{ height: 40, maxWidth: 220, objectFit: 'contain' }} /> : <span style={{ fontSize: 22, fontWeight: 800 }}>{name}</span>}
        </div>
        <div style={{ padding: 36 }}>
          <h3 style={{ fontSize: 28, lineHeight: 1.15, margin: 0, fontWeight: 800, color: '#0f172a' }}>
            What missed calls are costing {prospect.trim() || 'your business'}
          </h3>
          <div style={{ marginTop: 24, background: `${primary}12`, border: `1px solid ${primary}33`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>Estimated lost revenue</p>
            <p style={{ margin: '6px 0 0', fontSize: 46, fontWeight: 900, color: primary }}>{money(r.lostMonth)}<span style={{ fontSize: 20, color: '#64748b', fontWeight: 700 }}>/mo</span></p>
            <p style={{ margin: '4px 0 0', fontSize: 16, color: '#475569' }}>That&apos;s about <strong>{money(r.lostYear)}</strong> a year walking out the door.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            {[['Calls missed / month', String(r.missedMonth)], ['Jobs lost / month', String(r.lostJobsMonth)], ['Avg job value', money(avgJob)]].map(([l, v]) => (
              <div key={l} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{v}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{l}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22, fontSize: 16, color: '#1f2937', lineHeight: 1.6 }}>
            An AI receptionist answers every one of those calls, 24/7, books the job, and texts you the details. No missed calls, no lost revenue.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
            <img src={qrImg(demo ? `tel:${demo.replace(/[^\d+]/g, '')}` : signupUrl, 220)} alt="QR" width={110} height={110} style={{ width: 110, height: 110, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{demo ? 'Scan to hear it answer live' : 'Scan to get started'}</p>
              {demo && <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: primary }}>{demo}</p>}
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569' }}>{name}{agency?.phone ? ` · ${agency.phone}` : ''} · {signupUrl.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
          <p style={{ marginTop: 18, fontSize: 11, color: '#94a3b8' }}>Estimate based on the figures provided. Actual results vary.</p>
        </div>
      </div>
    </div>
  );
}