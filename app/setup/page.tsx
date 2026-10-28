import Link from 'next/link';
import { ArrowUpRight, CalendarCheck, PlugZap, ListChecks, RefreshCw, LifeBuoy } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

export const metadata = {
  title: 'Setup: connect your calendar | VoiceAI Connect',
  description: 'How to connect your calendar so your AI receptionist books appointments into it automatically.',
};

const STEPS: { n: string; title: string; body: string }[] = [
  { n: '1', title: 'Open your AI Agent settings', body: 'Log into your dashboard and go to the AI Agent page. You will see a calendar section with a Connect button.' },
  { n: '2', title: 'Click Connect', body: 'Choose the calendar you use, then click Connect. You will be taken to your calendar provider to sign in.' },
  { n: '3', title: 'Authorize access', body: 'Sign into your own calendar account and approve access so the AI can check availability and create events. Your calendar stays private, you can disconnect at any time.' },
  { n: '4', title: 'Pick the calendar to book into', body: 'If your account has more than one calendar, choose the one the AI should book into. Most accounts have a single default calendar and this is handled for you.' },
  { n: '5', title: "You're done", body: 'The AI now books appointments into your calendar in real time during the call, creates the contact, and the automations you already run keep firing off every booking.' },
];

const TROUBLE: { q: string; a: string }[] = [
  { q: 'The connection says it expired', a: 'Open the AI Agent page and click Reconnect. This refreshes the connection without losing any settings.' },
  { q: 'No calendar was found', a: 'Create a calendar in your account first, then come back and click Reconnect so the AI can see it.' },
  { q: 'A booked time is not showing', a: 'Confirm the calendar is still connected on the AI Agent page (look for the green "connected" status). If it shows expired, reconnect.' },
  { q: 'I want to stop bookings', a: 'Click Disconnect on the AI Agent page. The AI stops writing to your calendar immediately. Reconnect any time to turn it back on.' },
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-14 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <p className="t-eyebrow text-em mb-7">Setup guide</p>
            <h1 className="t-h1 text-white max-w-[20ch]">Connect your calendar.</h1>
            <p className="t-body mt-7 max-w-2xl text-[1rem]">
              Connect your calendar once and your AI receptionist books appointments into it automatically, in real time
              on every call. It takes about a minute. Here is the whole process, start to finish.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/client/ai-agent" className="btn btn-em">Go to your AI Agent <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-white/45">
              <span className="inline-flex items-center gap-2 text-[12.5px]"><CalendarCheck className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Books in real time</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><PlugZap className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> About a minute to set up</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><RefreshCw className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Disconnect any time</span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-ink pb-28 border-t border-white/[0.04]">
        <div className="max-w-[820px] mx-auto px-6 lg:px-10 pt-14">

          {/* What it does */}
          <div className="rounded-2xl p-5 lg:p-6 mb-14" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
            <p className="font-mono text-[11px] tracking-wide uppercase text-em mb-2">What this does</p>
            <p className="text-[14px] text-white/75 leading-relaxed">
              Once your calendar is connected, the AI checks your real availability on the call, books the appointment,
              and creates the customer as a contact. You never touch it, and you can see every booking in your dashboard.
            </p>
          </div>

          {/* Steps */}
          <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-5 flex items-center gap-2.5">
            <ListChecks className="w-5 h-5 text-em" strokeWidth={2} /> Step by step
          </h2>
          <div className="space-y-3 mb-16">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 lg:p-5">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-[13px] font-semibold" style={{ background: 'rgba(1,245,209,0.1)', color: '#01f5d1', border: '1px solid rgba(1,245,209,0.25)' }}>{s.n}</div>
                <div className="min-w-0">
                  <h3 className="font-display text-[15.5px] font-medium text-white/90 mb-1">{s.title}</h3>
                  <p className="text-[13.5px] text-white/55 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* After */}
          <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">After you connect</h2>
          <p className="text-[14px] text-white/60 leading-relaxed mb-5">
            Nothing else to do. From the next call on, the AI books straight into your calendar, and the booking shows up
            in your dashboard with the call it came from. If you want to pause or switch calendars later, head back to the
            AI Agent page and use Reconnect or Disconnect.
          </p>

          {/* Troubleshooting */}
          <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-5 mt-14 flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-em" strokeWidth={2} /> Troubleshooting
          </h2>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05] mb-16">
            {TROUBLE.map((t) => (
              <div key={t.q} className="px-4 lg:px-5 py-4">
                <p className="text-[14px] font-medium text-white/85 mb-1">{t.q}</p>
                <p className="text-[13px] text-white/50 leading-relaxed">{t.a}</p>
              </div>
            ))}
          </div>

          {/* Support */}
          <div className="rounded-2xl p-5 lg:p-6 flex items-start gap-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <LifeBuoy className="w-5 h-5 text-em shrink-0 mt-0.5" strokeWidth={1.9} />
            <div>
              <p className="text-[14.5px] font-semibold text-white mb-1">Need a hand?</p>
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                Email <a href="mailto:support@myvoiceaiconnect.com" className="text-em">support@myvoiceaiconnect.com</a> and we will get you connected. We answer within a day.
              </p>
            </div>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
