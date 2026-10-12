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
  Download, Smartphone, Layout, Type, Eye, Palette,
} from 'lucide-react';

type Action = { label: string; href: string; keywords: string; icon: any; hint?: string };

// Product-wide map. keywords carry the synonyms real agencies type.
const ACTIONS: Action[] = [
  // Clients
  { label: 'Add a client', href: '/agency/clients/new', icon: Plus, hint: 'Clients', keywords: 'add client new client create client onboard sign up a client add a business new customer set up a client' },
  { label: 'Add a test client (try it yourself)', href: '/agency/clients/new', icon: Phone, hint: 'Clients', keywords: 'test client demo client try it out test the system test number give it a call sample client' },
  { label: 'View my clients', href: '/agency/clients', icon: Users, hint: 'Clients', keywords: 'clients my clients see clients manage clients client list customers accounts' },
  { label: "Listen to a client's calls / recordings", href: '/agency/clients', icon: Phone, hint: 'Clients', keywords: 'calls call logs call history recordings listen to calls transcripts what the ai said call summaries' },

  // AI Lab
  { label: 'Change the AI voice', href: '/agency/templates', icon: Mic, hint: 'AI Lab', keywords: 'voice change voice ai voice elevenlabs voices natural voice voice settings recommended voices test voices preview voices sound the voice demo voice demo line voice voice on the demo receptionist voice' },
  { label: 'Adjust voice speed', href: '/agency/templates', icon: Mic, hint: 'AI Lab', keywords: 'voice speed speed pace talk faster slower how fast rate of speech' },
  { label: 'Change / check the AI model', href: '/agency/templates', icon: Cpu, hint: 'AI Lab', keywords: 'model ai model elevenlabs model newest model latest model which model intelligence' },
  { label: 'Edit the AI prompt / greeting / knowledge base', href: '/agency/templates', icon: Cpu, hint: 'AI Lab', keywords: 'prompt system prompt ai behavior receptionist greeting opening line knowledge base kb instructions what the ai knows faq business info train the ai script' },
  { label: 'Use an industry template / prompt pack', href: '/agency/templates', icon: Layout, hint: 'AI Lab', keywords: 'industry template prompt pack prebuilt template vertical dentist plumber hvac salon restaurant law firm preset' },

  // Demo
  { label: 'Try the demo phone line', href: '/agency/demo-phone', icon: Phone, hint: 'Demo', keywords: 'demo phone demo line call the ai test the ai sample call try the receptionist demo number hear the ai live demo' },
  { label: 'Turn on demo mode / sample data', href: '/agency/settings?tab=demo', icon: Eye, hint: 'Settings', keywords: 'demo mode sample data fake data preview the dashboard try the dashboard example data showcase' },

  // Leads
  { label: 'Find leads / businesses', href: '/agency/leads/finder', icon: Target, hint: 'Lead Finder', keywords: 'find leads lead finder find businesses prospect search businesses find every business scrape pull a list build a list google maps' },
  { label: 'Sort lead results A-Z', href: '/agency/leads/finder', icon: Target, hint: 'Lead Finder', keywords: 'alphabetical sort leads a-z order results sort by name' },
  { label: 'View my saved leads / pipeline', href: '/agency/leads', icon: Target, hint: 'Leads', keywords: 'leads saved leads pipeline lead list my leads crm prospects follow ups' },
  { label: 'Add a lead manually', href: '/agency/leads/new', icon: Plus, hint: 'Leads', keywords: 'add lead new lead enter a lead manually create lead' },

  // Outreach
  { label: 'Send outreach / email leads', href: '/agency/outreach', icon: Send, hint: 'Outreach', keywords: 'outreach send emails contact leads follow up email a lead reach out campaign cold email sequence' },
  { label: 'Edit my outreach email templates', href: '/agency/outreach', icon: FileText, hint: 'Outreach', keywords: 'outreach templates email templates edit template message template wording sequence email copy' },

  // Website / Marketing
  { label: 'Edit my website', href: '/agency/marketing', icon: Globe, hint: 'Website', keywords: 'website marketing site landing page edit site my site web page homepage' },
  { label: 'Change my website template / layout', href: '/agency/marketing?tab=template', icon: Layout, hint: 'Website', keywords: 'website template layout theme design switch template change template style' },
  { label: 'Show / hide website sections', href: '/agency/marketing?tab=sections', icon: Eye, hint: 'Website', keywords: 'website sections hide section show section reorder sections rearrange blocks turn off a section' },
  { label: 'Edit my website text / copy / headlines', href: '/agency/marketing?tab=content', icon: Type, hint: 'Website', keywords: 'website content copy text headlines wording edit words change text hero headline' },
  { label: 'Edit my website menu / navigation', href: '/agency/marketing?tab=navigation', icon: Link2, hint: 'Website', keywords: 'website navigation menu nav links header links footer links menu items' },
  { label: 'Change website colors', href: '/agency/marketing?tab=colors', icon: Palette, hint: 'Website', keywords: 'website colors brand colors theme colors palette color scheme' },
  { label: 'Connect a custom domain', href: '/agency/marketing?tab=domain', icon: Globe, hint: 'Website', keywords: 'custom domain my own domain connect domain dns use my domain url point my domain' },
  { label: 'Add tracking / analytics pixel', href: '/agency/marketing?tab=tracking', icon: BarChart3, hint: 'Website', keywords: 'tracking pixel gtm google analytics fb pixel facebook pixel tag manager tag conversion tracking' },
  { label: 'Change my shared-link / SMS preview card', href: '/agency/marketing?tab=seo', icon: Link2, hint: 'Website / Link Preview', keywords: 'link preview share preview sms preview social preview og image open graph link image logo on link when i share text preview headline on link metadata the card the image when sharing voiceai still showing seo' },
  { label: 'Edit my legal pages (privacy / terms)', href: '/agency/marketing?tab=legal', icon: FileText, hint: 'Website', keywords: 'legal pages privacy policy terms of service terms and conditions legal' },
  { label: 'Download marketing materials (Marketing Kit)', href: '/agency/marketing-kit', icon: Download, hint: 'Marketing Kit', keywords: 'marketing kit flyers brochures sales materials one pager leave behind printables promo materials assets' },
  { label: 'Agency profit / ROI calculator', href: '/agency/marketing-kit/calculator', icon: BarChart3, hint: 'Marketing Kit', keywords: 'calculator roi profit calculator earnings calculator how much can i make revenue projection' },

  // Branding / identity
  { label: 'White-label branding (remove VoiceAI)', href: '/agency/branding', icon: Paintbrush, hint: 'Branding', keywords: 'branding white label remove voiceai rebrand my brand hide voiceai connect make it mine' },
  { label: 'Upload / change my logo', href: '/agency/settings?tab=profile', icon: Building, hint: 'Settings', keywords: 'logo upload logo brand my logo change logo company logo' },
  { label: 'Change my app name / app icon', href: '/agency/settings?tab=profile', icon: Smartphone, hint: 'Settings', keywords: 'app name app icon home screen icon pwa installed app name icon on phone' },
  { label: 'Change my subdomain / white-label address', href: '/agency/settings?tab=profile', icon: Globe, hint: 'Settings', keywords: 'subdomain white label address my url address change subdomain slug' },
  { label: 'Change my agency name', href: '/agency/settings?tab=profile', icon: Settings, hint: 'Settings', keywords: 'name agency name rename company name change name business name' },
  { label: 'Change my alert phone / notifications', href: '/agency/settings?tab=profile', icon: Phone, hint: 'Settings', keywords: 'alert phone notifications text alerts where i get alerts signup alerts notification number my phone' },

  // Payments / pricing / billing
  { label: 'Connect Stripe to get paid by clients', href: '/agency/settings?tab=payments', icon: CreditCard, hint: 'Payments', keywords: 'stripe connect stripe get paid collect payments payment setup charge clients payout how do i get paid accept payments not accepting signups' },
  { label: 'Set up Paystack / Flutterwave', href: '/agency/settings?tab=payments', icon: CreditCard, hint: 'Payments', keywords: 'paystack flutterwave africa nigeria ghana kenya payments non-stripe local payments' },
  { label: 'Set my client pricing / plans', href: '/agency/settings?tab=pricing', icon: DollarSign, hint: 'Settings', keywords: 'pricing prices what to charge client price plans set price change pricing how much to charge packages plan names trial length setup fee' },
  { label: 'View client payments / revenue', href: '/agency/payments', icon: Receipt, hint: 'Payments', keywords: 'payments client payments revenue who paid earnings income transactions collected' },
  { label: 'My billing / invoices / upgrade plan', href: '/agency/settings?tab=billing', icon: Receipt, hint: 'Settings', keywords: 'invoices my bill usage what i owe subscription upgrade downgrade plan my plan billing pay my bill' },

  // Team / developer
  { label: 'Invite a team member', href: '/agency/settings?tab=team', icon: Users, hint: 'Settings', keywords: 'team invite add user staff team member colleague seat add teammate' },
  { label: 'Bring my own Telnyx / Twilio numbers', href: '/agency/settings?tab=twilio', icon: Phone, hint: 'Settings', keywords: 'twilio byot own numbers telnyx bring my own number port phone provider my own twilio' },
  { label: 'Get the signup embed code', href: '/agency/settings?tab=embed', icon: Code, hint: 'Settings', keywords: 'embed widget embed code add signup to my site iframe put the form on my site signup widget' },
  { label: 'Get API keys', href: '/agency/settings?tab=developer', icon: Code, hint: 'Settings', keywords: 'api api key developer integration token keys' },
  { label: 'Set up webhooks', href: '/agency/settings?tab=webhooks', icon: Webhook, hint: 'Settings', keywords: 'webhook webhooks zapier automation events notify my system callbacks' },
  { label: 'Set my support email / phone', href: '/agency/settings?tab=support', icon: HelpCircle, hint: 'Settings', keywords: 'support email support phone what clients see help contact info support settings' },

  // Analytics / inbox / referrals / support
  { label: 'View reporting / analytics', href: '/agency/analytics', icon: BarChart3, hint: 'Analytics', keywords: 'reporting analytics reports stats performance metrics roi dashboard numbers how are we doing insights' },
  { label: 'Check my inbox / messages', href: '/agency/inbox', icon: Inbox, hint: 'Inbox', keywords: 'inbox messages client messages support messages from voiceai connect conversations dms' },
  { label: 'Refer and earn', href: '/agency/referrals', icon: Gift, hint: 'Referrals', keywords: 'referral refer affiliate earn commission invite agencies referral link rewards' },
  { label: 'Contact VoiceAI Connect support', href: '/agency/support', icon: HelpCircle, hint: 'Support', keywords: 'support help contact ask a question talk to someone get help assistance' },
];

