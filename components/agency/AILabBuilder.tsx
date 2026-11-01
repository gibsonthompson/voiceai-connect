'use client';

// ============================================================================
// AILabBuilder — the AI Lab conversational receptionist builder.
// ----------------------------------------------------------------------------
// Turn one is a clean, ChatGPT-style prompt bar: describe the business or paste
// its website. We read the site (POST /ai-lab/intake), identify the industry and
// pre-fill name, city, services and FAQs. The conversation then confirms and
// fills the rest (hours, services, knowledge, voice, greeting). NOTHING is
// created live during the conversation. Only "Go live" (POST /ai-lab/build)
// creates the assistant, folds everything into the knowledge base, and
// provisions a phone number. Provisioning is the last step, on purpose.
//
// Built auth-light so the same flow can later back a public marketing-site demo:
// the collection is identical, only the final action differs (go live here vs
// web-call demo + signup there).
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp, Loader2, Phone, Package, Check, Pencil, Plus, X, Play, Square,
  Sparkles, Clock, Briefcase, BookOpen, Mic, MessageSquare, Rocket, ChevronDown,
} from 'lucide-react';

const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

const STEPS = [
  { key: 'business', label: 'Business', icon: Sparkles },
  { key: 'hours', label: 'Hours', icon: Clock },
  { key: 'services', label: 'Services', icon: Briefcase },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { key: 'voice', label: 'Voice', icon: Mic },
  { key: 'greeting', label: 'Greeting', icon: MessageSquare },
  { key: 'review', label: 'Go live', icon: Rocket },
];

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Mon' }, { key: 'tuesday', label: 'Tue' }, { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' }, { key: 'friday', label: 'Fri' }, { key: 'saturday', label: 'Sat' }, { key: 'sunday', label: 'Sun' },
];

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
  additional_info: string; hours: any; voice_id: string | null; voice_name: string | null;
  greeting: string; read_website: boolean; customGen: boolean;
};

