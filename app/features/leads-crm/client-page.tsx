'use client';

import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Menu, X, Target, Mail, MessageSquare, Clock, Users, Zap, FileText, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

function WaveformIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" /><rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" /><rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" /><rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" /></svg>);
}

export default function LeadsCRMFeaturePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);

  const templates = [
    { name: 'Initial Outreach', type: 'email', desc: 'First contact with new leads' },
    { name: 'Follow-up #1', type: 'email', desc: '3 days after initial contact' },
    { name: 'Follow-up #2', type: 'email', desc: '7 days, more urgency' },
    { name: 'Break-up Email', type: 'email', desc: '14 days, final attempt' },
    { name: 'SMS - Quick Intro', type: 'sms', desc: 'Short text introduction' },
    { name: 'SMS - After Voicemail', type: 'sms', desc: 'Follow up after call' },
  ];

  const variables = [
    { var: '{lead_business_name}', example: 'Smith Plumbing Co' },
    { var: '{lead_contact_first_name}', example: 'John' },
    { var: '{lead_industry}', example: 'Plumbing' },
    { var: '{agency_name}', example: 'Your Agency' },
    { var: '{signup_link}', example: 'youragency.com/signup' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
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

      <div className="pt-24 sm:pt-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><ChevronRight className="h-4 w-4" /><span className="text-[#fafaf9]/60">Leads CRM</span></div></div></div>

      <section className="relative pt-8 sm:pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6"><Target className="h-4 w-4 text-emerald-400" /><span className="text-emerald-300/90">All Plans</span></div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">Built-in leads CRM.<span className="block mt-2 text-[#fafaf9]/40">Find and close more clients.</span></h1>
              <p className="mt-6 text-lg sm:text-xl text-[#fafaf9]/60 leading-relaxed">Track prospects, send personalized outreach with pre-built templates, and follow up until they convert. Everything you need to grow your agency.</p>
              <div className="mt-8 space-y-3">
                {['Lead pipeline with status tracking', 'Pre-built email & SMS templates', 'Smart variables auto-fill', 'Activity log for every interaction', 'Follow-up sequence reminders'].map((item) => (<div key={item} className="flex items-center gap-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-400" /></div><span className="text-[#fafaf9]/70">{item}</span></div>))}
              </div>
            </div>
            
            {/* Lead Pipeline Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Lead Pipeline</h3>
                  <span className="text-xs text-emerald-400">124 total leads</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: 'New', count: 23, color: 'bg-blue-500' },
                    { label: 'Contacted', count: 41, color: 'bg-amber-500' },
                    { label: 'Hot', count: 18, color: 'bg-red-500' },
                    { label: 'Converted', count: 42, color: 'bg-emerald-500' },
                  ].map((stage) => (
                    <div key={stage.label} className="text-center">
                      <div className={`h-2 rounded-full ${stage.color} mb-2`} style={{ opacity: 0.6 }} />
                      <p className="text-lg font-semibold">{stage.count}</p>
                      <p className="text-[10px] text-[#fafaf9]/40">{stage.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Ace Plumbing', contact: 'Tom Wilson', status: 'hot', time: '2h ago' },
                    { name: 'Elite HVAC', contact: 'Maria Santos', status: 'contacted', time: '1d ago' },
                    { name: 'Peak Roofing', contact: 'James Lee', status: 'new', time: 'Just now' },
                  ].map((lead) => (
                    <div key={lead.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <span className="text-xs text-blue-400">{lead.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-[#fafaf9]/40">{lead.contact}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          lead.status === 'hot' ? 'bg-red-500/10 text-red-400' :
                          lead.status === 'contacted' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>{lead.status}</span>
                        <p className="text-[10px] text-[#fafaf9]/30 mt-1">{lead.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold">Pre-built outreach templates</h2>
            <p className="mt-3 text-[#fafaf9]/50">Proven email and SMS templates ready to send. Just click and customize.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.name} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${template.type === 'email' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                    {template.type === 'email' ? <Mail className="h-4 w-4 text-blue-400" /> : <MessageSquare className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <span className="text-[10px] text-[#fafaf9]/40 uppercase">{template.type}</span>
                  </div>
                </div>
                <p className="text-sm text-[#fafaf9]/50">{template.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#fafaf9]/40 mt-6">+ 10 more templates included • Create unlimited custom templates</p>
        </div>
      </section>

      {/* Variables Section */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Smart variables, zero typing</h2>
              <p className="text-[#fafaf9]/50 mb-6">Variables auto-fill with lead and agency info. Send personalized messages to hundreds of prospects in minutes.</p>
              <div className="space-y-3">
                {variables.map((v) => (
                  <div key={v.var} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <code className="text-sm text-emerald-400 font-mono">{v.var}</code>
                    <span className="text-sm text-[#fafaf9]/50">→ {v.example}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Template Preview */}
            <div className="relative">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Template Preview</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-[#fafaf9]/40 text-xs mb-1">Subject</p>
                    <p>Quick question about <span className="text-emerald-400">{'{lead_business_name}'}</span>&apos;s phone system</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-[#fafaf9]/40 text-xs mb-1">Body</p>
                    <p className="text-[#fafaf9]/70 leading-relaxed">
                      Hi <span className="text-emerald-400">{'{lead_contact_first_name}'}</span>,<br /><br />
                      I came across <span className="text-emerald-400">{'{lead_business_name}'}</span> while researching <span className="text-emerald-400">{'{lead_industry}'}</span> businesses in the area.<br /><br />
                      I help companies like yours never miss a call with AI-powered receptionists...<br /><br />
                      Best,<br />
                      <span className="text-emerald-400">{'{agency_owner_name}'}</span><br />
                      <span className="text-emerald-400">{'{agency_name}'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 rounded-lg bg-emerald-500 text-[#050505] text-sm font-medium">Copy to Clipboard</button>
                  <button className="px-4 py-2 rounded-lg border border-white/10 text-sm">Edit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Log Section */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Activity Timeline */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium">Activity Timeline</span>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Mail, action: 'Email sent', detail: '"Quick question about your phone system"', time: 'Today, 2:34 PM', color: 'text-blue-400 bg-blue-500/10' },
                    { icon: FileText, action: 'Note added', detail: '"Spoke briefly, interested but busy this week..."', time: 'Today, 10:15 AM', color: 'text-amber-400 bg-amber-500/10' },
                    { icon: Zap, action: 'Status changed', detail: 'New → Contacted', time: 'Yesterday, 4:22 PM', color: 'text-emerald-400 bg-emerald-500/10' },
                    { icon: Target, action: 'Lead created', detail: 'Source: Cold Outreach', time: 'Jan 24, 9:00 AM', color: 'text-purple-400 bg-purple-500/10' },
                  ].map((activity, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color.split(' ')[1]}`}>
                        <activity.icon className={`h-4 w-4 ${activity.color.split(' ')[0]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-[#fafaf9]/40 truncate">{activity.detail}</p>
                        <p className="text-[10px] text-[#fafaf9]/30 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Never lose context</h2>
              <p className="text-[#fafaf9]/50 mb-6">Every email, note, status change, and interaction is automatically logged. Pick up any conversation exactly where you left off.</p>
              <div className="space-y-3">
                {['Automatic activity tracking', 'Add notes to any lead', 'See full conversation history', 'Track follow-up reminders'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-[#fafaf9]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Follow-up Sequences */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold">Follow-up sequences that convert</h2>
            <p className="mt-3 text-[#fafaf9]/50">Pre-built 4-step sequence turns cold leads into paying clients.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/[0.06]" />
              
              <div className="space-y-6">
                {[
                  { day: 'Day 0', name: 'Initial Outreach', desc: 'Introduce yourself and your AI receptionist service', status: 'sent' },
                  { day: 'Day 3', name: 'Follow-up #1', desc: 'Gentle reminder with a new angle or benefit', status: 'ready' },
                  { day: 'Day 7', name: 'Follow-up #2', desc: 'Add urgency, share a quick case study', status: 'queued' },
                  { day: 'Day 14', name: 'Break-up Email', desc: 'Final attempt - creates urgency to respond', status: 'queued' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'sent' ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                      step.status === 'ready' ? 'bg-amber-500/20 border-2 border-amber-500' :
                      'bg-white/[0.05] border-2 border-white/[0.1]'
                    }`}>
                      {step.status === 'sent' ? (
                        <Check className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-[#fafaf9]/40" />
                      )}
                    </div>
                    <div className="flex-1 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs text-[#fafaf9]/40">{step.day}</span>
                          <h3 className="font-medium">{step.name}</h3>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          step.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' :
                          step.status === 'ready' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-white/[0.05] text-[#fafaf9]/40'
                        }`}>{step.status === 'sent' ? '✓ Sent' : step.status === 'ready' ? 'Send Now' : 'Queued'}</span>
                      </div>
                      <p className="text-sm text-[#fafaf9]/50">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8">Related features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[{ title: 'Client CRM', desc: 'Manage paying clients', href: '/features/client-crm' },{ title: 'Analytics', desc: 'Track performance metrics', href: '/features/analytics' },{ title: 'Marketing Website', desc: 'Convert leads automatically', href: '/features/marketing-site' }].map((item) => (<Link key={item.title} href={item.href} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 transition-colors group"><h3 className="font-medium group-hover:text-emerald-400">{item.title}</h3><p className="text-sm text-[#fafaf9]/50 mt-1">{item.desc}</p></Link>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-semibold">Start closing more deals</h2>
          <p className="mt-4 text-[#fafaf9]/50">Leads CRM included in all plans. No extra cost.</p>
          <div className="mt-8"><Link href="/signup" className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-medium text-[#050505]">Start Your Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12"><div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-8"><Link href="/" className="flex items-center gap-2.5"><div className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5" /></div><span className="font-semibold">VoiceAI Connect</span></Link><div className="flex gap-8 text-sm text-[#fafaf9]/40"><Link href="/features" className="hover:text-[#fafaf9]">Features</Link><Link href="/platform" className="hover:text-[#fafaf9]">Platform</Link><Link href="/pricing" className="hover:text-[#fafaf9]">Pricing</Link></div><p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect</p></div></footer>
    </div>
  );
}