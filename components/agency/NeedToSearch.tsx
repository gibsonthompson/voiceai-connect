'use client';

// ============================================================================
// "I need to..." command bar for the agency dashboard.
// The agency types an intent ("add a client", "change the voice", "the link
// preview") and gets jumped straight to the exact place, tab and all. The
// action map is product-wide and seeded with every "where is this?" that has
// come in from agencies (voices/AI model, the shared-link preview, Stripe
// Connect to get paid, the Lead Finder A-Z sort, reporting, test clients...).
// No match -> hand off to the dashboard support assistant with the query.
// ============================================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useAgency } from '@/app/agency/context';
import {
  Search, Plus, Users, Target, Send, BarChart3, CreditCard, DollarSign,
  Globe, Phone, Cpu, Paintbrush, Settings, Mic, Link2, MessageSquare,
  Gift, Code, Webhook, Receipt, Inbox, HelpCircle, ArrowRight, FileText, Building,
} from 'lucide-react';

type Action = { label: string; href: string; keywords: string; icon: any; hint?: string };

// Product-wide map. keywords carry the synonyms real agencies type.
const ACTIONS: Action[] = [
  // Clients
  { label: 'Add a client', href: '/agency/clients/new', icon: Plus, hint: 'Clients', keywords: 'add client new client create client onboard sign up a client add a business new customer set up a client' },
  { label: 'Add a test client (try it yourself)', href: '/agency/clients/new', icon: Phone, hint: 'Clients', keywords: 'test client demo client try it out test the system try the ai test number give it a call' },
  { label: 'View my clients', href: '/agency/clients', icon: Users, hint: 'Clients', keywords: 'clients my clients see clients manage clients client list customers' },
  { label: "Listen to a client's calls / recordings", href: '/agency/clients', icon: Phone, hint: 'Clients', keywords: 'calls call logs call history recordings listen to calls transcripts what the ai said' },

  // AI receptionist / voices  (the voices + model questions)
  { label: 'Change the AI voice', href: '/agency/templates', icon: Mic, hint: 'AI Lab', keywords: 'voice change voice elevenlabs voices natural voice voice settings recommended voices test voices preview voices sound' },
  { label: 'Change / check the AI model', href: '/agency/templates', icon: Cpu, hint: 'AI Lab', keywords: 'model ai model elevenlabs model newest model latest model which model' },
  { label: 'Adjust voice speed', href: '/agency/templates', icon: Mic, hint: 'AI Lab', keywords: 'voice speed speed pace talk faster slower how fast' },
  { label: 'Edit the AI prompt / greeting / knowledge base', href: '/agency/templates', icon: Cpu, hint: 'AI Lab', keywords: 'prompt system prompt ai behavior receptionist greeting knowledge base kb instructions what the ai knows faq business info train the ai' },

  // Lead Finder / outreach
  { label: 'Find leads / businesses', href: '/agency/leads/finder', icon: Target, hint: 'Lead Finder', keywords: 'find leads lead finder find businesses prospect search businesses find every business scrape pull a list build a list' },
  { label: 'Sort lead results A-Z', href: '/agency/leads/finder', icon: Target, hint: 'Lead Finder', keywords: 'alphabetical sort leads a-z order results sort by name' },
  { label: 'View my saved leads / pipeline', href: '/agency/leads', icon: Target, hint: 'Leads', keywords: 'leads saved leads pipeline lead list my leads crm' },
  { label: 'Add a lead manually', href: '/agency/leads/new', icon: Plus, hint: 'Leads', keywords: 'add lead new lead enter a lead manually' },
  { label: 'Send outreach / email leads', href: '/agency/outreach', icon: Send, hint: 'Outreach', keywords: 'outreach send emails contact leads follow up email a lead how to send reach out campaign' },

  // Website / marketing / LINK PREVIEW
  { label: 'Edit my website', href: '/agency/marketing', icon: Globe, hint: 'Website', keywords: 'website marketing site landing page edit site my site' },
  { label: 'Change my shared-link / SMS preview card', href: '/agency/marketing?tab=seo', icon: Link2, hint: 'Website / SEO & Social', keywords: 'link preview share preview sms preview social preview og image open graph link image logo on link when i share text preview headline on link metadata the card the image when sharing voiceai still showing' },
  { label: 'Connect a custom domain', href: '/agency/marketing?tab=domain', icon: Globe, hint: 'Website', keywords: 'custom domain my own domain connect domain dns use my domain url' },
  { label: 'Change website colors / template', href: '/agency/marketing?tab=colors', icon: Paintbrush, hint: 'Website', keywords: 'colors brand colors theme website template layout design' },
  { label: 'Add tracking / analytics pixel', href: '/agency/marketing?tab=tracking', icon: BarChart3, hint: 'Website', keywords: 'tracking pixel gtm google analytics fb pixel facebook pixel tag manager' },
  { label: 'Get the signup embed code', href: '/agency/settings?tab=embed', icon: Code, hint: 'Settings', keywords: 'embed widget embed code add signup to my site iframe put the form on my site' },

  // Branding / logo
  { label: 'Upload / change my logo', href: '/agency/settings?tab=profile', icon: Building, hint: 'Settings', keywords: 'logo upload logo brand my logo change logo' },
  { label: 'White-label branding (remove VoiceAI)', href: '/agency/branding', icon: Paintbrush, hint: 'Branding', keywords: 'branding white label remove voiceai rebrand my brand hide voiceai connect' },

  // Billing / payments  (the Stripe Connect / get-paid gap)
  { label: 'Connect Stripe to get paid by clients', href: '/agency/settings?tab=payments', icon: CreditCard, hint: 'Settings / Payments', keywords: 'stripe connect stripe get paid collect payments payment setup stripe connect charge clients payout how do i get paid accept payments not accepting signups' },
  { label: 'Set my client pricing / plans', href: '/agency/settings?tab=pricing', icon: DollarSign, hint: 'Settings', keywords: 'pricing prices what to charge client price plans set price change pricing how much to charge packages' },
  { label: 'Set up Paystack / Flutterwave', href: '/agency/settings?tab=payments', icon: CreditCard, hint: 'Settings / Payments', keywords: 'paystack flutterwave africa nigeria ghana kenya payments non-stripe' },
  { label: 'View client payments / revenue', href: '/agency/payments', icon: Receipt, hint: 'Payments', keywords: 'payments client payments revenue who paid earnings income' },
  { label: 'My own billing / invoices / upgrade plan', href: '/agency/settings?tab=billing', icon: Receipt, hint: 'Settings', keywords: 'invoices my bill usage what i owe subscription upgrade downgrade plan my plan billing' },

  // Reporting
  { label: 'View reporting / analytics', href: '/agency/analytics', icon: BarChart3, hint: 'Analytics', keywords: 'reporting analytics reports stats performance metrics roi dashboard numbers how are we doing' },

  // Settings / team / dev
  { label: 'Change my agency name', href: '/agency/settings?tab=profile', icon: Settings, hint: 'Settings', keywords: 'name agency name rename company name change name' },
  { label: 'Invite a team member', href: '/agency/settings?tab=team', icon: Users, hint: 'Settings', keywords: 'team invite add user staff team member colleague seat' },
  { label: 'Bring my own Telnyx / Twilio numbers', href: '/agency/settings?tab=twilio', icon: Phone, hint: 'Settings', keywords: 'twilio byot own numbers telnyx bring my own number port' },
  { label: 'Get API keys', href: '/agency/settings?tab=developer', icon: Code, hint: 'Settings', keywords: 'api api key developer integration token' },
  { label: 'Set up webhooks', href: '/agency/settings?tab=webhooks', icon: Webhook, hint: 'Settings', keywords: 'webhook webhooks zapier automation events notify my system' },

  // Inbox / support / demo / referrals
  { label: 'Check my inbox / messages', href: '/agency/inbox', icon: Inbox, hint: 'Inbox', keywords: 'inbox messages client messages support messages from voiceai connect' },
  { label: 'Try the demo phone', href: '/agency/demo-phone', icon: Phone, hint: 'Demo', keywords: 'demo demo phone try the ai test number call the ai sample call' },
  { label: 'Refer and earn', href: '/agency/referrals', icon: Gift, hint: 'Referrals', keywords: 'referral refer affiliate earn commission invite agencies' },
  { label: 'Contact VoiceAI Connect support', href: '/agency/support', icon: HelpCircle, hint: 'Support', keywords: 'support help contact ask a question talk to someone' },
];