function clean(s: string): string {
  return (s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
// Typo-tolerant subsequence: do the chars of `needle` appear in order in `hay`?
function subseq(needle: string, hay: string): boolean {
  if (!needle) return false;
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) { if (hay[j] === needle[i]) i++; }
  return i === needle.length;
}

// Inverse-document-frequency over the catalog: common words ("change", "my",
// "set") carry almost no weight, distinctive ones ("demo", "voice", "stripe",
// "webhook") carry a lot. This is what stops a one-word overlap on a generic
// verb from padding the results.
const DF: Record<string, number> = {};
for (const a of ACTIONS) {
  const seen = new Set(clean(a.label + ' ' + a.keywords).split(' ').filter((t) => t.length > 1));
  seen.forEach((t) => { DF[t] = (DF[t] || 0) + 1; });
}
const N_ACTIONS = ACTIONS.length;
const idf = (t: string) => Math.log((N_ACTIONS + 1) / ((DF[t] || 0) + 0.5));
// A token is "distinctive" if it appears in at most ~20% of actions.
const DISTINCT_MAX_DF = Math.max(2, Math.ceil(N_ACTIONS * 0.2));
const isDistinct = (t: string) => (DF[t] || 0) > 0 && (DF[t] || 0) <= DISTINCT_MAX_DF;

const PREFIXES = ['i need to', 'i want to', 'i would like to', 'how do i', 'how to', 'how can i', 'where do i', 'where is', 'where can i', 'help me', 'can i', 'show me', 'go to', 'take me to', 'navigate to', 'jump to', 'pull up', 'open', 'change the', 'change my', 'change', 'update my', 'update', 'edit my', 'edit', 'set up my', 'set up', 'set my', 'set', 'add a', 'add', 'create a', 'create', 'make a', 'make', 'find a', 'find', 'view my', 'view', 'see my', 'see', 'get my', 'get', 'enable', 'turn on', 'turn off'];

// Tiny words that must never create a match on their own.
const STOP = new Set(['to', 'a', 'an', 'the', 'my', 'me', 'is', 'for', 'of', 'and', 'i', 'on', 'in', 'do', 'how', 'where', 'can', 'need', 'want']);

function stripPrefix(s: string): string {
  // Peel known intent prefixes (longest first) until none apply, so
  // "change my demo voice" reduces to "demo voice".
  let cur = s;
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const p of PREFIXES) {
      if (cur === p) { cur = ''; changed = true; break; }
      if (cur.startsWith(p + ' ')) { cur = cur.slice(p.length).trim(); changed = true; break; }
    }
    if (!changed) break;
  }
  return cur;
}
function normalize(q: string): string { return stripPrefix(clean(q)); }

