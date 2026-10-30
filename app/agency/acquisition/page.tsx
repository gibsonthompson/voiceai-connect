'use client';

// ============================================================================
// ACQUISITION COMMAND CENTER
// The page an agency works from to land clients, and keeps using after the first
// one. North star (0 -> 1 paying) before the first client; an ongoing pipeline
// view after. The acquisition funnel with a diagnostic that reads the real
// drop-off, the setup checklist (auto-verified, collapses when done), demo-call
// warm leads to follow up, daily reps, and the field playbook (collapses once
// they know it). Data: GET /api/agency/:id/acquisition.
// ============================================================================

import { useState, useEffect } from 'react';
import {
  TrendingUp, Mail, PhoneIncoming, Star, DollarSign, Check, ChevronRight,
  ChevronDown, Loader2, Flame, Play, CalendarCheck, PartyPopper,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';

interface DemoLead {
  id: string;
  caller_phone?: string | null;
  caller_name?: string | null;
  business_name?: string | null;
  interest_level?: string | null;
  created_at: string;
}
interface AcquisitionData {
  funnel: { messagesThisWeek: number; messagesAllTime: number; demoCallsThisWeek: number; demoCallsAllTime: number; trials: number; paying: number };
  checklist: { demoLive: boolean; testClient: boolean; pricingSet: boolean; stripeConnected: boolean; leadList: boolean; firstOutreach: boolean };
  recentDemoCalls: DemoLead[];
  reps: { outreachToday: number; goal: number; streak: number };
  hasFirstClient: boolean;
}

const DEMO_DATA: AcquisitionData = {
  funnel: { messagesThisWeek: 38, messagesAllTime: 112, demoCallsThisWeek: 6, demoCallsAllTime: 14, trials: 2, paying: 0 },
  checklist: { demoLive: true, testClient: true, pricingSet: true, stripeConnected: false, leadList: false, firstOutreach: true },
  recentDemoCalls: [
    { id: 'd1', business_name: 'Blue Ridge Plumbing', caller_phone: '+18285550142', interest_level: 'high', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'd2', business_name: 'Summit HVAC', caller_phone: '+18285550187', interest_level: 'medium', created_at: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: 'd3', caller_name: 'Jake', caller_phone: '+17045550119', interest_level: 'low', created_at: new Date(Date.now() - 50 * 3600000).toISOString() },
  ],
  reps: { outreachToday: 18, goal: 30, streak: 3 },
  hasFirstClient: false,
};

function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const dd = phone.replace(/\D/g, '');
  const ten = dd.length === 11 && dd.startsWith('1') ? dd.slice(1) : dd;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const dys = Math.floor(h / 24);
  return dys === 1 ? 'yesterday' : `${dys} days ago`;
}
function pct(a: number, b: number): string {
  if (!b) return '—';
  return `${Math.round((a / b) * 100)}%`;
}

