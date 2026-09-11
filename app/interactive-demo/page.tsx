'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Phone, ArrowRight, Check, Users, DollarSign, PhoneCall,
  Settings, Copy, TrendingUp, ChevronRight, Zap, LayoutDashboard,
  Target, Send, BarChart3, Bot, AlertCircle,
  Paintbrush, Mail, MessageSquare, Plus, Search, Download,
  ArrowUpRight, Wallet, Eye, Shuffle, Sparkles,
  Save, RotateCcw, Mic, Headphones, Calendar, FileSpreadsheet,
  Trash2, Globe, Lightbulb, ExternalLink, Clock, Hash,
  Gift, Building, CreditCard, Receipt, Edit2, Banknote,
  MoreVertical, FileText, Sun, Moon, Palette, Share2,
  CheckCircle2, Info, Link as LinkIcon, Play, Pause,
  BookOpen, HelpCircle, ChevronDown, ChevronLeft, Code, LifeBuoy, Upload, FlaskConical, RefreshCw, Smartphone,
  Infinity as InfinityIcon,
  PhoneForwarded, PhoneIncoming, Lock, Eye as EyeIcon, EyeOff,
  Building2, Link2, Tag, ArrowUpDown, MapPin, User, PhoneOff,
  CheckCircle, X, ArrowLeft, Menu
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const AGENCY = {
  name: 'AI Voice Pro', plan: 'Professional', signupLink: 'aivoice.pro/signup',
  stats: { clients: 47, revenue: '$15,100', calls: '2,847', mrr: '$8,408' },
  analyticsStats: { mrr: 840800, totalEarned: 5750000, pendingPayout: 231000, activeClients: 42, trialClients: 5 },
  revenueByMonth: [
    { month: '2025-07', amount: 341000 }, { month: '2025-08', amount: 390000 },
    { month: '2025-09', amount: 378000 }, { month: '2025-10', amount: 475000 },
    { month: '2025-11', amount: 512000 }, { month: '2025-12', amount: 585000 },
    { month: '2026-01', amount: 634000 }, { month: '2026-02', amount: 706000 },
    { month: '2026-03', amount: 840800 },
  ],
  payments: [
    { id: 'p1', client: 'Smith Plumbing Co', amount: 19900, status: 'succeeded', type: 'subscription', date: '2026-03-08' },
    { id: 'p2', client: 'Elite Dental Care', amount: 19900, status: 'succeeded', type: 'subscription', date: '2026-03-08' },
    { id: 'p3', client: 'Peak Roofing LLC', amount: 14900, status: 'succeeded', type: 'subscription', date: '2026-03-07' },
    { id: 'p4', client: 'Valley Electric', amount: 19900, status: 'succeeded', type: 'subscription', date: '2026-03-07' },
    { id: 'p5', client: 'Sunrise HVAC', amount: 14900, status: 'pending', type: 'subscription', date: '2026-03-06' },
    { id: 'p6', client: 'Metro Law Group', amount: 19900, status: 'succeeded', type: 'subscription', date: '2026-03-05' },
    { id: 'p7', client: 'Bright Smile Dental', amount: 14900, status: 'succeeded', type: 'subscription', date: '2026-03-05' },
  ],
  planClients: { starter: 14, pro: 23, growth: 5 },
  clients: [
    { id: '1', name: 'Smith Plumbing Co', email: 'john@smithplumbing.com', plan: 'professional', status: 'active', calls: 127, mrr: '$199', created: '2025-11-14' },
    { id: '2', name: 'Elite Dental Care', email: 'dr.chen@elitedental.com', plan: 'professional', status: 'active', calls: 203, mrr: '$199', created: '2025-10-22' },
    { id: '3', name: 'Sunrise HVAC', email: 'mike@sunrisehvac.com', plan: 'starter', status: 'trial', calls: 44, mrr: '$149', created: '2026-03-02' },
    { id: '4', name: 'Peak Roofing LLC', email: 'dan@peakroofing.com', plan: 'starter', status: 'active', calls: 89, mrr: '$149', created: '2025-12-08' },
    { id: '5', name: 'Valley Electric', email: 'sarah@valleyelectric.com', plan: 'professional', status: 'active', calls: 167, mrr: '$199', created: '2025-09-30' },
    { id: '6', name: 'Metro Law Group', email: 'info@metrolaw.com', plan: 'professional', status: 'active', calls: 211, mrr: '$199', created: '2025-08-15' },
    { id: '7', name: 'Bright Smile Dental', email: 'admin@brightsmile.com', plan: 'starter', status: 'active', calls: 56, mrr: '$149', created: '2026-01-20' },
    { id: '8', name: 'Swift Auto Repair', email: 'tom@swiftauto.com', plan: 'professional', status: 'trial', calls: 12, mrr: '$199', created: '2026-03-05' },
  ],
  leads: [
    { id: '1', name: 'Ace Garage Doors', contact: 'Tom Wilson', email: 'tom@acegaragedoors.com', phone: '(404) 555-1001', industry: 'Home Services', source: 'Cold Email', status: 'qualified', value: 19900, followUp: '2026-03-10', created: '2026-02-15' },
    { id: '2', name: 'Comfort Air HVAC', contact: 'Maria Santos', email: 'maria@comfortair.com', phone: '(678) 555-2002', industry: 'HVAC', source: 'LinkedIn', status: 'contacted', value: 14900, followUp: '2026-03-11', created: '2026-02-20' },
    { id: '3', name: 'Quick Fix Plumbing', contact: 'James Lee', email: 'james@quickfixplumbing.com', phone: '(770) 555-3003', industry: 'Plumbing', source: 'Referral', status: 'proposal', value: 19900, followUp: '2026-03-08', created: '2026-01-28' },
    { id: '4', name: 'Bright Smiles Dental', contact: 'Dr. Patel', email: 'admin@brightsmilesdental.com', phone: '(404) 555-4004', industry: 'Medical/Dental', source: 'Website', status: 'new', value: 14900, followUp: null, created: '2026-03-09' },
    { id: '5', name: 'Summit Roofing', contact: 'Mike Brown', email: 'mike@summitroofing.com', phone: '(678) 555-5005', industry: 'Roofing', source: 'Cold Email', status: 'contacted', value: 14900, followUp: '2026-03-07', created: '2026-02-10' },
    { id: '6', name: 'Express Locksmith', contact: 'Dana Rivera', email: 'dana@expresslocksmith.com', phone: '(770) 555-6006', industry: 'Home Services', source: 'DM', status: 'qualified', value: 19900, followUp: '2026-03-12', created: '2026-02-05' },
    { id: '7', name: 'Green Lawn Landscaping', contact: 'Carlos Mendez', email: 'carlos@greenlawn.com', phone: '(404) 555-7007', industry: 'Landscaping', source: 'Google Maps', status: 'new', value: 14900, followUp: null, created: '2026-03-08' },
    { id: '8', name: 'Premier Auto Body', contact: 'Kevin Park', email: 'kevin@premierautobody.com', phone: '(678) 555-8008', industry: 'Automotive', source: 'Referral', status: 'won', value: 19900, followUp: null, created: '2026-01-15' },
    { id: '9', name: 'Cozy Home HVAC', contact: 'Linda Torres', email: 'linda@cozyhomehvac.com', phone: '(770) 555-9009', industry: 'HVAC', source: 'Instagram', status: 'lost', value: 14900, followUp: null, created: '2026-01-20' },
    { id: '10', name: 'Diamond Electrical', contact: 'Ray Thompson', email: 'ray@diamondelectrical.com', phone: '(404) 555-1010', industry: 'Electrical', source: 'Google Maps', status: 'contacted', value: 19900, followUp: '2026-03-09', created: '2026-02-25' },
  ],
  leadStats: { total: 42, active: 33, qualified: 12, pipeline: 598000, followUpsToday: 3, overdue: 2 },
  templates: [
    { id: '1', name: 'Cold Intro Email', type: 'email', sent: 38, desc: 'Hey {name}, noticed {business} doesn\'t have...' },
    { id: '2', name: 'Follow-Up #1', type: 'email', sent: 22, desc: 'Following up on my note about AI receptionist...' },
    { id: '3', name: 'Follow-Up #2', type: 'email', sent: 14, desc: 'Quick question, still losing calls to voicemail?' },
    { id: '4', name: 'Closing Email', type: 'email', sent: 11, desc: 'Last note, free trial expires Friday...' },
    { id: '5', name: 'SMS Introduction', type: 'sms', sent: 57, desc: 'Hey {name}, this is {agency}. Quick question...' },
    { id: '6', name: 'Missed Call Follow-Up', type: 'sms', sent: 19, desc: 'Hi {name}, tried calling. We help businesses like...' },
    { id: '7', name: 'SMS Closer', type: 'sms', sent: 8, desc: 'Last chance, your free trial link expires...' },
    { id: '8', name: 'Discovery Call Script', type: 'call_script', sent: 31, desc: 'Opening → Pain points → Demo offer → Close' },
    { id: '9', name: 'Follow-Up Call Script', type: 'call_script', sent: 15, desc: 'Recap → Objection handling → Trial setup' },
  ],
};

const CLIENT = {
  name: 'Smith Plumbing Co', owner: 'John Smith', phone: '+1 (404) 555-0192', agencyName: 'AI Voice Pro',
  stats: { calls: 127, urgent: 8, limit: 500 },
  calls: [
    { id: '1', caller: 'Sarah Johnson', phone: '(555) 123-4567', service: 'Emergency leak repair', urgency: 'high', time: '10 min ago' },
    { id: '2', caller: 'Mike Chen', phone: '(555) 234-5678', service: 'Water heater quote', urgency: 'normal', time: '1 hour ago' },
    { id: '3', caller: 'Lisa Martinez', phone: '(555) 345-6789', service: 'Drain cleaning', urgency: 'normal', time: '2 hours ago' },
    { id: '4', caller: 'John Davis', phone: '(555) 456-7890', service: 'Faucet installation', urgency: 'normal', time: 'Yesterday' },
    { id: '5', caller: 'Emma Wilson', phone: '(555) 567-8901', service: 'Pipe inspection', urgency: 'medium', time: '2 days ago' },
    { id: '6', caller: 'Carlos Ruiz', phone: '(555) 678-9012', service: 'Sewer line check', urgency: 'high', time: '2 days ago' },
  ],
};

function fmtCents(c: number) { return `$${(c / 100).toLocaleString()}`; }
function fmtMonth(m: string) { const [y, mo] = m.split('-'); return new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); }

// ─── Agency: Dashboard ────────────────────────────────────────────────────────