// Relevance of a catalog action. Phrase/prefix/substring win big; otherwise
// IDF-weighted token coverage, GATED so a match built only from common words
// never surfaces.
function relevanceAction(a: Action, qClean: string, qTokens: string[]): number {
  if (!qClean) return 0;
  const label = clean(a.label);
  const hay = clean(a.label + ' ' + a.keywords);
  // Space-padded so matches land on whole words: " voice " must not match
  // "voiceai". wc() is our word-boundary test; prefix() allows a partially
  // typed word ("web" -> "website").
  const lw = ' ' + label + ' ';
  const hw = ' ' + hay + ' ';
  const wc = (text: string, term: string) => text.includes(' ' + term + ' ');
  const labelWords = label.split(' ');
  const hayWords = hay.split(' ');
  if (label === qClean) return 1200;
  if (label.startsWith(qClean + ' ')) return 950;
  if (wc(lw, qClean)) return 820;
  if (qClean.length >= 4 && wc(hw, qClean)) return 680;
  if (qTokens.length === 0) return 0;
  let matchedW = 0, totalW = 0, labelHits = 0, distinctHit = false;
  for (const t of qTokens) {
    const w = idf(t);
    totalW += w;
    let hit = 0;
    if (wc(hw, t)) { hit = 1; if (isDistinct(t)) distinctHit = true; }
    else if (t.length >= 3 && hayWords.some((x) => x.startsWith(t))) hit = 0.7;
    else if (t.length >= 4 && subseq(t, hay)) hit = 0.5;
    if (hit > 0) {
      matchedW += w * hit;
      if (wc(lw, t) || labelWords.some((x) => x.startsWith(t))) labelHits += 1;
    }
  }
  if (matchedW === 0 || totalW === 0) return 0;
  if (!distinctHit) return 0; // only common words matched -> noise
  const coverage = matchedW / totalW;
  return coverage * 520 + labelHits * 45;
}

