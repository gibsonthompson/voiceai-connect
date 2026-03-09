'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Phone, ArrowRight, Check, Play, Users, DollarSign, PhoneCall,
  Settings, Copy, TrendingUp, ChevronRight, Zap, LayoutDashboard,
  Target, Send, BarChart3, Globe, Gift, Bot, AlertCircle, PhoneOff,
  Paintbrush, Cpu, Lock, Eye, LogOut, Mail, FileText, MessageSquare,
  Mic, Star, Clock, Bell, Plus, Search, Filter, Download, ExternalLink,
  CheckCircle, XCircle, Activity, Inbox
} from 'lucide-react';

// ─── Icons ────────────────────────────────────────────────────────────────────

function WaveformIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color || 'currentColor'} />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color || 'currentColor'} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color || 'currentColor'} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
    </svg>
  );
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const AGENCY = {
  name: 'Your Agency',
  plan: 'Professional',
  signupLink: 'aivoice.pro/signup',
  stats: {
    clients: 47,
    revenue: '$12,400',
    calls: '2,847',
    mrr: '$6,903',
  },
  clients: [
    { id: '1', name: 'Smith Plumbing Co',   plan: 'professional', status: 'active',  calls: 127, mrr: '$149' },
    { id: '2', name: 'Elite Dental Care',   plan: 'professional', status: 'active',  calls: 203, mrr: '$149' },
    { id: '3', name: 'Sunrise HVAC',        plan: 'starter',      status: 'trial',   calls:  44, mrr: '$99'  },
    { id: '4', name: 'Peak Roofing LLC',    plan: 'starter',      status: 'active',  calls:  89, mrr: '$99'  },
    { id: '5', name: 'Valley Electric',     plan: 'professional', status: 'active',  calls: 167, mrr: '$149' },
    { id: '6', name: 'Metro Law Group',     plan: 'professional', status: 'active',  calls: 211, mrr: '$149' },
    { id: '7', name: 'Bright Smile Dental', plan: 'starter',      status: 'active',  calls:  56, mrr: '$99'  },
    { id: '8', name: 'Swift Auto Repair',   plan: 'professional', status: 'trial',   calls:  12, mrr: '$149' },
  ],
  leads: [
    { id: '1', name: 'Ace Garage Doors',   contact: 'Tom Wilson',    status: 'hot',  source: 'Cold Email', last: '2h ago'  },
    { id: '2', name: 'Comfort Air HVAC',   contact: 'Maria Santos',  status: 'warm', source: 'LinkedIn',   last: '1d ago'  },
    { id: '3', name: 'Quick Fix Plumbing', contact: 'James Lee',     status: 'hot',  source: 'Referral',   last: '3h ago'  },
    { id: '4', name: 'Bright Smiles Dental',contact: 'Dr. Patel',   status: 'new',  source: 'Website',    last: 'Just now'},
    { id: '5', name: 'Summit Roofing',     contact: 'Mike Brown',    status: 'warm', source: 'Cold Email', last: '2d ago'  },
    { id: '6', name: 'Express Locksmith',  contact: 'Dana Rivera',   status: 'hot',  source: 'DM',         last: '5h ago'  },
  ],
  templates: [
    { id: '1', name: 'Cold Intro Email',      type: 'email', sent: 38 },
    { id: '2', name: 'Follow-Up #1',           type: 'email', sent: 22 },
    { id: '3', name: 'SMS Introduction',       type: 'sms',   sent: 57 },
    { id: '4', name: 'Missed Call Follow-Up',  type: 'sms',   sent: 19 },
    { id: '5', name: 'Closing Email',          type: 'email', sent: 11 },
  ],
  analytics: {
    totalRevenue: '$47,200',
    activeClients: 47,
    avgRevenue: '$264',
    churnRate: '2.1%',
  },
};