function AgencyOverview() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Welcome back, Alex</h1>
        <p className="mt-1 text-sm text-[#fafaf9]/50">Here&apos;s how your agency is performing.</p>
      </div>
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-xs text-[#fafaf9]/50 mb-1">Your Client Signup Link</p><p className="text-sm font-medium text-emerald-300 truncate">{AGENCY.signupLink}</p></div>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors flex-shrink-0">
            {copied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Total Clients', value: AGENCY.stats.clients, icon: Users, color: '#10b981' },
          { label: 'Monthly Revenue', value: AGENCY.stats.revenue, icon: DollarSign, color: '#f59e0b' },
          { label: 'Calls This Month', value: AGENCY.stats.calls, icon: PhoneCall, color: '#3b82f6' },
          { label: 'MRR', value: AGENCY.stats.mrr, icon: TrendingUp, color: '#a78bfa' },
        ] as const).map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${s.color}18` }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div><p className="text-[10px] sm:text-xs text-[#fafaf9]/50">{s.label}</p><p className="text-lg sm:text-xl font-semibold text-[#fafaf9]">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3"><h2 className="text-sm font-medium text-[#fafaf9]">Recent Clients</h2><span className="text-xs text-emerald-400 cursor-pointer">View all →</span></div>
        <div className="p-3 space-y-2">
          {AGENCY.clients.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><span className="text-xs font-medium text-emerald-400">{c.name[0]}</span></div>
                <div><p className="text-sm font-medium text-[#fafaf9]">{c.name}</p><p className="text-xs text-[#fafaf9]/40 capitalize">{c.plan} · {c.mrr}/mo</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{c.status}</span>
                <ChevronRight className="h-4 w-4 text-[#fafaf9]/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agency: Clients (mirrors real clients page) ──────────────────────────────

function AgencyClients({ onAdd }: { onAdd: () => void }) {
  const [sq, setSq] = useState('');
  const [sf, setSf] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const rows = [
    ...AGENCY.clients.map(c => ({ id: c.id, name: c.name, email: c.email, plan: c.plan, status: c.status, calls: c.calls, mrr: c.mrr, created: c.created, test: false })),
    { id: 'test', name: 'Test Line (demo)', email: 'test@aivoicepro.com', plan: '', status: 'active', calls: 3, mrr: '', created: '2026-02-28', test: true },
  ];
  const filtered = rows.filter(c => {
    const ms = !sq || c.name.toLowerCase().includes(sq.toLowerCase()) || c.email.toLowerCase().includes(sq.toLowerCase());
    const mf = !sf || c.status === sf;
    return ms && mf;
  }).sort((a, b) => (a.test === b.test ? 0 : a.test ? 1 : -1));
  const billable = AGENCY.clients.length;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Clients</h1><p className="mt-1 text-sm text-[#fafaf9]/50">{billable} clients <span className="text-[#fafaf9]/30">&middot; 1 test</span></p></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <button onClick={() => setExportOpen(o => !o)} className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70"><Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 bg-[#0f0f0f] border border-white/[0.08] shadow-xl">
                  <button onClick={() => setExportOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#fafaf9]/90 hover:bg-white/[0.04]"><Users className="h-4 w-4 flex-shrink-0 text-[#fafaf9]/40" />Export Client Roster</button>
                  <div className="border-t border-white/[0.06]" />
                  <button onClick={() => setExportOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#fafaf9]/90 hover:bg-white/[0.04]"><PhoneCall className="h-4 w-4 flex-shrink-0 text-[#fafaf9]/40" />Export All Calls</button>
                </div>
              )}
            </div>
            <button onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors flex-1 sm:flex-initial"><Plus className="h-4 w-4" />Add Client</button>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" /><input type="text" placeholder="Search clients..." value={sq} onChange={e => setSq(e.target.value)} className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none" /></div>
          <select value={sf} onChange={e => setSf(e.target.value)} className="rounded-xl px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70 focus:outline-none sm:w-44"><option value="">All Status</option><option value="active">Active</option><option value="trial">Trial</option><option value="past_due">Past Due</option><option value="suspended">Suspended</option></select>
        </div>
      </div>
      <div data-tour="clients-table" className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-[#fafaf9]/40 border-b border-white/[0.06]"><div className="col-span-4">Business</div><div className="col-span-2">Plan</div><div className="col-span-2">Calls</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Added</div></div>
        {filtered.map((c, i) => (
          <div key={c.id} className="px-4 sm:px-6 py-4 hover:bg-white/[0.03] cursor-pointer transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0"><div className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: c.test ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.1)' }}>{c.test ? <FlaskConical className="h-4 w-4" style={{ color: '#8b5cf6' }} /> : <span className="text-sm font-medium text-emerald-400">{c.name[0]}</span>}</div><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-medium text-sm text-[#fafaf9] truncate">{c.name}</p>{c.test && <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Test</span>}</div><p className="text-xs text-[#fafaf9]/40 truncate">{c.email}</p></div></div>
                <ArrowUpRight className="h-4 w-4 text-[#fafaf9]/30 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-between text-xs pl-[52px]"><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{c.status}</span><span className="text-[#fafaf9]/40 capitalize">{c.test ? 'Test client' : `${c.plan} \u00b7 ${c.calls} calls`}</span></div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: c.test ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.1)' }}>{c.test ? <FlaskConical className="h-4 w-4" style={{ color: '#8b5cf6' }} /> : <span className="text-sm font-medium text-emerald-400">{c.name[0]}</span>}</div><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-medium text-sm text-[#fafaf9] truncate">{c.name}</p>{c.test && <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Test</span>}</div><p className="text-xs text-[#fafaf9]/40 truncate">{c.email}</p></div></div>
              <div className="col-span-2">{c.test ? (<p className="text-sm" style={{ color: '#8b5cf6' }}>Test client</p>) : (<><p className="text-sm text-[#fafaf9] capitalize">{c.plan}</p><p className="text-xs text-[#fafaf9]/40">{c.mrr}/mo</p></>)}</div>
              <div className="col-span-2 flex items-center gap-2"><PhoneCall className="h-4 w-4 text-[#fafaf9]/30" /><span className="text-sm text-[#fafaf9]">{c.calls}</span><span className="text-xs text-[#fafaf9]/40">this month</span></div>
              <div className="col-span-2"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{c.status}</span></div>
              <div className="col-span-2 flex items-center justify-end gap-2"><span className="text-sm text-[#fafaf9]/40">{new Date(c.created).toLocaleDateString()}</span><ChevronRight className="h-4 w-4 text-[#fafaf9]/20" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agency: Add Client (mirrors real clients/new page) ──────────────────────

function AgencyAddClient({ onBack }: { onBack: () => void }) {
  const [pmode, setPmode] = useState<'plan' | 'custom'>('plan');
  const [plan, setPlan] = useState('pro');
  const [pw, setPw] = useState('Kp7mRq2t');
  const [showPw, setShowPw] = useState(true);
  const labelCls = 'block text-sm font-medium mb-1.5 text-[#fafaf9]/70';
  const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none focus:border-emerald-500/50';
  const sectionHead = 'text-sm font-semibold uppercase tracking-wide text-[#fafaf9]/50';
  const req = <span className="text-red-400">*</span>;
  const customFields = [
    { label: 'Monthly ($)', ph: '499' }, { label: 'Setup ($)', ph: '1000' }, { label: 'Included min', ph: '2000' },
    { label: 'Per-min after ($)', ph: '0.15' }, { label: 'Call limit', ph: '-1 = unlimited' },
  ];
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-[#fafaf9]/40 hover:text-[#fafaf9]/70 transition-colors mb-4"><ArrowLeft className="h-4 w-4" />Back to Clients</button>
      <div className="mb-6"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Add New Client</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Set up a new AI receptionist. The client will receive a welcome SMS with their phone number.</p></div>
      <div data-tour="add-client-form" className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">

        {/* Business Information */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5"><Building2 className="h-4 w-4 text-emerald-400" /><h2 className={sectionHead}>Business Information</h2></div>
          <div className="space-y-4">
            <div><label className={labelCls}>Business Name {req}</label><input type="text" defaultValue="Comfort Air HVAC" className={inputCls} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Industry {req}</label><select defaultValue="HVAC" className={inputCls}><option>HVAC</option><option>Plumbing</option><option>Dental</option><option>Legal</option><option>Roofing</option><option>Auto Repair</option><option>Other</option></select></div>
              <div>
                <label className={labelCls}>Pricing</label>
                <div className="inline-flex rounded-lg p-0.5 mb-2 bg-white/[0.04] border border-white/[0.08]">{(['plan', 'custom'] as const).map(m => (<button key={m} type="button" onClick={() => setPmode(m)} className="px-3 py-1 rounded-md text-xs font-medium transition-colors" style={pmode === m ? { backgroundColor: '#10b981', color: '#050505' } : { color: 'rgba(250,250,249,0.7)' }}>{m === 'plan' ? 'Use a plan' : 'Custom'}</button>))}</div>
                {pmode === 'plan' ? (
                  <select value={plan} onChange={e => setPlan(e.target.value)} className={inputCls}><option value="starter">Starter - $149/mo</option><option value="pro">Professional - $199/mo</option><option value="growth">Growth - $349/mo</option></select>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">{customFields.map(f => (<div key={f.label}><label className="block text-[11px] mb-0.5 text-[#fafaf9]/70">{f.label}</label><input placeholder={f.ph} inputMode="decimal" className="w-full rounded-lg px-2.5 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div>))}</div>
                    <p className="text-[11px] text-[#fafaf9]/50">This client is billed exactly these amounts and never sees your standard plans.</p>
                  </div>
                )}
              </div>
            </div>
            <div><label className={labelCls}>Country {req}</label><select defaultValue="US" className={inputCls}><option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="AU">Australia</option></select></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>City {req}</label><input type="text" defaultValue="Atlanta" className={inputCls} /></div>
              <div><label className={labelCls}>State {req}</label><select defaultValue="GA" className={inputCls}><option value="GA">Georgia</option><option value="FL">Florida</option><option value="TX">Texas</option><option value="NY">New York</option><option value="CA">California</option></select></div>
            </div>
            <div><label className={labelCls}>Website URL <span className="font-normal text-[#fafaf9]/40">(optional, used to build AI knowledge base)</span></label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/40" /><input type="text" placeholder="www.comfortair.com" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div></div>
          </div>
        </div>

        {/* Owner / Contact */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5"><User className="h-4 w-4 text-emerald-400" /><h2 className={sectionHead}>Owner / Contact</h2></div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name {req}</label><input type="text" defaultValue="Maria" className={inputCls} /></div>
              <div><label className={labelCls}>Last Name</label><input type="text" defaultValue="Santos" className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Email {req}</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/40" /><input type="email" defaultValue="maria@comfortair.com" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div></div>
            <div><label className={labelCls}>Phone {req} <span className="font-normal text-[#fafaf9]/40">(+1)</span></label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/40" /><input type="tel" defaultValue="(678) 555-2002" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div></div>
          </div>
        </div>

        {/* Login Credentials */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5"><Lock className="h-4 w-4 text-emerald-400" /><h2 className={sectionHead}>Login Credentials</h2></div>
          <div><label className={labelCls}>Temporary Password {req}</label><div className="flex gap-2"><div className="relative flex-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/40" /><input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#fafaf9]/40">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><button type="button" onClick={() => setPw(Math.random().toString(36).slice(2, 10))} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm bg-white/[0.06] border border-white/[0.08] text-[#fafaf9]/70"><RefreshCw className="h-3.5 w-3.5" />Generate</button></div><p className="text-xs mt-1.5 text-[#fafaf9]/40">Share this with the client so they can log in. They can change it in their dashboard settings.</p></div>
        </div>

        {/* Submit */}
        <div className="p-5 sm:p-6">
          <div className="rounded-xl p-3.5 mb-4 flex gap-3 bg-white/[0.02] border border-white/[0.06]"><Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" /><p className="text-xs leading-relaxed text-[#fafaf9]/50">This will provision an AI receptionist with a local phone number, create the client&apos;s account, and send them a welcome SMS. They will start on a 7-day free trial with no credit card required. This may take up to 30 seconds.</p></div>
          <div className="flex flex-col sm:flex-row gap-3"><button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors">Add Client</button><button onClick={onBack} className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70">Cancel</button></div>
        </div>

      </div>
    </div>
  );
}

// ─── Agency: Leads ────────────────────────────────────────────────────────────

function AgencyLeads() {
  const [sq, setSq] = useState('');
  const [sf, setSf] = useState('');
  const getStatusStyle = (s: string) => {
    const m: Record<string, { bg: string; text: string }> = {
      new: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
      contacted: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      qualified: { bg: 'rgba(168,85,247,0.1)', text: '#a78bfa' },
      proposal: { bg: 'rgba(6,182,212,0.1)', text: '#22d3ee' },
      won: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      lost: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    };
    return m[s] || { bg: 'rgba(255,255,255,0.05)', text: 'rgba(250,250,249,0.5)' };
  };
  const getLabel = (s: string) => ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified', proposal: 'Proposal', won: 'Won', lost: 'Lost' }[s] || s);
  const isOverdue = (d: string | null) => { if (!d) return false; const dt = new Date(d); dt.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return dt < t; };
  const filtered = AGENCY.leads.filter(l => {
    const ms = !sq || l.name.toLowerCase().includes(sq.toLowerCase()) || l.contact.toLowerCase().includes(sq.toLowerCase());
    const mf = !sf || l.status === sf;
    return ms && mf;
  });
  const ls = AGENCY.leadStats;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Leads</h1><p className="mt-1 text-sm text-[#fafaf9]/50">{ls.total} total leads{ls.overdue > 0 && <span className="ml-2 text-amber-400">{ls.overdue} overdue</span>}</p></div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70"><FileSpreadsheet className="h-4 w-4" />Import CSV</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505]"><Plus className="h-4 w-4" />Add Lead</button>
          </div>
        </div>
      </div>

      {/* Overdue Banner */}
      {ls.overdue > 0 && (
        <div className="w-full mb-6 rounded-xl p-3 flex items-center justify-between bg-amber-500/[0.08] border border-amber-500/20">
          <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" /><div><p className="font-medium text-sm text-amber-300">{ls.overdue} overdue follow-up{ls.overdue > 1 ? 's' : ''}</p><p className="text-xs text-[#fafaf9]/40 hidden sm:block">Click to view leads that need attention</p></div></div>
          <ChevronRight className="h-5 w-5 text-amber-400 flex-shrink-0" />
        </div>
      )}

      {/* Stats Grid */}
      <div data-tour="leads-pipeline" className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-6">
        {([
          { label: 'Active', value: ls.active, icon: Target, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Qualified', value: ls.qualified, icon: TrendingUp, color: '#a78bfa', bg: 'rgba(168,85,247,0.1)' },
          { label: 'Pipeline', value: fmtCents(ls.pipeline), icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Sequence Due', value: '7', icon: Mail, color: '#a78bfa', bg: 'rgba(168,85,247,0.1)' },
          { label: 'Today', value: ls.followUpsToday, icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ] as const).map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 sm:gap-3"><div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: s.bg }}><s.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: s.color }} /></div><div><p className="text-[10px] sm:text-xs text-[#fafaf9]/40">{s.label}</p><p className="text-lg sm:text-xl font-semibold text-[#fafaf9]">{s.value}</p></div></div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" /><input type="text" placeholder="Search leads..." value={sq} onChange={e => setSq(e.target.value)} className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none" /></div>
        <select value={sf} onChange={e => setSf(e.target.value)} className="rounded-xl px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70 focus:outline-none"><option value="">All Status</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="won">Won</option><option value="lost">Lost</option></select>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-[#fafaf9]/40 border-b border-white/[0.06]"><div className="col-span-3">Business</div><div className="col-span-2">Contact</div><div className="col-span-2">Status</div><div className="col-span-2">Value</div><div className="col-span-2">Follow-up</div><div className="col-span-1"></div></div>
        {filtered.map((l, i) => {
          const ss = getStatusStyle(l.status);
          const overdue = isOverdue(l.followUp) && !['won','lost'].includes(l.status);
          return (
            <div key={l.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.03] cursor-pointer transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', backgroundColor: overdue ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
              {/* Mobile */}
              <div className="lg:hidden">
                <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3 min-w-0"><div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}><span className="text-xs font-medium text-blue-400">{l.name[0]}</span></div><div className="min-w-0"><p className="font-medium text-sm text-[#fafaf9] truncate">{l.name}</p><p className="text-xs text-[#fafaf9]/40 truncate">{l.contact}</p></div></div><ArrowUpRight className="h-4 w-4 text-[#fafaf9]/30 flex-shrink-0" /></div>
                <div className="flex items-center justify-between text-xs pl-12"><div className="flex items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: ss.bg, color: ss.text }}>{getLabel(l.status)}</span>{overdue && <AlertCircle className="h-3 w-3 text-red-400" />}</div><span className="text-[#fafaf9]/40">{l.value ? fmtCents(l.value) : '-'}</span></div>
              </div>
              {/* Desktop */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}><span className="text-sm font-medium text-blue-400">{l.name[0]}</span></div><div className="min-w-0"><p className="font-medium text-sm text-[#fafaf9] truncate">{l.name}</p><p className="text-xs text-[#fafaf9]/40 capitalize truncate">{l.industry}</p></div></div>
                <div className="col-span-2 min-w-0"><p className="text-sm text-[#fafaf9] truncate">{l.contact}</p><p className="text-xs text-[#fafaf9]/40 truncate">{l.email}</p></div>
                <div className="col-span-2"><span className="inline-flex rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: ss.bg, color: ss.text }}>{getLabel(l.status)}</span></div>
                <div className="col-span-2"><p className="text-sm text-[#fafaf9]">{l.value ? fmtCents(l.value) : '-'}</p>{l.value && <p className="text-xs text-[#fafaf9]/40">/month</p>}</div>
                <div className="col-span-2">{l.followUp ? (<div className="flex items-center gap-2">{overdue && <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />}<div><p className="text-sm" style={{ color: overdue ? '#ef4444' : '#fafaf9' }}>{new Date(l.followUp).toLocaleDateString()}</p>{overdue && <p className="text-xs text-red-400">Overdue</p>}</div></div>) : <p className="text-sm text-[#fafaf9]/40">Not set</p>}</div>
                <div className="col-span-1 flex justify-end"><ChevronRight className="h-4 w-4 text-[#fafaf9]/20" /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agency: Outreach ─────────────────────────────────────────────────────────

function AgencyOutreach() {
  const [sq, setSq] = useState('');
  const [tf, setTf] = useState<string | null>(null);
  const filtered = AGENCY.templates.filter(t => {
    const ms = !sq || t.name.toLowerCase().includes(sq.toLowerCase());
    const mt = !tf || t.type === tf;
    return ms && mt;
  });
  const emails = filtered.filter(t => t.type === 'email');
  const sms = filtered.filter(t => t.type === 'sms');
  const calls = filtered.filter(t => t.type === 'call_script');
  const renderRow = (t: typeof AGENCY.templates[0], i: number, total: number) => (
    <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.03] transition-colors cursor-pointer" style={{ borderBottom: i < total - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: t.type === 'email' ? 'rgba(168,85,247,0.1)' : t.type === 'sms' ? 'rgba(6,182,212,0.1)' : 'rgba(34,197,94,0.1)' }}>
          {t.type === 'email' ? <Mail className="h-4 w-4 text-purple-400" /> : t.type === 'sms' ? <MessageSquare className="h-4 w-4 text-cyan-400" /> : <PhoneCall className="h-4 w-4 text-green-400" />}
        </div>
        <div className="min-w-0"><div className="flex items-center gap-1.5"><p className="font-medium text-sm text-[#fafaf9] truncate">{t.name}</p>{i === 0 && <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400"><Sparkles className="h-2.5 w-2.5" />Default</span>}</div><p className="text-[11px] text-[#fafaf9]/40 truncate">{t.desc}</p></div>
      </div>
      <div className="flex items-center gap-1 ml-2"><span className="text-[10px] text-[#fafaf9]/30 hidden sm:inline mr-1">{t.sent}x</span><MoreVertical className="h-4 w-4 text-[#fafaf9]/30" /></div>
    </div>
  );
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Outreach</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Manage email, SMS, and call script templates</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505]"><Plus className="h-4 w-4" />New Template</button></div></div>
      {/* Quick Links */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-6">
        {[{ label: 'Email Template', sub: 'Create new email', icon: Mail, bg: 'rgba(59,130,246,0.1)', color: 'text-blue-400' }, { label: 'SMS Template', sub: 'Create new SMS', icon: MessageSquare, bg: 'rgba(6,182,212,0.1)', color: 'text-cyan-400' }, { label: 'Call Script', sub: 'Create cold call script', icon: PhoneCall, bg: 'rgba(34,197,94,0.1)', color: 'text-green-400' }].map(c => (
          <div key={c.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 hover:bg-white/[0.04] cursor-pointer transition-colors"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: c.bg }}><c.icon className={`h-5 w-5 ${c.color}`} /></div><div><p className="font-medium text-sm text-[#fafaf9]">{c.label}</p><p className="text-xs text-[#fafaf9]/40">{c.sub}</p></div></div></div>
        ))}
      </div>
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" /><input type="text" placeholder="Search templates..." value={sq} onChange={e => setSq(e.target.value)} className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none" /></div>
        <div className="flex items-center gap-1">{[{ v: null, l: 'All' }, { v: 'email', l: 'Email' }, { v: 'sms', l: 'SMS' }, { v: 'call_script', l: 'Call Scripts' }].map(f => (<button key={f.l} onClick={() => setTf(f.v)} className="rounded-lg px-3 py-2 text-xs font-medium transition-colors" style={tf === f.v ? { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' } : { color: 'rgba(250,250,249,0.5)' }}>{f.l}</button>))}</div>
      </div>
      {/* Grouped lists */}
      <div className="space-y-5">
        {emails.length > 0 && <div><div className="flex items-center gap-2 mb-2"><Mail className="h-4 w-4 text-[#fafaf9]/40" /><h3 className="text-xs font-medium text-[#fafaf9]/50">Email Templates</h3><span className="text-[10px] text-[#fafaf9]/30">({emails.length})</span></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">{emails.map((t, i) => renderRow(t, i, emails.length))}</div></div>}
        {sms.length > 0 && <div><div className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-[#fafaf9]/40" /><h3 className="text-xs font-medium text-[#fafaf9]/50">SMS Templates</h3><span className="text-[10px] text-[#fafaf9]/30">({sms.length})</span></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">{sms.map((t, i) => renderRow(t, i, sms.length))}</div></div>}
        {calls.length > 0 && <div><div className="flex items-center gap-2 mb-2"><PhoneCall className="h-4 w-4 text-[#fafaf9]/40" /><h3 className="text-xs font-medium text-[#fafaf9]/50">Call Scripts</h3><span className="text-[10px] text-[#fafaf9]/30">({calls.length})</span></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">{calls.map((t, i) => renderRow(t, i, calls.length))}</div></div>}
      </div>
    </div>
  );
}

// ─── Agency: Analytics (mirrors real analytics page) ──────────────────────────

function AgencyAnalytics() {
  const mx = Math.max(...AGENCY.revenueByMonth.map(r => r.amount), 1);
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Analytics & Revenue</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Track your earnings and client metrics.</p></div>
      <div data-tour="analytics-stats" className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        {([
          { label: 'Monthly Recurring', value: fmtCents(AGENCY.analyticsStats.mrr), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Earned', value: fmtCents(AGENCY.analyticsStats.totalEarned), icon: DollarSign, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Pending Payout', value: fmtCents(AGENCY.analyticsStats.pendingPayout), icon: Wallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Paying Clients', value: String(AGENCY.analyticsStats.activeClients), icon: Users, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', sub: `+${AGENCY.analyticsStats.trialClients} in trial` },
        ] as const).map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-4"><div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: s.bg }}><s.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: s.color }} /></div><div className="min-w-0"><p className="text-[10px] sm:text-xs text-[#fafaf9]/50">{s.label}</p><p className="text-lg sm:text-2xl font-semibold text-[#fafaf9]">{s.value}</p>{'sub' in s && s.sub && <p className="text-[10px] text-[#fafaf9]/40">{s.sub}</p>}</div></div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6">
          <h3 className="font-medium mb-4 text-sm text-[#fafaf9]">Revenue Over Time</h3>
          <div className="h-36 sm:h-48"><div className="flex items-end justify-between h-full gap-1 sm:gap-2">
            {AGENCY.revenueByMonth.map((item, idx) => (<div key={item.month} className="flex-1 flex flex-col items-center gap-1"><div className="w-full flex flex-col items-center justify-end h-28 sm:h-40"><div className="w-full max-w-[32px] sm:max-w-[40px] rounded-t-lg" style={{ height: `${Math.max((item.amount / mx) * 100, 4)}%`, backgroundColor: '#10b981', opacity: 0.5 + (idx / AGENCY.revenueByMonth.length) * 0.5 }} title={fmtCents(item.amount)} /></div><span className="text-[8px] sm:text-xs text-[#fafaf9]/40">{fmtMonth(item.month)}</span></div>))}
          </div></div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6">
          <h3 className="font-medium mb-4 text-sm text-[#fafaf9]">Revenue by Plan</h3>
          <div className="space-y-4">
            {[{ plan: 'Starter', count: AGENCY.planClients.starter, price: 14900, color: '#3b82f6' }, { plan: 'Professional', count: AGENCY.planClients.pro, price: 19900, color: '#10b981' }, { plan: 'Growth', count: AGENCY.planClients.growth, price: 34900, color: '#a78bfa' }].map(p => {
              const rev = p.count * p.price; const pct = (rev / AGENCY.analyticsStats.mrr) * 100;
              return (<div key={p.plan}><div className="flex items-center justify-between mb-1"><span className="text-xs sm:text-sm text-[#fafaf9]">{p.plan}</span><span className="text-xs sm:text-sm font-medium text-[#fafaf9]">{fmtCents(rev)}</span></div><div className="h-1.5 sm:h-2 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} /></div><p className="text-[10px] text-[#fafaf9]/40 mt-1">{p.count} client{p.count !== 1 ? 's' : ''}</p></div>);
            })}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-white/[0.06]"><h3 className="font-medium text-sm text-[#fafaf9]">Recent Transactions</h3></div>
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-[#fafaf9]/40 border-b border-white/[0.06]"><div className="col-span-4">Client</div><div className="col-span-2">Amount</div><div className="col-span-2">Status</div><div className="col-span-2">Type</div><div className="col-span-2 text-right">Date</div></div>
        {AGENCY.payments.map((p, i) => (
          <div key={p.id} className="px-4 sm:px-6 py-3 sm:py-4" style={{ borderBottom: i < AGENCY.payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="lg:hidden"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0"><span className="text-xs font-medium text-emerald-400">{p.client[0]}</span></div><span className="text-sm text-[#fafaf9] truncate">{p.client}</span></div><span className="font-medium text-sm text-[#fafaf9]">{fmtCents(p.amount)}</span></div><div className="flex items-center justify-between text-xs pl-11"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span><span className="text-[#fafaf9]/40">{new Date(p.date).toLocaleDateString()}</span></div></div>
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center"><div className="col-span-4 flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10"><span className="text-xs font-medium text-emerald-400">{p.client[0]}</span></div><span className="text-sm text-[#fafaf9] truncate">{p.client}</span></div><div className="col-span-2 font-medium text-sm text-[#fafaf9]">{fmtCents(p.amount)}</div><div className="col-span-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span></div><div className="col-span-2 text-sm text-[#fafaf9]/40 capitalize">{p.type}</div><div className="col-span-2 text-right text-sm text-[#fafaf9]/40">{new Date(p.date).toLocaleDateString()}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agency: Branding (mirrors real branding page) ────────────────────────────

function AgencyBranding() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10"><Paintbrush className="h-5 w-5 text-emerald-400" /></div><div><h1 className="text-xl sm:text-2xl font-bold text-[#fafaf9]">Dashboard Branding</h1><p className="text-sm mt-0.5 text-[#fafaf9]/50">Customize colors for your agency and client dashboards</p></div></div>
        <div className="flex items-center gap-2"><button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border border-white/[0.06] bg-white/[0.02] text-[#fafaf9]/50"><RotateCcw className="h-4 w-4" />Reset All</button><button className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><Save className="h-4 w-4" />Save Changes</button></div>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0"><Sparkles className="h-4 w-4 text-emerald-400" /></div><div><p className="text-sm font-medium text-[#fafaf9]">Auto-generate a palette</p><p className="text-xs mt-0.5 text-[#fafaf9]/40">Shuffles your brand colors into different arrangements</p></div></div>
        <button className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505] flex-shrink-0"><Shuffle className="h-4 w-4" />Shuffle</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl px-4 py-3 flex items-center justify-between border border-white/[0.06] bg-white/[0.02]"><div className="flex items-center gap-2"><Paintbrush className="h-4 w-4 text-[#fafaf9]/40" /><span className="text-sm text-[#fafaf9]/50">2 custom colors active</span></div><span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400">dark mode</span></div>
          {[{ g: 'Sidebar / Navigation', f: [{ l: 'Sidebar Background', c: '#0a2e1f', custom: true }, { l: 'Sidebar Text', c: '#ffffff', custom: false }] }, { g: 'Page Background', f: [{ l: 'Page Background', c: '#0a0a0a', custom: false }] }, { g: 'Cards & Surfaces', f: [{ l: 'Card Background', c: '#111111', custom: false }, { l: 'Card Border', c: '#1a1a1a', custom: true }] }, { g: 'Text Colors', f: [{ l: 'Primary Text', c: '#fafaf9', custom: false }, { l: 'Muted Text', c: '#888888', custom: false }] }].map(s => (
            <div key={s.g} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]"><Paintbrush className="h-4 w-4 text-emerald-400" /><span className="text-sm font-semibold text-[#fafaf9]">{s.g}</span></div>
              <div className="p-3 space-y-2">{s.f.map(f => (<div key={f.l} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ backgroundColor: f.custom ? 'rgba(16,185,129,0.05)' : 'transparent', border: f.custom ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.04)' }}><div className="w-9 h-9 rounded-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: f.c }} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-medium text-[#fafaf9]">{f.l}</span>{f.custom && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">Custom</span>}</div></div><span className="w-[90px] text-xs font-mono text-center rounded-lg px-2 py-1.5 bg-white/[0.04] border border-white/[0.06] text-[#fafaf9]/60">{f.c}</span></div>))}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2"><div className="sticky top-6 space-y-4">
          <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-emerald-400" /><span className="text-sm font-semibold text-[#fafaf9]">Live Preview</span></div>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden"><div className="flex" style={{ height: '260px' }}>
            <div className="w-[130px] flex-shrink-0 p-3 bg-[#0a2e1f] border-r border-white/10"><div className="flex items-center gap-2 mb-3 px-1"><div className="w-5 h-5 rounded bg-emerald-500/20" /><div className="h-2 rounded-full flex-1 bg-white/40" /></div>{['Dashboard', 'Clients', 'Settings'].map((l, i) => (<div key={l} className="flex items-center gap-2 rounded-lg px-2 py-1.5 mb-0.5" style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent' }}><div className="w-3 h-3 rounded" style={{ backgroundColor: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }} /><span className="text-[9px]" style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.6)' }}>{l}</span></div>))}</div>
            <div className="flex-1 p-3 bg-[#0a0a0a]"><div className="h-3 w-20 rounded-full bg-white/60 mb-3" /><div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(n => (<div key={n} className="rounded-lg p-2.5 bg-[#111] border border-[#1a1a1a]"><div className="h-1.5 w-10 rounded-full bg-white/30 mb-1.5" /><div className="h-3 w-14 rounded-full bg-white/50 mb-1.5" /><div className="h-1 w-full rounded-full bg-white/10" /></div>))}</div><div className="mt-2.5 flex gap-2"><div className="rounded-lg px-2.5 py-1 bg-emerald-500"><span className="text-[9px] font-medium text-[#050505]">Primary</span></div><div className="rounded-lg px-2.5 py-1 bg-[#111] border border-[#1a1a1a]"><span className="text-[9px] font-medium text-white/70">Secondary</span></div></div></div>
          </div></div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"><p className="text-xs font-medium mb-2 text-[#fafaf9]/40">Your brand colors</p><div className="flex gap-3">{[{ l: 'Primary', c: '#10b981' }, { l: 'Secondary', c: '#059669' }, { l: 'Accent', c: '#34d399' }].map(({ l, c }) => (<div key={l} className="flex items-center gap-1.5 flex-1"><div className="w-5 h-5 rounded-md border border-white/10 flex-shrink-0" style={{ backgroundColor: c }} /><div><p className="text-[10px] font-medium text-[#fafaf9]">{l}</p><p className="text-[9px] font-mono text-[#fafaf9]/40">{c}</p></div></div>))}</div></div>
        </div></div>
      </div>
    </div>
  );
}

// ─── Agency: Demo Phone ───────────────────────────────────────────────────────

function AgencyDemoPhone() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Demo Phone</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Your dedicated demo line for showcasing AI receptionist capabilities</p></div>

      {/* Active Demo Card */}
      <div data-tour="demo-phone" className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10"><Phone className="h-5 w-5 text-emerald-400" /></div>
            <div><h3 className="font-semibold text-base sm:text-lg text-[#fafaf9]">Your Demo Number</h3><span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Active</span></div>
          </div>
        </div>

        {/* Gradient phone display */}
        <div className="flex items-center justify-between rounded-xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #10b981, #10b981dd)' }}>
          <div className="flex items-center gap-3"><PhoneCall className="h-6 w-6 text-[#050505]" /><span className="text-xl sm:text-2xl font-bold tracking-wide text-[#050505]">(678) 555-0199</span></div>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 text-[#050505]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Usage hints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="flex items-start gap-3 rounded-lg p-3 bg-white/[0.03]"><MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="text-xs font-medium text-[#fafaf9]">Post-call SMS</p><p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Callers automatically receive your signup link via text after hanging up</p></div></div>
          <div className="flex items-start gap-3 rounded-lg p-3 bg-white/[0.03]"><Headphones className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="text-xs font-medium text-[#fafaf9]">On your marketing site</p><p className="text-[10px] sm:text-xs text-[#fafaf9]/40">This number appears automatically in your &quot;Experience It Live&quot; section</p></div></div>
        </div>

        <button className="flex items-center gap-2 text-xs text-red-400"><Trash2 className="h-3.5 w-3.5" />Delete demo number</button>
      </div>

      {/* How It Works */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <h3 className="font-semibold text-sm sm:text-base text-[#fafaf9] mb-1">How the Demo Works</h3>
        <p className="text-xs sm:text-sm text-[#fafaf9]/40 mb-5">When a prospect calls your demo number, the AI walks them through an interactive experience</p>
        <div className="space-y-4 mb-6">
          {([
            { step: '1', icon: Mic, title: 'AI greets the caller', desc: 'A warm, professional voice answers and explains this is a live demo of your AI receptionist service.' },
            { step: '2', icon: Users, title: 'Gathers business context', desc: 'The AI asks "What type of business do you run?", plumber, dentist, lawyer, restaurant, anything.' },
            { step: '3', icon: Bot, title: 'Roleplays as their receptionist', desc: 'Based on their answer, the AI acts out a realistic call scenario for their industry, taking a service request, scheduling an appointment, etc.' },
            { step: '4', icon: Sparkles, title: 'Showcases key features', desc: 'The AI naturally mentions instant text summaries, 24/7 availability, and how setup takes just minutes.' },
            { step: '5', icon: MessageSquare, title: 'Follow-up SMS with signup link', desc: 'After the call ends, the caller automatically receives a text with your signup link so they can start their free trial.' },
          ] as const).map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5 bg-emerald-500/10"><item.icon className="h-4 w-4 text-emerald-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#fafaf9]"><span className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold mr-1.5 bg-emerald-500/15 text-emerald-400">{item.step}</span>{item.title}</p>
                <p className="text-[10px] sm:text-xs mt-0.5 text-[#fafaf9]/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why this converts */}
        <div className="rounded-lg p-4 bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs font-medium mb-2 text-[#fafaf9]">💡 Why this converts</p>
          <p className="text-[10px] sm:text-xs leading-relaxed text-[#fafaf9]/40">
            Instead of explaining what an AI receptionist does, prospects <strong className="text-[#fafaf9]/70">experience it firsthand</strong>. 
            They hear the voice quality, feel the natural conversation flow, and see how it handles their specific industry, 
            all in a 60-second phone call. The follow-up text makes it effortless to convert from &quot;that was cool&quot; to &quot;I want this for my business.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Agency: Marketing (mirrors real marketing website page) ──────────────────

function AgencyMarketing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState<string | null>(null);
  const [tmpl, setTmpl] = useState('classic');
  const TEMPLATES = [{ id: 'classic', name: 'Classic', style: 'Professional & Versatile', desc: 'Clean, professional layout that works for every industry.' }, { id: 'beside', name: 'Beside', style: 'Modern & Story-Driven', desc: 'Product-led storytelling with a split hero and floating UI mockups.' }, { id: 'editorial', name: 'Editorial', style: 'Premium & Editorial', desc: 'Serif headlines, organic wave art, and large testimonials.' }];
  const tabs = [{ id: 'overview', label: 'Overview', icon: Globe }, { id: 'template', label: 'Template', icon: LayoutDashboard }, { id: 'content', label: 'Content', icon: FileText }, { id: 'colors', label: 'Colors', icon: Palette }, { id: 'domain', label: 'Domain', icon: LinkIcon }, { id: 'tracking', label: 'Tracking', icon: BarChart3 }, { id: 'seo', label: 'SEO & Social', icon: Share2 }];
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Marketing Website</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Your public website where clients learn about your service</p></div>
      {/* Quick Actions */}
      <div data-tour="marketing-site" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-start justify-between mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><Globe className="h-5 w-5 text-emerald-400" /></div><span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span></div><h3 className="font-medium text-sm mb-1 text-[#fafaf9]">Your Website</h3><p className="text-xs mb-3 text-[#fafaf9]/40 truncate">https://demo.myvoiceaiconnect.com</p><div className="flex gap-2"><button className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium bg-emerald-500 text-[#050505]"><Eye className="h-4 w-4" />View</button><button onClick={() => { setCopied('url'); setTimeout(() => setCopied(null), 2000); }} className="flex items-center justify-center rounded-lg px-3 py-2 bg-white/[0.04] border border-white/[0.08]">{copied === 'url' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-[#fafaf9]/40" />}</button></div></div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-start justify-between mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><Palette className="h-5 w-5 text-emerald-400" /></div></div><h3 className="font-medium text-sm mb-1 text-[#fafaf9]">Active Template</h3><p className="text-xs mb-3 text-[#fafaf9]/40">Classic, Professional &amp; Versatile</p><button onClick={() => setActiveTab('template')} className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/60"><LayoutDashboard className="h-4 w-4" />Change Template</button></div>
      </div>
      {/* Tabs */}
      <div className="mb-4 overflow-x-auto border-b border-white/[0.06]"><nav className="flex gap-5 min-w-max">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-1.5 pb-3 text-xs font-medium border-b-2 transition-colors" style={activeTab === tab.id ? { borderColor: '#10b981', color: '#10b981' } : { borderColor: 'transparent', color: 'rgba(250,250,249,0.4)' }}><tab.icon className="h-4 w-4" />{tab.label}</button>))}</nav></div>
      {/* Overview */}
      {activeTab === 'overview' && (<div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><h3 className="font-medium text-sm mb-4 text-[#fafaf9]">Your website includes:</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[{ t: 'Hero Section', d: 'Eye-catching headline with CTAs' }, { t: 'Features Overview', d: 'AI receptionist capabilities' }, { t: 'How It Works', d: '4-step process to get started' }, { t: 'Pricing Plans', d: 'Starter, Pro, and Growth tiers' }, { t: 'Testimonials', d: 'Social proof section' }, { t: 'FAQ Section', d: 'Common questions answered' }, { t: 'Industry Cards', d: 'Industries you serve' }, { t: 'Comparison Table', d: 'Compare vs competitors' }].map(i => (<div key={i.t} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="font-medium text-xs text-[#fafaf9]">{i.t}</p><p className="text-[10px] text-[#fafaf9]/40">{i.d}</p></div></div>))}</div></div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><h3 className="font-medium text-sm mb-4 text-[#fafaf9]">Current Settings</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{ l: 'Tagline', v: 'AI-Powered Phone Answering' }, { l: 'Headline', v: 'Never Miss Another Call' }, { l: 'Theme', v: 'Dark' }, { l: 'Domain', v: 'voiceai.youragency.com' }].map(s => (<div key={s.l}><p className="text-[10px] uppercase tracking-wide mb-1 text-[#fafaf9]/40">{s.l}</p><p className="text-xs text-[#fafaf9] truncate">{s.v}</p></div>))}</div></div>
      </div>)}
      {activeTab === 'template' && (<div className="space-y-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><h3 className="font-medium text-sm text-[#fafaf9] mb-1">Choose Your Template</h3><p className="text-xs text-[#fafaf9]/40">Each template has a unique layout and style. Your content carries over between templates.</p></div>
        {TEMPLATES.map(t => { const active = tmpl === t.id; return (<div key={t.id} className="rounded-2xl overflow-hidden border bg-white/[0.025]" style={{ borderColor: active ? '#10b981' : 'rgba(255,255,255,0.08)' }}><div className="p-4 flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h4 className="font-semibold text-sm text-[#fafaf9]">{t.name}</h4>{active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Active</span>}</div><p className="text-xs font-medium text-emerald-400 mt-0.5">{t.style}</p><p className="text-xs text-[#fafaf9]/40 mt-1">{t.desc}</p></div>{active ? (<span className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 flex-shrink-0"><CheckCircle2 className="h-3.5 w-3.5" />Active</span>) : (<button onClick={() => setTmpl(t.id)} className="text-xs font-medium px-4 py-2 rounded-lg bg-emerald-500 text-[#050505] flex-shrink-0">Select</button>)}</div></div>); })}
      </div>)}
      {activeTab === 'content' && (<div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6 space-y-4"><h3 className="font-medium text-sm text-[#fafaf9]">Website Content</h3><p className="text-xs text-[#fafaf9]/40 mb-4">Customize the text on your marketing website.</p>{[{ l: 'Tagline / Badge', v: 'AI-Powered Phone Answering', p: 'AI-Powered Phone Answering' }, { l: 'Main Headline', v: 'Never Miss Another Call', p: 'Never Miss Another Call' }, { l: 'Subheadline', v: 'Our AI receptionist answers calls 24/7...', p: 'AI Receptionist Starting at $49/month' }].map(f => (<div key={f.l}><label className="block text-xs font-medium mb-1.5 text-[#fafaf9]/60">{f.l}</label><input type="text" defaultValue={f.v} placeholder={f.p} className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div>))}<button className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505] mt-2"><Save className="h-4 w-4" />Save Content</button></div>)}
      {activeTab === 'domain' && (<div className="space-y-4"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><h3 className="font-medium text-sm mb-1 text-[#fafaf9]">Default Subdomain</h3><p className="text-xs text-[#fafaf9]/40 mb-3">Always available at this URL</p><div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]"><Globe className="h-5 w-5 text-[#fafaf9]/40 flex-shrink-0" /><span className="flex-1 text-xs font-mono text-[#fafaf9] truncate">https://demo.myvoiceaiconnect.com</span><Copy className="h-4 w-4 text-[#fafaf9]/30" /></div></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><div className="flex items-center justify-between mb-2"><h3 className="font-medium text-sm text-[#fafaf9]">Custom Domain</h3><span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span></div><p className="text-xs text-[#fafaf9]/40 mb-3">Connect your own domain</p><input type="text" defaultValue="voiceai.youragency.com" className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div></div>)}
    </div>
  );
}

// ─── Agency: Referrals (mirrors real referrals page) ──────────────────────────

function AgencyReferrals() {
  const [copied, setCopied] = useState(false);
  const refLink = 'https://myvoiceaiconnect.com/signup?ref=aivoicepro';
  const referrals = [
    { id: '1', name: 'ReachLocal Marketing', status: 'active', plan: 'professional', date: '2026-01-15' },
    { id: '2', name: 'GrowthSpark Agency', status: 'active', plan: 'starter', date: '2026-02-08' },
    { id: '3', name: 'NovaTech Solutions', status: 'trial', plan: 'professional', date: '2026-03-02' },
  ];
  const commissions = [
    { id: 'c1', amount: 7960, status: 'transferred', from: 'ReachLocal Marketing', date: '2026-03-01' },
    { id: 'c2', amount: 7960, status: 'active', from: 'ReachLocal Marketing', date: '2026-02-01' },
    { id: 'c3', amount: 3960, status: 'active', from: 'GrowthSpark Agency', date: '2026-03-01' },
    { id: 'c4', amount: 3960, status: 'pending', from: 'NovaTech Solutions', date: '2026-03-05' },
  ];
  const fmtC = (c: number) => `$${(c / 100).toFixed(2)}`;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      <div className="mb-8"><div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15"><Gift className="h-5 w-5 text-emerald-400" /></div><h1 className="text-2xl font-semibold text-[#fafaf9]">Referral Program</h1></div><p className="text-[#fafaf9]/50">Earn 40% recurring commission for every agency you refer</p></div>
      {/* Referral Link */}
      <div className="rounded-2xl p-6 mb-8 bg-emerald-500/[0.06] border border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4"><div><h2 className="font-medium text-[#fafaf9] flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400" />Your Referral Link</h2><p className="text-sm mt-1 text-[#fafaf9]/40">Share this link to earn commissions</p></div><button className="flex items-center gap-2 text-sm text-emerald-400"><Edit2 className="h-4 w-4" />Customize Code</button></div>
        <div className="flex flex-col sm:flex-row gap-3"><div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 bg-white/[0.04] border border-white/[0.08]"><span className="text-sm text-[#fafaf9] truncate flex-1">{refLink}</span></div><button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-6 py-3 rounded-xl font-medium bg-white/[0.06] border border-white/[0.08] text-[#fafaf9] flex items-center justify-center gap-2">{copied ? <><Check className="h-4 w-4 text-emerald-400" />Copied!</> : <><Copy className="h-4 w-4" />Copy Link</>}</button></div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ l: 'Total Referrals', v: '3', sub: '2 active', icon: Users }, { l: 'This Month', v: '$119.20', icon: TrendingUp }, { l: 'Lifetime Earnings', v: '$238.40', icon: DollarSign }, { l: 'Available Balance', v: '$158.80', icon: Banknote, hl: true }].map(s => (
          <div key={s.l} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: s.hl ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border: s.hl ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.hl ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}><s.icon className="h-5 w-5" style={{ color: s.hl ? '#10b981' : 'rgba(250,250,249,0.5)' }} /></div></div>
            <p className="text-sm mb-1 text-[#fafaf9]/50">{s.l}</p><p className="text-2xl font-semibold" style={{ color: s.hl ? '#10b981' : '#fafaf9' }}>{s.v}</p>{s.sub && <p className="text-xs mt-1 text-[#fafaf9]/40">{s.sub}</p>}
          </div>
        ))}
      </div>
      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"><div className="p-5 border-b border-white/[0.06]"><h3 className="font-medium text-[#fafaf9]">Your Referrals</h3></div>{referrals.map((r, i) => (<div key={r.id} className="p-4 hover:bg-white/[0.03] transition-colors" style={{ borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}><div className="flex items-center justify-between"><div><p className="font-medium text-[#fafaf9]">{r.name}</p><p className="text-sm text-[#fafaf9]/40">Joined {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.status}</span></div></div>))}</div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"><div className="p-5 border-b border-white/[0.06]"><h3 className="font-medium text-[#fafaf9]">Commission History</h3></div>{commissions.map((c, i) => (<div key={c.id} className="p-4 hover:bg-white/[0.03] transition-colors" style={{ borderBottom: i < commissions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}><div className="flex items-center justify-between"><div><p className="font-medium text-emerald-400">+{fmtC(c.amount)}</p><p className="text-sm text-[#fafaf9]/40">From {c.from}</p></div><div className="text-right"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'transferred' ? 'bg-emerald-500/10 text-emerald-400' : c.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.06] text-[#fafaf9]/50'}`}>{c.status}</span><p className="text-xs mt-1 text-[#fafaf9]/30">{new Date(c.date).toLocaleDateString()}</p></div></div></div>))}</div>
      </div>
      {/* How it works */}
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"><h3 className="font-medium mb-4 text-[#fafaf9]">How It Works</h3><div className="grid sm:grid-cols-3 gap-6">{[{ n: '1', t: 'Share Your Link', d: 'Share your unique referral link with other agency owners' }, { n: '2', t: 'They Sign Up', d: "When they create an agency using your link, they're linked to you" }, { n: '3', t: 'Earn 40% Forever', d: 'Earn 40% of their subscription fee every month they stay subscribed' }].map(s => (<div key={s.n} className="flex gap-4"><div className="flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-sm flex-shrink-0 bg-emerald-500/15 text-emerald-400">{s.n}</div><div><p className="font-medium text-sm text-[#fafaf9]">{s.t}</p><p className="text-xs mt-1 text-[#fafaf9]/40">{s.d}</p></div></div>))}</div></div>
    </div>
  );
}

