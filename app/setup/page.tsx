import Link from 'next/link';
import {
  ArrowUpRight, Palette, UserPlus, Bot, CalendarCheck, PhoneForwarded,
  LayoutDashboard, Wrench, LifeBuoy,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

export const metadata = {
  title: 'Setup guide | VoiceAI Connect',
  description: 'Get set up on VoiceAI Connect: brand your platform, onboard a client, configure the AI receptionist, connect a calendar, and go live.',
};

type Step = { title: string; body: string };
type Section = { id: string; icon: any; eyebrow: string; title: string; intro: string; steps: Step[] };

const SECTIONS: Section[] = [
  {
    id: 'brand',
    icon: Palette,
    eyebrow: 'Step 1',
    title: 'Create and brand your platform',
    intro: 'VoiceAI Connect is yours to white-label. Before you onboard anyone, set it up under your own brand so every client sees you, not us.',
    steps: [
      { title: 'Create your account', body: 'Sign up and open your dashboard. This is the control center for your whole agency.' },
      { title: 'Add your branding', body: 'Upload your logo, set your colors, and point your own domain at your platform so clients log into a site that looks like yours.' },
      { title: 'Set your pricing', body: 'Choose what you charge each client. You bill them directly and keep the relationship, we run the infrastructure underneath.' },
    ],
  },
  {
    id: 'client',
    icon: UserPlus,
    eyebrow: 'Step 2',
    title: 'Onboard your first client',
    intro: 'Adding a client takes under a minute and provisions a real AI phone number for their business on the spot.',
    steps: [
      { title: 'Add the business', body: 'Enter the business name, industry, and contact details. A dedicated AI phone number is provisioned automatically.' },
      { title: 'They get their own dashboard', body: 'Each client gets a branded login to see their calls, recordings, transcripts, summaries, and bookings, something most platforms never give the end business.' },
    ],
  },
  {
    id: 'receptionist',
    icon: Bot,
    eyebrow: 'Step 3',
    title: 'Configure the AI receptionist',
    intro: 'Set how the AI answers, sounds, and what it knows about the business. Changes take effect on the very next call.',
    steps: [
      { title: 'Set the greeting and voice', body: 'Write the opening line the AI says and pick its voice. Keep it on brand for the business.' },
      { title: 'Add the knowledge base', body: 'Give the AI the business hours, services, pricing, and common questions so it answers callers accurately.' },
      { title: 'Set call handling', body: 'Decide what happens when a caller needs a human: transfer to a number, or take a message and text the owner.' },
    ],
  },
  {
    id: 'calendar',
    icon: CalendarCheck,
    eyebrow: 'Step 4',
    title: 'Connect a calendar',
    intro: 'Connect the calendar the business uses and the AI books appointments into it live, right on the call. This is optional, the AI can also just capture the request and text it over.',
    steps: [
      { title: 'Open the AI Agent page', body: 'In the client dashboard, go to the AI Agent page and find the calendar section.' },
      { title: 'Click Connect and authorize', body: 'Choose the calendar the business uses, sign in, and approve access so the AI can check availability and create events.' },
      { title: 'Pick which calendar to use', body: 'If the account has more than one calendar, choose the one to book into. The AI now books in real time and creates the contact on each booking.' },
    ],
  },
  {
    id: 'golive',
    icon: PhoneForwarded,
    eyebrow: 'Step 5',
    title: 'Go live',
    intro: 'Point the business phone at the AI and make a test call. This is the only step that touches the real phone line.',
    steps: [
      { title: 'Forward the business number', body: 'Set the business to forward its existing line to the provisioned AI number. This is call forwarding, not porting, so nothing about their number changes.' },
      { title: 'Make a test call', body: 'Call the business line and talk to the AI the way a customer would. Confirm it answers, books, and texts the summary as expected.' },
    ],
  },
  {
    id: 'run',
    icon: LayoutDashboard,
    eyebrow: 'Step 6',
    title: 'Run it day to day',
    intro: 'Everything the AI does flows into the dashboard, and the built-in automations handle the follow-up.',
    steps: [
      { title: 'Review calls and bookings', body: 'Every call has a recording, a transcript, an AI summary, and the booking it produced, all in the dashboard.' },
      { title: 'Turn on automations', body: 'Use the built-in messaging automations for things like follow-up texts and reminders, set up right from the dashboard, no outside tools required.' },
    ],
  },
];

const TROUBLE: { q: string; a: string }[] = [
  { q: 'The AI number is still provisioning', a: 'New numbers are usually ready in under a minute. Refresh the client page, if it is still setting up after a few minutes, contact support.' },
  { q: 'A calendar connection says it expired', a: 'Open the AI Agent page and click Reconnect. This refreshes the connection without losing any settings.' },
  { q: 'Calls are not reaching the AI', a: 'Confirm the business line is forwarding to the provisioned AI number, and that forwarding is turned on for all calls.' },
  { q: 'I want to stop bookings for a client', a: 'Click Disconnect on that client’s AI Agent page. The AI stops writing to the calendar immediately, and you can reconnect any time.' },
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
            <h1 className="t-h1 text-white max-w-[20ch]">Get set up on VoiceAI Connect.</h1>
            <p className="t-body mt-7 max-w-2xl text-[1rem]">
              Everything you need to launch, from branding your platform to onboarding a client, configuring the AI
              receptionist, connecting a calendar, and going live. Work through it once and you have a repeatable playbook
              for every client after.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/agency" className="btn btn-em">Open your dashboard <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-ink pb-28 border-t border-white/[0.04]">
        <div className="max-w-[860px] mx-auto px-6 lg:px-10 pt-14">

          {/* What you'll set up */}
          <div className="rounded-2xl p-5 lg:p-6 mb-14" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
            <p className="font-mono text-[11px] tracking-wide uppercase text-em mb-3">What you'll set up</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {SECTIONS.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 text-[13.5px] text-white/70 hover:text-white transition-colors">
                  <span className="font-mono text-[11px] text-em-deep w-4 shrink-0">{i + 1}</span>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-16">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <p className="t-eyebrow text-em-deep mb-2">{s.eyebrow}</p>
                  <h2 className="font-display text-[23px] font-semibold text-white tracking-tight mb-2.5 flex items-center gap-2.5">
                    <Icon className="w-5 h-5 text-em shrink-0" strokeWidth={2} /> {s.title}
                  </h2>
                  <p className="text-[14px] text-white/60 leading-relaxed mb-5 max-w-2xl">{s.intro}</p>
                  <div className="space-y-3">
                    {s.steps.map((st, idx) => (
                      <div key={st.title} className="flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 lg:p-5">
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-[13px] font-semibold" style={{ background: 'rgba(1,245,209,0.1)', color: '#01f5d1', border: '1px solid rgba(1,245,209,0.25)' }}>{idx + 1}</div>
                        <div className="min-w-0">
                          <h3 className="font-display text-[15.5px] font-medium text-white/90 mb-1">{st.title}</h3>
                          <p className="text-[13.5px] text-white/55 leading-relaxed">{st.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Troubleshooting */}
          <h2 className="font-display text-[23px] font-semibold text-white tracking-tight mb-5 mt-20 flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-em shrink-0" strokeWidth={2} /> Troubleshooting
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
                Email <a href="mailto:support@myvoiceaiconnect.com" className="text-em">support@myvoiceaiconnect.com</a> and we will help you get set up. We answer within a day.
              </p>
            </div>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
