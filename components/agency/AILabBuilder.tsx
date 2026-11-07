'use client';

// ============================================================================
// AILabBuilder — the AI Lab conversational receptionist builder.
// ----------------------------------------------------------------------------
// Turn one is a clean prompt bar: describe the business or paste its website.
// /intake reads the site and pre-fills industry, name, city, services, FAQs and
// staff. A guided flow (mirroring the client onboarding wizard) then confirms
// and fills: business, hours, services, knowledge, team, voice + greeting.
//
// Terminal model (two deliberate steps):
//   1. Review & Create  -> POST /ai-lab/create  creates a REAL client with the
//      full package but NO phone number. A numberless client is not billed.
//   2. Get a Phone Number -> POST /ai-lab/:id/buy-number  is the ONLY place a
//      number is bought, and the only paid action. The owner can also finish
//      without a number and buy one later.
//
// Built auth-light so the same flow can later back a public marketing-site demo.
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp, Loader2, Phone, Package, Check, Pencil, Plus, X, Play, Square,
  Sparkles, Clock, Briefcase, BookOpen, Users, Mic, Rocket, ChevronDown, PhoneCall,
} from 'lucide-react';

const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

const STEPS = [
  { key: 'business', label: 'Business', icon: Sparkles, title: 'Your Business', subtitle: 'Confirm what we found. Fix anything that looks off.' },
  { key: 'hours', label: 'Hours', icon: Clock, title: 'Business Hours', subtitle: 'When you are open. The receptionist uses this to handle after-hours calls.' },
  { key: 'services', label: 'Services', icon: Briefcase, title: 'Services You Offer', subtitle: 'So the AI can tell callers what you do and book the right thing.' },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen, title: 'What Callers Ask', subtitle: 'Teach it the questions you hear every day, plus anything else it should know.' },
  { key: 'staff', label: 'Team', icon: Users, title: 'Your Team', subtitle: 'Who works here, so the AI can take messages and book with the right person.' },
  { key: 'voice', label: 'Voice', icon: Mic, title: 'Voice & Greeting', subtitle: 'How it answers the phone, and who it sounds like.' },
  { key: 'review', label: 'Review', icon: Rocket, title: 'Review & Create', subtitle: 'Create the receptionist now. You will add a phone number as the last step.' },
];

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' }, { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' }, { key: 'friday', label: 'Friday' }, { key: 'saturday', label: 'Saturday' }, { key: 'sunday', label: 'Sunday' },
];

const OPEN_24 = { open: '12:00 AM', close: '11:59 PM' };
const is24 = (d: any) => !!d && !d.closed && d.open === OPEN_24.open && d.close === OPEN_24.close;

const DEFAULT_HOURS: any = {
  monday: { open: '9:00 AM', close: '5:00 PM', closed: false }, tuesday: { open: '9:00 AM', close: '5:00 PM', closed: false },
  wednesday: { open: '9:00 AM', close: '5:00 PM', closed: false }, thursday: { open: '9:00 AM', close: '5:00 PM', closed: false },
  friday: { open: '9:00 AM', close: '5:00 PM', closed: false }, saturday: { open: '9:00 AM', close: '5:00 PM', closed: true },
  sunday: { open: '9:00 AM', close: '5:00 PM', closed: true },
};

const CATALOG = [
  ['home_services', 'Home Services'], ['hvac', 'HVAC / Heating & Cooling'], ['plumbing', 'Plumbing'], ['electrical', 'Electrical'],
  ['roofing', 'Roofing'], ['waterproofing', 'Waterproofing & Foundation'], ['pest_control', 'Pest Control'], ['landscaping', 'Landscaping & Lawn Care'],
  ['junk_removal', 'Junk Removal & Dumpster'], ['septic', 'Septic & Well'], ['automotive', 'Automotive'], ['medical', 'Medical'],
  ['dental', 'Dental & Orthodontics'], ['legal', 'Legal'], ['financial', 'Financial Services'], ['real_estate', 'Real Estate'],
  ['professional_services', 'Professional Services'], ['salon_spa', 'Salon & Spa'], ['fitness', 'Fitness & Recreation'],
  ['restaurants', 'Restaurant & Food Service'], ['retail', 'Retail'],
];

type Pkg = {
  mode: string; industry: { value: string; label: string } | null; confidence: string;
  sub_vertical: string | null; business_name: string; city: string; website_url: string;
  services: { name: string; description?: string }[]; faqs: { q: string; a: string }[];
  staff: { name: string; role?: string }[]; additional_info: string; hours: any;
  voice_id: string | null; voice_name: string | null; greeting: string; read_website: boolean; customGen: boolean;
  client_email: string;
};