export default function AILabBuilder({ agencyId, api, theme, logoUrl }: { agencyId: string; api: string; theme: any; logoUrl?: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'prompt' | 'chat' | 'building'>('prompt');
  const [query, setQuery] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });
  const update = (patch: Partial<Pkg>) => setPkg((p) => (p ? { ...p, ...patch } : p));

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [step, phase]);

  // ── Intake: read the site, pre-fill, start the conversation ────────────────
  async function runIntake(q: string) {
    const text = (q || '').trim();
    if (!text) return;
    setReading(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/intake`, { method: 'POST', headers: headers(), body: JSON.stringify({ query: text }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not read that. Try rephrasing.');
      const next: Pkg = {
        mode: j.mode, industry: j.industry || null, confidence: j.confidence,
        sub_vertical: j.sub_vertical || null, business_name: j.business_name || '', city: j.city || '',
        website_url: j.website_url || '', services: Array.isArray(j.services) ? j.services : [],
        faqs: Array.isArray(j.faqs) ? j.faqs : [], additional_info: '', hours: { ...DEFAULT_HOURS },
        voice_id: null, voice_name: null, greeting: '', read_website: !!j.read_website, customGen: !j.industry,
      };
      setPkg(next);
      setStep(0); setDone({});
      setPhase('chat');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setReading(false);
    }
  }

  function goNext() {
    const key = STEPS[step].key;
    setDone((d) => ({ ...d, [key]: true }));
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function goTo(i: number) { if (i >= 0 && i < STEPS.length) setStep(i); }

  // ── Commit (go live): the only place a number is provisioned ───────────────
  async function goLive() {
    if (!pkg) return;
    setPhase('building'); setError('');
    try {
      let industryValue = pkg.industry?.value || null;

      // Custom path: generate the custom industry first, then build with its key.
      if (!industryValue && pkg.customGen) {
        const label = (pkg.sub_vertical || pkg.business_name || 'Custom Business').slice(0, 60);
        const cRes = await fetch(`${api}/api/agency/${agencyId}/custom-industries`, {
          method: 'POST', headers: headers(),
          body: JSON.stringify({ label, description: `AI receptionist for ${pkg.sub_vertical || pkg.business_name || 'the business'}.` }),
        });
        const cj = await cRes.json().catch(() => ({}));
        if (cRes.status === 403 && cj.upgrade_required) { setError(`${cj.title || 'Custom industries are a Scale feature'}. Start your free trial in Billing to generate it.`); setPhase('chat'); return; }
        if (!cRes.ok) throw new Error(cj.error || 'Could not generate the custom industry.');
        industryValue = cj.key || (cj.industry && cj.industry.key) || null;
        if (!industryValue) throw new Error('Custom industry was not created.');
      }
      if (!industryValue) { setError('Pick an industry before going live.'); setPhase('chat'); setStep(0); return; }

      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/build`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          industry: industryValue, business_name: pkg.business_name, city: pkg.city, website_url: pkg.website_url,
          sub_vertical: pkg.sub_vertical, hours: pkg.hours, services: pkg.services, faqs: pkg.faqs,
          additional_info: pkg.additional_info, voice_id: pkg.voice_id, greeting: pkg.greeting,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 403 && j.upgrade_required) { setError(`${j.title || 'Paid feature'}. ${j.message || ''}`); setPhase('chat'); setStep(STEPS.length - 1); return; }
      if (!res.ok || !j.client_id) throw new Error(j.error || 'Could not go live.');
      router.push(`/agency/clients/${j.client_id}`);
    } catch (e: any) {
      setError(e?.message || 'Go live failed.'); setPhase('chat'); setStep(STEPS.length - 1);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PHASE: building
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'building') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="h-7 w-7 animate-spin mb-4" style={{ color: theme.primary }} />
        <p className="text-[15px] font-medium" style={{ color: theme.text }}>Going live</p>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Reading your site, building the receptionist, and assigning a number.</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // PHASE: prompt (clean entry)
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'prompt') {
    const hasText = !!query.trim();
    return (
      <div className="min-h-[88vh] flex flex-col items-center px-6 pt-[24vh]">
        <div className="w-full" style={{ maxWidth: 640 }}>
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img src={logoUrl} alt="" className="object-contain" style={{ maxHeight: 40, maxWidth: 200 }} />
            </div>
          )}
          <h1 className="text-center font-semibold tracking-tight mb-7" style={{ color: theme.text, fontSize: 'clamp(24px, 4.5vw, 34px)', lineHeight: 1.15 }}>
            Let’s build your receptionist
          </h1>

          <form onSubmit={(e) => { e.preventDefault(); runIntake(query); }} className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(''); }}
              placeholder="Describe the business, or paste its website"
              autoComplete="off" autoFocus
              className="w-full rounded-[26px] pl-5 pr-14 py-4 text-[15px] transition-colors focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text, boxShadow: theme.isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')}
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
            />
            <button type="submit" aria-label="Build" disabled={reading || !hasText}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center transition-all disabled:cursor-default"
              style={{ backgroundColor: hasText ? theme.primary : theme.hover, color: hasText ? theme.primaryText : theme.textMuted, opacity: reading ? 0.7 : 1 }}>
              {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-center text-[12px] mt-3" style={{ color: theme.textMuted }}>
            Paste a website and we’ll read it to fill in the details.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setQuery(ex); runIntake(ex); }}
                className="rounded-full px-3.5 py-1.5 text-[13px] transition-colors"
                style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary + '66'; e.currentTarget.style.color = theme.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}>
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-5 text-sm rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <div className="text-center mt-9">
            <button onClick={() => router.push('/agency/templates')} className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
              <Package className="h-3.5 w-3.5" /> Browse all industry templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // PHASE: chat (conversation + live package panel)
  // ════════════════════════════════════════════════════════════════════════
  if (!pkg) return null;

  return (
    <div className="mx-auto w-full px-4 sm:px-6 py-6" style={{ maxWidth: 1040 }}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Conversation */}
        <div className="flex-1 min-w-0">
          <StepRail step={step} done={done} theme={theme} onJump={goTo} />
          <div ref={scrollRef} className="mt-5">
            <StepBody
              step={step} pkg={pkg} theme={theme} api={api} agencyId={agencyId}
              update={update} onNext={goNext} onBack={() => goTo(step - 1)}
              onGoLive={goLive} error={error}
            />
          </div>
        </div>

        {/* Live package panel */}
        <div className="lg:w-[320px] lg:flex-shrink-0">
          <PackagePanel pkg={pkg} theme={theme} onEdit={goTo} />
        </div>
      </div>
    </div>
  );
}