// Relevance of a named entity (a client). Names are inherently distinctive, so
// no IDF gate, but require the query to actually cover the name so a stray
// one-word overlap doesn't surface every client.
function relevanceName(name: string, extra: string, qClean: string, qTokens: string[]): number {
  if (!qClean) return 0;
  const label = clean(name);
  const hay = clean(name + ' ' + (extra || ''));
  if (!label) return 0;
  if (label === qClean) return 1300;
  if (label.startsWith(qClean)) return 1000;
  if (label.includes(qClean)) return 880;
  if (qClean.length >= 3 && hay.includes(qClean)) return 720;
  if (qTokens.length === 0) return 0;
  let covered = 0;
  for (const t of qTokens) {
    if (hay.includes(t)) covered += 1;
    else if (t.length >= 4 && subseq(t, label)) covered += 0.5;
  }
  if (covered === 0) return 0;
  const frac = covered / qTokens.length;
  // The query has to be meaningfully about this name.
  if (frac < 0.5) return 0;
  return frac * 620 + 120;
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
      const s = relevanceName(c.business_name, c.owner_phone || '', qClean, qTokens);
      if (s > 0) scored.push({ s: s + 40, row: { key: `c-${c.id}`, label: `Open ${c.business_name}`, hint: 'Client', href: `/agency/clients/${c.id}`, Icon: Building } });
    }
    for (const a of ACTIONS) {
      const s = relevanceAction(a, qClean, qTokens);
      if (s > 0) scored.push({ s, row: { key: `a-${a.label}`, label: a.label, hint: a.hint, href: a.href, Icon: a.icon } });
    }
    scored.sort((x, y) => y.s - x.s);
    return scored.slice(0, 7).map((x) => x.row);
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