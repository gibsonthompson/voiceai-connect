'use client';

import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Menu, X, Sparkles, Clock, AlertTriangle, Phone, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

function WaveformIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" /><rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" /><rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" /><rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /></svg>);
}

export default function AiSummariesFeaturePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden"><div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[128px]" /></div>

      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5"><div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-base sm:text-lg font-semibold">VoiceAI Connect</span></Link>
            <div className="hidden lg:flex items-center gap-1">{[{ name: 'Platform', href: '/platform' }, { name: 'Features', href: '/features' }, { name: 'Pricing', href: '/pricing' }].map((item) => (<Link key={item.name} href={item.href} className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9]">{item.name}</Link>))}</div>
            <div className="hidden lg:flex items-center gap-3"><Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505]">Start Free Trial <ArrowRight className="h-4 w-4" /></Link></div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 sm:pt-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><ChevronRight className="h-4 w-4" /><span className="text-[#fafaf9]/60">AI Summaries</span></div></div></div>

      <section className="relative pt-8 sm:pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-6"><Sparkles className="h-4 w-4 text-amber-400" /><span className="text-amber-300/90">All Plans</span></div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">AI-powered summaries.<span className="block mt-2 text-[#fafaf9]/40">Key details extracted automatically.</span></h1>
              <p className="mt-6 text-lg sm:text-xl text-[#fafaf9]/60 leading-relaxed">Don&apos;t read transcripts. Our AI extracts the important stuff: who called, why, what they need, and what action is required.</p>
              <div className="mt-8 space-y-3">
                {['Auto-generated after every call', 'Extracts caller intent and requests', 'Identifies action items', 'Highlights urgency levels'].map((item) => (
                  <div key={item} className="flex items-center gap-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-400" /></div><span className="text-[#fafaf9]/70">{item}</span></div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="font-medium">AI Summary</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-[#fafaf9]/40 mb-1">Caller</p>
                    <p className="text-sm">Sarah Johnson • (555) 123-4567</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-[#fafaf9]/40 mb-1">Reason for Call</p>
                    <p className="text-sm">Leaky kitchen faucet, dripping for several days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 mb-1">Action Required</p>
                    <p className="text-sm">Schedule service appointment - requested morning slot</p>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm text-emerald-400">Appointment booked: Tomorrow 9-11 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center mb-12">What AI summaries extract</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Phone, title: 'Contact Info', desc: 'Name, phone number, and any details mentioned.' },
              { icon: Clock, title: 'Call Intent', desc: 'Why they called and what they&apos;re looking for.' },
              { icon: AlertTriangle, title: 'Urgency Level', desc: 'Normal, important, or urgent classification.' },
              { icon: Calendar, title: 'Action Items', desc: 'Next steps like callbacks, appointments, quotes.' },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-amber-500/10 mb-4"><item.icon className="h-5 w-5 text-amber-400" /></div>
                <h3 className="font-semibold mb-2">{item.title}</h3><p className="text-sm text-[#fafaf9]/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Related features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Transcripts', desc: 'Full word-for-word transcription', href: '/features/transcripts' },
              { title: 'SMS Summaries', desc: 'Instant text notifications', href: '/features/sms-summaries' },
              { title: 'Urgency Detection', desc: 'Automatic priority classification', href: '/features/urgency-detection' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 transition-colors group">
                <h3 className="font-medium group-hover:text-emerald-400">{item.title}</h3><p className="text-sm text-[#fafaf9]/50 mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-semibold">Skip the transcript. Get the highlights.</h2>
          <p className="mt-4 text-[#fafaf9]/50">AI summaries included in all plans.</p>
          <div className="mt-8"><Link href="/signup" className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-medium text-[#050505]">Start Your Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12"><div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-8"><Link href="/" className="flex items-center gap-2.5"><div className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5" /></div><span className="font-semibold">VoiceAI Connect</span></Link><div className="flex gap-8 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><Link href="/platform" className="hover:text-[#fafaf9]">Platform</Link><Link href="/pricing" className="hover:text-[#fafaf9]">Pricing</Link></div><p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect</p></div></footer>
    </div>
  );
}