// ── Step rail (progress, jump-to) ───────────────────────────────────────────
function StepRail({ step, done, theme, onJump }: any) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STEPS.map((s, i) => {
        const active = i === step;
        const complete = done[s.key] && !active;
        const Icon = s.icon;
        return (
          <button key={s.key} onClick={() => onJump(i)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: active ? theme.primary : (complete ? theme.primary15 : 'transparent'),
              color: active ? theme.primaryText : (complete ? theme.primary : theme.textMuted),
              border: `1px solid ${active ? theme.primary : theme.border}`,
            }}>
            {complete ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Bot bubble ──────────────────────────────────────────────────────────────
function Bot({ theme, children }: any) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}>
        <Sparkles className="h-3.5 w-3.5" style={{ color: theme.primary }} />
      </div>
      <div className="text-[15px] leading-relaxed pt-0.5" style={{ color: theme.text }}>{children}</div>
    </div>
  );
}

function Card({ theme, children }: any) {
  return <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>{children}</div>;
}

function PrimaryBtn({ theme, onClick, children, icon: Icon }: any) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
      {Icon && <Icon className="h-4 w-4" />} {children}
    </button>
  );
}
function GhostBtn({ theme, onClick, children }: any) {
  return <button onClick={onClick} className="text-sm font-medium px-3 py-2.5 rounded-xl transition-colors" style={{ color: theme.textMuted }}>{children}</button>;
}

function Field({ theme, label, value, onChange, placeholder }: any) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium" style={{ color: theme.textMuted }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl px-3 py-2.5 text-[14px] focus:outline-none transition-colors"
        style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }}
        onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')}
        onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)} />
    </label>
  );
}

// ── The active step body ─────────────────────────────────────────────────────
function StepBody({ step, pkg, theme, api, agencyId, update, onNext, onBack, onGoLive, error }: any) {
  const key = STEPS[step].key;
  const name = pkg.business_name || 'your business';

  if (key === 'business') return <BusinessStep {...{ pkg, theme, update, onNext }} />;
  if (key === 'hours') return <HoursStep {...{ pkg, theme, update, onNext, onBack, name }} />;
  if (key === 'services') return <ServicesStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'knowledge') return <KnowledgeStep {...{ pkg, theme, update, onNext, onBack }} />;
  if (key === 'voice') return <VoiceStep {...{ pkg, theme, api, update, onNext, onBack }} />;
  if (key === 'greeting') return <GreetingStep {...{ pkg, theme, api, agencyId, update, onNext, onBack }} />;
  if (key === 'review') return <ReviewStep {...{ pkg, theme, onGoLive, onBack, error }} />;
  return null;
}

