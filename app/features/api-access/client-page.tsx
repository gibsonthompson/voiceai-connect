'use client';
import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Menu, X, Code, Webhook, Zap, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

function WaveformIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" /><rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" /><rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" /><rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /></svg>);
}

export default function ApiAccessFeaturePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden"><div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[128px]" /></div>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-16 sm:h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5"><div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-base sm:text-lg font-semibold">VoiceAI Connect</span></Link>
          <div className="hidden lg:flex items-center gap-1">{[{ name: 'Platform', href: '/platform' }, { name: 'Features', href: '/features' }, { name: 'Pricing', href: '/pricing' }].map((item) => (<Link key={item.name} href={item.href} className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9]">{item.name}</Link>))}</div>
          <div className="hidden lg:flex items-center gap-3"><Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505]">Start Free Trial <ArrowRight className="h-4 w-4" /></Link></div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div></div>
      </nav>

      <div className="pt-24 sm:pt-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><ChevronRight className="h-4 w-4" /><span className="text-[#fafaf9]/60">API & Webhooks</span></div></div></div>

      <section className="relative pt-8 sm:pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-6"><Code className="h-4 w-4 text-amber-400" /><span className="text-amber-300/90">Scale Plan</span></div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">Full API access.<span className="block mt-2 text-[#fafaf9]/40">Build custom integrations.</span></h1>
              <p className="mt-6 text-lg sm:text-xl text-[#fafaf9]/60">RESTful API and real-time webhooks let you integrate with any CRM, build custom dashboards, or automate workflows based on call events.</p>
              <div className="mt-8 space-y-3">
                {['Full REST API access', 'Real-time webhooks', 'CRM integrations', 'Custom automation'].map((item) => (<div key={item} className="flex items-center gap-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-400" /></div><span className="text-[#fafaf9]/70">{item}</span></div>))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4 text-[#fafaf9]/40"><Code className="h-4 w-4" /><span>api.voiceai-connect.com</span></div>
                <div className="space-y-2 text-xs">
                  <p className="text-emerald-400">// Get all calls for a client</p>
                  <p><span className="text-amber-400">GET</span> /v1/clients/:id/calls</p>
                  <p className="text-emerald-400 mt-4">// Create new client</p>
                  <p><span className="text-emerald-400">POST</span> /v1/clients</p>
                  <p className="text-emerald-400 mt-4">// Webhook: New call completed</p>
                  <p><span className="text-blue-400">POST</span> yourapp.com/webhooks</p>
                  <div className="mt-4 p-3 rounded bg-white/[0.03] text-[#fafaf9]/60">
                    {`{`}<br/>
                    &nbsp;&nbsp;&quot;event&quot;: &quot;call.completed&quot;,<br/>
                    &nbsp;&nbsp;&quot;caller&quot;: &quot;+15551234567&quot;,<br/>
                    &nbsp;&nbsp;&quot;summary&quot;: &quot;...&quot;<br/>
                    {`}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center mb-12">API capabilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Code, title: 'REST API', desc: 'Full CRUD operations for clients, calls, and settings.' },
              { icon: Webhook, title: 'Webhooks', desc: 'Real-time events for calls, voicemails, and more.' },
              { icon: Lock, title: 'Secure Auth', desc: 'API keys with granular permissions.' },
              { icon: Zap, title: 'Rate Limits', desc: '1000 requests/min for high-volume operations.' },
            ].map((item) => (<div key={item.title} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center"><div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-amber-500/10 mb-4"><item.icon className="h-5 w-5 text-amber-400" /></div><h3 className="font-semibold mb-2">{item.title}</h3><p className="text-sm text-[#fafaf9]/50">{item.desc}</p></div>))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Related features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[{ title: 'Stripe Connect', desc: 'Automated billing integration', href: '/features/stripe-connect' },{ title: 'Auto Provisioning', desc: '60-second client setup', href: '/features/auto-provisioning' },{ title: 'Analytics', desc: 'Call data and insights', href: '/features/analytics' }].map((item) => (<Link key={item.title} href={item.href} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 transition-colors group"><h3 className="font-medium group-hover:text-emerald-400">{item.title}</h3><p className="text-sm text-[#fafaf9]/50 mt-1">{item.desc}</p></Link>))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-semibold">Build anything you can imagine</h2>
          <p className="mt-4 text-[#fafaf9]/50">Full API access included in Scale plan.</p>
          <div className="mt-8"><Link href="/signup" className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-medium text-[#050505]">Start Your Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12"><div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-8"><Link href="/" className="flex items-center gap-2.5"><div className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5" /></div><span className="font-semibold">VoiceAI Connect</span></Link><div className="flex gap-8 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><Link href="/platform" className="hover:text-[#fafaf9]">Platform</Link><Link href="/pricing" className="hover:text-[#fafaf9]">Pricing</Link></div><p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect</p></div></footer>
    </div>
  );
}