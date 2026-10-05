'use client';

import { useState, useMemo } from 'react';

// Shared, brandable missed-call revenue calculator. Pure and prop-driven so the
// same component renders on the agency's white-label site (branding from host),
// inside the dashboard (branding from the agency profile), and as a public lead
// magnet. No localStorage here; the host surface passes config in.
export interface CalcBranding {
  businessName?: string;
  accentColor?: string;
  logoUrl?: string | null;
  clientPrice?: number;     // the agency's monthly price to their client
  ctaText?: string;
  ctaUrl?: string;
  poweredBy?: string | null; // renders "Powered by X" when set
}

type PresetKey = 'plumbing' | 'hvac' | 'electrical' | 'roofing' | 'general';
const PRESETS: Record<PresetKey, { job: number; missed: number; close: number; label: string }> = {
  plumbing:   { job: 650,  missed: 30, close: 45, label: 'Plumbing' },
  hvac:       { job: 850,  missed: 35, close: 40, label: 'HVAC' },
  electrical: { job: 550,  missed: 28, close: 45, label: 'Electrical' },
  roofing:    { job: 9000, missed: 25, close: 30, label: 'Roofing' },
  general:    { job: 500,  missed: 30, close: 40, label: 'Other' },
};

const fmt0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const usd = (n: number) => '$' + fmt0.format(Math.max(0, Math.round(n)));