// Business
function BusinessStep({ pkg, theme, update, onNext }: any) {
  const [pickOpen, setPickOpen] = useState(false);
  const industryLabel = pkg.industry?.label || (pkg.sub_vertical ? `Custom: ${pkg.sub_vertical}` : 'Custom receptionist');
  return (
    <>
      <Bot theme={theme}>
        {pkg.read_website ? 'I read the site. ' : ''}Here’s what I’ve got. Fix anything that’s off, then continue.
      </Bot>
      <Card theme={theme}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field theme={theme} label="Business name" value={pkg.business_name} onChange={(v: string) => update({ business_name: v })} placeholder="Acme Dental" />
          <Field theme={theme} label="City" value={pkg.city} onChange={(v: string) => update({ city: v })} placeholder="Austin" />
        </div>
        <div className="mt-3">
          <span className="text-[12px] font-medium" style={{ color: theme.textMuted }}>Industry template</span>
          <div className="mt-1 relative">
            <button onClick={() => setPickOpen((o) => !o)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] transition-colors"
              style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }}>
              <span>{industryLabel}</span>
              <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />
            </button>
            {pickOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-xl py-1 max-h-64 overflow-auto shadow-lg" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                {!!pkg.sub_vertical && (
                  <button onClick={() => { update({ industry: null, customGen: true }); setPickOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 transition-colors hover:opacity-80" style={{ color: theme.text }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Generate custom: {pkg.sub_vertical}
                  </button>
                )}
                {CATALOG.map(([value, label]) => (
                  <button key={value} onClick={() => { update({ industry: { value, label }, customGen: false }); setPickOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:opacity-80"
                    style={{ color: theme.text, backgroundColor: pkg.industry?.value === value ? theme.primary15 : 'transparent' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!pkg.industry && pkg.customGen && (
            <p className="text-[12px] mt-2" style={{ color: theme.textMuted }}>No built-in template fits, so we’ll generate a custom one when you go live.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Hours
function HoursStep({ pkg, theme, update, onNext, onBack, name }: any) {
  const setDay = (day: string, patch: any) => update({ hours: { ...pkg.hours, [day]: { ...pkg.hours[day], ...patch } } });
  const applyWeekdays = () => {
    const h = { ...pkg.hours };
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((d) => { h[d] = { open: '9:00 AM', close: '5:00 PM', closed: false }; });
    update({ hours: h });
  };
  return (
    <>
      <Bot theme={theme}>When is {name} open? The receptionist uses this to handle after-hours calls.</Bot>
      <Card theme={theme}>
        <button onClick={applyWeekdays} className="text-[12px] font-medium mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ color: theme.primary, border: `1px solid ${theme.primary}44` }}>
          Set weekdays 9 to 5
        </button>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const d = pkg.hours[key] || { open: '9:00 AM', close: '5:00 PM', closed: true };
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-10 text-[13px] font-medium" style={{ color: theme.text }}>{label}</span>
                <button onClick={() => setDay(key, { closed: !d.closed })} className="text-[12px] rounded-full px-2.5 py-1 transition-colors"
                  style={{ backgroundColor: d.closed ? 'transparent' : theme.primary15, color: d.closed ? theme.textMuted : theme.primary, border: `1px solid ${d.closed ? theme.border : theme.primary + '44'}` }}>
                  {d.closed ? 'Closed' : 'Open'}
                </button>
                {!d.closed && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="w-24 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
                    <span className="text-[12px]" style={{ color: theme.textMuted }}>to</span>
                    <input value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="w-24 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Services
function ServicesStep({ pkg, theme, update, onNext, onBack }: any) {
  const [draft, setDraft] = useState('');
  const add = () => { const n = draft.trim(); if (!n) return; update({ services: [...pkg.services, { name: n, description: '' }] }); setDraft(''); };
  const remove = (i: number) => update({ services: pkg.services.filter((_: any, idx: number) => idx !== i) });
  return (
    <>
      <Bot theme={theme}>These are the services I found. Add or remove any so the receptionist talks about the right ones.</Bot>
      <Card theme={theme}>
        <div className="flex flex-wrap gap-2">
          {pkg.services.map((s: any, i: number) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5 text-[13px]" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }}>
              {s.name}
              <button onClick={() => remove(i)} aria-label="Remove" className="rounded-full p-0.5 hover:opacity-70" style={{ color: theme.textMuted }}><X className="h-3 w-3" /></button>
            </span>
          ))}
          {pkg.services.length === 0 && <span className="text-[13px]" style={{ color: theme.textMuted }}>No services yet, add a few below.</span>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="Add a service" className="flex-1 rounded-xl px-3 py-2.5 text-[14px] focus:outline-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
          <button onClick={add} className="h-10 w-10 rounded-xl inline-flex items-center justify-center" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex justify-between">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Knowledge
function KnowledgeStep({ pkg, theme, update, onNext, onBack }: any) {
  const removeFaq = (i: number) => update({ faqs: pkg.faqs.filter((_: any, idx: number) => idx !== i) });
  return (
    <>
      <Bot theme={theme}>
        {pkg.read_website ? 'I pulled these from your site. ' : ''}Anything else the receptionist should know? Parking, insurance, what you do not handle, whatever matters.
      </Bot>
      <Card theme={theme}>
        {pkg.faqs.length > 0 && (
          <div className="space-y-2 mb-3">
            {pkg.faqs.map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: theme.text }}>{f.q}</p>
                  {f.a && <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>{f.a}</p>}
                </div>
                <button onClick={() => removeFaq(i)} aria-label="Remove" className="p-0.5 hover:opacity-70" style={{ color: theme.textMuted }}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <textarea value={pkg.additional_info} onChange={(e) => update({ additional_info: e.target.value })} rows={4}
          placeholder="e.g. We offer free estimates, we do not service apartments, parking is behind the building."
          className="w-full rounded-xl px-3 py-2.5 text-[14px] focus:outline-none resize-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
        <div className="mt-4 flex justify-between">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Voice
function VoiceStep({ pkg, theme, api, update, onNext, onBack }: any) {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${api}/api/voices`);
        const j = await res.json().catch(() => ({}));
        const list = Array.isArray(j.voices) ? j.voices : [];
        if (alive) setVoices(list);
      } catch { /* ignore */ } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; if (audioRef.current) { audioRef.current.pause(); } };
  }, [api]);

  const preview = async (v: any) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (playing === v.id) { setPlaying(null); return; }
      setPlaying(v.id);
      const text = pkg.greeting || `Thanks for calling ${pkg.business_name || 'the office'}, how can I help you today?`;
      const res = await fetch(`/api/voice-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice_id: v.id, text }) });
      if (!res.ok) { setPlaying(null); return; }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setPlaying(null);
      audio.play().catch(() => setPlaying(null));
    } catch { setPlaying(null); }
  };

  const shown = showAll ? voices : voices.slice(0, 6);
  return (
    <>
      <Bot theme={theme}>Pick a voice. Tap play to hear it say your greeting.</Bot>
      <Card theme={theme}>
        {loading ? (
          <div className="flex items-center gap-2 text-[13px] py-3" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading voices</div>
        ) : (
          <div className="space-y-2">
            {shown.map((v: any) => {
              const selected = pkg.voice_id === v.id;
              return (
                <div key={v.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
                  style={{ backgroundColor: selected ? theme.primary15 : theme.hover, border: `1px solid ${selected ? theme.primary + '55' : theme.border}` }}
                  onClick={() => update({ voice_id: v.id, voice_name: v.name })}>
                  <button onClick={(e) => { e.stopPropagation(); preview(v); }} className="h-8 w-8 rounded-full flex-shrink-0 inline-flex items-center justify-center" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                    {playing === v.id ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium flex items-center gap-1.5" style={{ color: theme.text }}>
                      {v.name}
                      {v.accent && <span className="text-[11px] font-normal" style={{ color: theme.textMuted }}>· {v.accent}</span>}
                    </p>
                    {v.description && <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{v.description}</p>}
                  </div>
                  {selected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />}
                </div>
              );
            })}
            {!showAll && voices.length > 6 && (
              <button onClick={() => setShowAll(true)} className="text-[13px] font-medium" style={{ color: theme.primary }}>Show all {voices.length} voices</button>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-between">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Greeting
function GreetingStep({ pkg, theme, api, agencyId, update, onNext, onBack }: any) {
  const [loading, setLoading] = useState(false);
  const token = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };

  // Auto-suggest a greeting once, when empty.
  useEffect(() => {
    if (pkg.greeting) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/suggest-greeting`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ business_name: pkg.business_name, industry: pkg.industry?.value, sub_vertical: pkg.sub_vertical }),
        });
        const j = await res.json().catch(() => ({}));
        if (alive && j.greeting) update({ greeting: j.greeting });
      } catch { /* ignore */ } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Bot theme={theme}>Here’s a greeting to open with. Tweak it to sound like you.</Bot>
      <Card theme={theme}>
        {loading && !pkg.greeting ? (
          <div className="flex items-center gap-2 text-[13px] py-3" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Drafting a greeting</div>
        ) : (
          <textarea value={pkg.greeting} onChange={(e) => update({ greeting: e.target.value })} rows={3}
            placeholder="Thanks for calling, how can I help you today?"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] focus:outline-none resize-none" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.text }} />
        )}
        <div className="mt-4 flex justify-between">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onNext}>Continue</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// Review
function ReviewStep({ pkg, theme, onGoLive, onBack, error }: any) {
  return (
    <>
      <Bot theme={theme}>Everything’s set. Going live builds the receptionist and assigns it a phone number so you can call it.</Bot>
      <Card theme={theme}>
        <p className="text-[14px]" style={{ color: theme.text }}>
          A <span style={{ fontWeight: 600 }}>{pkg.industry?.label || (pkg.sub_vertical ? 'custom ' + pkg.sub_vertical : 'custom')}</span> receptionist for <span style={{ fontWeight: 600 }}>{pkg.business_name || 'your business'}</span>
          {pkg.city ? `, ${pkg.city}` : ''}.
        </p>
        <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>
          {pkg.services.length} service{pkg.services.length === 1 ? '' : 's'}, {pkg.faqs.length} FAQ{pkg.faqs.length === 1 ? '' : 's'}, {pkg.voice_name || 'default'} voice. A number is assigned now, at go-live.
        </p>
        {error && <div className="mt-3 text-[13px] rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
        <div className="mt-4 flex justify-between items-center">
          <GhostBtn theme={theme} onClick={onBack}>Back</GhostBtn>
          <PrimaryBtn theme={theme} onClick={onGoLive} icon={Phone}>Go live</PrimaryBtn>
        </div>
      </Card>
    </>
  );
}

// ── Live package panel ───────────────────────────────────────────────────────
function PackagePanel({ pkg, theme, onEdit }: any) {
  const openDays = DAYS.filter((d) => pkg.hours[d.key] && !pkg.hours[d.key].closed);
  const hoursSummary = openDays.length === 0 ? 'Closed' : (openDays.length === 7 ? 'Every day' : openDays.map((d) => d.label).join(', '));
  const Row = ({ i, icon: Icon, label, value }: any) => (
    <button onClick={() => onEdit(i)} className="w-full text-left flex items-start gap-3 py-2.5 group">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: theme.textMuted }}>{label}</p>
        <p className="text-[13px] truncate" style={{ color: theme.text }}>{value}</p>
      </div>
      <Pencil className="h-3 w-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.textMuted }} />
    </button>
  );
  return (
    <div className="rounded-2xl p-4 lg:sticky lg:top-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Your receptionist</p>
      <p className="text-[16px] font-semibold" style={{ color: theme.text }}>{pkg.business_name || 'New receptionist'}</p>
      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px]" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
        {pkg.industry?.label || (pkg.sub_vertical ? `Custom: ${pkg.sub_vertical}` : 'Custom')}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
        <Phone className="h-4 w-4" style={{ color: theme.textMuted }} />
        <span className="text-[12px]" style={{ color: theme.textMuted }}>Number assigned when you go live</span>
      </div>
      <div className="mt-2 divide-y" style={{ borderColor: theme.border }}>
        <Row i={1} icon={Clock} label="Hours" value={hoursSummary} />
        <Row i={2} icon={Briefcase} label="Services" value={pkg.services.length ? `${pkg.services.length} added` : 'None yet'} />
        <Row i={3} icon={BookOpen} label="Knowledge" value={`${pkg.read_website ? 'Website' : 'No site'}${pkg.faqs.length ? `, ${pkg.faqs.length} FAQs` : ''}`} />
        <Row i={4} icon={Mic} label="Voice" value={pkg.voice_name || 'Default'} />
        <Row i={5} icon={MessageSquare} label="Greeting" value={pkg.greeting ? pkg.greeting : 'Default'} />
      </div>
    </div>
  );
}
