'use client';

import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Menu, X, Globe, Stethoscope, Scale, Wrench, Scissors, Car, Building2, UtensilsCrossed, Home, Briefcase, Heart, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

function WaveformIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" /><rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" /><rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" /><rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /></svg>);
}

export default function IndustriesFeaturePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);

  const industries = [
    { icon: Stethoscope, name: 'Healthcare', examples: 'Medical offices, dental, chiropractic, therapy', features: 'HIPAA compliance, appointment booking, insurance questions' },
    { icon: Scale, name: 'Legal', examples: 'Law firms, attorneys, legal services', features: 'Intake screening, consultation scheduling, confidentiality' },
    { icon: Wrench, name: 'Home Services', examples: 'Plumbing, HVAC, electrical, roofing', features: 'Emergency dispatch, service scheduling, estimates' },
    { icon: Scissors, name: 'Beauty & Wellness', examples: 'Salons, spas, barbershops, med spas', features: 'Appointment booking, service menus, stylist requests' },
    { icon: Car, name: 'Automotive', examples: 'Auto repair, dealerships, body shops', features: 'Service scheduling, parts inquiries, estimates' },
    { icon: Building2, name: 'Real Estate', examples: 'Agents, property management, brokerages', features: 'Showing scheduling, listing inquiries, lead capture' },
    { icon: UtensilsCrossed, name: 'Restaurants', examples: 'Restaurants, catering, food service', features: 'Reservations, hours, menu questions, takeout' },
    { icon: Home, name: 'Property Services', examples: 'Cleaning, landscaping, pest control', features: 'Quote requests, scheduling, service areas' },
    { icon: Briefcase, name: 'Professional Services', examples: 'Accounting, consulting, insurance', features: 'Appointment scheduling, service inquiries' },
    { icon: Heart, name: 'Veterinary', examples: 'Vet clinics, pet services, animal hospitals', features: 'Appointment booking, emergency triage' },
    { icon: GraduationCap, name: 'Education', examples: 'Tutoring, music lessons, training centers', features: 'Class scheduling, program information' },
    { icon: Building2, name: 'General Business', examples: 'Any local business', features: 'Customizable for any industry' },
  ];

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

      <div className="pt-24 sm:pt-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><ChevronRight className="h-4 w-4" /><span className="text-[#fafaf9]/60">Industries</span></div></div></div>

      <section className="relative pt-8 sm:pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6"><Globe className="h-4 w-4 text-emerald-400" /><span className="text-emerald-300/90">All Plans</span></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">Pre-trained for 12+ industries.<span className="block mt-2 text-[#fafaf9]/40">Ready on day one.</span></h1>
            <p className="mt-6 text-lg sm:text-xl text-[#fafaf9]/60 leading-relaxed">Each industry template includes domain-specific knowledge, common FAQs, and appropriate handling procedures. The AI knows the difference between a plumbing emergency and a routine dental checkup.</p>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center mb-12">Supported industries</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <div key={industry.name} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><industry.icon className="h-5 w-5 text-emerald-400" /></div>
                  <h3 className="font-semibold">{industry.name}</h3>
                </div>
                <p className="text-sm text-[#fafaf9]/50 mb-3">{industry.examples}</p>
                <p className="text-xs text-emerald-400/80">{industry.features}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Why industry training matters</h2>
              <div className="space-y-4">
                {[
                  { title: 'Correct terminology', desc: 'AI uses industry-specific language naturally.' },
                  { title: 'Proper procedures', desc: 'Knows when to book vs. when to escalate.' },
                  { title: 'Realistic expectations', desc: 'Sets appropriate wait times and pricing ranges.' },
                  { title: 'Compliance awareness', desc: 'Understands HIPAA, attorney-client privilege, etc.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3"><Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" /><div><h3 className="font-medium">{item.title}</h3><p className="text-sm text-[#fafaf9]/50">{item.desc}</p></div></div>
                ))}
              </div>
            </div>
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <h3 className="font-semibold mb-4 text-center">Easy to customize</h3>
              <p className="text-sm text-[#fafaf9]/50 text-center mb-6">Start with an industry template, then customize with the business&apos;s specific details using the knowledge base feature.</p>
              <Link href="/features/knowledge-base" className="block w-full py-3 text-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors">Learn about Knowledge Base →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Related features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'AI Intelligence', desc: 'GPT-4 powered conversations', href: '/features/ai-intelligence' },
              { title: 'Knowledge Base', desc: 'AI learns from their website', href: '/features/knowledge-base' },
              { title: 'Voice Options', desc: '16+ premium voices', href: '/features/voice-options' },
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
          <h2 className="text-2xl font-semibold">AI that speaks your clients&apos; language</h2>
          <p className="mt-4 text-[#fafaf9]/50">All industry templates included in every plan.</p>
          <div className="mt-8"><Link href="/signup" className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-medium text-[#050505]">Start Your Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12"><div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-8"><Link href="/" className="flex items-center gap-2.5"><div className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5" /></div><span className="font-semibold">VoiceAI Connect</span></Link><div className="flex gap-8 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><Link href="/platform" className="hover:text-[#fafaf9]">Platform</Link><Link href="/pricing" className="hover:text-[#fafaf9]">Pricing</Link></div><p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect</p></div></footer>
    </div>
  );
}