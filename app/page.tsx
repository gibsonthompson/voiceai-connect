'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown, Check, X as XIcon, ChevronRight, Phone, Menu, X } from 'lucide-react';
import { usePrice } from '@/hooks/usePrice';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

function useCounter(end: number) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / 2000, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return { val, ref };
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { formatPrice } = usePrice();
  const c1 = useCounter(60);
  const c2 = useCounter(97);
  const c3 = useCounter(24);
  const r1 = useReveal(); const r2 = useReveal(); const r3 = useReveal();
  const r4 = useReveal(); const r5 = useReveal(); const r6 = useReveal();
  const r7 = useReveal();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const tabs = [
    { label: 'Agency Dashboard', title: 'YOUR COMMAND CENTER', desc: 'See every client, every call, every dollar — from your phone or desktop. Add clients, manage billing, customize branding, track revenue.', mockup: 'agency' },
    { label: 'Client Dashboard', title: 'WHAT YOUR CLIENTS SEE', desc: 'Each client gets their own branded dashboard with call recordings, transcripts, AI summaries, and SMS notifications. Your brand, not ours.', mockup: 'client' },
    { label: 'Marketing Site', title: 'YOUR BRANDED WEBSITE', desc: 'Professional and Enterprise plans include a complete marketing website with your logo, colors, domain, and an interactive AI demo phone line.', mockup: 'marketing' },
    { label: 'Leads CRM', title: 'FIND AND CLOSE CLIENTS', desc: '13+ outreach templates, Google Maps lead finder, follow-up tracking, and smart variable auto-fill. Everything to fill your pipeline.', mockup: 'crm' },
  ];

  const renderMockup = (type: string) => {
    const frame = 'rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-2xl shadow-black/10';
    const bar = (url: string) => (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/60" /><div className="w-3 h-3 rounded-full bg-yellow-400/60" /><div className="w-3 h-3 rounded-full bg-green-400/60" /></div>
        <div className="flex-1 text-center"><span className="inline-block px-5 py-1 rounded-md bg-gray-100 text-[10px] text-gray-400 font-mono">{url}</span></div>
      </div>
    );

    if (type === 'agency') return (
      <div className={frame}>
        {bar('app.smartcallsolutions.com/agency')}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" /><span className="text-sm font-semibold text-gray-800">SmartCall Solutions</span></div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium">● Live</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['Active Clients','23'],['Monthly Revenue','$3,427'],['Calls Today','47']].map(([l,v])=>(
              <div key={l} className="p-3 rounded-xl bg-gray-50 border border-gray-100"><p className="text-[10px] text-gray-400 uppercase tracking-wider">{l}</p><p className="text-lg font-bold text-gray-800 mt-0.5">{v}</p></div>
            ))}
          </div>
          <div className="space-y-2">
            {[['Dr. Sarah Chen — Dental','12 calls','bg-emerald-400'],['Mike\'s Plumbing','8 calls','bg-blue-400'],['Atlas Law Group','5 calls','bg-purple-400']].map(([n,c,col])=>(
              <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-2.5"><div className={`w-2 h-2 rounded-full ${col}`}/><span className="text-xs text-gray-700 font-medium">{n}</span></div>
                <span className="text-[11px] text-gray-400">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (type === 'client') return (
      <div className={frame}>
        {bar('app.smartcallsolutions.com/dashboard')}
        <div className="p-5 space-y-4">
          <div><p className="text-xs text-gray-400">Recent Calls</p><p className="text-sm font-semibold text-gray-800 mt-1">Mike&apos;s Plumbing — AI Receptionist</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2"><Phone className="w-3.5 h-3.5 text-blue-500" /><span className="text-[11px] font-medium text-blue-700">Call from (404) 555-0189</span><span className="text-[10px] text-blue-400 ml-auto">2 min ago</span></div>
            <p className="text-xs text-gray-600 leading-relaxed">&quot;Hi, I have a leaking pipe under my kitchen sink. Can someone come out today?&quot;</p>
            <div className="flex gap-2 mt-3"><span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium">Urgent</span><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-medium">Leak Repair</span></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 py-2 rounded-lg bg-gray-100 text-center text-[11px] text-gray-500 font-medium">▶ Play Recording</div>
            <div className="flex-1 py-2 rounded-lg bg-gray-100 text-center text-[11px] text-gray-500 font-medium">📄 Transcript</div>
          </div>
        </div>
      </div>
    );

    if (type === 'marketing') return (
      <div className={frame}>
        {bar('smartcallsolutions.com')}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><span className="text-white text-xs font-bold">SC</span></div><span className="font-semibold text-gray-800">SmartCall Solutions</span></div>
          <div><p className="text-xl font-bold text-gray-900">Never Miss Another Call</p><p className="text-xs text-gray-500 mt-1">AI-powered receptionist for your business</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 space-y-2">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500" /><span className="text-xs font-semibold text-blue-700">Try Our AI Demo</span></div>
            <p className="text-lg font-mono font-bold text-gray-900">(555) 123-DEMO</p>
            <p className="text-[10px] text-gray-500">Call now — tell the AI about your business</p>
          </div>
        </div>
      </div>
    );

    return (
      <div className={frame}>
        {bar('app.smartcallsolutions.com/leads')}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold text-gray-800">Lead Pipeline</span><span className="text-[10px] text-gray-400">14 prospects</span></div>
          {[['Ace Plumbing','Outreach 1 sent','bg-yellow-400'],['Bright Dental','Demo scheduled','bg-blue-400'],['Carter Law','Follow-up #2','bg-orange-400'],['Delta HVAC','Ready to close','bg-green-400']].map(([n,s,c])=>(
            <div key={n} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
              <div className={`w-2.5 h-2.5 rounded-full ${c}`}/><div className="flex-1"><p className="text-xs font-medium text-gray-700">{n}</p><p className="text-[10px] text-gray-400">{s}</p></div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300"/>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled?'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06]':''}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12"><div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5"><img src="/icon-512x512.png" alt="" className="h-9 w-9 rounded-xl" /><span className="text-lg font-semibold text-white" style={{fontFamily:'var(--font-sora)'}}>VoiceAI Connect</span></Link>
          <div className="hidden lg:flex items-center gap-8">{['Platform','Pricing','Blog'].map(n=><Link key={n} href={n==='Pricing'?'#pricing':`/${n.toLowerCase()}`} className="text-sm text-white/50 hover:text-white transition-colors">{n}</Link>)}</div>
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/agency/login" className="text-sm text-white/50 hover:text-white">Log in</Link>
            <Link href="/signup" className="btn-pill-secondary text-xs py-2.5 px-5">SIGN UP</Link>
          </div>
          <button onClick={()=>setMenuOpen(!menuOpen)} className="lg:hidden text-white/60"><Menu className="w-6 h-6"/></button>
        </div></div>
        {menuOpen&&<div className="lg:hidden fixed inset-0 bg-black z-50 flex flex-col"><div className="flex items-center justify-between px-6 h-20"><span className="text-lg font-semibold text-white" style={{fontFamily:'var(--font-sora)'}}>VoiceAI Connect</span><button onClick={()=>setMenuOpen(false)} className="text-white"><X className="w-6 h-6"/></button></div><div className="flex-1 flex flex-col justify-center px-8 gap-6">{['Platform','Pricing','Blog','Log in'].map(n=><Link key={n} href={`/${n.toLowerCase()}`} onClick={()=>setMenuOpen(false)} className="text-3xl font-semibold text-white/80 hover:text-white">{n}</Link>)}<Link href="/signup" onClick={()=>setMenuOpen(false)} className="btn-pill-primary mt-4 justify-center">START FREE TRIAL</Link></div></div>}
      </nav>

      {/* HERO */}
      <section className="section-dark relative min-h-screen flex items-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <div className="relative z-10">
              <h1 className="display-xl text-white">The platform behind<br/><span className="bg-gradient-to-r from-[#4AEABC] via-[#A78BFA] to-[#F9A8D4] bg-clip-text text-transparent">your AI agency</span></h1>
              <p className="mt-8 text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed">VoiceAI Connect gives you everything to sell AI receptionists to local businesses — white-label branding, automated setup, client dashboards, and a CRM. You sell. We handle the rest.</p>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link href="/signup" className="btn-pill-primary">START FREE TRIAL <ArrowDown className="w-4 h-4"/></Link>
                <Link href="/interactive-demo" className="btn-pill-secondary">WATCH DEMO</Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-end items-center"><div className="hero-visual"><div className="hero-diamond"><div className="hero-layer hero-layer-1"/><div className="hero-layer hero-layer-2"/><div className="hero-layer hero-layer-3"/></div></div></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] py-8">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <p className="label-uppercase text-white/25 mb-5">Built on enterprise infrastructure</p>
            <div className="flex items-center gap-10 sm:gap-16">{['VAPI','Telnyx','Stripe','Supabase','Vercel'].map(n=><span key={n} className="text-base sm:text-lg font-semibold text-white/20 whitespace-nowrap" style={{fontFamily:'var(--font-sora)'}}>{n}</span>)}</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — Stacking */}
      <section className="section-dark py-24 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div ref={r1} className="reveal text-center mb-20">
            <p className="label-uppercase text-[#4AEABC]/80 mb-4">How It Works</p>
            <h2 className="display-lg text-white">Four steps to launch.</h2>
            <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">Setup takes an afternoon. Your first client could come this week.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6 pb-[30vh]">
            {[
              {s:'01',t:'Brand it as yours',d:'Upload your logo, pick colors, set pricing. Every touchpoint shows your brand. VoiceAI Connect is invisible.',g:'from-[#4AEABC]/10',b:'border-[#4AEABC]/15'},
              {s:'02',t:'Connect Stripe',d:'Link your Stripe account. Client payments go directly to you. No middleman, no revenue share, no per-client fees.',g:'from-[#A78BFA]/10',b:'border-[#A78BFA]/15'},
              {s:'03',t:'Share your signup link',d:'Send prospects your branded page. They enter business info, the platform provisions AI + phone number — live in 60 seconds.',g:'from-[#F9A8D4]/10',b:'border-[#F9A8D4]/15'},
              {s:'04',t:'Collect recurring revenue',d:'Payments hit your Stripe monthly. AI answers calls 24/7. Clients see their own dashboard. You add more clients.',g:'from-[#FCD34D]/10',b:'border-[#FCD34D]/15'},
            ].map((c,i)=>(
              <div key={c.s} className="stack-card" style={{top:`${100+i*30}px`,zIndex:10+i}}>
                <div className={`rounded-3xl border ${c.b} bg-gradient-to-br ${c.g} to-transparent p-8 sm:p-12`} style={{backgroundColor:'rgba(12,12,12,0.95)'}}>
                  <div className="flex items-start gap-6 sm:gap-10">
                    <span className="text-6xl sm:text-8xl font-bold text-white/[0.04] leading-none select-none" style={{fontFamily:'var(--font-sora)'}}>{c.s}</span>
                    <div><h3 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{fontFamily:'var(--font-sora)'}}>{c.t}</h3><p className="text-base text-white/50 leading-relaxed max-w-lg">{c.d}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM DEMO — Light */}
      <section className="section-light py-24 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div ref={r2} className="reveal text-center mb-16">
            <p className="label-uppercase text-black/40 mb-4">Platform</p>
            <h2 className="display-lg text-black">See what you get.</h2>
            <p className="mt-4 text-lg text-black/50 max-w-2xl mx-auto">Every tool you need to run an AI receptionist agency — branded as yours, managed from anywhere.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1 mb-12 border-b border-black/10">
            {tabs.map((tab,i)=><button key={tab.label} onClick={()=>setActiveTab(i)} className={`px-5 py-3 text-sm font-medium transition-all relative ${activeTab===i?'text-black':'text-black/40 hover:text-black/60'}`}>{tab.label}{activeTab===i&&<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"/>}</button>)}
          </div>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="label-uppercase text-black/30 mb-3">{tabs[activeTab].title}</p>
              <h3 className="display-md text-black">{tabs[activeTab].label}</h3>
              <p className="mt-4 text-base text-black/55 leading-relaxed max-w-lg">{tabs[activeTab].desc}</p>
              <Link href="/signup" className="btn-pill-primary mt-8">START FREE TRIAL <ArrowDown className="w-4 h-4"/></Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#4AEABC]/10 via-[#A78BFA]/10 to-[#F9A8D4]/10 rounded-3xl blur-2xl opacity-50"/>
              <div className="relative">{renderMockup(tabs[activeTab].mockup)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITION — Light */}
      <section className="section-light py-24 lg:py-40 border-t border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div ref={r3} className="reveal text-center mb-16">
            <p className="label-uppercase text-black/40 mb-4">Competition</p>
            <h2 className="display-lg text-black">Not retrofitted for resale.<br/>Built for it.</h2>
            <p className="mt-4 text-lg text-black/50 max-w-2xl mx-auto">Most platforms bolt on white-labeling as an afterthought. VoiceAI Connect was built for agency-to-client resale from day one.</p>
          </div>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full text-sm"><thead><tr>
              <th className="text-left py-5 pr-6 text-black/40 font-semibold label-uppercase w-[280px]">Feature</th>
              <th className="py-5 px-6 text-center comparison-highlight"><span className="font-bold text-black text-base" style={{fontFamily:'var(--font-sora)'}}>VoiceAI Connect</span></th>
              <th className="py-5 px-6 text-center text-black/50 font-semibold">GoHighLevel</th>
              <th className="py-5 px-6 text-center text-black/50 font-semibold">Autocalls</th>
              <th className="py-5 px-6 text-center text-black/50 font-semibold hidden md:table-cell">echowin</th>
            </tr></thead><tbody>
              {[
                ['Client-facing dashboard for end businesses',true,false,false,false],
                ['60-second automated client onboarding',true,false,false,false],
                ['No A2P registration required per client',true,false,true,true],
                ['Built-in leads CRM with outreach templates',true,false,false,false],
                ['Mobile-first agency management',true,false,true,true],
                ['Interactive AI demo phone line',true,false,false,false],
                ['Flat pricing with no per-client fees',true,false,true,false],
                ['White-label marketing website included',true,false,true,true],
                ['Direct Stripe Connect payments to agency',true,true,false,false],
              ].map(([f,v,g,a,e])=>(
                <tr key={f as string} className="border-t border-black/[0.06]">
                  <td className="py-4 pr-6 text-black/60">{f as string}</td>
                  <td className="py-4 px-6 text-center comparison-highlight">{v?<Check className="w-5 h-5 text-black mx-auto" strokeWidth={2.5}/>:<XIcon className="w-4 h-4 text-black/20 mx-auto"/>}</td>
                  <td className="py-4 px-6 text-center">{g?<Check className="w-5 h-5 text-black/40 mx-auto"/>:<XIcon className="w-4 h-4 text-black/15 mx-auto"/>}</td>
                  <td className="py-4 px-6 text-center">{a?<Check className="w-5 h-5 text-black/40 mx-auto"/>:<XIcon className="w-4 h-4 text-black/15 mx-auto"/>}</td>
                  <td className="py-4 px-6 text-center hidden md:table-cell">{e?<Check className="w-5 h-5 text-black/40 mx-auto"/>:<XIcon className="w-4 h-4 text-black/15 mx-auto"/>}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
      </section>

      {/* STATS + CTA — Dark */}
      <section className="section-dark py-24 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 lg:mb-40">
            <div ref={r4} className="reveal">
              <h2 className="display-lg text-white">This is how you start<br/><span className="bg-gradient-to-r from-[#4AEABC] to-white bg-clip-text text-transparent">an AI business.</span></h2>
              <p className="mt-6 text-lg text-white/45 max-w-lg leading-relaxed">Not a course. Not a community. A platform — with real infrastructure, real clients, and real recurring revenue.</p>
              <div className="flex flex-wrap gap-4 mt-10"><Link href="/signup" className="btn-pill-primary">START FREE TRIAL <ArrowDown className="w-4 h-4"/></Link><Link href="/interactive-demo" className="btn-pill-secondary">WATCH DEMO</Link></div>
            </div>
            <div className="hidden lg:flex justify-end"><div className="hero-visual" style={{width:360,height:360}}><div className="hero-diamond"><div className="hero-layer hero-layer-1"/><div className="hero-layer hero-layer-2"/><div className="hero-layer hero-layer-3"/></div></div></div>
          </div>
          <div ref={r5} className="reveal grid sm:grid-cols-3 gap-8 sm:gap-16 border-t border-white/[0.06] pt-16">
            <div><p className="label-uppercase text-white/30 mb-2">Client Onboarding</p><p className="stat-number text-white"><span ref={c1.ref}>{c1.val}</span>s</p><p className="text-sm text-white/40 mt-2">From signup to live AI receptionist. No coding, no A2P, no waiting.</p></div>
            <div><p className="label-uppercase text-white/30 mb-2">Profit Margin</p><p className="stat-number text-white"><span ref={c2.ref}>{c2.val}</span>%</p><p className="text-sm text-white/40 mt-2">Same platform fee for 10 or 100 clients. Revenue scales, costs don&apos;t.</p></div>
            <div><p className="label-uppercase text-white/30 mb-2">AI Coverage</p><p className="stat-number text-white"><span ref={c3.ref}>{c3.val}</span>/7</p><p className="text-sm text-white/40 mt-2">Every call answered — nights, weekends, holidays.</p></div>
          </div>
        </div>
      </section>

      {/* PRICING — Light */}
      <section id="pricing" className="section-light py-24 lg:py-40 scroll-mt-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div ref={r6} className="reveal text-center mb-16">
            <p className="label-uppercase text-black/40 mb-4">Pricing</p>
            <h2 className="display-lg text-black">Flat fee. No surprises.</h2>
            <p className="mt-4 text-lg text-black/50">Same price whether you have 10 clients or 100.</p>
          </div>
          <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-5">
            {[
              {name:'Starter',price:99,desc:'Test the waters',features:['Up to 25 clients','White-label client dashboard','Leads CRM + email templates','Stripe Connect payments','Email support'],limits:['Subdomain only','No marketing site']},
              {name:'Professional',price:199,desc:'Most agencies start here',pop:true,features:['Up to 100 clients','3 agency + 2 client team members','Full marketing website','Interactive AI demo line','Custom domain','API access','Priority support'],limits:[]},
              {name:'Enterprise',price:499,desc:'Scale without limits',features:['Unlimited clients','10 agency + 5 client team members','Everything in Professional','Dedicated success manager','SLA guarantee','Phone support'],limits:[]},
            ].map(t=>(
              <div key={t.name} className={`rounded-2xl border p-7 sm:p-8 relative ${t.pop?'border-black bg-white shadow-xl lg:scale-105':'border-black/10 bg-white/60'}`}>
                {t.pop&&<div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="rounded-full bg-black text-white px-4 py-1 text-xs font-semibold" style={{fontFamily:'var(--font-sora)'}}>MOST POPULAR</span></div>}
                <p className="text-sm text-black/40">{t.desc}</p>
                <p className="text-xl font-bold text-black mt-1" style={{fontFamily:'var(--font-sora)'}}>{t.name}</p>
                <div className="my-5"><span className="text-4xl font-bold text-black" style={{fontFamily:'var(--font-sora)'}}>{formatPrice(t.price)}</span><span className="text-black/40">/mo</span></div>
                <ul className="space-y-2.5 mb-6">
                  {t.features.map(f=><li key={f} className="flex items-start gap-2.5 text-sm"><Check className="w-4 h-4 text-black shrink-0 mt-0.5" strokeWidth={2.5}/><span className="text-black/65">{f}</span></li>)}
                  {t.limits?.map(l=><li key={l} className="flex items-start gap-2.5 text-sm"><XIcon className="w-4 h-4 text-black/15 shrink-0 mt-0.5"/><span className="text-black/30">{l}</span></li>)}
                </ul>
                <Link href="/signup" className={`block w-full text-center rounded-full py-3.5 text-sm font-semibold transition-all ${t.pop?'bg-black text-white hover:bg-black/80':'border border-black/15 text-black hover:border-black/40'}`}>Start Free Trial</Link>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-black/35">All plans include 14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ — Dark */}
      <section className="section-dark py-24 lg:py-40">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div ref={r7} className="reveal text-center mb-12"><h2 className="display-md text-white">Common Questions</h2></div>
          <div className="space-y-3">
            {[
              {q:"Wait — is this another 'make money with AI' thing?",a:"No courses. No upsells. No guru nonsense. VoiceAI Connect is infrastructure — like Shopify lets you start a store without building e-commerce from scratch. Real platform, real clients, real monthly payments. The math is simple: local businesses need phone coverage, AI does it for a fraction of a human receptionist."},
              {q:"What exactly is VoiceAI Connect?",a:"Think 'Shopify for AI receptionists.' You brand the platform as your company, find local businesses that miss calls, and sell them AI receptionist service at $99-299/month. When they sign up, the platform auto-provisions their AI, phone number, and dashboard. You collect payment. We handle everything else."},
              {q:"Do my clients know about VoiceAI Connect?",a:"No. Your logo, colors, domain. The client dashboard, emails, marketing site, and phone experience all show your brand. VoiceAI Connect is invisible to your clients."},
              {q:"What's the difference vs GoHighLevel?",a:"GHL is a Swiss Army knife — CRMs, funnels, email, SMS. VoiceAI Connect does one thing well: AI receptionist resale. Key differences: clients get their own dashboard (GHL has none), onboarding takes 60 seconds (GHL takes days with A2P), and you run it from your phone (GHL is desktop-first)."},
              {q:"How do I get clients?",a:"13+ outreach templates, sales scripts, built-in leads CRM, Google Maps lead finder. The AI demo phone line is your secret weapon — prospects call, tell the AI about their business, and it becomes their receptionist on the spot."},
              {q:"Do I need technical skills?",a:"No. Upload your logo, pick colors, set prices, share your link. The platform handles AI config, phone provisioning, and everything else automatically."},
              {q:"Can I really charge $99-299/month?",a:"Yes. A missed call costs a business $500+. A human receptionist costs $3,000/month. AI coverage at $149? No-brainer. You're solving a problem that's already costing them money."},
            ].map((item,i)=>(
              <details key={i} className="group rounded-2xl border border-white/[0.06] overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer select-none"><span className="text-base font-medium text-white/90 pr-4">{item.q}</span><ChevronRight className="w-5 h-5 text-white/25 shrink-0 transition-transform duration-200 group-open:rotate-90"/></summary>
                <div className="px-6 pb-6"><p className="text-sm text-white/45 leading-relaxed">{item.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER — Light */}
      <footer className="section-light py-16 border-t border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div><Link href="/" className="flex items-center gap-2 mb-4"><img src="/icon-512x512.png" alt="" className="h-8 w-8 rounded-lg"/><span className="font-bold text-black" style={{fontFamily:'var(--font-sora)'}}>VoiceAI Connect</span></Link><p className="text-xs text-black/40">The white-label platform for AI receptionist agencies.</p></div>
            {[{t:'PRODUCT',l:[['Platform','/platform'],['Pricing','/#pricing'],['Blog','/blog'],['Referral Program','/referral-program']]},{t:'COMPARE',l:[['vs GoHighLevel','/blog/voiceai-connect-vs-gohighlevel'],['vs Autocalls','/blog/voiceai-connect-vs-autocalls'],['vs echowin','/blog/voiceai-connect-vs-echowin']]},{t:'LEGAL',l:[['Terms','/terms'],['Privacy','/privacy'],['Contact','mailto:support@voiceaiconnect.com']]}].map(c=>(
              <div key={c.t}><p className="label-uppercase text-black/30 mb-4">{c.t}</p><div className="space-y-2.5">{c.l.map(([n,h])=><Link key={n} href={h} className="block text-sm text-black/50 hover:text-black transition-colors">{n}</Link>)}</div></div>
            ))}
          </div>
          <div className="pt-8 border-t border-black/[0.06]"><p className="text-xs text-black/25">© 2026 VoiceAI Connect. All rights reserved.</p></div>
        </div>
      </footer>

      {/* Mobile CTA */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled&&!menuOpen?'translate-y-0':'translate-y-full'}`}>
        <div className="bg-black/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pt-3" style={{paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))'}}>
          <Link href="/signup" className="flex items-center justify-center gap-2 w-full bg-white text-black font-semibold rounded-full py-3.5 text-sm" style={{fontFamily:'var(--font-sora)'}}>START FREE TRIAL<ArrowRight className="w-4 h-4"/></Link>
        </div>
      </div>
    </div>
  );
}