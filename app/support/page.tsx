import Link from 'next/link';
import {
  ArrowUpRight, Bot, Inbox, Mail, MessagesSquare, Building2, UserRound,
  Layers, Clock, ShieldCheck, BookOpen, Code2, Rocket,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

export const metadata = {
  title: 'Support | VoiceAI Connect',
  description:
    'Get help on VoiceAI Connect: instant answers from the AI assistant, in-app support for agencies, the dashboard Inbox for every level, and email support.',
};

type Channel = { icon: any; title: string; body: string; foot: string };
type Tier = { icon: any; who: string; reach: string; body: string };
type Faq = { q: string; a: string };
type Quick = { icon: any; title: string; body: string; href: string; cta: string };

const CHANNELS: Channel[] = [
  {
    icon: Bot,
    title: 'AI assistant',
    body: 'The chat bubble in the corner of every page and inside your dashboard. It answers from the VoiceAI Connect knowledge base instantly, any time of day, and hands off to a person the moment it cannot.',
    foot: 'Instant · always on',
  },
  {
    icon: Inbox,
    title: 'In-app support',
    body: 'Ask a question from inside your dashboard. If it needs a human, it escalates to our team and the reply comes straight back to you in your Inbox, so the whole thread stays in one place.',
    foot: 'Reply lands in your Inbox',
  },
  {
    icon: Mail,
    title: 'Email',
    body: 'Prefer email, or need to attach files and screenshots? Write to us directly and we pick it up the same way. Good for anything detailed or account-level.',
    foot: 'We answer within a day',
  },
];

const TIERS: Tier[] = [
  {
    icon: UserRound,
    who: 'A business client',
    reach: 'Reaches their agency',
    body: 'If you are a business whose receptionist is run by an agency, your agency is your first line of support. Message them straight from your dashboard Inbox and the thread goes to the team that manages your account.',
  },
  {
    icon: Building2,
    who: 'An agency',
    reach: 'Reaches VoiceAI Connect',
    body: 'If you run the platform for your clients, you reach us through the AI assistant or in-app support in your dashboard, or by email. Human replies come back in your Inbox so your whole history with us stays threaded.',
  },
  {
    icon: Layers,
    who: 'A prospect',
    reach: 'Reaches us on the site',
    body: 'Still evaluating VoiceAI Connect? Use the AI assistant on the marketing site or email us. You do not need an account, leave a way to reach you and the team follows up.',
  },
];

const FAQS: Faq[] = [
  {
    q: 'How fast will I hear back?',
    a: 'The AI assistant answers instantly. When something is escalated to a person, we reply within a day, usually much sooner during business hours.',
  },
  {
    q: 'Where do human replies show up?',
    a: 'In your dashboard Inbox. When you escalate a question, the answer comes back as a message thread there rather than only by email, so nothing gets lost.',
  },
  {
    q: 'My clients need help. Do they contact you?',
    a: 'No. The platform is white-labeled to you, so your clients contact you through their own dashboard Inbox. You contact VoiceAI Connect. Your clients never see us.',
  },
  {
    q: 'A calendar connection says it expired.',
    a: 'Open the AI Agent page for that client and click Reconnect. It refreshes the connection without losing any settings or bookings.',
  },
  {
    q: 'Calls are not reaching the AI.',
    a: 'Confirm the business line is forwarding to the provisioned AI number and that forwarding is on for all calls. If it still does not connect, reach out and we will check the number from our side.',
  },
  {
    q: 'Can I get help setting things up the first time?',
    a: 'Yes. Start with the Setup guide for the full walkthrough, and if you get stuck at any step the AI assistant and our team can pick it up from there.',
  },
];

const QUICK: Quick[] = [
  {
    icon: Rocket,
    title: 'Setup guide',
    body: 'Launch your platform, onboard a client, and go live, step by step.',
    href: '/setup',
    cta: 'Open the guide',
  },
  {
    icon: Code2,
    title: 'Developer API',
    body: 'REST endpoints, webhooks, and integration recipes for building on the platform.',
    href: '/developers',
    cta: 'View the reference',
  },
  {
    icon: BookOpen,
    title: 'Ask the assistant',
    body: 'Open the chat bubble for an instant answer from the knowledge base.',
    href: '/',
    cta: 'Open the site',
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-14 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <p className="t-eyebrow text-em mb-7">Support</p>
            <h1 className="t-h1 text-white max-w-[20ch]">Help, whenever you need it.</h1>
            <p className="t-body mt-7 max-w-2xl text-[1rem]">
              Get an instant answer from the AI assistant, or reach a real person in a click. Every human reply
              comes back to your dashboard Inbox, so a question and its answer stay in one thread, start to finish.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/agency" className="btn btn-em">Open your dashboard <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <a href="mailto:support@myvoiceaiconnect.com" className="btn">Email support</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-white/45">
              <span className="inline-flex items-center gap-2 text-[12.5px]"><Bot className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Instant AI answers</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><Inbox className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Replies in your Inbox</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><Clock className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Human reply within a day</span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-ink pb-28 border-t border-white/[0.04]">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-10 pt-16">

          {/* START HERE */}
          <div className="rounded-2xl p-6 lg:p-7 mb-16 flex flex-col sm:flex-row items-start gap-5" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
            <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(1,245,209,0.1)', border: '1px solid rgba(1,245,209,0.25)' }}>
              <MessagesSquare className="w-5 h-5 text-em" strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-wide uppercase text-em mb-2">Start here</p>
              <p className="text-[14.5px] text-white/80 leading-relaxed max-w-2xl">
                The fastest way to an answer is the AI assistant, the chat bubble in the corner of the site and in your
                dashboard. It knows the platform and responds instantly. Ask it anything, and if your question needs a
                person it hands the conversation to our team without you starting over.
              </p>
            </div>
          </div>

          {/* CHANNELS */}
          <p className="t-eyebrow text-em-deep mb-2">Ways to get help</p>
          <h2 className="font-display text-[24px] font-semibold text-white tracking-tight mb-6">Three ways to reach us</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-20">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 lg:p-6 flex flex-col">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(1,245,209,0.08)', border: '1px solid rgba(1,245,209,0.2)' }}>
                    <Icon className="w-[18px] h-[18px] text-em" strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[16px] font-semibold text-white/90 mb-2">{c.title}</h3>
                  <p className="text-[13.5px] text-white/55 leading-relaxed flex-1">{c.body}</p>
                  <p className="font-mono text-[11px] tracking-wide uppercase text-em-deep mt-4 pt-3 border-t border-white/[0.06]">{c.foot}</p>
                </div>
              );
            })}
          </div>

          {/* SUPPORT BY LEVEL */}
          <p className="t-eyebrow text-em-deep mb-2">How it works</p>
          <h2 className="font-display text-[24px] font-semibold text-white tracking-tight mb-3">Support at every level</h2>
          <p className="text-[14px] text-white/60 leading-relaxed mb-6 max-w-2xl">
            VoiceAI Connect is layered. You run the platform for your clients under your own brand, and we run the
            platform for you. Support follows the same lines, so everyone talks to the right person.
          </p>
          <div className="space-y-3 mb-20">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.who} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(1,245,209,0.08)', border: '1px solid rgba(1,245,209,0.2)' }}>
                    <Icon className="w-[18px] h-[18px] text-em" strokeWidth={1.9} />
                  </div>
                  <div className="sm:w-56 shrink-0">
                    <p className="font-display text-[15.5px] font-semibold text-white/90">{t.who}</p>
                    <p className="font-mono text-[11px] tracking-wide uppercase text-em-deep mt-1">{t.reach}</p>
                  </div>
                  <p className="text-[13.5px] text-white/55 leading-relaxed flex-1">{t.body}</p>
                </div>
              );
            })}
          </div>

          {/* THE INBOX */}
          <div className="rounded-2xl p-6 lg:p-7 mb-20 flex flex-col sm:flex-row items-start gap-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(1,245,209,0.08)', border: '1px solid rgba(1,245,209,0.2)' }}>
              <Inbox className="w-5 h-5 text-em" strokeWidth={1.9} />
            </div>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-white mb-2">The Inbox ties it together</h2>
              <p className="text-[13.5px] text-white/60 leading-relaxed max-w-2xl mb-3">
                Every support conversation lives in the dashboard Inbox as a message thread. When a client messages their
                agency, or an agency escalates a question to VoiceAI Connect, the reply returns to that same thread, not
                a separate email chain you have to dig for.
              </p>
              <p className="text-[13.5px] text-white/60 leading-relaxed max-w-2xl">
                That means you always have the full history in one place: who asked what, when, and how it was resolved.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <p className="t-eyebrow text-em-deep mb-2">Common questions</p>
          <h2 className="font-display text-[24px] font-semibold text-white tracking-tight mb-6">Quick answers</h2>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05] mb-6">
            {FAQS.map((f) => (
              <div key={f.q} className="px-5 lg:px-6 py-5">
                <p className="text-[14.5px] font-medium text-white/85 mb-1.5">{f.q}</p>
                <p className="text-[13.5px] text-white/55 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-white/45 leading-relaxed mb-20 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-em-deep shrink-0" strokeWidth={1.9} />
            Have a question that is not here? The AI assistant answers from the full knowledge base, and escalates to a person if it needs to.
          </p>

          {/* QUICK LINKS */}
          <p className="t-eyebrow text-em-deep mb-2">Keep going</p>
          <h2 className="font-display text-[24px] font-semibold text-white tracking-tight mb-6">Helpful next steps</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.title} href={q.href} className="group rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 lg:p-6 flex flex-col hover:border-em/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(1,245,209,0.08)', border: '1px solid rgba(1,245,209,0.2)' }}>
                    <Icon className="w-[18px] h-[18px] text-em" strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[15.5px] font-semibold text-white/90 mb-2">{q.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed flex-1">{q.body}</p>
                  <span className="text-[13px] text-em mt-4 inline-flex items-center gap-1.5">{q.cta} <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></span>
                </Link>
              );
            })}
          </div>

          {/* EMAIL FOOTER CARD */}
          <div className="rounded-2xl p-5 lg:p-6 flex items-start gap-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Mail className="w-5 h-5 text-em shrink-0 mt-0.5" strokeWidth={1.9} />
            <div>
              <p className="text-[14.5px] font-semibold text-white mb-1">Still need a person?</p>
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                Email <a href="mailto:support@myvoiceaiconnect.com" className="text-em">support@myvoiceaiconnect.com</a> and we will get back to you within a day.
              </p>
            </div>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