export default function MissedCallCalculator(props: CalcBranding) {
  const accent = props.accentColor || '#3B82F6';
  const accentDark = accent.toLowerCase() === '#111827' || accent.toLowerCase() === '#0b0b0b';
  const accentInk = accentDark ? '#E9EEF6' : '#ffffff';
  const price = typeof props.clientPrice === 'number' && props.clientPrice >= 0 ? props.clientPrice : 297;
  const name = (props.businessName || '').trim();

  const [preset, setPreset] = useState<PresetKey>('plumbing');
  const [calls, setCalls] = useState(40);
  const [job, setJob] = useState(650);
  const [missed, setMissed] = useState(30);
  const [close, setClose] = useState(45);
  const [recover, setRecover] = useState(70);
  const [copied, setCopied] = useState(false);

  const applyPreset = (key: PresetKey) => {
    const p = PRESETS[key];
    setPreset(key); setJob(p.job); setMissed(p.missed); setClose(p.close);
  };

  const c = useMemo(() => {
    const missedMo = calls * (missed / 100) * 4.33;
    const lostMo = missedMo * job * (close / 100);
    const lostYr = lostMo * 12;
    const backMo = lostMo * (recover / 100);
    const netMo = backMo - price;
    const perCall = job * (close / 100);
    const callsToPay = perCall > 0 ? Math.max(1, Math.ceil(price / perCall)) : 1;
    return { missedMo, lostMo, lostYr, backMo, netMo, callsToPay, fiveYr: lostYr * 5 };
  }, [calls, job, missed, close, recover, price]);

  const summary = () => {
    const l = [
      'Quick math on missed calls for a shop like yours:',
      `At about ${calls} calls a week and a ${usd(job)} average job, you're missing roughly ${Math.round(c.missedMo)} calls a month, around ${usd(c.lostMo)}/month (${usd(c.lostYr)}/year) in work going to voicemail and walking to competitors.`,
      `An AI receptionist answers every one, 24/7. Even saving just ${recover}% of them, that's about ${usd(c.backMo)}/month back. It runs ${usd(price)}/month.`,
      'Want me to set up a test line you can call?',
    ];
    return l.join('\n\n') + (name ? `\n\n- ${name}` : '');
  };
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(summary()); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mcc-root" style={{ ['--mcc-accent' as any]: accent, ['--mcc-accent-ink' as any]: accentInk }}>
      <style>{`
        .mcc-root{--mcc-ink:#0E1420;--mcc-surface:#161E2E;--mcc-surface2:#1C2636;--mcc-line:#293549;--mcc-text:#E9EEF6;--mcc-muted:#8B98AD;--mcc-loss:#FF5A4D;--mcc-gain:#2DC78F;
          background:var(--mcc-ink);color:var(--mcc-text);border-radius:18px;overflow:hidden;font-family:'Inter',system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;line-height:1.5}
        .mcc-pad{padding:clamp(18px,3.2vw,30px)}
        .mcc-head{display:flex;align-items:center;gap:10px;margin-bottom:20px}
        .mcc-logo{height:30px;width:auto;max-width:150px;object-fit:contain;border-radius:6px}
        .mcc-mark{width:30px;height:30px;border-radius:8px;background:var(--mcc-accent);display:grid;place-items:center;font-weight:700;color:var(--mcc-accent-ink);font-size:16px;flex:none}
        .mcc-name{font-weight:600;font-size:16px;letter-spacing:-.01em}
        .mcc-eyebrow{color:var(--mcc-muted);font-size:13px;margin:0 0 9px}
        .mcc-fig{font-weight:800;color:var(--mcc-loss);font-size:clamp(40px,8vw,78px);line-height:.98;letter-spacing:-.03em;margin:0}
        .mcc-fig .cur{font-size:.62em;vertical-align:.08em}
        .mcc-sub{color:var(--mcc-muted);font-size:14px;margin:11px 0 0;max-width:60ch}
        .mcc-sub b{color:var(--mcc-text);font-weight:600}
        .mcc-divide{border:0;border-top:1px solid var(--mcc-line);margin:22px 0}
        .mcc-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;align-items:start}
        @media (max-width:720px){.mcc-grid{grid-template-columns:1fr}}
        .mcc-card{background:var(--mcc-surface);border:1px solid var(--mcc-line);border-radius:15px;padding:18px}
        .mcc-h2{font-weight:600;font-size:15px;margin:0 0 2px}
        .mcc-hint{color:var(--mcc-muted);font-size:12.5px;margin:0 0 15px}
        .mcc-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:17px}
        .mcc-chip{cursor:pointer;font-size:13px;color:var(--mcc-muted);background:var(--mcc-surface2);border:1px solid var(--mcc-line);border-radius:999px;padding:7px 13px;font-family:inherit}
        .mcc-chip[data-on="true"]{color:var(--mcc-accent-ink);background:var(--mcc-accent);border-color:var(--mcc-accent)}
        .mcc-field{margin-bottom:16px}.mcc-field:last-child{margin-bottom:0}
        .mcc-fl{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px}
        .mcc-fl label{font-size:13px;color:var(--mcc-text)}
        .mcc-fl .v{font-weight:600;font-size:15px}
        .mcc-money{position:relative}
        .mcc-money span{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mcc-muted);font-weight:600;font-size:17px;pointer-events:none}
        .mcc-num{width:100%;font-weight:600;font-size:17px;color:var(--mcc-text);background:var(--mcc-surface2);border:1px solid var(--mcc-line);border-radius:10px;padding:10px 12px 10px 26px;outline:none;font-family:inherit}
        .mcc-num:focus{border-color:var(--mcc-accent)}
        .mcc-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;background:var(--mcc-surface2);outline:none;margin:4px 0}
        .mcc-range::-webkit-slider-thumb{-webkit-appearance:none;width:19px;height:19px;border-radius:50%;background:var(--mcc-accent);border:3px solid var(--mcc-ink);cursor:pointer}
        .mcc-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--mcc-accent);border:3px solid var(--mcc-ink);cursor:pointer}
        .mcc-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--mcc-line)}
        .mcc-row:first-child{padding-top:2px}
        .mcc-row .k{font-size:13px;color:var(--mcc-muted)}
        .mcc-row .val{font-weight:600;font-size:18px}
        .mcc-row.big{padding:15px 0}.mcc-row.big .k{color:var(--mcc-text);font-size:14px}.mcc-row.big .val{font-size:25px;color:var(--mcc-loss)}
        .mcc-rec{margin-top:16px;padding:15px;border-radius:12px;background:rgba(45,199,143,.08);border:1px solid rgba(45,199,143,.28)}
        .mcc-rec .cap{font-size:12px;color:var(--mcc-gain);margin:0 0 9px}
        .mcc-rec .mcc-row{border-bottom:1px solid rgba(45,199,143,.18)}.mcc-rec .mcc-row:last-child{border-bottom:none;padding-bottom:0}
        .mcc-rec .gain{color:var(--mcc-gain)}
        .mcc-pay{margin-top:13px;font-size:13px;color:var(--mcc-muted);line-height:1.55}.mcc-pay b{color:var(--mcc-text);font-weight:600}
        .mcc-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;align-items:center}
        .mcc-btn{cursor:pointer;font-weight:600;font-size:14px;border-radius:11px;padding:12px 18px;border:1px solid var(--mcc-line);background:var(--mcc-surface);color:var(--mcc-text);font-family:inherit;text-decoration:none;display:inline-block}
        .mcc-btn.primary{background:var(--mcc-accent);border-color:var(--mcc-accent);color:var(--mcc-accent-ink)}
        .mcc-copied{font-size:13px;color:var(--mcc-gain)}
        .mcc-foot{color:var(--mcc-muted);font-size:11.5px;margin-top:22px;line-height:1.6;max-width:70ch}
        .mcc-pw{margin-top:6px}
        .mcc-root input:focus-visible{outline:2px solid var(--mcc-accent);outline-offset:2px}
        @media (prefers-reduced-motion:reduce){.mcc-root *{transition:none!important}}
      `}</style>

      <div className="mcc-pad">
        <div className="mcc-head">
          {props.logoUrl
            ? <img className="mcc-logo" src={props.logoUrl} alt={name || 'logo'} />
            : <div className="mcc-mark">{(name ? name[0] : 'R').toUpperCase()}</div>}
          {!props.logoUrl && <div className="mcc-name">{name || 'Your Business'}</div>}
        </div>

        <p className="mcc-eyebrow">What unanswered calls cost a shop like yours, every year</p>
        <h1 className="mcc-fig"><span className="cur">$</span>{fmt0.format(Math.round(c.lostYr))}</h1>
        <p className="mcc-sub">About <b>{fmt0.format(Math.round(c.missedMo))} calls a month</b> hit voicemail and walk to a competitor. Roughly <b>8 in 10</b> never try again. Adjust the numbers to match your business.</p>

        <hr className="mcc-divide" />

        <div className="mcc-grid">
          <div className="mcc-card">
            <h2 className="mcc-h2">Your numbers</h2>
            <p className="mcc-hint">Start with a trade, then fine-tune.</p>
            <div className="mcc-chips">
              {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                <button key={k} type="button" className="mcc-chip" data-on={preset === k} onClick={() => applyPreset(k)}>{PRESETS[k].label}</button>
              ))}
            </div>

            <div className="mcc-field">
              <div className="mcc-fl"><label htmlFor="mcc-calls">Calls you get a week</label><span className="v">{calls}</span></div>
              <input id="mcc-calls" className="mcc-range" type="range" min={5} max={200} step={5} value={calls} onChange={(e) => setCalls(+e.target.value)} />
            </div>
            <div className="mcc-field">
              <div className="mcc-fl"><label htmlFor="mcc-job">Average job value</label></div>
              <div className="mcc-money"><span>$</span><input id="mcc-job" className="mcc-num" type="number" min={0} step={25} value={job} inputMode="numeric" onChange={(e) => setJob(Math.max(0, +e.target.value || 0))} /></div>
            </div>
            <div className="mcc-field">
              <div className="mcc-fl"><label htmlFor="mcc-missed">Calls you miss</label><span className="v">{missed}%</span></div>
              <input id="mcc-missed" className="mcc-range" type="range" min={5} max={70} step={1} value={missed} onChange={(e) => setMissed(+e.target.value)} />
            </div>
            <div className="mcc-field">
              <div className="mcc-fl"><label htmlFor="mcc-close">How often a call becomes a job</label><span className="v">{close}%</span></div>
              <input id="mcc-close" className="mcc-range" type="range" min={10} max={90} step={1} value={close} onChange={(e) => setClose(+e.target.value)} />
            </div>
            <div className="mcc-field">
              <div className="mcc-fl"><label htmlFor="mcc-recover">Of the missed ones, how many could be saved</label><span className="v">{recover}%</span></div>
              <input id="mcc-recover" className="mcc-range" type="range" min={30} max={100} step={5} value={recover} onChange={(e) => setRecover(+e.target.value)} />
            </div>
          </div>

          <div className="mcc-card">
            <h2 className="mcc-h2">The damage</h2>
            <p className="mcc-hint">What's slipping through right now.</p>
            <div className="mcc-row"><span className="k">Missed calls a month</span><span className="val">{fmt0.format(Math.round(c.missedMo))}</span></div>
            <div className="mcc-row"><span className="k">Lost revenue a month</span><span className="val">{usd(c.lostMo)}</span></div>
            <div className="mcc-row big"><span className="k">Lost revenue a year</span><span className="val">{usd(c.lostYr)}</span></div>

            <div className="mcc-rec">
              <p className="cap">With an AI receptionist answering every call, 24/7</p>
              <div className="mcc-row"><span className="k">Revenue it brings back a month</span><span className="val gain">{usd(c.backMo)}</span></div>
              <div className="mcc-row"><span className="k">After the {usd(price)}/mo cost</span><span className="val gain">{usd(c.netMo)}</span></div>
            </div>

            <p className="mcc-pay">It pays for itself the moment it saves <b>{c.callsToPay} {c.callsToPay === 1 ? 'call' : 'calls'} a month</b>. Do nothing for five years and that's <b>{usd(c.fiveYr)}</b> gone.</p>
          </div>
        </div>

        <div className="mcc-cta">
          {props.ctaUrl
            ? <a className="mcc-btn primary" href={props.ctaUrl}>{props.ctaText || 'Set up a test line you can call'}</a>
            : <span className="mcc-btn primary">{props.ctaText || 'Set up a test line you can call'}</span>}
          <button type="button" className="mcc-btn" onClick={copySummary}>Copy the summary</button>
          {copied && <span className="mcc-copied">Copied</span>}
        </div>

        <p className="mcc-foot">
          Figures are estimates for illustration. Benchmarks: small businesses miss 20 to 62% of calls during business hours; the average missed call to a home-services business is worth roughly $1,200 in lifetime value; about 8 in 10 callers who hit voicemail never leave a message (Invoca, CallRail, Forbes SMB study, 2024 to 2025).
          {props.poweredBy ? <span className="mcc-pw">Powered by {props.poweredBy}</span> : null}
        </p>
      </div>
    </div>
  );
}