// ─── Agency: Settings (mirrors real settings/page.tsx + PlansEditor.tsx) ───────

const SETTINGS_CORE_FEATURES = [
  'AI receptionist available 24/7', 'Dedicated business phone number', 'Two-way text messaging',
  'Call recordings & transcripts', 'AI-powered call summaries', 'Google Calendar appointment booking',
  'Call history dashboard',
];

const SETTINGS_FEATURE_ROWS: { key: string; label: string }[] = [
  { key: 'knowledge_base', label: 'Knowledge Base' },
  { key: 'custom_voice', label: 'Custom Voice' },
  { key: 'custom_greeting', label: 'Custom Greeting' },
  { key: 'business_hours', label: 'Business Hours Routing' },
  { key: 'call_transfer', label: 'Live Call Transfer' },
  { key: 'transfer_fallback', label: 'Transfer Fallback' },
  { key: 'caller_recognition', label: 'Caller Recognition' },
  { key: 'spam_detection', label: 'Spam & Robocall Detection' },
];

interface DemoPlan { id: string; name: string; price: string; calls: string; unlimited: boolean; minutes: string; seats: string; tagline: string; visible: boolean; popular: boolean; features: Record<string, boolean>; }

const SETTINGS_PLANS_SEED: DemoPlan[] = [
  { id: 'starter', name: 'Starter', price: '149', calls: '50', unlimited: false, minutes: '300', seats: '0', tagline: 'Great for solo operators', visible: true, popular: false, features: { knowledge_base: false, custom_voice: false, custom_greeting: false, business_hours: true, call_transfer: false, transfer_fallback: false, caller_recognition: false, spam_detection: true } },
  { id: 'pro', name: 'Professional', price: '199', calls: '150', unlimited: false, minutes: '600', seats: '2', tagline: 'Most popular with growing teams', visible: true, popular: true, features: { knowledge_base: true, custom_voice: false, custom_greeting: true, business_hours: true, call_transfer: true, transfer_fallback: true, caller_recognition: true, spam_detection: true } },
  { id: 'growth', name: 'Growth', price: '349', calls: '', unlimited: true, minutes: '2000', seats: '5', tagline: 'For high call volume', visible: true, popular: false, features: { knowledge_base: true, custom_voice: true, custom_greeting: true, business_hours: true, call_transfer: true, transfer_fallback: true, caller_recognition: true, spam_detection: true } },
];

function SettingsSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: on ? '#10b981' : 'rgba(255,255,255,0.15)' }}>
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform" style={{ transform: on ? 'translateX(19px)' : 'translateX(3px)' }} />
    </button>
  );
}

// Side-by-side plans matrix: plans are columns, toggleable features are rows.
// Mirrors components/agency/PlansEditor.tsx with sample data (no persistence).
function AgencyPlansMatrix() {
  const [plans, setPlans] = useState<DemoPlan[]>(SETTINGS_PLANS_SEED);
  const toggle = (idx: number, key: string) => setPlans(prev => prev.map((p, i) => (i === idx ? { ...p, features: { ...p.features, [key]: !p.features[key] } } : p)));
  const setVisible = (idx: number) => setPlans(prev => prev.map((p, i) => (i === idx ? { ...p, visible: !p.visible } : p)));
  const removePlan = (idx: number) => setPlans(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  const addPlan = () => setPlans(prev => (prev.length >= 6 ? prev : [...prev, { id: 'p' + Date.now(), name: 'New Plan', price: '', calls: '50', unlimited: false, minutes: '200', seats: '0', tagline: '', visible: true, popular: false, features: {} }]));

  const cellBorder = '1px solid rgba(255,255,255,0.08)';
  const rowLine = 'rgba(255,255,255,0.06)';
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `minmax(140px, 180px) repeat(${plans.length}, minmax(200px, 1fr))`, minWidth: 'min-content' };
  const colStyle = (visible: boolean): React.CSSProperties => ({ backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: cellBorder, borderRight: cellBorder, borderTop: `1px solid ${rowLine}`, opacity: visible ? 1 : 0.55 });
  const inputCls = 'w-full min-w-0 rounded-lg px-3 py-2 text-sm bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none';

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div style={gridStyle}>
          <div className="p-4 flex items-end"><p className="text-xs leading-relaxed text-[#fafaf9]/40">Set up each plan across the top, then toggle its features in the rows below.</p></div>
          {plans.map((p, idx) => (
            <div key={p.id} className="p-4 rounded-t-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: cellBorder, borderRight: cellBorder, borderTop: cellBorder, opacity: p.visible ? 1 : 0.55 }}>
              <div className="flex items-center gap-2 mb-2"><input defaultValue={p.name} className="flex-1 min-w-0 rounded-lg px-3 py-2 text-base font-semibold bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none" />{p.popular && <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Popular</span>}</div>
              <div className="flex items-center gap-1 mb-3">
                <button type="button" onClick={() => setVisible(idx)} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium bg-white/[0.04]" style={{ color: p.visible ? '#10b981' : 'rgba(250,250,249,0.4)' }}>{p.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{p.visible ? 'Visible' : 'Hidden'}</button>
                <div className="flex-1" />
                <button type="button" disabled={idx === 0} className="disabled:opacity-30 p-1.5 text-[#fafaf9]/40"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" disabled={idx === plans.length - 1} className="disabled:opacity-30 p-1.5 text-[#fafaf9]/40"><ChevronRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => removePlan(idx)} disabled={plans.length <= 1} className="p-1.5 disabled:opacity-30 text-[#fafaf9]/40"><Trash2 className="h-4 w-4" /></button>
              </div>
              <label className="block text-[11px] font-medium mb-1 text-[#fafaf9]/40">Price ($/mo)</label>
              <div className="relative mb-3"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#fafaf9]/40">$</span><input defaultValue={p.price} placeholder="0" className="w-full rounded-lg pl-7 pr-3 py-2 text-base font-semibold bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div>
              <label className="block text-[11px] font-medium mb-1 text-[#fafaf9]/40">Calls / mo</label>
              {p.unlimited ? (
                <div className="w-full rounded-lg px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2 mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.09)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}><InfinityIcon className="h-4 w-4" /> Unlimited</div>
              ) : (
                <div className="mb-3"><input defaultValue={p.calls} className={inputCls} /></div>
              )}
              <label className="block text-[11px] font-medium mb-1 text-[#fafaf9]/40">Included min / mo</label>
              <div className="mb-1"><input defaultValue={p.minutes} className={inputCls} /></div>
              <p className="mb-3 text-[10px] leading-tight text-[#fafaf9]/40">Minutes bundled into the price. 0 = every minute billed at the per-minute rate.</p>
              <label className="block text-[11px] font-medium mb-1 text-[#fafaf9]/40">Client team seats</label>
              <div className="mb-1"><input defaultValue={p.seats} className={inputCls} /></div>
              <p className="text-[10px] leading-tight text-[#fafaf9]/40">Extra dashboard logins beyond the owner. 0 = owner only.</p>
            </div>
          ))}
          <div className="px-4 pt-5 pb-2 flex items-end"><p className="text-[11px] font-bold uppercase tracking-wider text-[#fafaf9]/40">Features</p></div>
          {plans.map(p => (<div key={p.id} className="pt-5 pb-2" style={colStyle(p.visible)} />))}
          {SETTINGS_FEATURE_ROWS.map(row => (
            <React.Fragment key={row.key}>
              <div className="px-4 py-3 flex items-center"><span className="text-sm text-[#fafaf9]">{row.label}</span></div>
              {plans.map((p, idx) => (<div key={p.id} className="px-4 py-3 flex items-center justify-center" style={colStyle(p.visible)}><SettingsSwitch on={!!p.features[row.key]} onClick={() => toggle(idx, row.key)} /></div>))}
            </React.Fragment>
          ))}
          <div className="h-3" />
          {plans.map(p => (<div key={p.id} className="h-3 rounded-b-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: cellBorder, borderRight: cellBorder, borderBottom: cellBorder, borderTop: `1px solid ${rowLine}`, opacity: p.visible ? 1 : 0.55 }} />))}
        </div>
      </div>
      {plans.length < 6 && (
        <button type="button" onClick={addPlan} className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors mt-4 text-emerald-400" style={{ border: '1px dashed rgba(255,255,255,0.12)' }}><Plus className="h-4 w-4" /> Add a plan</button>
      )}
    </div>
  );
}

function AgencySettings() {
  const [tab, setTab] = useState('profile');
  const [billMyself, setBillMyself] = useState(false);
  const [billMethod, setBillMethod] = useState('');
  const [requireCard, setRequireCard] = useState(false);
  const tabs = [
    { id: 'profile', label: 'Profile', icon: Building },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'twilio', label: 'Twilio', icon: Globe },
    { id: 'embed', label: 'Embed', icon: Code },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'demo', label: 'Demo Mode', icon: Eye },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];
  const labelCls = 'block text-xs font-medium mb-1.5 text-[#fafaf9]/60';
  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none';
  const cardCls = 'rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]';
  const infoPill = 'rounded-xl p-3 flex items-start gap-2.5 bg-blue-500/[0.06] border border-blue-500/15';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#fafaf9]">Settings</h1><p className="mt-1 text-sm text-[#fafaf9]/50">Manage your agency settings</p></div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-48 flex-shrink-0"><nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">{tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap" style={tab === t.id ? { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' } : { color: 'rgba(250,250,249,0.5)' }}><t.icon className="h-4 w-4" />{t.label}{t.id === 'demo' && <div className="w-2 h-2 rounded-full ml-auto flex-shrink-0 bg-emerald-400" />}</button>))}</nav></div>
        {/* Content */}
        <div className={`flex-1 ${tab === 'pricing' ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6">

            {tab === 'profile' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Agency Profile</h3><p className="text-xs text-[#fafaf9]/40">Basic information about your agency.</p></div>
              <div><label className={labelCls}>Agency Name</label><input type="text" defaultValue="AI Voice Pro" className={inputCls} /></div>
              <div><label className={labelCls}>Logo</label><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08]"><span className="text-2xl font-bold text-emerald-400">{AGENCY.name.charAt(0)}</span></div><button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/60"><Upload className="h-4 w-4" />Upload</button></div><p className="mt-1.5 text-[10px] text-[#fafaf9]/30">PNG, JPG up to 2MB</p></div>
              <div><label className={labelCls}>Subdomain</label><div className="flex items-stretch rounded-xl overflow-hidden border border-white/[0.08]"><input type="text" defaultValue="aivoicepro" className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white/[0.04] text-[#fafaf9] focus:outline-none" /><div className="flex items-center px-3 text-sm whitespace-nowrap bg-white/[0.03] text-[#fafaf9]/40 border-l border-white/[0.08]">.myvoiceaiconnect.com</div></div><p className="mt-1.5 text-[10px] text-[#fafaf9]/30">Preview: https://aivoicepro.myvoiceaiconnect.com/signup</p></div>
              <div className="rounded-xl p-4 bg-emerald-500/[0.06] border border-white/[0.08]"><div className="flex items-start gap-2.5"><Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="text-sm font-medium mb-1 text-[#fafaf9]">How white-labeling works</p><p className="text-xs leading-relaxed text-[#fafaf9]/40">The logo, colors, and theme you set here become your agency default and apply to every client dashboard. You can also brand each client individually from that client&apos;s page. Client dashboards show your logo, never VoiceAI Connect.</p></div></div></div>
              <div><label className={labelCls}>Client Branding</label><div className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[0.04] border border-white/[0.08]"><div><p className="text-sm font-medium text-[#fafaf9]">Allow client branding</p><p className="text-[10px] mt-0.5 text-[#fafaf9]/40">Clients can upload their own logo and set custom colors</p></div><SettingsSwitch on={false} onClick={() => {}} /></div></div>
              <div className="pt-4 border-t border-white/[0.06]"><div className="flex items-center gap-2 mb-1"><Lock className="h-4 w-4 text-emerald-400" /><h3 className="text-base font-medium text-[#fafaf9]">Change Password</h3></div><p className="text-xs mb-4 text-[#fafaf9]/40">Update the password you use to sign in.</p><div className="space-y-3 max-w-md"><input type="password" placeholder="Current password" className={inputCls} /><input type="password" placeholder="New password" className={inputCls} /><input type="password" placeholder="Confirm new password" className={inputCls} /><button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><Lock className="h-4 w-4" />Change Password</button></div></div>
            </div>)}

            {tab === 'pricing' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Client Plans</h3><p className="text-xs text-[#fafaf9]/40">Set pricing, call limits, and features for each plan your clients can choose.</p></div>
              <div className={infoPill}><Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" /><div><p className="text-xs font-medium text-blue-300/90">Every plan includes the core, regardless of price:</p><div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5">{SETTINGS_CORE_FEATURES.map((f, i) => (<span key={f} className="text-[11px] whitespace-nowrap text-[#fafaf9]/40">{f}{i < SETTINGS_CORE_FEATURES.length - 1 ? ' \u00b7' : ''}</span>))}</div><p className="text-[11px] mt-1.5 leading-relaxed text-[#fafaf9]/40">The toggles in the grid below are the extras you include or exclude per plan.</p></div></div>
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08]"><div className="flex items-center gap-2 mb-2"><Lock className="h-4 w-4 text-emerald-400" /><h4 className="font-medium text-sm text-[#fafaf9]">Client Trial Setup</h4></div><p className="text-xs mb-3 text-[#fafaf9]/40">Control whether new clients need to enter a credit card to start their 7-day trial. Affects signups from your embed widget or marketing site, not clients you add manually.</p><div className="flex items-start justify-between rounded-xl px-4 py-3 bg-white/[0.02] border border-white/[0.06]"><div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium text-[#fafaf9]">Require credit card to start trial</p><p className="text-[11px] mt-1 leading-relaxed text-[#fafaf9]/40">{requireCard ? 'Clients enter a card during signup, get a 7-day free trial, and are auto-charged at day 7.' : 'Clients get a 7-day no-card trial and upgrade manually to keep service.'}</p></div><SettingsSwitch on={requireCard} onClick={() => setRequireCard(!requireCard)} /></div></div>
              <AgencyPlansMatrix />
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08]"><div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-emerald-400" /><h4 className="font-medium text-sm text-[#fafaf9]">Custom features</h4></div><p className="text-[11px] mb-3 text-[#fafaf9]/40">Add your own feature bullets. They show up as toggle rows in the grid above, so you include or exclude them per plan like the built-in ones.</p><div className="space-y-2 mb-3">{['Dedicated account manager', 'Monthly performance report'].map(cf => (<div key={cf} className="flex items-center gap-2"><input defaultValue={cf} className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /><button className="p-2 rounded-lg flex-shrink-0 text-[#fafaf9]/40"><Trash2 className="h-4 w-4" /></button></div>))}</div><div className="flex items-center gap-2"><input placeholder="e.g. Priority onboarding" className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /><button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium flex-shrink-0 bg-emerald-500 text-[#050505]"><Plus className="h-4 w-4" /> Add</button></div></div>
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08]"><div className="flex items-center gap-2 mb-1.5"><DollarSign className="h-4 w-4 text-emerald-400" /><h4 className="font-medium text-sm text-[#fafaf9]">Client Per-Minute Billing</h4></div><p className="text-xs mb-4 text-[#fafaf9]/40">Charge your clients per voice minute on top of their monthly plan. Charges run on your connected Stripe account, so you keep 100 percent of what you bill. Leave this off to absorb minutes yourself.</p><div className="mb-4"><label className="block text-xs font-medium mb-1.5 text-[#fafaf9]/60">Rate per minute ($)</label><input defaultValue="0.35" className="w-40 rounded-xl px-3 py-2 text-sm bg-[#050505] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /></div><div className="flex items-start justify-between rounded-xl px-4 py-3 bg-white/[0.02] border border-white/[0.06]"><div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium text-[#fafaf9]">Charge clients per minute</p><p className="text-[11px] mt-1 leading-relaxed text-[#fafaf9]/40">Off. You absorb minutes and bill clients only their flat plan.</p></div><SettingsSwitch on={false} onClick={() => {}} /></div></div>
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3"><span className="text-xs mr-auto text-[#fafaf9]/40">Changes are not live until you save.</span><button className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><Check className="h-4 w-4" />Save Changes</button></div>
            </div>)}

            {tab === 'payments' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Payment Settings</h3><p className="text-xs text-[#fafaf9]/40">Connect Stripe to receive payments from your clients.</p></div>
              {billMyself && (<div className={infoPill}><Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" /><p className="text-xs text-[#fafaf9]/40">Not needed while you bill clients yourself. Turn off &ldquo;Bill my clients myself&rdquo; below if you want the platform to charge your clients through Stripe.</p></div>)}
              <div className={`${cardCls} ${billMyself ? 'opacity-50 pointer-events-none select-none' : ''}`}><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#635BFF] flex-shrink-0"><CreditCard className="h-6 w-6 text-white" /></div><div className="flex-1"><p className="font-medium text-sm text-[#fafaf9]">Stripe Connect</p><div className="flex items-center gap-2 mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><p className="text-xs text-emerald-400">Active</p></div></div></div><div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs"><div className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/[0.02]"><span className="text-[#fafaf9]/40">Charges</span><span className="flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" />Enabled</span></div><div className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/[0.02]"><span className="text-[#fafaf9]/40">Payouts</span><span className="flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" />Enabled</span></div></div></div>
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08]"><div className="flex items-center gap-2 mb-1.5"><Receipt className="h-4 w-4 text-emerald-400" /><h4 className="font-medium text-sm text-[#fafaf9]">How You Bill Your Clients</h4></div><p className="text-xs mb-4 text-[#fafaf9]/40">By default, your clients pay through Stripe Connect. If you would rather bill them yourself with your own invoices or payment links, turn this on and new clients are set up with no card and no checkout.</p><div className="flex items-start justify-between rounded-xl px-4 py-3" style={billMyself ? { backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' } : { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}><div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium" style={{ color: billMyself ? '#10b981' : '#fafaf9' }}>Bill my clients myself</p><p className="text-[11px] mt-1 leading-relaxed text-[#fafaf9]/40">{billMyself ? 'On. You handle client billing outside the platform. New clients go live immediately with no card and no checkout, and the platform never charges them.' : 'Off. The platform charges your clients for you through Stripe Connect checkout, and you keep the margin.'}</p></div><SettingsSwitch on={billMyself} onClick={() => setBillMyself(!billMyself)} /></div>{billMyself && (<div className="mt-3"><label className="block text-xs font-medium mb-1.5 text-[#fafaf9]/60">How do you bill your clients?</label><select value={billMethod} onChange={e => setBillMethod(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none"><option value="">Select a method...</option><option value="invoices">Manual invoices</option><option value="own_stripe">My own Stripe account</option><option value="quickbooks">QuickBooks / Xero</option><option value="paypal">PayPal</option><option value="bank">Bank transfer / ACH</option><option value="other">Other</option></select></div>)}</div>
              <div className={infoPill}><Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" /><p className="text-xs text-blue-300/80">Payments from your clients go directly to your Stripe account. The platform never holds your funds.</p></div>
            </div>)}

            {tab === 'billing' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Subscription &amp; Billing</h3><p className="text-xs text-[#fafaf9]/40">Manage your VoiceAI Connect subscription.</p></div>
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08]"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[#fafaf9]/40">Current Plan</p><p className="text-2xl font-semibold mt-1 text-[#fafaf9]">Scale</p></div><span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">Active</span></div><div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3"><div className="rounded-lg px-3 py-2 bg-white/[0.02]"><p className="text-[10px] text-[#fafaf9]/40">Price</p><p className="font-medium text-sm text-[#fafaf9]">$499/mo</p></div><div className="rounded-lg px-3 py-2 bg-white/[0.02]"><p className="text-[10px] text-[#fafaf9]/40">Per-client fee</p><p className="font-medium text-sm text-[#fafaf9]">$0.00</p></div></div><div className="mt-3"><div className="flex items-center justify-between text-xs mb-1"><span className="text-[#fafaf9]/40">Clients</span><span className="text-[#fafaf9]">47 / Unlimited</span></div></div></div>
              <div className="flex flex-col sm:flex-row gap-3"><button className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><ExternalLink className="h-4 w-4" />Manage Subscription</button><button className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-red-400"><X className="h-4 w-4" />Cancel Subscription</button></div>
            </div>)}

            {tab === 'twilio' && (<div className="space-y-5">
              <div className="rounded-xl p-4 flex items-start gap-3 bg-blue-500/[0.06] border border-blue-500/15"><Globe className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" /><div><p className="text-sm font-medium text-blue-300/90">For international numbers only</p><p className="text-xs mt-1 text-[#fafaf9]/40">Connect Twilio only if your clients are outside the US and need local numbers from another country. US numbers are provisioned automatically, so if you serve US clients you can skip this.</p></div></div>
              <div className={cardCls}><div className="flex items-center justify-between"><div><p className="font-medium text-sm text-[#fafaf9]">Bring your own Twilio</p><p className="text-xs mt-0.5 text-[#fafaf9]/40">Use your own Twilio account for non-US numbers.</p></div><button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]/70">Connect</button></div></div>
            </div>)}

            {tab === 'embed' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Embed Widget</h3><p className="text-xs text-[#fafaf9]/40">Add a signup widget to your existing website. Clients sign up without leaving your site.</p></div>
              <div><label className={labelCls}>Embed Code</label><div className="relative"><pre className="rounded-xl p-4 text-[10px] overflow-x-auto bg-[#050505] border border-white/[0.08] text-[#fafaf9]">{'<script src="https://aivoicepro.myvoiceaiconnect.com/embed.js" data-agency="ag_7Fk29d"></script>'}</pre><button className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-[#fafaf9]"><Copy className="h-3.5 w-3.5" />Copy</button></div></div>
              <div className={infoPill}><Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" /><p className="text-xs text-blue-300/80">Paste this snippet into your website just before the closing body tag. It stays valid even if you change your subdomain.</p></div>
            </div>)}

            {tab === 'team' && (<div className="space-y-5">
              <div className="flex items-center justify-between"><div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Team Members</h3><p className="text-xs text-[#fafaf9]/40">Give staff their own logins to your agency dashboard.</p></div><span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] text-[#fafaf9]/60">2 of 3 seats used</span></div>
              <div className="space-y-2">{[{ n: 'You', e: 'owner@aivoicepro.com', r: 'Owner' }, { n: 'Jordan Blake', e: 'jordan@aivoicepro.com', r: 'Staff' }].map(m => (<div key={m.e} className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[0.03] border border-white/[0.06]"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 text-sm font-medium">{m.n.charAt(0)}</div><div><p className="text-sm font-medium text-[#fafaf9]">{m.n}</p><p className="text-[11px] text-[#fafaf9]/40">{m.e}</p></div></div><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#fafaf9]/60">{m.r}</span></div>))}</div>
              <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><Plus className="h-4 w-4" />Invite member</button>
            </div>)}

            {tab === 'demo' && (<div className="space-y-5">
              <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10"><Eye className="h-5 w-5 text-emerald-400" /></div><div><h3 className="text-base font-medium text-[#fafaf9]">Demo Mode</h3><p className="text-xs mt-0.5 text-[#fafaf9]/40">Preview your dashboard with realistic sample data.</p></div></div><SettingsSwitch on={true} onClick={() => {}} /></div>
              <div className="rounded-xl px-4 py-3 flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" /><span className="text-sm font-medium text-emerald-400">Demo mode is active, all pages show sample data</span></div>
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]"><p className="text-sm font-medium mb-3 text-[#fafaf9]">What demo mode shows:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[{ l: 'Dashboard', d: '47 clients, $8,408 MRR, 2,847 total calls' }, { l: 'Clients', d: 'Realistic service businesses with plans and call data' }, { l: 'Call History', d: 'Calls with AI summaries, urgency levels, transcripts' }, { l: 'Analytics', d: 'Revenue charts, plan breakdown, payment history' }].map(f => (<div key={f.l} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" /><div><p className="text-xs font-medium text-[#fafaf9]">{f.l}</p><p className="text-[10px] text-[#fafaf9]/40">{f.d}</p></div></div>))}</div></div>
            </div>)}

            {tab === 'support' && (<div className="space-y-5">
              <div><h3 className="text-base font-medium mb-1 text-[#fafaf9]">Contact Support</h3><p className="text-xs text-[#fafaf9]/40">Questions or need a hand? Send us a message and our team will get back to you.</p></div>
              <div><textarea placeholder="How can we help?" rows={5} className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-white/[0.04] border border-white/[0.08] text-[#fafaf9] focus:outline-none" /><div className="flex items-center justify-between mt-2"><span className="text-xs text-[#fafaf9]/30">0/2000</span><button className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-emerald-500 text-[#050505]"><Send className="h-4 w-4" />Send</button></div></div>
              <div><p className="text-sm font-medium mb-3 text-[#fafaf9]">Your previous messages</p><div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]"><p className="text-sm text-[#fafaf9]">Can I add a fourth plan tier for enterprise clients?</p><p className="text-[10px] mt-2 text-[#fafaf9]/40">Mar 4, 2026</p></div></div>
            </div>)}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Client Views ─────────────────────────────────────────────────────────────

// ─── Client: Dashboard (mirrors real dashboard-content.tsx) ───────────────────

function ClientOverview() {
  const [copied, setCopied] = useState(false);
  const pc = '#10b981';
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const first = CLIENT.owner.split(' ')[0];
  const used = CLIENT.stats.calls;
  const limit = CLIENT.stats.limit;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const circ = 2 * Math.PI * 34;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{greet}, {first}</h1><p className="mt-1 text-sm text-gray-500">Here&apos;s how {CLIENT.name} is doing today.</p></div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Contact {CLIENT.agencyName}</span></button>
      </div>
      {/* Phone Number Card */}
      <div data-tour="client-phone" className="mb-6 sm:mb-8 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4"><p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Your AI Number</p><span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600"><span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" /><span className="relative rounded-full h-2 w-2 bg-emerald-500" /></span>Active</span></div>
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 sm:gap-4 min-w-0"><div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-emerald-50 flex-shrink-0"><Phone className="h-6 w-6 text-emerald-600" /></div><p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 truncate">{CLIENT.phone}</p></div><button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 flex-shrink-0">{copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}<span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span></button></div>
        <p className="mt-4 pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-500">Call forwarding is on. Customers who call your business number reach your AI.</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Today</p><p className="text-3xl sm:text-4xl font-bold text-gray-900">6</p><p className="text-[11px] mt-1 text-gray-400">calls received</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50"><PhoneCall className="h-6 w-6 text-emerald-600" /></div></div></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">This Month</p><p className="text-3xl sm:text-4xl font-bold text-gray-900">{used}</p><p className="text-[11px] mt-1 text-gray-400">of {limit} calls</p></div><div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}><svg viewBox="0 0 76 76" className="w-full h-full -rotate-90"><circle cx="38" cy="38" r="34" fill="none" strokeWidth="4.5" stroke="#e5e7eb" /><circle cx="38" cy="38" r="34" fill="none" strokeWidth="4.5" stroke={pc} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} /></svg><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-900">{pct}%</span></div></div></div>
      </div>
      {/* Recent Calls */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-6"><h2 className="font-semibold text-sm sm:text-base text-gray-900">Recent Calls</h2><span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-emerald-600 cursor-pointer">View all<ChevronRight className="h-4 w-4" /></span></div>
        <div>
          {CLIENT.calls.slice(0, 5).map((c, idx) => {
            const urgBg = c.urgency === 'high' ? 'rgba(239,68,68,0.1)' : c.urgency === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
            const urgColor = c.urgency === 'high' ? '#ef4444' : c.urgency === 'medium' ? '#f59e0b' : '#6b7280';
            return (
              <div key={c.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors" style={{ borderBottom: idx < Math.min(CLIENT.calls.length, 5) - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 bg-emerald-50"><PhoneCall className="h-[18px] w-[18px] text-emerald-600" /></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-[13px] sm:text-sm text-gray-900 truncate">{c.caller}</p><p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">{c.phone}<span className="hidden sm:inline"> &middot; {c.service}</span></p><p className="text-[10px] sm:hidden mt-0.5 text-gray-400">{c.time}</p></div>
                <div className="text-right flex-shrink-0"><span className="rounded-full px-2.5 py-[3px] text-[10px] sm:text-[11px] font-semibold capitalize" style={{ backgroundColor: urgBg, color: urgColor }}>{c.urgency}</span><p className="mt-1 text-[10px] text-gray-400 hidden sm:block">{c.time}</p></div>
                <ChevronRight className="h-4 w-4 hidden sm:block flex-shrink-0 text-gray-300" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Client: Calls (mirrors real ClientCallsPage) ────────────────────────────

function ClientCalls() {
  const [sq, setSq] = useState('');
  const filtered = CLIENT.calls.filter(c => !sq || c.caller.toLowerCase().includes(sq.toLowerCase()) || c.service.toLowerCase().includes(sq.toLowerCase()));
  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#f9fafb' }}>
      <div className="mb-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Call History</h1><p className="mt-1 text-sm text-gray-500">{CLIENT.calls.length} total calls</p></div><div className="flex items-center gap-2"><div className="relative flex-1 sm:flex-initial"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search calls..." value={sq} onChange={e => setSq(e.target.value)} className="w-full sm:w-48 lg:w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none" /></div><button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500"><Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button></div></div></div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
        {filtered.map(c => {
          const urgBg = c.urgency === 'high' ? 'rgba(239,68,68,0.1)' : c.urgency === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
          const urgColor = c.urgency === 'high' ? '#ef4444' : c.urgency === 'medium' ? '#f59e0b' : '#10b981';
          return (
            <div key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="p-3 sm:hidden"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: urgBg }}><PhoneCall className="h-5 w-5" style={{ color: urgColor }} /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2 mb-1"><p className="font-medium text-sm text-gray-900 truncate">{c.caller}</p><span className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0" style={{ backgroundColor: urgBg, color: urgColor }}>{c.urgency}</span></div><p className="text-xs text-gray-500 truncate">{c.phone}</p><div className="flex items-center justify-between mt-1"><p className="text-[10px] text-gray-400 truncate">{c.service}</p><p className="text-[10px] text-gray-400 flex-shrink-0">{c.time}</p></div></div><ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 self-center" /></div></div>
              <div className="hidden sm:flex items-center justify-between p-4 lg:p-5"><div className="flex items-center gap-4"><div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full" style={{ backgroundColor: urgBg }}><PhoneCall className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: urgColor }} /></div><div><p className="font-medium text-sm lg:text-base text-gray-900">{c.caller}</p><p className="text-xs lg:text-sm text-gray-500">{c.phone}</p></div></div><div className="flex items-center gap-4 lg:gap-6"><div className="text-right hidden lg:block"><p className="text-sm text-gray-500">{c.service}</p></div><div className="text-right min-w-[80px]"><span className="rounded-full px-2 lg:px-3 py-0.5 lg:py-1 text-[10px] lg:text-xs font-medium" style={{ backgroundColor: urgBg, color: urgColor }}>{c.urgency}</span><p className="mt-1 text-[10px] lg:text-xs text-gray-400">{c.time}</p></div><ChevronRight className="h-4 w-4 text-gray-300" /></div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Client: Contacts (mirrors real ClientContactsPage) ──────────────────────

function ClientContacts() {
  const [statusFilter, setStatusFilter] = useState('all');
  const pc = '#10b981';
  const contacts = [
    { id: '1', name: 'Sarah Johnson', phone: '(555) 123-4567', email: 'sarah@email.com', status: 'active', tags: ['repeat_caller'], calls: 3, last: '10 min ago' },
    { id: '2', name: 'Mike Chen', phone: '(555) 234-5678', email: null, status: 'new', tags: ['appointment_booked'], calls: 1, last: '1 hour ago' },
    { id: '3', name: 'Lisa Martinez', phone: '(555) 345-6789', email: 'lisa.m@gmail.com', status: 'active', tags: ['emergency'], calls: 2, last: '2 hours ago' },
    { id: '4', name: 'John Davis', phone: '(555) 456-7890', email: null, status: 'converted', tags: [], calls: 1, last: 'Yesterday' },
    { id: '5', name: 'Emma Wilson', phone: '(555) 567-8901', email: 'emma@business.com', status: 'active', tags: ['repeat_caller', 'high_priority'], calls: 5, last: '2 days ago' },
    { id: '6', name: 'Robert Taylor', phone: '(555) 678-9012', email: null, status: 'inactive', tags: [], calls: 1, last: '2 weeks ago' },
  ];
  const stats = { total: 6, new: 1, active: 3, converted: 1, inactive: 1 };
  const statusConf: Record<string, { label: string; dot: string }> = { new: { label: 'New', dot: '#3b82f6' }, active: { label: 'Active', dot: '#10b981' }, converted: { label: 'Converted', dot: '#8b5cf6' }, inactive: { label: 'Inactive', dot: '#6b7280' } };
  const tagColors: Record<string, string> = { emergency: '#ef4444', high_priority: '#f59e0b', repeat_caller: '#8b5cf6', appointment_booked: '#10b981' };
  const filtered = contacts.filter(c => statusFilter === 'all' || c.status === statusFilter);
  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#f9fafb' }}>
      <div className="mb-4 sm:mb-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Contacts</h1><p className="mt-1 text-sm text-gray-500">{stats.total} total contacts from calls</p></div><button className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium bg-emerald-500 text-white"><Plus className="h-4 w-4" />Add Contact</button></div></div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
        {[{ l: 'New', v: stats.new, c: '#3b82f6', f: 'new' }, { l: 'Active', v: stats.active, c: '#10b981', f: 'active' }, { l: 'Converted', v: stats.converted, c: '#8b5cf6', f: 'converted' }, { l: 'Inactive', v: stats.inactive, c: '#6b7280', f: 'inactive' }].map(s => (
          <button key={s.l} onClick={() => setStatusFilter(statusFilter === s.f ? 'all' : s.f)} className="rounded-xl border p-3 sm:p-4 text-left transition-all" style={{ borderColor: statusFilter === s.f ? s.c : '#e5e7eb', backgroundColor: statusFilter === s.f ? `${s.c}08` : '#fff' }}>
            <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.c }} /><span className="text-xs text-gray-500">{s.l}</span></div>
            <p className="text-lg sm:text-xl font-semibold text-gray-900">{s.v}</p>
          </button>
        ))}
      </div>
      {/* Search */}
      <div className="flex items-center gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search contacts..." className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none" /></div><select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 cursor-pointer"><option>Most Recent</option><option>Most Calls</option><option>Name A-Z</option></select></div>
      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
        {filtered.map(c => {
          const st = statusConf[c.status] || statusConf.new;
          return (
            <div key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
              {/* Mobile */}
              <div className="p-3 sm:hidden"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold" style={{ backgroundColor: `${pc}15`, color: pc }}>{c.name[0]}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2 mb-0.5"><p className="font-medium text-sm text-gray-900 truncate">{c.name}</p><div className="flex items-center gap-1.5 flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} /><span className="text-[10px] text-gray-400">{st.label}</span></div></div><p className="text-xs text-gray-500 truncate">{c.phone}</p><div className="flex items-center justify-between mt-1"><div className="flex items-center gap-2"><span className="text-[10px] text-gray-400">{c.calls} call{c.calls !== 1 ? 's' : ''}</span>{c.tags.length > 0 && <div className="flex gap-1">{c.tags.slice(0, 2).map(t => (<span key={t} className="rounded-full px-1.5 py-0.5 text-[8px] font-medium" style={{ backgroundColor: `${tagColors[t] || pc}20`, color: tagColors[t] || pc }}>{t.replace(/_/g, ' ')}</span>))}</div>}</div><span className="text-[10px] text-gray-400 flex-shrink-0">{c.last}</span></div></div><ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 self-center" /></div></div>
              {/* Desktop */}
              <div className="hidden sm:flex items-center justify-between p-4 lg:p-5"><div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1"><div className="flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full flex-shrink-0 text-sm lg:text-base font-semibold" style={{ backgroundColor: `${pc}15`, color: pc }}>{c.name[0]}</div><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-medium text-sm lg:text-base text-gray-900 truncate">{c.name}</p><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} /><span className="text-xs text-gray-400">{st.label}</span></div></div><div className="flex items-center gap-3 mt-0.5"><span className="text-xs lg:text-sm text-gray-500">{c.phone}</span>{c.email && <span className="text-xs text-gray-400 hidden lg:inline">{c.email}</span>}</div></div></div><div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">{c.tags.length > 0 && <div className="hidden lg:flex gap-1.5">{c.tags.slice(0, 3).map(t => (<span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${tagColors[t] || pc}20`, color: tagColors[t] || pc }}>{t.replace(/_/g, ' ')}</span>))}</div>}<div className="text-right min-w-[70px]"><p className="text-sm font-medium text-gray-900">{c.calls} call{c.calls !== 1 ? 's' : ''}</p><p className="text-xs text-gray-400">{c.last}</p></div><ChevronRight className="h-4 w-4 text-gray-300" /></div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Client: AI Agent (mirrors real ClientAIAgentPage) ───────────────────────