const PREFIXES = ['i need to', 'i want to', 'i would like to', 'how do i', 'how to', 'how can i', 'where do i', 'where is', 'where can i', 'help me', 'can i', 'show me', 'go to', 'take me to', 'navigate to', 'jump to', 'pull up', 'open'];

// Tiny words that must never create a match on their own.
const STOP = new Set(['to', 'a', 'an', 'the', 'my', 'me', 'is', 'for', 'of', 'and', 'i', 'on', 'in']);

function stripPrefix(s: string): string {
  for (const p of PREFIXES) { if (s === p || s.startsWith(p + ' ')) return s.slice(p.length).trim(); }
  return s;
}
function clean(s: string): string {
  return (s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalize(q: string): string { return stripPrefix(clean(q)); }

// Typo-tolerant subsequence: do the chars of `needle` appear in order in `hay`?
function subseq(needle: string, hay: string): boolean {
  if (!needle) return false;
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) { if (hay[j] === needle[i]) i++; }
  return i === needle.length;
}

// Relevance of a candidate (its display name + extra keywords) to the query.
// Full-name match wins, then prefix/substring, then token coverage with a
// fuzzy fallback. The caller strips stopwords and 1-char tokens, so trivial
// words like "to" can never generate noise.
function relevance(name: string, keywords: string, qClean: string, qTokens: string[]): number {
  if (!qClean) return 0;
  const label = clean(name);
  const hay = clean(name + ' ' + (keywords || ''));
  if (label === qClean) return 1000;
  if (label.startsWith(qClean)) return 650;
  if (label.includes(qClean)) return 480;
  if (hay.includes(qClean)) return 300;
  if (qTokens.length === 0) return 0;
  let covered = 0;
  for (const t of qTokens) {
    if (hay.includes(t)) covered += 1;
    else if (t.length >= 4 && subseq(t, label)) covered += 0.5;
  }
  if (covered === 0) return 0;
  let s = (covered / qTokens.length) * 220;
  if (qTokens.every((t) => label.includes(t))) s += 140;
  return s;
}

const POPULAR = ['Add a client', 'Find leads / businesses', 'Change my shared-link / SMS preview card', 'Change the AI voice', 'Connect Stripe to get paid by clients', 'View reporting / analytics'];

type Row = { key: string; label: string; hint?: string; href: string; Icon: any };

export default function NeedToSearch() {
  const theme = useTheme();
  const router = useRouter();
  const { agency } = useAgency();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [clients, setClients] = useState<{ id: string; business_name: string; owner_phone?: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Load this agency's clients once so the bar can jump straight to one by name.
  useEffect(() => {
    if (!agency?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const r = await fetch(`${backendUrl}/api/agency/${agency.id}/clients`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setClients((d.clients || []).map((c: any) => ({ id: c.id, business_name: c.business_name || '', owner_phone: c.owner_phone || '' })));
      } catch { /* non-blocking */ }
    })();
    return () => { cancelled = true; };
  }, [agency?.id]);

  const qClean = normalize(query);
  const qTokens = useMemo(() => qClean.split(' ').filter((t) => t.length > 1 && !STOP.has(t)), [qClean]);

  const rows: Row[] = useMemo(() => {
    if (!qClean) {
      return ACTIONS.filter((a) => POPULAR.includes(a.label)).map((a) => ({ key: `a-${a.label}`, label: a.label, hint: a.hint, href: a.href, Icon: a.icon }));
    }
    const scored: { row: Row; s: number }[] = [];
    // Real clients first-class: "open bella's salon" jumps to that client.
    for (const c of clients) {
      if (!c.business_name) continue;
      const s = relevance(c.business_name, c.owner_phone || '', qClean, qTokens);
      if (s > 0) scored.push({ s: s + 30, row: { key: `c-${c.id}`, label: `Open ${c.business_name}`, hint: 'Client', href: `/agency/clients/${c.id}`, Icon: Building } });
    }
    for (const a of ACTIONS) {
      const s = relevance(a.label, a.keywords, qClean, qTokens);
      if (s > 0) scored.push({ s, row: { key: `a-${a.label}`, label: a.label, hint: a.hint, href: a.href, Icon: a.icon } });
    }
    scored.sort((x, y) => y.s - x.s);
    return scored.slice(0, 8).map((x) => x.row);
  }, [qClean, qTokens, clients]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const go = (href: string) => { setOpen(false); setQuery(''); router.push(href); };
  const askSupport = () => go(`/agency/support${qClean ? `?q=${encodeURIComponent(qClean)}` : ''}`);

  const noMatch = !!qClean && rows.length === 0;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min((noMatch ? 0 : rows.length - 1), i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (noMatch) askSupport();
      else if (rows[active]) go(rows[active].href);
    } else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={ref} className="relative mb-6 sm:mb-8 max-w-3xl">
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
        style={{ backgroundColor: theme.card, border: `1px solid ${open ? theme.primary : theme.border}` }}>
        <Search className="h-5 w-5 flex-shrink-0" style={{ color: theme.primary }} />
        <span className="text-sm font-medium flex-shrink-0 hidden sm:inline" style={{ color: theme.textMuted }}>I need to</span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="open a client, change the voice, get paid..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: theme.text }}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl overflow-hidden shadow-xl"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          {!qClean && (
            <div className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Popular</div>
          )}
          {rows.map((r, i) => {
            const Icon = r.Icon;
            const isActive = i === active;
            return (
              <button key={r.key} onClick={() => go(r.href)} onMouseEnter={() => setActive(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ backgroundColor: isActive ? (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'transparent' }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <Icon className="h-4 w-4" style={{ color: theme.primary }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate" style={{ color: theme.text }}>{r.label}</span>
                  {r.hint && <span className="block text-[11px]" style={{ color: theme.textMuted }}>{r.hint}</span>}
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
              </button>
            );
          })}

          {noMatch && (
            <button onClick={askSupport} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: `${theme.primary}1a` }}>
                <MessageSquare className="h-4 w-4" style={{ color: theme.primary }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium" style={{ color: theme.text }}>Ask the support assistant</span>
                <span className="block text-[11px] truncate" style={{ color: theme.textMuted }}>&ldquo;{qClean}&rdquo;</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
            </button>
          )}

          {!noMatch && qClean && (
            <button onClick={askSupport} className="w-full flex items-center gap-2 px-4 py-2.5 text-left border-t text-[12px]"
              style={{ borderColor: theme.border, color: theme.textMuted }}>
              <HelpCircle className="h-3.5 w-3.5" /> Not here? Ask the support assistant
            </button>
          )}
        </div>
      )}
    </div>
  );
}