export default function AcquisitionPage() {
  const { agency, loading: ctxLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [data, setData] = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  // null = auto (derive from state); a boolean = the user's explicit toggle.
  const [checklistOpen, setChecklistOpen] = useState<boolean | null>(null);
  const [playOpen, setPlayOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (demoMode) { setData(DEMO_DATA); setLoading(false); return; }
    if (!agency) return;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${backendUrl}/api/agency/${agency.id}/acquisition`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setData(await res.json());
      } catch { /* leave data null; render a safe empty shell */ }
      finally { setLoading(false); }
    })();
  }, [agency, demoMode]);

  if (ctxLoading || loading) {
    return <div className="p-8 flex items-center justify-center" style={{ minHeight: '60vh' }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>;
  }

  const d = data || DEMO_DATA;
  const f = d.funnel;

  const diagnose = (): { title: string; how: string; href?: string; cta?: string } => {
    if (f.paying > 0) return { title: `You've landed ${f.paying} ${f.paying === 1 ? 'client' : 'clients'}.`, how: 'Keep the funnel full. The same play that landed those lands the next ones, so keep the demo calls coming and keep following up.' };
    if (f.messagesThisWeek === 0 && f.demoCallsAllTime === 0) return { title: 'Nothing is going out yet.', how: 'The funnel only moves when you do. Pick a niche, pull a list, and start reaching out, or go do the in-person walk-in.', href: '/agency/leads', cta: 'Open lead finder' };
    if (f.demoCallsThisWeek === 0 && f.demoCallsAllTime === 0) return { title: 'Messages are going out but nobody is calling the demo.', how: 'Your outreach is not landing. The highest-converting move is in person: walk in and get them to hear it on the spot.', href: '/agency/marketing-kit', cta: 'Get the walk-in kit' };
    if (f.trials === 0) return { title: 'You are getting demo calls but no trials.', how: 'These are warm leads, people who already heard it. Follow up with the callers below and start a trial.', href: '/agency/demo-phone', cta: 'See demo callers' };
    return { title: 'You have trials but nobody paying yet.', how: 'Call your trial clients, walk them through the dashboard, and ask for the card. The Demo Close script handles the four objections.', href: '/agency/outreach', cta: 'Open the scripts' };
  };
  const diag = diagnose();

  const chk = d.checklist;
  const checklistItems = [
    { done: chk.demoLive, label: 'Demo number is live', href: '/agency/demo-phone', go: 'Set up' },
    { done: chk.testClient, label: 'Test client created', href: '/agency/dashboard', go: 'Create' },
    { done: chk.pricingSet, label: 'Client pricing set', href: '/agency/settings?tab=pricing', go: 'Set pricing' },
    { done: chk.stripeConnected, label: 'Connect Stripe to get paid', href: '/agency/settings?tab=payments', go: 'Connect' },
    { done: chk.leadList, label: 'Pull your first target list', href: '/agency/leads', go: 'Lead finder' },
    { done: chk.firstOutreach, label: 'Send your first outreach', href: '/agency/outreach', go: 'Outreach' },
  ];
  const doneCount = checklistItems.filter(i => i.done).length;
  const setupComplete = doneCount === checklistItems.length;

  const checklistExpanded = checklistOpen ?? (!setupComplete && !d.hasFirstClient);
  const playExpanded = playOpen ?? !d.hasFirstClient;

  const repsPct = Math.min(100, Math.round((d.reps.outreachToday / Math.max(1, d.reps.goal)) * 100));
  const payingPct = Math.max(6, Math.min(100, (f.paying > 0 ? 100 : Math.min(90, f.demoCallsThisWeek * 12 + f.trials * 20 + 10))));

  const card: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' };
  const sectionLabel = (text: string, extra?: string) => (
    <div className="flex items-center gap-3 mt-7 mb-3">
      <span className="text-[11px] font-mono uppercase tracking-[0.1em] flex-shrink-0" style={{ color: theme.textMuted }}>{text}{extra ? ` · ${extra}` : ''}</span>
      <span className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
    </div>
  );
  const interestStyle = (lvl?: string | null): { c: string; bg: string; label: string } => {
    const l = (lvl || '').toLowerCase();
    if (l === 'high') return { c: theme.success, bg: theme.successBg, label: 'High interest' };
    if (l === 'low') return { c: theme.textMuted, bg: theme.hover, label: 'Low' };
    return { c: theme.warning, bg: theme.warningBg, label: 'Medium' };
  };

  const stages = [
    { k: 'Messages sent', v: f.messagesThisWeek, sub: 'this week', accent: false, icon: Mail },
    { k: 'Demo calls', v: f.demoCallsThisWeek, sub: `${pct(f.demoCallsThisWeek, f.messagesThisWeek)} of messages`, accent: true, icon: PhoneIncoming },
    { k: 'Trials started', v: f.trials, sub: `${pct(f.trials, f.demoCallsAllTime)} of demo calls`, accent: false, icon: Star },
    { k: 'Paying', v: f.paying, sub: f.paying > 0 ? 'keep going' : 'close a trial', accent: false, icon: DollarSign },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}><TrendingUp className="h-5 w-5" style={{ color: theme.primary }} /></div>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>Acquisition</p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{d.hasFirstClient ? 'Keep landing clients' : 'Get your first client'}</h1>
          <p className="mt-1 text-sm max-w-[62ch]" style={{ color: theme.textMuted }}>Your pipeline from first message to paying client. The whole game is getting a prospect to hear your AI answer, then closing them on a trial.</p>
        </div>
      </div>

      {/* HERO: north star (pre) or pipeline metrics (post) */}
      {d.hasFirstClient ? (
        <div className="mt-5 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ ...card, background: theme.isDark ? `linear-gradient(90deg, ${theme.withAlpha(theme.success, 0.1)}, ${theme.card} 60%)` : `linear-gradient(90deg, ${theme.withAlpha(theme.success, 0.07)}, ${theme.card} 60%)` }}>
          <div className="flex items-center gap-3">
            <PartyPopper className="h-7 w-7 flex-shrink-0" style={{ color: theme.success }} />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: theme.textMuted }}>Paying clients</p>
              <p className="text-4xl font-bold leading-none" style={{ color: theme.success }}>{f.paying}</p>
            </div>
          </div>
          <div className="h-10 w-px hidden sm:block" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-6">
            <div><p className="text-2xl font-bold tabular-nums" style={{ color: theme.text }}>{f.demoCallsThisWeek}</p><p className="text-[11px] font-mono" style={{ color: theme.textMuted }}>demo calls this week</p></div>
            <div><p className="text-2xl font-bold tabular-nums" style={{ color: theme.text }}>{f.trials}</p><p className="text-[11px] font-mono" style={{ color: theme.textMuted }}>trials open</p></div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center gap-5" style={card}>
          <div className="flex-shrink-0">
            <p className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: theme.textMuted }}>Paying clients</p>
            <p className="mt-1 text-4xl font-bold leading-none"><span style={{ color: theme.primary }}>{f.paying}</span><span className="text-2xl font-semibold" style={{ color: theme.textMuted }}> / 1</span></p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.borderSubtle}` }}>
              <div className="h-full rounded-full" style={{ width: `${payingPct}%`, background: `linear-gradient(90deg, ${theme.withAlpha(theme.primary, 0.7)}, ${theme.primary})` }} />
            </div>
            <p className="mt-2 text-[13px]" style={{ color: theme.textMuted }}>
              {f.demoCallsThisWeek > 0
                ? <>You're closer than it feels. <span style={{ color: theme.success, fontWeight: 600 }}>{f.demoCallsThisWeek} demo call{f.demoCallsThisWeek === 1 ? '' : 's'} this week</span>, people who already heard it. Follow up and close one.</>
                : <>Get one prospect to hear the AI and you're most of the way there. Start with the play below.</>}
            </p>
          </div>
        </div>
      )}

      {/* FUNNEL */}
      {sectionLabel('Your pipeline')}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {stages.map((s, i) => (
            <div key={s.k} className="relative p-4 sm:p-[18px]" style={{ borderRight: i < 3 ? `1px solid ${theme.borderSubtle}` : 'none', borderBottom: i < 2 ? `1px solid ${theme.borderSubtle}` : 'none' }}>
              <div className="absolute top-3.5 right-3.5 h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: s.accent ? theme.primary15 : theme.hover }}><s.icon className="h-3.5 w-3.5" style={{ color: s.accent ? theme.primary : theme.textMuted }} /></div>
              <p className="text-[10.5px] font-mono uppercase tracking-[0.06em]" style={{ color: theme.textMuted }}>{s.k}</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums" style={{ color: s.accent ? theme.primary : (s.v === 0 ? theme.textMuted : theme.text) }}>{s.v}</p>
              <p className="mt-1 text-[10.5px] font-mono" style={{ color: theme.textMuted }}>{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 p-4 sm:px-[18px]" style={{ borderTop: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? theme.hover : theme.bg }}>
          <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.paying > 0 ? theme.success : theme.warning, boxShadow: `0 0 0 4px ${f.paying > 0 ? theme.successBg : theme.warningBg}` }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px]" style={{ color: theme.text }}><span style={{ color: f.paying > 0 ? theme.success : theme.warning, fontWeight: 700 }}>{diag.title}</span> <span style={{ color: theme.textMuted }}>{diag.how}</span></p>
            {diag.href && diag.cta && (
              <a href={diag.href} className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold font-mono" style={{ color: theme.primary }}>{diag.cta} <ChevronRight className="h-3.5 w-3.5" /></a>
            )}
          </div>
        </div>
      </div>

      {/* SETUP (collapsible) + REPS */}
      {sectionLabel('Setup', `${doneCount} of ${checklistItems.length} done`)}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(0,220px)] gap-4">
        <div className="p-4 sm:p-5" style={card}>
          <button type="button" onClick={() => setChecklistOpen(!checklistExpanded)} className="w-full flex items-center justify-between gap-3 text-left" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <span className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Setup checklist</h3>
              {setupComplete
                ? <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full" style={{ color: theme.success, backgroundColor: theme.successBg }}>Complete</span>
                : <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full" style={{ color: theme.primary, backgroundColor: theme.primary15 }}>{doneCount}/{checklistItems.length}</span>}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" style={{ color: theme.textMuted, transform: checklistExpanded ? 'rotate(180deg)' : 'none' }} />
          </button>
          {checklistExpanded && (
            <div className="mt-3">
              {checklistItems.map((item, i) => (
                <div key={item.label} className="flex items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                  <span className="h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0" style={item.done ? { backgroundColor: theme.success } : { border: `1.5px solid ${theme.border}` }}>{item.done && <Check className="h-3 w-3" style={{ color: theme.getContrastText(theme.success) }} strokeWidth={3} />}</span>
                  <span className="text-[13.5px]" style={{ color: item.done ? theme.textMuted : theme.text }}>{item.label}</span>
                  {!item.done && <a href={item.href} className="ml-auto text-[11px] font-mono flex-shrink-0" style={{ color: theme.primary }}>{item.go} ›</a>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col items-center justify-center text-center gap-1.5" style={card}>
          <p className="text-[11px] font-mono uppercase tracking-[0.1em]" style={{ color: theme.textMuted }}>Today's outreach</p>
          <div className="my-1 h-[108px] w-[108px] rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${theme.primary} ${repsPct}%, ${theme.hover} 0)` }}>
            <div className="h-[84px] w-[84px] rounded-full flex flex-col items-center justify-center" style={{ backgroundColor: theme.card }}>
              <span className="text-2xl font-bold leading-none" style={{ color: theme.text }}>{d.reps.outreachToday}</span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: theme.textMuted }}>of {d.reps.goal}</span>
            </div>
          </div>
          {d.reps.streak > 0
            ? <span className="text-[12px] font-mono inline-flex items-center gap-1" style={{ color: theme.primary }}><Flame className="h-3.5 w-3.5" />{d.reps.streak}-day streak</span>
            : <span className="text-[12px] font-mono" style={{ color: theme.textMuted }}>Start a streak today</span>}
          <p className="text-[12px] max-w-[24ch]" style={{ color: theme.textMuted }}>Consistency is what fills the funnel.</p>
        </div>
      </div>

      {/* DEMO LEADS */}
      {d.recentDemoCalls.length > 0 && (
        <>
          {sectionLabel('Demo calls to follow up', 'your warmest leads')}
          <div className="p-2" style={card}>
            {d.recentDemoCalls.slice(0, 5).map((c) => {
              const who = c.business_name || c.caller_name || formatPhone(c.caller_phone) || 'Unknown caller';
              const ints = interestStyle(c.interest_level);
              return (
                <a key={c.id} href="/agency/demo-phone" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <span className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><PhoneIncoming className="h-4 w-4" style={{ color: theme.primary }} /></span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate" style={{ color: theme.text }}>{who}</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: theme.textMuted }}>{formatPhone(c.caller_phone) || 'No number'} · {timeAgo(c.created_at)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full hidden sm:inline" style={{ color: ints.c, backgroundColor: ints.bg }}>{ints.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: theme.textMuted }}>Follow up ›</span>
                  </div>
                </a>
              );
            })}
            <a href="/agency/demo-phone" className="flex items-center justify-center py-2.5 text-[12px] font-mono" style={{ color: theme.primary }}>View all demo calls ›</a>
          </div>
        </>
      )}

      {/* PLAYBOOK (collapsible) */}
      <div className="flex items-center gap-3 mt-7 mb-3">
        <button type="button" onClick={() => setPlayOpen(!playExpanded)} className="flex items-center gap-2 flex-shrink-0" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <span className="text-[11px] font-mono uppercase tracking-[0.1em]" style={{ color: theme.textMuted }}>The play that lands clients</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: theme.textMuted, transform: playExpanded ? 'rotate(180deg)' : 'none' }} />
        </button>
        <span className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
      </div>
      {playExpanded && (
        <div className="p-1.5" style={card}>
          {[
            { h: 'Pick one niche with a storefront', p: 'Home services work best: HVAC, plumbing, roofing, auto, med spas. Pick one, in one city. Focus beats spraying ten industries.', links: [{ label: 'Lead finder', href: '/agency/leads' }], vid: 'Pick your niche' },
            { h: 'Walk in and ask one question', p: 'Don’t pitch. Ask: "How many calls does this place miss when you’re slammed or closed?" Let them answer. That’s the opening.', links: [], vid: 'The walk-in: first 20 seconds' },
            { h: 'Call the demo on speaker, right there', p: 'Pull out your phone, call your demo line, and let them hear the AI answer as their business. This is the moment the deal is made.', links: [{ label: 'Demo phone', href: '/agency/demo-phone' }], vid: 'The live-demo close' },
            { h: 'Leave the kit, get their cell', p: 'Hand them the one-pager with the QR so they can hear it again. If the owner is out, leave the "Sorry we missed you" card.', links: [{ label: 'Marketing kit', href: '/agency/marketing-kit' }], vid: null },
            { h: 'Follow up and close the trial', p: 'Text the next day with the demo number again. When they’re in, start the 7-day trial, walk them through it, and ask for the card.', links: [{ label: 'Outreach templates', href: '/agency/outreach' }], vid: 'The 4 objections' },
          ].map((step, i) => (
            <div key={i} className="flex gap-3.5 p-3.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
              <span className="h-[26px] w-[26px] rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-mono font-semibold" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}`, color: theme.primary }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{step.h}</h4>
                <p className="text-[13px]" style={{ color: theme.textMuted }}>{step.p}</p>
                {(step.links.length > 0 || step.vid) && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {step.links.map((l) => (
                      <a key={l.href} href={l.href} className="text-[11px] font-mono rounded-full px-2.5 py-1" style={{ color: theme.primary, backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>{l.label}</a>
                    ))}
                    {step.vid && <span className="text-[11px] font-mono rounded-full px-2.5 py-1 inline-flex items-center gap-1.5" style={{ color: theme.textMuted, border: `1px dashed ${theme.border}` }}><Play className="h-3 w-3" />{step.vid}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WALKTHROUGH CTA */}
      <div className="mt-6 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3" style={{ background: theme.isDark ? `linear-gradient(90deg, ${theme.primary15}, transparent)` : `linear-gradient(90deg, ${theme.primary10}, transparent)`, border: `1px solid ${theme.primary30}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <CalendarCheck className="h-5 w-5 flex-shrink-0" style={{ color: theme.primary }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Stuck, or want a second set of eyes?</p>
            <p className="text-[12.5px]" style={{ color: theme.textMuted }}>Get on a live walkthrough and we'll find exactly where you're losing deals.</p>
          </div>
        </div>
        <a href="/agency/support" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Book a walkthrough</a>
      </div>
    </div>
  );
}