function ClientAIAgent() {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const pc = '#10b981';
  const SectionHead = ({ icon: Icon, title, sub, live }: { icon: any; title: string; sub: string; live?: boolean }) => (
    <div className="p-3 sm:p-4 border-b border-gray-100"><div className="flex items-center gap-2 sm:gap-3"><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50"><Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><h3 className="font-semibold text-sm text-gray-900">{title}</h3>{live && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase bg-emerald-50 text-emerald-600">Live</span>}</div><p className="text-[10px] sm:text-xs text-gray-400">{sub}</p></div></div></div>
  );
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24" style={{ backgroundColor: '#f9fafb' }}>
      <div className="mb-4 sm:mb-6 text-center"><div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 bg-emerald-50"><Bot className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" /></div><h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 text-gray-900">AI Agent</h2><p className="text-xs sm:text-sm text-gray-500">Voice, personality, and behavior settings</p></div>
      <div data-tour="client-ai" className="max-w-3xl mx-auto">
        <section className="mb-4 sm:mb-6"><button className="w-full rounded-xl p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-3 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-colors"><Phone className="w-4 h-4 sm:w-5 sm:h-5" /><span className="font-semibold text-sm sm:text-base">Test Your AI Agent</span></button><p className="text-center text-[10px] sm:text-xs mt-1.5 text-gray-400">Call your AI number to hear your settings in action</p></section>
        {/* Google Calendar */}
        <section className="mb-4 sm:mb-6"><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><div className="p-3 sm:p-4 border-b border-gray-100"><div className="flex items-center gap-2 sm:gap-3"><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50"><Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><h3 className="font-semibold text-sm text-gray-900">Google Calendar</h3><span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase bg-emerald-50 text-emerald-600">Live</span></div><p className="text-[10px] sm:text-xs text-gray-400">Your AI can book appointments to your calendar</p></div></div></div><div className="p-3 sm:p-4"><div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 mb-2.5"><Check className="w-4 h-4 text-emerald-600" /><p className="text-xs sm:text-sm font-medium text-emerald-700">Calendar connected</p></div><div className="flex gap-2"><button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Reconnect</button><button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100">Disconnect</button></div></div></div></section>
        {/* Voice */}
        <section className="mb-4 sm:mb-6"><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><SectionHead icon={Mic} title="Voice Selection" sub="Choose your AI's voice" live /><div className="p-3 sm:p-4"><div className="flex gap-1.5 mb-3">{['All (8)', 'Female', 'Male'].map((f, i) => (<button key={f} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium" style={i === 0 ? { backgroundColor: pc, color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>{f}</button>))}</div><div className="grid grid-cols-2 gap-2 sm:gap-3">{[{ name: 'Sarah', accent: 'American', style: 'Warm & Professional', sel: true, cur: true }, { name: 'Emily', accent: 'British', style: 'Elegant & Clear', sel: false, cur: false }, { name: 'Jessica', accent: 'American', style: 'Friendly & Bright', sel: false, cur: false }, { name: 'James', accent: 'American', style: 'Confident & Deep', sel: false, cur: false }, { name: 'Oliver', accent: 'British', style: 'Polished & Calm', sel: false, cur: false }, { name: 'Sophia', accent: 'Australian', style: 'Energetic & Warm', sel: false, cur: false }].map(v => (<div key={v.name} className="relative p-2 sm:p-3 rounded-xl border-2 cursor-pointer" style={{ borderColor: v.sel ? pc : '#e5e7eb', backgroundColor: v.sel ? `${pc}08` : '#fff' }}>{v.cur && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-white text-[8px] font-bold rounded-full bg-emerald-500">CURRENT</span>}<div className="flex items-start gap-1.5 sm:gap-2"><button className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-500"><Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" /></button><div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{v.name}</span>{v.sel && <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />}</div><p className="text-[9px] sm:text-[10px] text-gray-400 truncate">{v.accent} · {v.style}</p></div></div></div>))}</div></div></div></section>
        {/* Greeting */}
        <section className="mb-4 sm:mb-6"><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><SectionHead icon={MessageSquare} title="Greeting Message" sub="What your AI says first" live /><div className="p-3 sm:p-4"><textarea defaultValue={`Hi, you've reached ${CLIENT.name}. This call may be recorded for quality and training purposes. How can I help you today?`} rows={3} maxLength={500} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /><div className="flex items-center justify-between mt-1.5"><button className="flex items-center gap-1 text-[10px] text-gray-400"><RotateCcw className="w-3 h-3" />Reset</button><span className="text-[10px] text-gray-400">128/500</span></div></div></div></section>
        {/* Hours */}
        <section className="mb-4 sm:mb-6"><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><SectionHead icon={Clock} title="Business Hours" sub="When you're available" live /><div className="p-3 sm:p-4"><div onClick={() => setHoursOpen(!hoursOpen)} className="flex items-center justify-between cursor-pointer"><div className="flex flex-wrap gap-1.5">{['M-F: 7am-6pm', 'Sat: 8am-2pm', 'Sun: Closed'].map((h, i) => (<span key={i} className="px-2 py-1 rounded text-[10px] sm:text-xs bg-gray-100 text-gray-500">{h}</span>))}</div><button className="flex items-center gap-1 text-xs font-medium text-emerald-600 ml-2 flex-shrink-0">{hoursOpen ? 'Hide' : 'Edit'}<ChevronDown className={`w-3 h-3 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} /></button></div>{hoursOpen && (<div className="mt-3 space-y-1.5">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => { const isClosed = day === 'Sunday'; return (<div key={day} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"><span className="w-10 text-[10px] font-medium text-gray-500">{day.slice(0, 3)}</span><label className="flex items-center gap-1"><input type="checkbox" defaultChecked={isClosed} className="w-3 h-3 rounded" /><span className="text-[10px] text-gray-500">Closed</span></label>{!isClosed && (<div className="flex items-center gap-1 ml-auto"><select defaultValue={day === 'Saturday' ? '8:00 AM' : '7:00 AM'} className="px-1.5 py-0.5 text-[10px] border border-gray-200 rounded bg-white text-gray-700"><option>7:00 AM</option><option>8:00 AM</option><option>9:00 AM</option></select><span className="text-[10px] text-gray-400">-</span><select defaultValue={day === 'Saturday' ? '2:00 PM' : '6:00 PM'} className="px-1.5 py-0.5 text-[10px] border border-gray-200 rounded bg-white text-gray-700"><option>2:00 PM</option><option>5:00 PM</option><option>6:00 PM</option></select></div>)}</div>); })}<button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-500 text-white"><Sparkles className="w-4 h-4" />Save Hours</button></div>)}</div></div></section>
        {/* Knowledge Base */}
        <section className="mb-4 sm:mb-6"><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><SectionHead icon={BookOpen} title="Knowledge Base" sub="Teach your AI about your business" live /><div className="p-3 sm:p-4"><div onClick={() => setKbOpen(!kbOpen)} className="flex items-center justify-between cursor-pointer"><div className="text-xs text-gray-500">Updated: Mar 5, 2026</div><button className="flex items-center gap-1 text-xs font-medium text-emerald-600">{kbOpen ? 'Hide' : 'Edit'}<ChevronDown className={`w-3 h-3 transition-transform ${kbOpen ? 'rotate-180' : ''}`} /></button></div>{kbOpen && (<div className="mt-3 space-y-4"><div><label className="flex items-center gap-1.5 text-xs font-medium text-gray-900 mb-1.5"><Globe className="w-3.5 h-3.5 text-emerald-600" />Website</label><input type="url" defaultValue="https://smithplumbing.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none" /></div><div><label className="flex items-center gap-1.5 text-xs font-medium text-gray-900 mb-1.5"><Settings className="w-3.5 h-3.5 text-emerald-600" />Services & Pricing</label>{[{ n: 'Emergency Leak Repair', p: '$150+' }, { n: 'Water Heater Install', p: '$800+' }, { n: 'Drain Cleaning', p: '$99' }].map((s, i) => (<div key={i} className="p-2 rounded-lg bg-gray-50 mb-1.5"><div className="flex gap-1.5"><input type="text" defaultValue={s.n} className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 min-w-0" /><input type="text" defaultValue={s.p} className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900" /><button className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div></div>))}<button className="mt-1 flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50"><Plus className="w-3.5 h-3.5" />Add Service</button></div><div><label className="flex items-center gap-1.5 text-xs font-medium text-gray-900 mb-1.5"><HelpCircle className="w-3.5 h-3.5 text-emerald-600" />FAQs</label>{[{ q: 'What areas do you serve?', a: 'We serve the greater Atlanta metro area including Marietta, Roswell, and Alpharetta.' }, { q: 'Do you offer emergency service?', a: 'Yes, we offer 24/7 emergency plumbing service with a 1-hour response time.' }].map((f, i) => (<div key={i} className="p-2 rounded-lg bg-gray-50 mb-1.5 space-y-1"><div className="flex gap-1.5"><input type="text" defaultValue={f.q} className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 min-w-0" /><button className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div><textarea defaultValue={f.a} rows={2} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 resize-none" /></div>))}<button className="mt-1 flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50"><Plus className="w-3.5 h-3.5" />Add FAQ</button></div><div><label className="flex items-center gap-1.5 text-xs font-medium text-gray-900 mb-1.5"><FileText className="w-3.5 h-3.5 text-emerald-600" />Additional Info</label><textarea defaultValue="We accept all major credit cards and offer financing. Licensed and insured. 15+ years experience." rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 resize-none focus:outline-none" /></div><button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-500 text-white"><Sparkles className="w-4 h-4" />Update AI Knowledge</button></div>)}</div></div></section>
        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100"><div className="flex items-start gap-2"><div className="text-base flex-shrink-0">💡</div><div><h4 className="font-semibold text-xs text-emerald-700 mb-0.5">Pro Tip</h4><p className="text-xs text-gray-500">After changes, tap &quot;Test Your AI&quot; to hear them in action!</p></div></div></div>
      </div>
    </div>
  );
}

// ─── Client: Settings (mirrors real ClientSettingsContent) ───────────────────

function ClientSettings() {
  const secHead = 'text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-gray-900';
  const card = 'rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm';
  const input = 'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24" style={{ backgroundColor: '#f9fafb' }}>
      <div className="mb-6 sm:mb-8"><h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Settings</h1><p className="mt-1 text-sm text-gray-500">Account, security, and billing</p></div>
      <div className="max-w-3xl">

        {/* Account identity */}
        <section className="mb-4 sm:mb-6"><div className={`${card} flex items-center justify-between gap-3`}><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold bg-emerald-50 text-emerald-600">{CLIENT.owner.charAt(0)}</div><div className="min-w-0"><p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{CLIENT.owner}</p><p className="text-[10px] sm:text-xs text-gray-400 truncate">john@smithplumbing.com &middot; {CLIENT.name}</p></div></div><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 bg-emerald-50 text-emerald-600">Account Owner</span></div></section>

        {/* AI Phone Number */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><Phone className="w-4 h-4 text-emerald-600" />AI Phone Number</h2><div className={card}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><label className="text-[10px] sm:text-xs block mb-0.5 text-gray-400">Your AI Receptionist</label><div className="text-base sm:text-xl font-bold text-emerald-600 truncate">{CLIENT.phone}</div></div><button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 flex-shrink-0"><Copy className="w-4 h-4" />Copy</button></div></div></section>

        {/* Add to Home Screen */}
        <section className="mb-4 sm:mb-6"><div className={`${card} flex items-center justify-between gap-3`}><div className="flex items-center gap-2.5 sm:gap-3 min-w-0"><div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50"><Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /></div><div className="min-w-0"><p className="text-xs sm:text-sm font-medium text-gray-900">Add to Home Screen</p><p className="text-[10px] sm:text-xs text-gray-400">Get instant access, works like a native app</p></div></div><button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-500 text-white flex-shrink-0">Install</button></div></section>

        {/* Contact Information */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><User className="w-4 h-4 text-emerald-600" />Contact Information</h2><div className={`${card} space-y-3 sm:space-y-4`}>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">Your name</label><input type="text" defaultValue={CLIENT.owner} className={input} /><p className="text-[10px] sm:text-xs mt-1 text-gray-400">Shown in your dashboard greeting. Your business name is set separately.</p></div>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">Owner Phone *</label><input type="tel" defaultValue="(404) 555-0100" className={input} /><p className="text-[10px] sm:text-xs mt-1 text-gray-400">Owner SMS notifications are sent here, and this is the default number the AI transfers to when a caller needs a person.</p></div>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">Email *</label><input type="email" defaultValue="john@smithplumbing.com" className={input} /></div>
          <button className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">No Changes</button>
        </div></section>

        {/* Your Login */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><Lock className="w-4 h-4 text-emerald-600" />Your Login</h2><div className={`${card} space-y-2.5`}><p className="text-[10px] sm:text-xs text-gray-400">The email and password you use to sign in to this dashboard.</p>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50"><User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" /><div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-wide text-gray-400">Username</p><p className="text-xs sm:text-sm font-mono truncate text-gray-900">john@smithplumbing.com</p></div><button className="flex-shrink-0 p-1 text-gray-400"><Copy className="w-3.5 h-3.5" /></button></div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50"><Lock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" /><div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-wide text-gray-400">Password</p><p className="text-xs sm:text-sm font-mono truncate text-gray-900">{'\u2022'.repeat(10)}</p></div><button className="flex-shrink-0 p-1 text-gray-400"><Copy className="w-3.5 h-3.5" /></button></div>
        </div></section>

        {/* Change Password */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><Lock className="w-4 h-4 text-emerald-600" />Change Password</h2><div className={`${card} space-y-3 sm:space-y-4`}>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">Current Password</label><input type="password" placeholder="Enter current password" className={input} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"><div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">New Password</label><input type="password" placeholder="Min 6 characters" className={input} /></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-500">Confirm New Password</label><input type="password" placeholder="Confirm new password" className={input} /></div></div>
          <button className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">Change Password</button>
        </div></section>

        {/* Users / Team */}
        <section className="mb-4 sm:mb-6"><div className="flex items-center justify-between mb-2 sm:mb-3"><h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-gray-900"><Users className="w-4 h-4 text-emerald-600" />Users</h2><span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">2 of 3 seats used</span></div><div className={`${card} space-y-2`}>
          <p className="text-[10px] sm:text-xs text-gray-400">Extra dashboard logins for your team. Each can get their own SMS call alerts.</p>
          {[{ n: CLIENT.owner, e: 'john@smithplumbing.com', r: 'Owner' }, { n: 'Dana Lee', e: 'dana@smithplumbing.com', r: 'Team' }].map(m => (<div key={m.e} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-gray-50"><div className="flex items-center gap-2.5 min-w-0"><div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600 text-xs font-semibold">{m.n.charAt(0)}</div><div className="min-w-0"><p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{m.n}</p><p className="text-[10px] text-gray-400 truncate">{m.e}</p></div></div><span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 flex-shrink-0">{m.r}</span></div>))}
          <button className="w-full mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50"><Plus className="w-3.5 h-3.5" />Add user</button>
        </div></section>

        {/* Subscription */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><CreditCard className="w-4 h-4 text-emerald-600" />Subscription</h2><div className={`${card} space-y-3 sm:space-y-4`}>
          <div className="flex items-center justify-between"><div><label className="text-[10px] sm:text-xs block mb-0.5 text-gray-400">Current Plan</label><div className="text-base sm:text-xl font-bold text-emerald-600 capitalize">Professional</div></div><span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-600">Active</span></div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3"><div className="p-2 sm:p-3 rounded-lg text-center bg-gray-50"><div className="text-base sm:text-lg font-bold text-emerald-600">500</div><div className="text-[10px] sm:text-xs text-gray-400">Limit</div></div><div className="p-2 sm:p-3 rounded-lg text-center bg-gray-50"><div className="text-base sm:text-lg font-bold text-emerald-600">127</div><div className="text-[10px] sm:text-xs text-gray-400">Used</div></div><div className="p-2 sm:p-3 rounded-lg text-center bg-gray-50"><div className="text-base sm:text-lg font-bold text-emerald-600">373</div><div className="text-[10px] sm:text-xs text-gray-400">Left</div></div></div>
          <button className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-500 border border-gray-200">Manage Subscription</button>
          <button className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm bg-transparent text-red-500 border border-red-500">Cancel subscription</button>
        </div></section>

        {/* Support */}
        <section className="mb-4 sm:mb-6"><h2 className={secHead}><Headphones className="w-4 h-4 text-emerald-600" />Support</h2><div className={card}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50"><Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /></div><div className="min-w-0"><p className="font-semibold text-xs sm:text-sm text-gray-900">AI Support Line</p><p className="text-[10px] sm:text-xs text-gray-400">Available 24/7 from {CLIENT.agencyName}</p></div></div><button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 text-white flex-shrink-0"><Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Call</button></div><div className="mt-2.5 pt-2.5 border-t border-gray-100"><span className="font-semibold text-sm sm:text-lg text-emerald-600">(678) 555-0199</span></div></div></section>

      </div>
    </div>
  );
}

// ─── Tour Animations ─────────────────────────────────────────────────────────

const TOUR_CSS = `
@keyframes tour-fade-in { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tour-fade-in-center { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes tour-spotlight-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes tour-spotlight-pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.15), 0 0 30px rgba(16,185,129,0.08); } 50% { box-shadow: 0 0 0 5px rgba(16,185,129,0.25), 0 0 50px rgba(16,185,129,0.15); } }
@keyframes tour-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes tour-pill-enter { from { opacity: 0; transform: translateY(20px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tour-number-pop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
@keyframes tour-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.tour-tooltip-enter { animation: tour-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.tour-tooltip-center { animation: tour-fade-in-center 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.tour-spotlight-enter { animation: tour-spotlight-in 0.4s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
.tour-spotlight-ring { animation: tour-spotlight-pulse 2s ease-in-out infinite; }
.tour-pill-enter { animation: tour-pill-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.tour-number-pop { animation: tour-number-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.tour-float { animation: tour-float 3s ease-in-out infinite; }
.tour-shimmer-bar { background: linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent); background-size: 200% 100%; animation: tour-shimmer 2s ease-in-out infinite; }
`;

// ─── Tour Overlay ────────────────────────────────────────────────────────────

interface TourStep {
  target: string | null;
  view: 'agency' | 'client';
  tab: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  pin?: 'top';
  title: string;
  body: string;
}

function TourOverlay({ step, stepIndex, totalSteps, onNext, onPrev, onPause, frameRef }: {
  step: TourStep; stepIndex: number; totalSteps: number; onNext: () => void; onPrev: () => void; onPause: () => void;
  frameRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Reset everything on step change
  useEffect(() => {
    setDragOffset(null);
    setReady(false);
    setRect(null);

    // Centered steps (no target) are ready immediately
    if (!step.target) {
      setReady(true);
      return;
    }

    // Some targets exist twice in the DOM (mobile + desktop variants). Pick
    // the first element that's actually on-screen, hidden or translated-off
    // elements would wreck tooltip placement.
    const findVisibleTarget = (): Element | null => {
      const all = document.querySelectorAll(`[data-tour="${step.target}"]`);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      for (const el of Array.from(all)) {
        const r = el.getBoundingClientRect();
        const onScreen = r.width > 0 && r.height > 0 && r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh;
        if (onScreen) return el;
      }
      return all[0] ?? null;
    };

    const timer = setTimeout(() => {
      const el = findVisibleTarget();
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect(r);
          setReady(true);
        }, 400);
      } else {
        setReady(true);
      }
    }, 250);

    const measure = () => {
      const el = findVisibleTarget();
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', measure);
    return () => { clearTimeout(timer); window.removeEventListener('resize', measure); };
  }, [step.target, stepIndex]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: dragOffset?.x || 0, oy: dragOffset?.y || 0 };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart.current) return;
    setDragOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my });
  };
  const handlePointerUp = () => { setIsDragging(false); dragStart.current = null; };

  const isCentered = step.position === 'center' || !step.target;
  const pad = 8;
  const dx = dragOffset?.x || 0;
  const dy = dragOffset?.y || 0;

  // Convert a viewport-relative DOMRect into frame-relative coordinates.
  const toFrameRect = (r: DOMRect | null): { top: number; left: number; right: number; bottom: number; width: number; height: number } | null => {
    if (!r) return null;
    const f = frameRef.current?.getBoundingClientRect();
    if (!f) return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    return { top: r.top - f.top, left: r.left - f.left, right: r.right - f.left, bottom: r.bottom - f.top, width: r.width, height: r.height };
  };
  const frameW = () => frameRef.current?.clientWidth ?? window.innerWidth;
  const frameH = () => frameRef.current?.clientHeight ?? window.innerHeight;

  const getTooltipStyle = (): React.CSSProperties => {
    if (isCentered || !rect) return { position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` };
    const fw = frameW(); const fh = frameH();
    const relRect = toFrameRect(rect)!;
    // Measure the actual tooltip if it's already mounted; fall back to a
    // conservative estimate so initial placement doesn't clip the Next button.
    const measuredH = tooltipRef.current?.offsetHeight ?? 0;
    const maxW = Math.min(340, fw - 32);
    const tooltipH = Math.max(measuredH, 340);
    const gap = 12;
    const margin = 12;
    // Both the mobile header and the desktop top bar are h-14 (56px), so always
    // reserve that space to keep top-placed tooltips clear of the bar.
    const headerH = 56;
    const spaceAbove = relRect.top; const spaceBelow = fh - relRect.bottom;
    const spaceRight = fw - relRect.right; const spaceLeft = relRect.left;

    let pos = step.position;
    if (pos === 'bottom' && spaceBelow < tooltipH + gap && spaceAbove > spaceBelow) pos = 'top';
    else if (pos === 'top' && spaceAbove < tooltipH + gap && spaceBelow > spaceAbove) pos = 'bottom';
    else if (pos === 'right' && spaceRight < maxW + gap && spaceLeft > spaceRight) pos = 'left';
    else if (pos === 'left' && spaceLeft < maxW + gap && spaceRight > spaceLeft) pos = 'right';
    if ((pos === 'top' && spaceAbove < tooltipH + gap) || (pos === 'bottom' && spaceBelow < tooltipH + gap)) {
      pos = spaceRight >= maxW + gap ? 'right' : spaceLeft >= maxW + gap ? 'left' : 'bottom';
    }

    const style: React.CSSProperties = { position: 'absolute', maxWidth: maxW, zIndex: 60 };
    const clampX = (x: number) => Math.max(margin, Math.min(x, fw - maxW - margin));
    const clampY = (y: number) => Math.max(headerH + margin, Math.min(y, fh - tooltipH - margin));
    // Pinned steps ignore the target and sit centered at the top of the frame.
    if (step.pin === 'top') return { position: 'absolute', maxWidth: maxW, zIndex: 60, top: clampY(headerH + margin + dy), left: clampX((fw - maxW) / 2 + dx) };
    const visTop = Math.max(relRect.top, 0); const visBottom = Math.min(relRect.bottom, fh);
    const visMidY = (visTop + visBottom) / 2;
    const visMidX = Math.max(relRect.left, 0) + Math.min(relRect.width, fw) / 2;

    // Drag offsets go inside the clamps so a dragged tooltip stays within the frame.
    switch (pos) {
      case 'bottom': style.top = clampY(Math.min(relRect.bottom, fh - 56) + gap + dy); style.left = clampX(visMidX - maxW / 2 + dx); break;
      case 'top': style.top = clampY(Math.max(relRect.top, 56) - tooltipH - gap + dy); style.left = clampX(visMidX - maxW / 2 + dx); break;
      case 'right': style.top = clampY(visMidY - tooltipH / 2 + dy); style.left = clampX(Math.min(relRect.right + gap, fw - maxW - margin) + dx); break;
      case 'left': style.top = clampY(visMidY - tooltipH / 2 + dy); style.left = clampX(relRect.left - maxW - gap + dx); break;
    }
    return style;
  };

  const getClipPath = () => {
    if (!rect || isCentered) return 'none';
    const fw = frameW(); const fh = frameH();
    const relRect = toFrameRect(rect)!;
    const x = Math.max(0, relRect.left - pad); const y = Math.max(0, relRect.top - pad);
    const x2 = Math.min(fw, relRect.right + pad);
    const y2 = Math.min(fh, relRect.bottom + pad);
    const w = x2 - x; const h = y2 - y;
    if (w <= 0 || h <= 0) return 'none';
    const r = 12;
    return `polygon(0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y + r}px, ${x + r}px ${y}px, ${x + w - r}px ${y}px, ${x + w}px ${y + r}px, ${x + w}px ${y + h - r}px, ${x + w - r}px ${y + h}px, ${x + r}px ${y + h}px, ${x}px ${y + h - r}px, ${x}px 100%, 100% 100%, 100% 0%)`;
  };

  const pct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div ref={overlayRef} className="absolute inset-0 z-[55]" onClick={e => { if (e.target === overlayRef.current) onPause(); }}>
      <style dangerouslySetInnerHTML={{ __html: TOUR_CSS }} />
      {/* Backdrop, always visible, dims immediately */}
      <div className="absolute inset-0" style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        clipPath: ready ? getClipPath() : 'none',
        backdropFilter: isCentered ? 'blur(4px)' : undefined,
        transition: 'clip-path 0.01s',
      }} />
      {isCentered && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}

      {/* Spotlight ring + Tooltip, only render after measurement */}
      {ready && (<>
        {rect && !isCentered && (() => {
          const fw = frameW(); const fh = frameH();
          const rel = toFrameRect(rect);
          if (!rel) return null;
          const rx = Math.max(0, rel.left - pad); const ry = Math.max(0, rel.top - pad);
          const rx2 = Math.min(fw, rel.right + pad);
          const ry2 = Math.min(fh, rel.bottom + pad);
          return (rx2 - rx > 0 && ry2 - ry > 0) ? (
            <div key={`spot-${stepIndex}`} className="absolute rounded-xl pointer-events-none tour-spotlight-enter tour-spotlight-ring" style={{
              left: rx, top: ry, width: rx2 - rx, height: ry2 - ry,
              border: '2px solid rgba(16,185,129,0.4)',
            }} />
          ) : null;
        })()}

        <div
          key={`tip-${stepIndex}`}
          ref={tooltipRef}
          className={isCentered ? 'tour-tooltip-center' : 'tour-tooltip-enter'}
          style={{ ...getTooltipStyle(), cursor: isDragging ? 'grabbing' : isCentered ? 'default' : 'grab', userSelect: 'none', touchAction: 'none' }}
          onClick={e => e.stopPropagation()}
          onPointerDown={isCentered ? undefined : handlePointerDown}
          onPointerMove={isCentered ? undefined : handlePointerMove}
          onPointerUp={isCentered ? undefined : handlePointerUp}
        >
        <div className={`rounded-2xl border border-white/[0.1] bg-[#0a0a0a]/95 backdrop-blur-xl ${isCentered ? 'p-5 sm:p-8 w-[90vw] max-w-md' : 'p-3 sm:p-5'}`} style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.05)' }}>

          {/* Drag handle + step number */}
          {!isCentered && (
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <div key={stepIndex} className="tour-number-pop flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-500 text-[9px] sm:text-[10px] font-bold text-[#050505]">{stepIndex + 1}</div>
                <div className="h-1 rounded-full overflow-hidden w-12 sm:w-16 bg-white/[0.08]">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#fafaf9]/25">{pct}%</span>
              </div>
              <div className="w-8 h-1 rounded-full bg-white/[0.12] cursor-grab" />
            </div>
          )}

          {/* Final CTA, animated icon */}
          {isCentered && (
            <div className="flex justify-center mb-4 sm:mb-5">
              <div className="tour-float h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
              </div>
            </div>
          )}

          <h3 className={`font-semibold text-[#fafaf9] mb-1.5 sm:mb-2 ${isCentered ? 'text-lg sm:text-2xl text-center' : 'text-sm sm:text-base'}`}>{step.title}</h3>

          {/* Shimmer divider */}
          {!isCentered && <div className="h-px w-full rounded-full tour-shimmer-bar mb-2 sm:mb-3" />}

          <p className={`text-xs sm:text-sm leading-relaxed text-[#fafaf9]/60 whitespace-pre-line ${isCentered ? 'text-center mb-5 sm:mb-6' : 'mb-3 sm:mb-4'}`}>{step.body}</p>

          {!isCentered ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300" style={{
                    width: i === stepIndex ? 14 : 4, height: 4,
                    backgroundColor: i === stepIndex ? '#10b981' : i < stepIndex ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)',
                  }} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button onClick={onPause} className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-[#fafaf9]/30 hover:text-[#fafaf9]/60 transition-colors">Pause</button>
                {stepIndex > 0 && <button onClick={onPrev} className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-lg border border-white/[0.06] text-[#fafaf9]/50 hover:text-[#fafaf9] hover:border-white/[0.12] transition-all">Back</button>}
                <button onClick={onNext} className="group px-3 sm:px-4 py-1 text-[10px] sm:text-xs font-medium rounded-lg bg-emerald-500 text-[#050505] hover:bg-emerald-400 transition-all flex items-center gap-1">
                  {stepIndex === totalSteps - 2 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full">
                <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#050505] hover:bg-[#fafaf9] transition-all hover:shadow-lg hover:shadow-white/10 w-full sm:w-auto">Start Free Trial<ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                <Link href="/#pricing" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.15] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-[#fafaf9]/80 hover:text-[#fafaf9] hover:border-white/25 transition-all w-full sm:w-auto">See Pricing</Link>
              </div>
              <button onClick={onPause} className="text-sm text-[#fafaf9]/40 hover:text-[#fafaf9]/70 transition-colors mt-1">
                Or Explore The Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}

// ─── Resume Tour Pill ────────────────────────────────────────────────────────

function TourResumePill({ step, total, onResume, onRestart }: { step: number; total: number; onResume: () => void; onRestart: () => void }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 tour-pill-enter">
      <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-[#0a0a0a]/95 backdrop-blur-xl px-2 py-1.5 shadow-2xl" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.08)' }}>
        {/* Progress ring */}
        <div className="relative flex items-center justify-center w-9 h-9">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${pct * 0.94} 100`} strokeLinecap="round" className="transition-all duration-500" />
          </svg>
          <span className="absolute text-[9px] font-bold text-emerald-400">{step + 1}</span>
        </div>
        <div className="pr-1">
          <p className="text-xs font-medium text-[#fafaf9]">Tour paused</p>
          <p className="text-[10px] text-[#fafaf9]/30">Step {step + 1} of {total}</p>
        </div>
        <button onClick={onResume} className="group flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-[#050505] hover:bg-emerald-400 transition-all">
          Resume
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button onClick={onRestart} className="px-2 py-2 text-[#fafaf9]/25 hover:text-[#fafaf9]/50 transition-colors" title="Restart tour">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Demo Page ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [view, setView] = useState<'agency' | 'client'>('agency');
  const [agencyTab, setAgencyTab] = useState('dashboard');
  const [clientTab, setClientTab] = useState('dashboard');
  const [tourStep, setTourStep] = useState(0);
  const [tourPaused, setTourPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const demoFrameRef = useRef<HTMLDivElement>(null);
  const agencyNav = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'clients', label: 'Clients', icon: Users }, { id: 'leads', label: 'Leads', icon: Target }, { id: 'outreach', label: 'Outreach', icon: Send }, { id: 'analytics', label: 'Analytics', icon: BarChart3 }, { id: 'demo-phone', label: 'Demo Phone', icon: Phone }, { id: 'marketing', label: 'Marketing', icon: Globe }, { id: 'referrals', label: 'Referrals', icon: Gift }, { id: 'branding', label: 'Branding', icon: Paintbrush }, { id: 'settings', label: 'Settings', icon: Settings }];
  const clientNav = [{ id: 'dashboard', label: 'Dashboard', icon: TrendingUp }, { id: 'calls', label: 'Calls', icon: PhoneCall }, { id: 'contacts', label: 'Contacts', icon: Users }, { id: 'ai-agent', label: 'AI Agent', icon: Bot }, { id: 'settings', label: 'Settings', icon: Settings }];

  const TOUR_STEPS = [
    { target: 'sidebar-mrr', view: 'agency' as const, tab: 'dashboard', position: 'right' as const, pin: 'top' as const,
      title: 'Your Monthly Recurring Revenue',
      body: 'Forty-seven local businesses on the platform, $8,408 landing in your account every month.\n\nEvery active subscription rolls up here. Your platform fee stays flat as you add clients, so this number keeps climbing while your costs hold steady.' },
    { target: 'clients-table', view: 'agency' as const, tab: 'clients', position: 'top' as const,
      title: 'Every Row Is A Paying Client',
      body: 'Each one is a local business paying you every month for their AI receptionist.\n\nYou set the price. The platform handles provisioning, billing, and the day-to-day, so there are no setup calls and no fulfillment work on your end.' },
    { target: 'add-client-form', view: 'agency' as const, tab: 'add-client', position: 'right' as const,
      title: 'Onboard A Client In Sixty Seconds',
      body: 'Enter a business name, pick a plan, click Create.\n\nThe platform provisions a dedicated number, tunes the AI for that industry, and sends the client their login. No technical work on your end, no A2P registration delay.' },
    { target: 'analytics-stats', view: 'agency' as const, tab: 'analytics', position: 'bottom' as const,
      title: 'Watch The Revenue Add Up',
      body: 'Recurring revenue, total earned, active clients, and payouts, all updating in real time.\n\nStripe Connect routes every subscription straight to your bank. The platform never touches your money.' },
    { target: 'demo-phone', view: 'agency' as const, tab: 'demo-phone', position: 'top' as const,
      title: 'Hear The AI For Yourself',
      body: 'Every agency gets a demo line. Point a prospect to it and the AI books appointments, answers questions, and captures leads, exactly what their business would get.\n\nIt is your sharpest sales tool. Hand someone the number instead of explaining, and they understand the product in thirty seconds.' },
    { target: 'marketing-site', view: 'agency' as const, tab: 'marketing', position: 'bottom' as const,
      title: 'A Branded Marketing Site, Included',
      body: 'Every agency ships with a white-labeled marketing site on your own domain.\n\nHero, pricing, FAQ, an embedded demo line, and a signup flow, all under your brand. Prospects find you, try it, and subscribe without you onboarding them by hand.' },
    { target: 'leads-pipeline', view: 'agency' as const, tab: 'leads', position: 'bottom' as const,
      title: 'Pipeline And Outreach, Built In',
      body: 'Take a prospect from first contact to paying client without leaving the platform.\n\nGoogle Maps prospecting, ready-made outreach templates, follow-up tracking, and reply detection. No separate CRM to buy or set up.' },
    { target: 'view-toggle', view: 'client' as const, tab: 'dashboard', position: 'bottom' as const,
      title: 'Now Switch To The Client View',
      body: 'This is what your clients log into once they are paying you.\n\nFully white-labeled: your name, your domain, your colors. They never see VoiceAI Connect anywhere.' },
    { target: 'client-phone', view: 'client' as const, tab: 'dashboard', position: 'bottom' as const,
      title: 'What Your Clients See Every Day',
      body: 'Calls handled, leads captured, missed calls saved.\n\nThat visibility is what earns the monthly fee. Clients can see exactly what they are paying for, every single month.' },
    { target: 'client-ai', view: 'client' as const, tab: 'ai-agent', position: 'top' as const,
      title: 'Clients Tune Their Own Agent',
      body: 'Voice, greeting, services, FAQ, the client configures the AI themselves.\n\nThe more they personalize it, the more it becomes part of how they run the business. That is what keeps them subscribed.' },
    { target: null, view: 'agency' as const, tab: 'dashboard', position: 'center' as const,
      title: 'Ready To Make It Yours?',
      body: 'Start your 14-day free trial, set up a real test client in a couple of minutes, and hear the AI answer on your own number.\n\nSet your pricing, share your branded signup link, and prospects subscribe under your brand. The platform provisions everything. The recurring revenue is yours.' },
  ];

  const tourActive = !tourPaused && tourStep >= 0 && tourStep < TOUR_STEPS.length;
  const tourHasProgress = tourPaused && tourStep >= 0 && tourStep < TOUR_STEPS.length;
  const currentStep = tourActive ? TOUR_STEPS[tourStep] : null;

  // Navigate view/tab when tour step changes
  useEffect(() => {
    if (!tourActive || !currentStep) return;
    // On mobile, sidebar-targeted steps need the drawer open so the tour can
    // anchor to elements that would otherwise be off-screen.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const targetInSidebar = currentStep.target === 'sidebar-mrr';
    setSidebarOpen(isMobile && targetInSidebar);
    if (currentStep.view !== view) setView(currentStep.view);
    if (currentStep.view === 'agency' && currentStep.tab !== agencyTab) setAgencyTab(currentStep.tab);
    if (currentStep.view === 'client' && currentStep.tab !== clientTab) setClientTab(currentStep.tab);
  }, [tourStep, tourPaused]);

  const nextStep = () => { if (tourStep < TOUR_STEPS.length - 1) setTourStep(tourStep + 1); else { setTourStep(-1); setTourPaused(false); } };
  const prevStep = () => { if (tourStep > 0) setTourStep(tourStep - 1); };
  const pauseTour = () => setTourPaused(true);
  const resumeTour = () => setTourPaused(false);
  const restartTour = () => { setTourStep(0); setTourPaused(false); };

  const renderAgency = () => { switch (agencyTab) { case 'clients': return <AgencyClients onAdd={() => setAgencyTab('add-client')} />; case 'add-client': return <AgencyAddClient onBack={() => setAgencyTab('clients')} />; case 'leads': return <AgencyLeads />; case 'outreach': return <AgencyOutreach />; case 'analytics': return <AgencyAnalytics />; case 'demo-phone': return <AgencyDemoPhone />; case 'marketing': return <AgencyMarketing />; case 'referrals': return <AgencyReferrals />; case 'branding': return <AgencyBranding />; case 'settings': return <AgencySettings />; default: return <AgencyOverview />; } };
  const renderClient = () => { switch (clientTab) { case 'calls': return <ClientCalls />; case 'contacts': return <ClientContacts />; case 'ai-agent': return <ClientAIAgent />; case 'settings': return <ClientSettings />; default: return <ClientOverview />; } };

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* ════════ HERO ════════ */}
      <section className="canvas-dot relative pt-32 lg:pt-40 pb-10 lg:pb-14 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <p className="t-eyebrow text-em mb-5">Interactive demo</p>
            <h1 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Click around. This is the agency you&apos;d run.
            </h1>
            <p className="t-body mt-5 max-w-xl text-[1rem]">
              This is the actual product, not a video. Poke around the business you&apos;d be running: local businesses paying you every month, the AI handling their calls, all under your brand. Flip between what you see and what your clients see, or take the guided tour. No signup required.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ DEMO FRAME ════════ */}
      <section className="bg-ink pb-14 lg:pb-20">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-5 lg:px-8">
          <div ref={demoFrameRef} className="relative h-[80vh] min-h-[480px] sm:min-h-[600px] lg:min-h-[640px] max-h-[860px] flex flex-col bg-[#050505] text-[#fafaf9] overflow-hidden rounded-xl lg:rounded-2xl border border-white/[0.1] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
      {/* Sample-data disclaimer pill */}
      <div className="absolute top-3 right-3 z-30 hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md pointer-events-none" style={{ background: 'rgba(0, 0, 0, 0.55)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4aeabc' }} />
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/60">Sample data · live platform has more depth</span>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      {/* Mobile Header, clean: logo icon + toggle + hamburger */}
      <div className="sticky z-30 lg:hidden" style={{ backgroundColor: view === 'client' ? 'rgb(17,78,60)' : '#050505', paddingTop: 'env(safe-area-inset-top)', top: 0 }}>
        <header className="flex items-center justify-between h-14 px-4" style={{ borderBottom: view === 'client' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)' }}>
          {/* Logo icon only, no name on mobile */}
          {view === 'agency' ? (
            <div className="flex items-center justify-center rounded-xl flex-shrink-0 text-base font-bold text-emerald-400" style={{ height: 36, width: 36, backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>{AGENCY.name.charAt(0)}</div>
          ) : (
            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ height: 36, width: 36, backgroundColor: 'rgba(255,255,255,0.15)' }}><Phone className="h-5 w-5 text-white" /></div>
          )}
          {/* Center toggle, thin buttons, spread apart */}
          <div data-tour="view-toggle" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">
            <button onClick={() => { setView('agency'); setSidebarOpen(false); }} className={`px-3 rounded-full text-[10px] font-medium transition-all leading-5 ${view === 'agency' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/40'}`}>Agency</button>
            <button onClick={() => { setView('client'); setSidebarOpen(false); }} className={`px-3 rounded-full text-[10px] font-medium transition-all leading-5 ${view === 'client' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/40'}`}>Client</button>
          </div>
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-10 h-10 -mr-1.5 rounded-xl" style={{ color: view === 'client' ? '#ffffff' : 'rgba(250,250,249,0.7)' }}>
            <Menu className="h-6 w-6" />
          </button>
        </header>
      </div>

      {/* Desktop Top Bar, only visible on lg+ */}
      <div className="hidden lg:flex relative z-40 items-center justify-between px-5 h-14 border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5"><img src="/icon-512x512.png" alt="VoiceAI Connect" className="h-7 w-7 rounded-lg flex-shrink-0" /><span className="text-sm font-semibold tracking-tight">VoiceAI Connect</span></Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1 text-xs"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span><span className="text-emerald-300/90">Interactive Demo</span></div>
        </div>
        <div data-tour="view-toggle" className="absolute left-1/2 -translate-x-1/2 inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-0.5"><button onClick={() => setView('agency')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'agency' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'}`}>Agency Dashboard</button><button onClick={() => setView('client')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'client' ? 'bg-emerald-500 text-[#050505]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'}`}>Client Dashboard</button></div>
        <div className="flex items-center gap-3"><button onClick={restartTour} className="px-3 py-1.5 text-xs text-[#fafaf9]/30 hover:text-[#fafaf9]/60 transition-colors">Restart Tour</button><Link href="/#pricing" className="px-3 py-1.5 rounded-full border border-white/[0.1] text-xs text-[#fafaf9]/70 hover:text-[#fafaf9] hover:border-white/20 transition-all">Pricing</Link><Link href="/signup" className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:shadow-lg hover:shadow-white/10">Start Free Trial<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></Link></div>
      </div>

      {/* Mobile Sidebar Overlay, matches real layout */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer, matches real layout: w-72, slides from left */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: view === 'client' ? 'rgb(17,78,60)' : '#050505', borderRight: view === 'client' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Drawer Header, "Menu" + X close, matches real layout */}
        <div className="flex items-center justify-between h-14 px-4" style={{ borderBottom: view === 'client' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)' }}>
          <span className="font-semibold text-base" style={{ color: view === 'client' ? '#ffffff' : '#fafaf9' }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-10 h-10 -mr-1.5 rounded-xl" style={{ color: view === 'client' ? '#ffffff' : 'rgba(250,250,249,0.7)' }}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav Items, matches real layout: rounded-xl px-3 py-3 */}
        <nav className="p-4 space-y-1">
          {(view === 'agency' ? agencyNav : clientNav).map(item => {
            const active = view === 'agency' ? agencyTab === item.id : clientTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (view === 'agency') setAgencyTab(item.id); else setClientTab(item.id);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors text-left"
                style={view === 'agency'
                  ? { backgroundColor: active ? 'rgba(16,185,129,0.1)' : 'transparent', color: active ? '#10b981' : 'rgba(250,250,249,0.6)' }
                  : { backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent', color: active ? '#ffffff' : 'rgba(255,255,255,0.65)' }
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {active && <ChevronRight className="h-4 w-4" style={{ color: view === 'agency' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.3)' }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom card, matches real layout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
          {view === 'agency' ? (
            <div data-tour="sidebar-mrr" className="rounded-xl p-3" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-[10px]" style={{ color: 'rgba(16,185,129,0.6)' }}>Monthly Revenue</p>
              <p className="text-lg font-bold text-emerald-300">{AGENCY.stats.mrr}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(16,185,129,0.5)' }}>{AGENCY.stats.clients} active clients</p>
            </div>
          ) : (
            <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Powered by</p>
              <p className="text-sm font-medium text-white">{CLIENT.agencyName}</p>
            </div>
          )}
        </div>
      </aside>
      {/* Dashboard */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'agency' ? (<>
          <div className="hidden lg:flex w-56 border-r border-white/[0.06] bg-[#050505] flex-shrink-0 flex-col">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5"><span className="text-sm font-bold text-[#fafaf9]">{AGENCY.name.charAt(0)}</span></div><div className="min-w-0"><p className="font-semibold text-sm text-[#fafaf9] truncate">{AGENCY.name}</p><p className="text-[10px] text-[#fafaf9]/40">{AGENCY.plan} Plan</p></div></div>
            <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">{agencyNav.map(item => (<button key={item.id} onClick={() => setAgencyTab(item.id)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${agencyTab === item.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'}`}><item.icon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{item.label}</span></button>))}</nav>
            <div className="p-3 border-t border-white/[0.06]"><div data-tour="sidebar-mrr" className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] p-3"><p className="text-[10px] text-emerald-400/70 mb-0.5">Monthly Revenue</p><p className="text-lg font-bold text-emerald-300">{AGENCY.stats.mrr}</p><p className="text-[10px] text-emerald-400/50 mt-0.5">{AGENCY.stats.clients} active clients</p></div></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#0a0a0a]" style={{ zoom: 0.8 } as any}>{renderAgency()}</div>
        </>) : (<>
          <div className="hidden lg:flex w-56 border-r flex-shrink-0 flex-col" style={{ backgroundColor: 'rgb(17,78,60)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}><Phone className="h-4 w-4 text-white" /></div><div className="min-w-0"><p className="font-semibold text-sm text-white truncate">{CLIENT.name}</p><p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>AI Receptionist Active</p></div></div>
            <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">{clientNav.map(item => (<button key={item.id} onClick={() => setClientTab(item.id)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all" style={{ backgroundColor: clientTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent', color: clientTab === item.id ? '#ffffff' : 'rgba(255,255,255,0.65)' }} onMouseEnter={e => { if (clientTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; }} onMouseLeave={e => { if (clientTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}><item.icon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{item.label}</span></button>))}</nav>
            <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}><p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Powered by</p><p className="text-sm font-semibold text-white">{CLIENT.agencyName}</p></div></div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ zoom: 0.8 } as any}>{renderClient()}</div>
        </>)}
      </div>
      {/* Tour Overlay */}
      {tourActive && currentStep && <TourOverlay step={currentStep} stepIndex={tourStep} totalSteps={TOUR_STEPS.length} onNext={nextStep} onPrev={prevStep} onPause={pauseTour} frameRef={demoFrameRef} />}
      {/* Resume Pill */}
      {tourHasProgress && <TourResumePill step={tourStep} total={TOUR_STEPS.length} onResume={resumeTour} onRestart={restartTour} />}
          </div>
        </div>
      </section>

      {/* ════════ CTA, Start now or book a call ════════ */}
      <section className="bg-ink canvas-dot py-28 lg:py-36 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Ready when you are</p>
            <h2 className="t-h1 text-white">Start now, or talk to us first.</h2>
            <p className="t-body mt-7 max-w-lg">
              Activate a workspace and have your branded platform live by Friday, or hop on a 20-minute call to see how the platform fits your specific business.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/demo" className="btn btn-ghost-dark">Book a call <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}