export default function AILabBuilder({ agencyId, api, theme, logoUrl }: { agencyId: string; api: string; theme: any; logoUrl?: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'prompt' | 'chat' | 'creating' | 'number'>('prompt');
  const [query, setQuery] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [created, setCreated] = useState<{ id: string; business_name: string } | null>(null);
  const [buying, setBuying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const token = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });
  const update = (patch: Partial<Pkg>) => setPkg((p) => (p ? { ...p, ...patch } : p));

  useEffect(() => { if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [step, phase]);

  async function runIntake(q: string) {
    const text = (q || '').trim();
    if (!text) return;
    setReading(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/intake`, { method: 'POST', headers: headers(), body: JSON.stringify({ query: text }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not read that. Try rephrasing.');
      setPkg({
        mode: j.mode, industry: j.industry || null, confidence: j.confidence, sub_vertical: j.sub_vertical || null,
        business_name: j.business_name || '', city: j.city || '', website_url: j.website_url || '',
        services: Array.isArray(j.services) ? j.services : [], faqs: Array.isArray(j.faqs) ? j.faqs : [],
        staff: Array.isArray(j.staff) ? j.staff : [], additional_info: '', hours: { ...DEFAULT_HOURS },
        voice_id: null, voice_name: null, greeting: '', read_website: !!j.read_website, customGen: !j.industry,
        client_email: '',
      });
      setStep(0); setDone({}); setPhase('chat');
    } catch (e: any) { setError(e?.message || 'Something went wrong.'); } finally { setReading(false); }
  }

  function goNext() { const key = STEPS[step].key; setDone((d) => ({ ...d, [key]: true })); if (step < STEPS.length - 1) setStep(step + 1); }
  function goTo(i: number) { if (i >= 0 && i < STEPS.length) setStep(i); }

  // Step 1: create the client (no number).
  async function createReceptionist() {
    if (!pkg) return;
    setPhase('creating'); setError('');
    try {
      let industryValue = pkg.industry?.value || null;
      if (!industryValue && pkg.customGen) {
        const label = (pkg.sub_vertical || pkg.business_name || 'Custom Business').slice(0, 60);
        const cRes = await fetch(`${api}/api/agency/${agencyId}/custom-industries`, { method: 'POST', headers: headers(), body: JSON.stringify({ label, description: `AI receptionist for ${pkg.sub_vertical || pkg.business_name || 'the business'}.` }) });
        const cj = await cRes.json().catch(() => ({}));
        if (cRes.status === 403 && cj.upgrade_required) { setError(`${cj.title || 'Custom industries are a Scale feature'}. Start your free trial in Billing to generate it.`); setPhase('chat'); setStep(STEPS.length - 1); return; }
        if (!cRes.ok) throw new Error(cj.error || 'Could not generate the custom industry.');
        industryValue = cj.key || (cj.industry && cj.industry.key) || null;
        if (!industryValue) throw new Error('Custom industry was not created.');
      }
      if (!industryValue) { setError('Pick an industry first.'); setPhase('chat'); setStep(0); return; }

      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/create`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          industry: industryValue, business_name: pkg.business_name, city: pkg.city, website_url: pkg.website_url,
          sub_vertical: pkg.sub_vertical, hours: pkg.hours, services: pkg.services, faqs: pkg.faqs, staff: pkg.staff,
          additional_info: pkg.additional_info, voice_id: pkg.voice_id, greeting: pkg.greeting, client_email: pkg.client_email,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.client_id) throw new Error(j.error || 'Could not create the receptionist.');
      setCreated({ id: j.client_id, business_name: j.business_name || pkg.business_name });
      setPhase('number');
    } catch (e: any) { setError(e?.message || 'Create failed.'); setPhase('chat'); setStep(STEPS.length - 1); }
  }

  // Step 2 (final): buy the number. The only paid action.
  async function buyNumber() {
    if (!created) return;
    setBuying(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/${created.id}/buy-number`, { method: 'POST', headers: headers() });
      const j = await res.json().catch(() => ({}));
      if (res.status === 403 && j.upgrade_required) { setError(`${j.title || 'Buying a number is a paid action'}. ${j.message || ''}`); setBuying(false); return; }
      if (!res.ok || !j.success) throw new Error(j.error || 'Could not buy a number.');
      router.push(`/agency/clients/${created.id}`);
    } catch (e: any) { setError(e?.message || 'Could not buy a number.'); setBuying(false); }
  }

  const finishWithoutNumber = () => { if (created) router.push(`/agency/clients/${created.id}`); };

  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'creating') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-5" style={{ color: theme.iconColor }} />
        <p className="text-[18px] font-semibold" style={{ color: theme.text }}>Creating Your Receptionist</p>
        <p className="text-[15px] mt-1.5" style={{ color: theme.textMuted }}>Reading your site and building the AI. No number is being bought yet.</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'prompt') {
    const hasText = !!query.trim();
    return (
      <div className="min-h-[88vh] flex flex-col items-center px-6 pt-[22vh]">
        <div className="w-full" style={{ maxWidth: 680 }}>
          {logoUrl && <div className="flex justify-center mb-7"><img src={logoUrl} alt="" className="object-contain" style={{ maxHeight: 44, maxWidth: 220 }} /></div>}
          <h1 className="text-center font-bold tracking-tight mb-8" style={{ color: theme.text, fontSize: 'clamp(30px, 5vw, 42px)', lineHeight: 1.1 }}>
            Let’s Build Your Receptionist
          </h1>
          <form onSubmit={(e) => { e.preventDefault(); runIntake(query); }} className="relative">
            <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setError(''); }}
              placeholder="Describe the business, or paste its website" autoComplete="off" autoFocus
              className="w-full rounded-[28px] pl-6 pr-16 py-5 text-[16px] transition-colors focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')} onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)} />
            <button type="submit" aria-label="Build" disabled={reading || !hasText}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full inline-flex items-center justify-center transition-all disabled:cursor-default"
              style={{ backgroundColor: hasText ? theme.primary : theme.hover, color: hasText ? theme.primaryText : theme.textMuted, opacity: reading ? 0.7 : 1 }}>
              {reading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            </button>
          </form>
          <p className="text-center text-[13px] mt-4" style={{ color: theme.textMuted }}>Paste a website and we’ll read it to fill in the details.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setQuery(ex); runIntake(ex); }}
                className="rounded-full px-4 py-2 text-[14px] transition-colors"
                style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary + '66'; e.currentTarget.style.color = theme.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}>{ex}</button>
            ))}
          </div>
          {error && <div className="mt-6 text-[14px] rounded-xl p-3.5 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
          <div className="text-center mt-10">
            <button onClick={() => router.push('/agency/templates')} className="inline-flex items-center gap-1.5 text-[14px] transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
              <Package className="h-4 w-4" /> Browse all industry templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'number' && created) {
    return (
      <div ref={topRef} className="mx-auto w-full px-4 sm:px-6 py-8" style={{ maxWidth: 720 }}>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: theme.primary }}>
          <Check className="h-4 w-4" /> Receptionist created · Final step
        </div>
        <h1 className="font-bold tracking-tight" style={{ color: theme.text, fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: 1.1 }}>Get a Phone Number</h1>
        <p className="text-[15px] mt-2 mb-6" style={{ color: theme.textMuted }}>
          <span style={{ color: theme.text, fontWeight: 600 }}>{created.business_name}</span> is created and fully configured. A phone number is what makes it live and callable, and it is the only part that counts toward your plan. You can buy one now or add it later.
        </p>
        <div className="rounded-2xl p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-start gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><PhoneCall className="h-5 w-5" style={{ color: theme.iconColor }} /></div>
            <div>
              <p className="text-[16px] font-semibold" style={{ color: theme.text }}>Buy a local number</p>
              <p className="text-[14px] mt-0.5" style={{ color: theme.textMuted }}>We provision a real number and connect it to this receptionist so you can call it right away.</p>
            </div>
          </div>
          {error && <div className="mb-4 text-[14px] rounded-xl p-3.5" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
          <button onClick={buyNumber} disabled={buying}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />} {buying ? 'Buying your number' : 'Buy a phone number'}
          </button>
          <button onClick={finishWithoutNumber} disabled={buying} className="w-full text-center text-[14px] mt-3 py-2 transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
            Finish without a number for now
          </button>
        </div>
      </div>
    );
  }

  if (!pkg) return null;

  // PHASE: chat
  const meta = STEPS[step];
  return (
    <div ref={topRef} className="mx-auto w-full px-4 sm:px-6 py-7" style={{ maxWidth: 1120 }}>
      <div className="flex flex-col lg:flex-row gap-7">
        <div className="flex-1 min-w-0">
          <StepRail step={step} done={done} theme={theme} onJump={goTo} />
          <div className="mt-7">
            <h2 className="font-bold tracking-tight" style={{ color: theme.text, fontSize: 'clamp(24px, 3.4vw, 32px)', lineHeight: 1.12 }}>{meta.title}</h2>
            <p className="text-[15px] mt-2 mb-5" style={{ color: theme.textMuted }}>{meta.subtitle}</p>
            <StepBody step={step} pkg={pkg} theme={theme} api={api} agencyId={agencyId}
              update={update} onNext={goNext} onBack={() => goTo(step - 1)} onCreate={createReceptionist} error={error} />
          </div>
        </div>
        <div className="lg:w-[340px] lg:flex-shrink-0">
          <PackagePanel pkg={pkg} theme={theme} onEdit={goTo} />
        </div>
      </div>
    </div>
  );
}

// ── Step rail ────────────────────────────────────────────────────────────────
function StepRail({ step, done, theme, onJump }: any) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STEPS.map((s, i) => {
        const active = i === step; const complete = done[s.key] && !active; const Icon = s.icon;
        return (
          <button key={s.key} onClick={() => onJump(i)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{ backgroundColor: active ? theme.primary : (complete ? theme.primary15 : 'transparent'), color: active ? theme.primaryText : (complete ? theme.primary : theme.textMuted), border: `1px solid ${active ? theme.primary : theme.border}` }}>
            {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}{s.label}
          </button>
        );
      })}
    </div>
  );
}

function Card({ theme, children }: any) {
  return <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>{children}</div>;
}
function PrimaryBtn({ theme, onClick, children, icon: Icon, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
      {Icon && <Icon className="h-4 w-4" />}{children}
    </button>
  );
}
function GhostBtn({ theme, onClick, children }: any) {
  return <button onClick={onClick} className="text-[15px] font-medium px-4 py-3 rounded-xl transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>{children}</button>;
}
function Field({ theme, label, value, onChange, placeholder }: any) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium" style={{ color: theme.textMuted }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-[15px] focus:outline-none transition-colors" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }}
        onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')} onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)} />
    </label>
  );
}
function NavRow({ theme, onBack, children }: any) {
  return <div className="mt-5 flex justify-between items-center">{onBack ? <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn> : <span />}{children}</div>;
}

function StepBody({ step, pkg, theme, api, agencyId, update, onNext, onBack, onCreate, error }: any) {
  const key = STEPS[step].key;
  if (key === 'business') return <BusinessStep {...{ pkg, theme, update, onNext }} />;
  if (key === 'hours') return <HoursStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'services') return <ServicesStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'knowledge') return <KnowledgeStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'staff') return <StaffStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'voice') return <VoiceGreetingStep {...{ pkg, theme, api, agencyId, update, onNext, onBack }} />;
  if (key === 'review') return <ReviewStep {...{ pkg, theme, onCreate, onBack, error }} />;
  return null;
}

// Business
function BusinessStep({ pkg, theme, update, onNext }: any) {
  const [pickOpen, setPickOpen] = useState(false);
  const industryLabel = pkg.industry?.label || (pkg.sub_vertical ? `Custom: ${pkg.sub_vertical}` : 'Custom receptionist');
  return (
    <Card theme={theme}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field theme={theme} label="Business name" value={pkg.business_name} onChange={(v: string) => update({ business_name: v })} placeholder="Acme Dental" />
        <Field theme={theme} label="City" value={pkg.city} onChange={(v: string) => update({ city: v })} placeholder="Austin" />
      </div>
      <div className="mt-4">
        <Field theme={theme} label="Client email (for billing & receipts)" value={pkg.client_email} onChange={(v: string) => update({ client_email: v })} placeholder="owner@acmedental.com" />
        <p className="text-[12px] mt-1.5" style={{ color: theme.textMuted }}>The client&rsquo;s own email. Used for their receipts and checkout, so your email never shows up in their payment.</p>
      </div>
      <div className="mt-4">
        <span className="text-[13px] font-medium" style={{ color: theme.textMuted }}>Industry template</span>
        <div className="mt-1.5 relative">
          <button onClick={() => setPickOpen((o) => !o)} className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-[15px] transition-colors" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }}>
            <span>{industryLabel}</span><ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />
          </button>
          {pickOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-xl py-1 max-h-72 overflow-auto shadow-lg" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              {!!pkg.sub_vertical && (
                <button onClick={() => { update({ industry: null, customGen: true }); setPickOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-[14px] flex items-center gap-2 transition-colors hover:opacity-80" style={{ color: theme.text }}>
                  <Sparkles className="h-4 w-4" style={{ color: theme.iconColor }} /> Generate custom: {pkg.sub_vertical}
                </button>
              )}
              {CATALOG.map(([value, label]) => (
                <button key={value} onClick={() => { update({ industry: { value, label }, customGen: false }); setPickOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-[14px] transition-colors hover:opacity-80" style={{ color: theme.text, backgroundColor: pkg.industry?.value === value ? theme.primary15 : 'transparent' }}>{label}</button>
              ))}
            </div>
          )}
        </div>
        {pkg.website_url && <p className="text-[13px] mt-2" style={{ color: theme.textMuted }}>Website: {pkg.website_url}</p>}
        {!pkg.industry && pkg.customGen && <p className="text-[13px] mt-2" style={{ color: theme.textMuted }}>No built-in template fits, so we’ll generate a custom one when you create it.</p>}
      </div>
      <NavRow theme={theme}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Hours (with 24h + Open 24/7)
function HoursStep({ pkg, theme, update, onNext, onBack }: any) {
  const setDay = (day: string, patch: any) => update({ hours: { ...pkg.hours, [day]: { ...pkg.hours[day], ...patch } } });
  const applyWeekdays = () => { const h = { ...pkg.hours }; ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((d) => { h[d] = { open: '9:00 AM', close: '5:00 PM', closed: false }; }); update({ hours: h }); };
  const applyAllDay = () => { const h: any = {}; DAYS.forEach(({ key }) => { h[key] = { ...OPEN_24, closed: false }; }); update({ hours: h }); };
  const Seg = ({ dayKey, mode, label }: any) => {
    const d = pkg.hours[dayKey] || { closed: true };
    const active = mode === 'closed' ? d.closed : mode === '24' ? is24(d) : (!d.closed && !is24(d));
    const onClick = () => { if (mode === 'closed') setDay(dayKey, { closed: true }); else if (mode === '24') setDay(dayKey, { ...OPEN_24, closed: false }); else setDay(dayKey, { open: '9:00 AM', close: '5:00 PM', closed: false }); };
    return <button onClick={onClick} className="text-[12px] rounded-lg px-2.5 py-1.5 transition-colors" style={{ backgroundColor: active ? theme.primary15 : 'transparent', color: active ? theme.primary : theme.textMuted, border: `1px solid ${active ? theme.primary + '55' : theme.border}` }}>{label}</button>;
  };
  return (
    <Card theme={theme}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={applyWeekdays} className="text-[13px] font-medium rounded-full px-3.5 py-1.5" style={{ color: theme.primary, border: `1px solid ${theme.primary}44` }}>Weekdays 9 to 5</button>
        <button onClick={applyAllDay} className="text-[13px] font-medium rounded-full px-3.5 py-1.5" style={{ color: theme.primary, border: `1px solid ${theme.primary}44` }}>Open 24/7</button>
      </div>
      <div className="space-y-2.5">
        {DAYS.map(({ key, label }) => {
          const d = pkg.hours[key] || { open: '9:00 AM', close: '5:00 PM', closed: true };
          const open = !d.closed && !is24(d);
          return (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-[14px] font-medium" style={{ color: theme.text }}>{label}</span>
              <div className="flex gap-1.5">
                <Seg dayKey={key} mode="open" label="Open" />
                <Seg dayKey={key} mode="24" label="24 hours" />
                <Seg dayKey={key} mode="closed" label="Closed" />
              </div>
              {open && (
                <div className="flex items-center gap-1.5">
                  <input value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="w-24 rounded-lg px-2.5 py-2 text-[13px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
                  <span className="text-[12px]" style={{ color: theme.textMuted }}>to</span>
                  <input value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="w-24 rounded-lg px-2.5 py-2 text-[13px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Services (each row editable inline)
function ServicesStep({ pkg, theme, update, onNext, onBack }: any) {
  const [draft, setDraft] = useState('');
  const add = () => { const n = draft.trim(); if (!n) return; update({ services: [...pkg.services, { name: n, description: '' }] }); setDraft(''); };
  const remove = (i: number) => update({ services: pkg.services.filter((_: any, idx: number) => idx !== i) });
  const edit = (i: number, name: string) => update({ services: pkg.services.map((s: any, idx: number) => idx === i ? { ...s, name } : s) });
  return (
    <Card theme={theme}>
      <div className="space-y-2">
        {pkg.services.map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s.name} onChange={(e) => edit(i, e.target.value)} className="flex-1 rounded-xl px-3.5 py-2.5 text-[15px] focus:outline-none transition-colors" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')} onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)} />
            <button onClick={() => remove(i)} aria-label="Remove" className="h-9 w-9 rounded-lg inline-flex items-center justify-center hover:opacity-70 flex-shrink-0" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
          </div>
        ))}
        {pkg.services.length === 0 && <p className="text-[14px]" style={{ color: theme.textMuted }}>No services yet, add a few below.</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add a service" className="flex-1 rounded-xl px-3.5 py-3 text-[15px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
        <button onClick={add} className="h-11 w-11 rounded-xl inline-flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Plus className="h-5 w-5" /></button>
      </div>
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Knowledge (each FAQ's question and answer editable inline)
function KnowledgeStep({ pkg, theme, update, onNext, onBack }: any) {
  const removeFaq = (i: number) => update({ faqs: pkg.faqs.filter((_: any, idx: number) => idx !== i) });
  const editFaq = (i: number, field: 'q' | 'a', val: string) => update({ faqs: pkg.faqs.map((f: any, idx: number) => idx === i ? { ...f, [field]: val } : f) });
  const addFaq = () => update({ faqs: [...pkg.faqs, { q: '', a: '' }] });
  const inputStyle = { backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text };
  return (
    <Card theme={theme}>
      <div className="space-y-3 mb-3">
        {pkg.faqs.map((f: any, i: number) => (
          <div key={i} className="rounded-xl p-3 space-y-2" style={{ backgroundColor: theme.hover }}>
            <div className="flex items-center gap-2">
              <input value={f.q} onChange={(e) => editFaq(i, 'q', e.target.value)} placeholder="What do callers ask?" className="flex-1 rounded-lg px-3 py-2.5 text-[14px] font-medium focus:outline-none" style={{ ...inputStyle, backgroundColor: theme.card }} />
              <button onClick={() => removeFaq(i)} aria-label="Remove" className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:opacity-70 flex-shrink-0" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
            </div>
            <textarea value={f.a} onChange={(e) => editFaq(i, 'a', e.target.value)} rows={2} placeholder="The answer the AI should give" className="w-full rounded-lg px-3 py-2.5 text-[14px] focus:outline-none resize-none" style={{ ...inputStyle, backgroundColor: theme.card }} />
          </div>
        ))}
      </div>
      <button onClick={addFaq} className="inline-flex items-center gap-1.5 text-[14px] font-medium mb-5" style={{ color: theme.primary }}><Plus className="h-4 w-4" /> Add a question</button>
      <label className="text-[13px] font-medium" style={{ color: theme.textMuted }}>Anything else it should know</label>
      <textarea value={pkg.additional_info} onChange={(e) => update({ additional_info: e.target.value })} rows={4} placeholder="e.g. We offer free estimates, we do not service apartments, parking is behind the building." className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-[15px] focus:outline-none resize-none" style={inputStyle} />
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Staff (each member's name and role editable inline)
function StaffStep({ pkg, theme, update, onNext, onBack }: any) {
  const [name, setName] = useState(''); const [role, setRole] = useState('');
  const add = () => { const n = name.trim(); if (!n) return; update({ staff: [...pkg.staff, { name: n, role: role.trim() }] }); setName(''); setRole(''); };
  const remove = (i: number) => update({ staff: pkg.staff.filter((_: any, idx: number) => idx !== i) });
  const edit = (i: number, field: 'name' | 'role', val: string) => update({ staff: pkg.staff.map((s: any, idx: number) => idx === i ? { ...s, [field]: val } : s) });
  const inputStyle = { backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text };
  return (
    <Card theme={theme}>
      {pkg.staff.length > 0 && (
        <div className="space-y-2 mb-4">
          {pkg.staff.map((s: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input value={s.name} onChange={(e) => edit(i, 'name', e.target.value)} placeholder="Name" className="flex-1 rounded-xl px-3.5 py-2.5 text-[15px] focus:outline-none" style={inputStyle} />
              <input value={s.role || ''} onChange={(e) => edit(i, 'role', e.target.value)} placeholder="Role (optional)" className="flex-1 rounded-xl px-3.5 py-2.5 text-[15px] focus:outline-none" style={inputStyle} />
              <button onClick={() => remove(i)} aria-label="Remove" className="h-9 w-9 rounded-lg inline-flex items-center justify-center hover:opacity-70 flex-shrink-0 self-end sm:self-auto" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a name" className="flex-1 rounded-xl px-3.5 py-3 text-[15px] focus:outline-none" style={inputStyle} />
        <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Role (optional)" className="flex-1 rounded-xl px-3.5 py-3 text-[15px] focus:outline-none" style={inputStyle} />
        <button onClick={add} className="h-11 rounded-xl px-4 inline-flex items-center justify-center gap-1.5 text-[14px] font-medium flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Plus className="h-4 w-4" /> Add</button>
      </div>
      <p className="text-[13px] mt-3" style={{ color: theme.textMuted }}>Optional. Skip it if it is just you.</p>
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Voice + Greeting (one step: draft greeting, then hear it in each voice)
function VoiceGreetingStep({ pkg, theme, api, agencyId, update, onNext, onBack }: any) {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [draftingGreeting, setDraftingGreeting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const token = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const res = await fetch(`${api}/api/voices`); const j = await res.json().catch(() => ({})); if (alive) setVoices(Array.isArray(j.voices) ? j.voices : []); }
      catch { /* ignore */ } finally { if (alive) setLoading(false); }
    })();
    // auto-draft a greeting once
    if (!pkg.greeting) {
      setDraftingGreeting(true);
      (async () => {
        try {
          const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/suggest-greeting`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ business_name: pkg.business_name, industry: pkg.industry?.value, sub_vertical: pkg.sub_vertical }) });
          const j = await res.json().catch(() => ({})); if (alive && j.greeting) update({ greeting: j.greeting });
        } catch { /* ignore */ } finally { if (alive) setDraftingGreeting(false); }
      })();
    }
    return () => { alive = false; if (audioRef.current) audioRef.current.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const preview = async (v: any) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (playing === v.id) { setPlaying(null); return; }
      setPlaying(v.id);
      const text = pkg.greeting || `Thanks for calling ${pkg.business_name || 'the office'}, how can I help you today?`;
      const res = await fetch(`/api/voice-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice_id: v.id, text }) });
      if (!res.ok) { setPlaying(null); return; }
      const blob = await res.blob(); const audio = new Audio(URL.createObjectURL(blob)); audioRef.current = audio;
      audio.onended = () => setPlaying(null); audio.play().catch(() => setPlaying(null));
    } catch { setPlaying(null); }
  };

  const shown = showAll ? voices : voices.slice(0, 6);
  return (
    <Card theme={theme}>
      <label className="text-[13px] font-medium" style={{ color: theme.textMuted }}>Greeting</label>
      {draftingGreeting && !pkg.greeting ? (
        <div className="flex items-center gap-2 text-[14px] py-3" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Drafting a greeting</div>
      ) : (
        <textarea value={pkg.greeting} onChange={(e) => update({ greeting: e.target.value })} rows={2} placeholder="Thanks for calling, how can I help you today?" className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-[15px] focus:outline-none resize-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
      )}
      <p className="text-[13px] mt-4 mb-2 font-medium" style={{ color: theme.textMuted }}>Pick a voice · tap play to hear it say your greeting</p>
      {loading ? (
        <div className="flex items-center gap-2 text-[14px] py-3" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading voices</div>
      ) : (
        <div className="space-y-2">
          {shown.map((v: any) => {
            const selected = pkg.voice_id === v.id;
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors cursor-pointer" style={{ backgroundColor: selected ? theme.primary15 : theme.hover, border: `1px solid ${selected ? theme.primary + '55' : theme.border}` }} onClick={() => update({ voice_id: v.id, voice_name: v.name })}>
                <button onClick={(e) => { e.stopPropagation(); preview(v); }} className="h-9 w-9 rounded-full flex-shrink-0 inline-flex items-center justify-center" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{playing === v.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                <div className="flex-1 min-w-0"><p className="text-[15px] font-medium flex items-center gap-1.5" style={{ color: theme.text }}>{v.name}{v.accent && <span className="text-[12px] font-normal" style={{ color: theme.textMuted }}>· {v.accent}</span>}</p>{v.description && <p className="text-[13px] truncate" style={{ color: theme.textMuted }}>{v.description}</p>}</div>
                {selected && <Check className="h-5 w-5 flex-shrink-0" style={{ color: theme.iconColor }} />}
              </div>
            );
          })}
          {!showAll && voices.length > 6 && <button onClick={() => setShowAll(true)} className="text-[14px] font-medium" style={{ color: theme.primary }}>Show all {voices.length} voices</button>}
        </div>
      )}
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn></NavRow>
    </Card>
  );
}

// Review
function ReviewStep({ pkg, theme, onCreate, onBack, error }: any) {
  return (
    <Card theme={theme}>
      <p className="text-[15px]" style={{ color: theme.text }}>
        A <span style={{ fontWeight: 600 }}>{pkg.industry?.label || (pkg.sub_vertical ? 'custom ' + pkg.sub_vertical : 'custom')}</span> receptionist for <span style={{ fontWeight: 600 }}>{pkg.business_name || 'your business'}</span>{pkg.city ? `, ${pkg.city}` : ''}.
      </p>
      <p className="text-[14px] mt-2" style={{ color: theme.textMuted }}>
        {pkg.services.length} service{pkg.services.length === 1 ? '' : 's'}, {pkg.staff.length} team member{pkg.staff.length === 1 ? '' : 's'}, {pkg.faqs.length} FAQ{pkg.faqs.length === 1 ? '' : 's'}, {pkg.voice_name || 'default'} voice.
      </p>
      <p className="text-[14px] mt-3 rounded-xl px-3.5 py-3" style={{ backgroundColor: theme.primary15, color: theme.text }}>
        This creates the receptionist with no phone number yet, so nothing is charged. You buy a number as the final step.
      </p>
      {error && <div className="mt-3 text-[14px] rounded-xl p-3.5" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
      <NavRow theme={theme} onBack={onBack}><PrimaryBtn theme={theme} onClick={onCreate} icon={Rocket}>Create receptionist</PrimaryBtn></NavRow>
    </Card>
  );
}

// ── Live package panel ───────────────────────────────────────────────────────
function PackagePanel({ pkg, theme, onEdit }: any) {
  const openDays = DAYS.filter((d) => pkg.hours[d.key] && !pkg.hours[d.key].closed);
  const all24 = openDays.length === 7 && openDays.every((d) => is24(pkg.hours[d.key]));
  const hoursSummary = all24 ? 'Open 24/7' : openDays.length === 0 ? 'Closed' : openDays.length === 7 ? 'Every day' : openDays.map((d) => d.label.slice(0, 3)).join(', ');
  const Row = ({ i, icon: Icon, label, value }: any) => (
    <button onClick={() => onEdit(i)} className="w-full text-left flex items-start gap-3 py-3 group">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted }} />
      <div className="flex-1 min-w-0"><p className="text-[11px] uppercase tracking-wide" style={{ color: theme.textMuted }}>{label}</p><p className="text-[14px] truncate" style={{ color: theme.text }}>{value}</p></div>
      <Pencil className="h-3.5 w-3.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.textMuted }} />
    </button>
  );
  return (
    <div className="rounded-2xl p-5 lg:sticky lg:top-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <p className="text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Your Receptionist</p>
      <p className="text-[18px] font-semibold" style={{ color: theme.text }}>{pkg.business_name || 'New receptionist'}</p>
      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px]" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{pkg.industry?.label || (pkg.sub_vertical ? `Custom: ${pkg.sub_vertical}` : 'Custom')}</div>
      <div className="mt-3.5 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: theme.hover }}><Phone className="h-4 w-4" style={{ color: theme.textMuted }} /><span className="text-[13px]" style={{ color: theme.textMuted }}>Number bought as the last step</span></div>
      <div className="mt-2 divide-y" style={{ borderColor: theme.border }}>
        <Row i={1} icon={Clock} label="Hours" value={hoursSummary} />
        <Row i={2} icon={Briefcase} label="Services" value={pkg.services.length ? `${pkg.services.length} added` : 'None yet'} />
        <Row i={3} icon={BookOpen} label="Knowledge" value={`${pkg.read_website ? 'Website' : 'No site'}${pkg.faqs.length ? `, ${pkg.faqs.length} FAQs` : ''}`} />
        <Row i={4} icon={Users} label="Team" value={pkg.staff.length ? `${pkg.staff.length} member${pkg.staff.length === 1 ? '' : 's'}` : 'Just you'} />
        <Row i={5} icon={Mic} label="Voice & Greeting" value={pkg.voice_name ? pkg.voice_name : 'Default'} />
      </div>
    </div>
  );
}