const CLIENT = {
  name: 'Smith Plumbing Co',
  phone: '+1 (404) 555-0192',
  agencyName: 'AI Voice Pro',
  stats: { calls: 127, urgent: 8, limit: 500 },
  calls: [
    { id: '1', caller: 'Sarah Johnson',  phone: '(555) 123-4567', service: 'Emergency leak repair',  urgency: 'high',   time: '10 min ago'  },
    { id: '2', caller: 'Mike Chen',      phone: '(555) 234-5678', service: 'Water heater quote',     urgency: 'normal', time: '1 hour ago'  },
    { id: '3', caller: 'Lisa Martinez',  phone: '(555) 345-6789', service: 'Drain cleaning',         urgency: 'normal', time: '2 hours ago' },
    { id: '4', caller: 'John Davis',     phone: '(555) 456-7890', service: 'Faucet installation',    urgency: 'normal', time: 'Yesterday'   },
    { id: '5', caller: 'Emma Wilson',    phone: '(555) 567-8901', service: 'Pipe inspection',        urgency: 'medium', time: '2 days ago'  },
    { id: '6', caller: 'Carlos Ruiz',    phone: '(555) 678-9012', service: 'Sewer line check',       urgency: 'high',   time: '2 days ago'  },
  ],
};

// ─── Agency Views ─────────────────────────────────────────────────────────────

function AgencyOverview() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Welcome back, Alex! 👋</h1>
        <p className="text-sm text-[#fafaf9]/50">Here's how your agency is performing.</p>
      </div>

      {/* Signup link */}
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#fafaf9]/50 mb-1">Your Client Signup Link</p>
            <p className="text-sm font-medium text-emerald-300 truncate">{AGENCY.signupLink}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
          >
            {copied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients', value: AGENCY.stats.clients, icon: Users,      color: '#10b981' },
          { label: 'Monthly Revenue',value: AGENCY.stats.revenue, icon: DollarSign, color: '#f59e0b' },
          { label: 'Calls This Month',value: AGENCY.stats.calls,  icon: PhoneCall,  color: '#3b82f6' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}18` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-xs text-[#fafaf9]/50">{s.label}</p>
            <p className="text-xl font-semibold text-[#fafaf9]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent clients */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-medium text-[#fafaf9]">Recent Clients</h2>
          <span className="text-xs text-emerald-400 cursor-pointer">View all →</span>
        </div>
        <div className="p-3 space-y-2">
          {AGENCY.clients.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-400">{c.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#fafaf9]">{c.name}</p>
                  <p className="text-xs text-[#fafaf9]/40 capitalize">{c.plan}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgencyClients() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#fafaf9]">Clients</h1>
          <p className="text-sm text-[#fafaf9]/50">Manage your AI receptionist clients</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#050505] hover:bg-emerald-400 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add Client
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[#fafaf9]/30" />
          <span className="text-xs text-[#fafaf9]/30">Search clients...</span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[#fafaf9]/50">
          <Filter className="h-3 w-3" />Filter
        </button>
      </div>
      <div className="space-y-2">
        {AGENCY.clients.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <span className="text-sm font-medium text-emerald-400">{c.name[0]}</span>
              </div>
              <div>
                <p className="font-medium text-sm text-[#fafaf9]">{c.name}</p>
                <p className="text-xs text-[#fafaf9]/40">{c.calls} calls · {c.mrr}/mo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{c.status}</span>
              <span className="text-xs text-[#fafaf9]/30 capitalize">{c.plan}</span>
              <ChevronRight className="h-4 w-4 text-[#fafaf9]/20 group-hover:text-[#fafaf9]/50 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencyLeads() {
  const statusColor: Record<string, string> = {
    hot:  'bg-red-500/10 text-red-400',
    warm: 'bg-amber-500/10 text-amber-400',
    new:  'bg-blue-500/10 text-blue-400',
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#fafaf9]">Leads CRM</h1>
          <p className="text-sm text-[#fafaf9]/50">Track and convert prospects into clients</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#050505]">
          <Plus className="h-3.5 w-3.5" />Add Lead
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: '124', color: '#3b82f6' },
          { label: 'Hot',   value: '18',  color: '#ef4444' },
          { label: 'Warm',  value: '42',  color: '#f59e0b' },
          { label: 'Won',   value: '47',  color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#fafaf9]/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {AGENCY.leads.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                <span className="text-xs font-medium text-blue-400">{l.name[0]}</span>
              </div>
              <div>
                <p className="font-medium text-sm text-[#fafaf9]">{l.name}</p>
                <p className="text-xs text-[#fafaf9]/40">{l.contact} · {l.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[l.status]}`}>{l.status}</span>
              <span className="text-[10px] text-[#fafaf9]/30">{l.last}</span>
              <ChevronRight className="h-4 w-4 text-[#fafaf9]/20 group-hover:text-[#fafaf9]/50 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencyOutreach() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Outreach Templates</h1>
        <p className="text-sm text-[#fafaf9]/50">13+ pre-built templates ready to send</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="text-xs text-[#fafaf9]/40 uppercase tracking-wider">Email Templates</div>
        {AGENCY.templates.filter(t => t.type === 'email').map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#fafaf9]">{t.name}</p>
                <p className="text-xs text-[#fafaf9]/40">Sent {t.sent} times</p>
              </div>
            </div>
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#fafaf9]/60 hover:bg-white/[0.06] transition-colors">Use</button>
          </div>
        ))}
        <div className="text-xs text-[#fafaf9]/40 uppercase tracking-wider pt-2">SMS Templates</div>
        {AGENCY.templates.filter(t => t.type === 'sms').map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#fafaf9]">{t.name}</p>
                <p className="text-xs text-[#fafaf9]/40">Sent {t.sent} times</p>
              </div>
            </div>
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#fafaf9]/60 hover:bg-white/[0.06] transition-colors">Use</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencyAnalytics() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Analytics</h1>
        <p className="text-sm text-[#fafaf9]/50">Track your agency performance</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Revenue',       value: AGENCY.analytics.totalRevenue, change: '+12%',  color: '#10b981' },
          { label: 'Active Clients',      value: AGENCY.analytics.activeClients, change: '+5',   color: '#3b82f6' },
          { label: 'Avg. Revenue/Client', value: AGENCY.analytics.avgRevenue,   change: '+8%',   color: '#f59e0b' },
          { label: 'Churn Rate',          value: AGENCY.analytics.churnRate,    change: '-0.3%', color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-[#fafaf9]/50">{s.label}</p>
            <p className="text-2xl font-semibold text-[#fafaf9] mt-1">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: s.color }}>{s.change} this month</p>
          </div>
        ))}
      </div>
      {/* Fake bar chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs text-[#fafaf9]/40 mb-4">Monthly Revenue</p>
        <div className="flex items-end gap-2 h-28">
          {[45, 52, 48, 61, 58, 70, 65, 80, 74, 88, 92, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${h}%`, backgroundColor: i === 11 ? '#10b981' : 'rgba(16,185,129,0.25)' }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-[#fafaf9]/20">
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  );
}

function AgencyBranding() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Branding</h1>
        <p className="text-sm text-[#fafaf9]/50">Customize your white-label appearance</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 col-span-2">
          <p className="text-xs text-[#fafaf9]/40 mb-3">Logo</p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <WaveformIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#fafaf9]/60 hover:bg-white/[0.06] transition-colors">Upload Logo</button>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs text-[#fafaf9]/40 mb-2">Primary Color</p>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: '#10b981' }} />
            <span className="text-sm font-mono text-[#fafaf9]/60">#10b981</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs text-[#fafaf9]/40 mb-2">Agency Name</p>
          <p className="text-sm text-[#fafaf9]">AI Voice Pro</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 col-span-2">
          <p className="text-xs text-[#fafaf9]/40 mb-2">Custom Domain</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-sm text-emerald-300 font-mono">aivoice.pro</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyDemoPhone() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Demo Phone</h1>
        <p className="text-sm text-[#fafaf9]/50">The AI demo line you use to close clients</p>
      </div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Phone className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-[#fafaf9]/50">Your Demo Line</p>
            <p className="text-xl font-bold text-[#fafaf9] font-mono">(404) 555-DEMO</p>
          </div>
        </div>
        <p className="text-sm text-[#fafaf9]/60 leading-relaxed">
          When prospects call this number, the AI asks about their business — then transforms into <span className="text-[#fafaf9]/90">their receptionist</span> live on the call. They hear exactly what their customers will hear.
        </p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <p className="text-sm font-medium text-[#fafaf9]">How the demo call works</p>
        {[
          { step: '1', text: 'Prospect calls your demo number' },
          { step: '2', text: 'AI asks: business name, type, hours, top question' },
          { step: '3', text: 'AI transforms into their custom receptionist' },
          { step: '4', text: 'They test it — ask it questions about their own business' },
          { step: '5', text: 'AI offers a free trial and texts the signup link' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400 flex-shrink-0">{s.step}</div>
            <p className="text-sm text-[#fafaf9]/70">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencySettings() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#fafaf9]">Settings</h1>
        <p className="text-sm text-[#fafaf9]/50">Manage your account and billing</p>
      </div>
      {[
        { label: 'Account', items: ['Profile', 'Password', 'Two-Factor Auth'] },
        { label: 'Billing', items: ['Payment Method', 'Invoices', 'Plan & Usage'] },
        { label: 'Integrations', items: ['Stripe Connect', 'Webhook URLs', 'API Keys'] },
      ].map((section) => (
        <div key={section.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-xs font-medium text-[#fafaf9]/40 uppercase tracking-wider">{section.label}</p>
          </div>
          <div className="p-2">
            {section.items.map((item) => (
              <button key={item} className="w-full flex items-center justify-between rounded-lg px-3 py-3 text-sm text-[#fafaf9]/70 hover:bg-white/[0.04] hover:text-[#fafaf9] transition-colors">
                {item}
                <ChevronRight className="h-4 w-4 text-[#fafaf9]/20" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Client Views ─────────────────────────────────────────────────────────────

function ClientOverview() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: '#f9fafb' }}>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Welcome back! 👋</h1>
        <p className="text-sm text-gray-500">Your AI receptionist activity.</p>
      </div>
      {/* Phone number */}
      <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your AI Phone Number</p>
              <p className="text-base font-semibold text-gray-900">{CLIENT.phone}</p>
            </div>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            {copied ? <><Check className="h-3 w-3 text-emerald-500" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Calls This Month', value: CLIENT.stats.calls,  sub: `of ${CLIENT.stats.limit}`, icon: PhoneCall,   color: '#10b981' },
          { label: 'High Priority',    value: CLIENT.stats.urgent, sub: 'Urgent calls',              icon: AlertCircle, color: '#f59e0b' },
          { label: 'Status',           value: 'Active',            sub: 'Receiving calls',           icon: Zap,         color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Recent calls */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent Calls</h2>
          <span className="text-xs text-emerald-600 cursor-pointer">View all →</span>
        </div>
        <div className="p-3 space-y-2">
          {CLIENT.calls.slice(0, 3).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.caller}</p>
                  <p className="text-xs text-gray-500">{c.service}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                c.urgency === 'high' ? 'bg-red-50 text-red-600' :
                c.urgency === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
              }`}>{c.urgency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientCalls() {
  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: '#f9fafb' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Call History</h1>
          <p className="text-sm text-gray-500">All calls handled by your AI</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
          <Download className="h-3 w-3" />Export
        </button>
      </div>
      <div className="space-y-2">
        {CLIENT.calls.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <PhoneCall className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{c.caller}</p>
                <p className="text-xs text-gray-500">{c.phone} · {c.service}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                c.urgency === 'high' ? 'bg-red-50 text-red-600' :
                c.urgency === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
              }`}>{c.urgency}</span>
              <span className="text-[10px] text-gray-400">{c.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientContacts() {
  const contacts = [
    { id: '1', name: 'Sarah Johnson',  phone: '(555) 123-4567', calls: 3, last: '10 min ago' },
    { id: '2', name: 'Mike Chen',      phone: '(555) 234-5678', calls: 1, last: '1 hour ago' },
    { id: '3', name: 'Lisa Martinez',  phone: '(555) 345-6789', calls: 2, last: '2 hours ago' },
    { id: '4', name: 'John Davis',     phone: '(555) 456-7890', calls: 1, last: 'Yesterday'  },
    { id: '5', name: 'Emma Wilson',    phone: '(555) 567-8901', calls: 2, last: '2 days ago' },
  ];
  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: '#f9fafb' }}>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Contacts</h1>
        <p className="text-sm text-gray-500">Everyone who has called your AI</p>
      </div>
      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <span className="text-sm font-medium text-emerald-700">{c.name[0]}</span>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{c.calls} call{c.calls !== 1 ? 's' : ''}</span>
              <span className="text-[10px] text-gray-400">{c.last}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientAIAgent() {
  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: '#f9fafb' }}>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">AI Agent</h1>
        <p className="text-sm text-gray-500">Configure how your AI receptionist behaves</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <Bot className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Your AI Receptionist</p>
            <p className="text-xs text-gray-500">Currently active · Answering calls</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="p-4 space-y-4">
          {[
            { label: 'Business Name',  value: CLIENT.name },
            { label: 'Voice',          value: 'Sarah (Warm & Professional)' },
            { label: 'Greeting',       value: 'Thank you for calling Smith Plumbing! How can I help you today?' },
            { label: 'Services Known', value: 'Leak repair, Water heaters, Drain cleaning, Pipe installation, Emergency calls' },
            { label: 'Business Hours', value: 'Mon–Fri 7am–6pm, Sat 8am–2pm, Emergency after-hours available' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-sm text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientSettings() {
  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: '#f9fafb' }}>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account preferences</p>
      </div>
      {[
        { label: 'Notifications', items: ['Email Alerts', 'SMS Alerts', 'Push Notifications'] },
        { label: 'Account', items: ['Profile', 'Change Password', 'Billing'] },
      ].map((section) => (
        <div key={section.label} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{section.label}</p>
          </div>
          <div className="p-2">
            {section.items.map((item) => (
              <button key={item} className="w-full flex items-center justify-between rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                {item}
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard Sandbox (Full) ─────────────────────────────────────────────────

export function FullDashboardSandbox() {
  const [view, setView] = useState<'agency' | 'client'>('agency');
  const [agencyTab, setAgencyTab] = useState('dashboard');
  const [clientTab, setClientTab] = useState('dashboard');

  const agencyNav = [
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'clients',    label: 'Clients',     icon: Users },
    { id: 'leads',      label: 'Leads',       icon: Target },
    { id: 'outreach',   label: 'Outreach',    icon: Send },
    { id: 'analytics',  label: 'Analytics',   icon: BarChart3 },
    { id: 'demo-phone', label: 'Demo Phone',  icon: Phone },
    { id: 'branding',   label: 'Branding',    icon: Paintbrush },
    { id: 'settings',   label: 'Settings',    icon: Settings },
  ];

  const clientNav = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'calls',     label: 'Calls',     icon: PhoneCall },
    { id: 'contacts',  label: 'Contacts',  icon: Users },
    { id: 'ai-agent',  label: 'AI Agent',  icon: Bot },
    { id: 'settings',  label: 'Settings',  icon: Settings },
  ];

  const renderAgency = () => {
    switch (agencyTab) {
      case 'clients':    return <AgencyClients />;
      case 'leads':      return <AgencyLeads />;
      case 'outreach':   return <AgencyOutreach />;
      case 'analytics':  return <AgencyAnalytics />;
      case 'demo-phone': return <AgencyDemoPhone />;
      case 'branding':   return <AgencyBranding />;
      case 'settings':   return <AgencySettings />;
      default:           return <AgencyOverview />;
    }
  };

  const renderClient = () => {
    switch (clientTab) {
      case 'calls':    return <ClientCalls />;
      case 'contacts': return <ClientContacts />;
      case 'ai-agent': return <ClientAIAgent />;
      case 'settings': return <ClientSettings />;
      default:         return <ClientOverview />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
          <button
            onClick={() => setView('agency')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === 'agency' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
            }`}
          >
            Agency Dashboard
          </button>
          <button
            onClick={() => setView('client')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              view === 'client' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
            }`}
          >
            Client Dashboard
          </button>
        </div>
      </div>

      {/* Browser Frame */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
        {/* Browser Chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="max-w-sm mx-auto bg-white/[0.04] rounded-lg px-4 py-1.5 text-xs text-center text-[#fafaf9]/40 font-mono">
              {view === 'agency'
                ? 'app.myvoiceaiconnect.com/agency/dashboard'
                : 'app.aivoice.pro/dashboard'}
            </div>
          </div>
          <div className="w-20" />
        </div>

        {/* Dashboard Layout */}
        <div className="flex h-[540px]">
          {view === 'agency' ? (
            <>
              {/* Agency Sidebar */}
              <div className="w-52 border-r border-white/[0.06] bg-[#050505] flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <WaveformIcon className="h-5 w-5 text-[#fafaf9]" />
                  </div>
                  <span className="font-semibold text-sm text-[#fafaf9] truncate">{AGENCY.name}</span>
                </div>
                <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                  {agencyNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAgencyTab(item.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        agencyTab === item.id
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] p-2.5">
                    <p className="text-[10px] text-emerald-400/70">Current Plan</p>
                    <p className="text-xs font-semibold text-emerald-300">{AGENCY.plan}</p>
                  </div>
                </div>
              </div>
              {/* Agency Content */}
              <div className="flex-1 overflow-y-auto bg-[#050505] text-[#fafaf9]">
                {renderAgency()}
              </div>
            </>
          ) : (
            <>
              {/* Client Sidebar */}
              <div className="w-52 border-r flex-shrink-0 flex flex-col" style={{ backgroundColor: 'rgb(17,78,60)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-sm text-white truncate">{CLIENT.name}</span>
                </div>
                <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                  {clientNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setClientTab(item.id)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: clientTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: clientTab === item.id ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      }}
                      onMouseEnter={(e) => {
                        if (clientTab !== item.id)
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
                      }}
                      onMouseLeave={(e) => {
                        if (clientTab !== item.id)
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="rounded-lg border p-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Powered by</p>
                    <p className="text-xs font-semibold text-white">{CLIENT.agencyName}</p>
                  </div>
                </div>
              </div>
              {/* Client Content */}
              <div className="flex-1 overflow-y-auto">
                {renderClient()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Demo Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[128px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-5 h-5" />
              </div>
              <span className="text-base font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:shadow-lg hover:shadow-white/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300/90">Interactive Platform Demo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            See exactly what
            <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              you're selling.
            </span>
          </h1>

          <p className="text-lg text-[#fafaf9]/60 max-w-2xl mx-auto mb-10">
            Explore both dashboards below — what you see as the agency owner,
            and what your clients see under your brand.
          </p>

          {/* Demo phone CTA */}
          <div className="inline-flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-6 py-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 flex-shrink-0">
              <Phone className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm text-[#fafaf9]/50">Want to hear the AI in action?</p>
              <p className="text-xl font-bold tracking-wide font-mono text-[#fafaf9]">(404) 555-DEMO</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <p className="text-sm text-[#fafaf9]/50 max-w-[180px] text-left">
              Call and the AI will become your receptionist live on the call.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm text-[#fafaf9]/30">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Dashboard Sandbox */}
      <section className="pb-20 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Glow behind frame */}
          <div className="absolute -inset-x-20 top-0 h-[400px] bg-gradient-to-b from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent blur-2xl pointer-events-none" />
          <div className="relative">
            <FullDashboardSandbox />
          </div>
        </div>
      </section>

      {/* Below the fold — context + supporting copy */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Users,
                color: '#10b981',
                title: 'Agency Dashboard',
                body: 'Manage all your clients, track revenue, work your leads pipeline, and send outreach — all from one place. Your brand, your pricing.',
              },
              {
                icon: Phone,
                color: '#f59e0b',
                title: 'Demo Phone Line',
                body: 'Call your demo number, tell the AI about a business, and it becomes their receptionist on the spot. The most effective sales tool you\'ll ever use.',
              },
              {
                icon: Bot,
                color: '#3b82f6',
                title: 'Client Dashboard',
                body: 'Your clients get a branded, polished dashboard to review calls, transcripts, and AI settings. They see your brand — not ours.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: `${card.color}15` }}>
                  <card.icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Ready to start your agency?
            </h2>
            <p className="text-[#fafaf9]/50 mb-8 max-w-xl mx-auto">
              14-day free trial, no credit card required. You'll be set up in under 24 hours.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10"
            >
              Start Free Trial — Free for 14 Days
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}