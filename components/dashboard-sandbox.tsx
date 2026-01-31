'use client';

import { useState } from 'react';
import { 
  Phone, Users, DollarSign, PhoneCall, Settings, LogOut, Copy, Check,
  TrendingUp, Clock, ChevronRight, Zap, LayoutDashboard, Target, Send,
  BarChart3, Globe, Gift, Bot, AlertCircle, PhoneOff
} from 'lucide-react';

function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// Sample data
const agencyData = {
  user: { first_name: 'Alex' },
  stats: [
    { label: 'Total Clients', value: '47', icon: 'users' },
    { label: 'Monthly Revenue', value: '$12,400', icon: 'dollar' },
    { label: 'Calls This Month', value: '2,847', icon: 'phone' },
  ],
  recentClients: [
    { id: '1', business_name: 'Smith Plumbing Co', plan_type: 'professional', subscription_status: 'active' },
    { id: '2', business_name: 'Elite Dental Care', plan_type: 'professional', subscription_status: 'active' },
    { id: '3', business_name: 'Sunrise HVAC', plan_type: 'starter', subscription_status: 'trial' },
    { id: '4', business_name: 'Peak Roofing', plan_type: 'starter', subscription_status: 'active' },
  ],
  signupLink: 'aivoice.pro/signup',
};

const clientData = {
  business_name: 'Smith Plumbing Co',
  phone_number: '+1 (404) 555-0192',
  stats: {
    callsThisMonth: 127,
    highUrgency: 8,
    callLimit: 500,
  },
  recentCalls: [
    { id: '1', customer_name: 'Sarah Johnson', customer_phone: '(555) 123-4567', service_requested: 'Emergency leak repair', urgency_level: 'high', created_at: new Date().toISOString() },
    { id: '2', customer_name: 'Mike Chen', customer_phone: '(555) 234-5678', service_requested: 'Water heater quote', urgency_level: 'normal', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', customer_name: 'Lisa Martinez', customer_phone: '(555) 345-6789', service_requested: 'Drain cleaning', urgency_level: 'normal', created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
};

// Agency Dashboard Content
function AgencyDashboard({ activeTab }: { activeTab: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconMap: Record<string, any> = { users: Users, dollar: DollarSign, phone: PhoneCall };
  const colors = ['#10b981', '#f59e0b', '#3b82f6'];

  if (activeTab === 'clients') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-[#fafaf9]/50">Manage your AI receptionist clients</p>
        </div>
        <div className="space-y-3">
          {[...agencyData.recentClients, 
            { id: '5', business_name: 'Valley Electric', plan_type: 'professional', subscription_status: 'active' },
            { id: '6', business_name: 'Metro Law Group', plan_type: 'professional', subscription_status: 'active' },
          ].map((client) => (
            <div key={client.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <span className="text-sm font-medium text-emerald-400">{client.business_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{client.business_name}</p>
                  <p className="text-sm text-[#fafaf9]/50 capitalize">{client.plan_type} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  client.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{client.subscription_status}</span>
                <ChevronRight className="h-4 w-4 text-[#fafaf9]/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-[#fafaf9]/50">Track your agency performance</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: '$47,200', change: '+12%' },
            { label: 'Active Clients', value: '47', change: '+5' },
            { label: 'Avg. Revenue/Client', value: '$264', change: '+8%' },
            { label: 'Churn Rate', value: '2.1%', change: '-0.3%' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-[#fafaf9]/50">{stat.label}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              <p className="text-xs text-emerald-400 mt-1">{stat.change} this month</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 h-40 flex items-center justify-center">
          <p className="text-[#fafaf9]/30 text-sm">Revenue chart visualization</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'leads') {
    const leads = [
      { id: '1', business_name: 'Ace Garage Doors', contact: 'Tom Wilson', status: 'hot', source: 'Cold Email', lastContact: '2 hours ago' },
      { id: '2', business_name: 'Comfort Air HVAC', contact: 'Maria Santos', status: 'warm', source: 'LinkedIn', lastContact: '1 day ago' },
      { id: '3', business_name: 'Quick Fix Plumbing', contact: 'James Lee', status: 'hot', source: 'Referral', lastContact: '3 hours ago' },
      { id: '4', business_name: 'Bright Smile Dental', contact: 'Dr. Patel', status: 'new', source: 'Website', lastContact: 'Just now' },
      { id: '5', business_name: 'Summit Roofing', contact: 'Mike Brown', status: 'warm', source: 'Cold Email', lastContact: '2 days ago' },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Leads</h1>
            <p className="text-sm text-[#fafaf9]/50">Track and convert prospects into clients</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-[#050505] hover:bg-emerald-400 transition-colors">
            <Target className="h-3 w-3" />
            Add Lead
          </button>
        </div>
        
        {/* Lead Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Leads', value: '124', color: '#3b82f6' },
            { label: 'Hot', value: '18', color: '#ef4444' },
            { label: 'Warm', value: '42', color: '#f59e0b' },
            { label: 'Converted', value: '47', color: '#10b981' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-lg font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] text-[#fafaf9]/40">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Leads List */}
        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                  <span className="text-xs font-medium text-blue-400">{lead.business_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{lead.business_name}</p>
                  <p className="text-xs text-[#fafaf9]/40">{lead.contact} • {lead.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  lead.status === 'hot' ? 'bg-red-500/10 text-red-400' : 
                  lead.status === 'warm' ? 'bg-amber-500/10 text-amber-400' : 
                  'bg-blue-500/10 text-blue-400'
                }`}>{lead.status}</span>
                <span className="text-[10px] text-[#fafaf9]/30">{lead.lastContact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Dashboard
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Welcome back, {agencyData.user.first_name}! 👋</h1>
        <p className="text-sm text-[#fafaf9]/50">Here&apos;s how your agency is performing.</p>
      </div>

      {/* Signup Link */}
      <div className="mb-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#fafaf9]/50 mb-1">Your Client Signup Link</p>
            <p className="text-sm font-medium text-emerald-300 truncate">{agencyData.signupLink}</p>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors flex-shrink-0">
            {copied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {agencyData.stats.map((stat, i) => {
          const Icon = iconMap[stat.icon];
          return (
            <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${colors[i]}15` }}>
                  <Icon className="h-5 w-5" style={{ color: colors[i] }} />
                </div>
                <div>
                  <p className="text-xs text-[#fafaf9]/50">{stat.label}</p>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Clients */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
          <h2 className="font-medium text-sm">Recent Clients</h2>
          <span className="text-xs text-emerald-400 cursor-pointer hover:text-emerald-300">View all →</span>
        </div>
        <div className="p-4 space-y-2">
          {agencyData.recentClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <span className="text-xs font-medium text-emerald-400">{client.business_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{client.business_name}</p>
                  <p className="text-xs text-[#fafaf9]/50 capitalize">{client.plan_type}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                client.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{client.subscription_status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Client Dashboard Content
function ClientDashboard({ activeTab }: { activeTab: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (activeTab === 'calls') {
    return (
      <div className="p-6" style={{ backgroundColor: '#f9fafb', minHeight: '100%' }}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Call History</h1>
          <p className="text-sm text-gray-500">All incoming calls handled by your AI</p>
        </div>
        <div className="space-y-3">
          {[...clientData.recentCalls,
            { id: '4', customer_name: 'John Davis', customer_phone: '(555) 456-7890', service_requested: 'Faucet installation', urgency_level: 'normal', created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: '5', customer_name: 'Emma Wilson', customer_phone: '(555) 567-8901', service_requested: 'Pipe inspection', urgency_level: 'medium', created_at: new Date(Date.now() - 172800000).toISOString() },
          ].map((call) => (
            <div key={call.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <PhoneCall className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{call.customer_name}</p>
                  <p className="text-sm text-gray-500">{call.customer_phone} • {call.service_requested}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                call.urgency_level === 'high' ? 'bg-red-50 text-red-600' : 
                call.urgency_level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
              }`}>{call.urgency_level}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'ai-agent') {
    return (
      <div className="p-6" style={{ backgroundColor: '#f9fafb', minHeight: '100%' }}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">AI Agent Settings</h1>
          <p className="text-sm text-gray-500">Configure how your AI receptionist behaves</p>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Business Name', value: 'Smith Plumbing Co' },
            { label: 'Greeting', value: 'Thank you for calling Smith Plumbing! How can I help you today?' },
            { label: 'Voice', value: 'Sarah (Warm & Professional)' },
            { label: 'Services', value: 'Leak repair, Water heaters, Drain cleaning, Pipe installation' },
          ].map((setting) => (
            <div key={setting.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">{setting.label}</p>
              <p className="text-sm text-gray-900">{setting.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Dashboard
  return (
    <div className="p-6" style={{ backgroundColor: '#f9fafb', minHeight: '100%' }}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back! 👋</h1>
        <p className="text-sm text-gray-500">Here&apos;s your AI receptionist activity.</p>
      </div>

      {/* Phone Number Card */}
      <div className="mb-6 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Phone className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your AI Phone Number</p>
              <p className="text-lg font-semibold text-gray-900">{clientData.phone_number}</p>
            </div>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? <><Check className="h-3 w-3 text-emerald-500" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Calls This Month', value: clientData.stats.callsThisMonth, sub: `of ${clientData.stats.callLimit}`, icon: PhoneCall, color: '#10b981' },
          { label: 'High Priority', value: clientData.stats.highUrgency, sub: 'Urgent calls', icon: AlertCircle, color: '#f59e0b' },
          { label: 'Status', value: 'Active', sub: 'Receiving calls', icon: Zap, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Calls */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="font-semibold text-sm text-gray-900">Recent Calls</h2>
          <span className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-700">View all →</span>
        </div>
        <div className="p-4 space-y-2">
          {clientData.recentCalls.map((call) => (
            <div key={call.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{call.customer_name}</p>
                  <p className="text-xs text-gray-500">{call.service_requested}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                call.urgency_level === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>{call.urgency_level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Sandbox Component
export default function DashboardSandbox() {
  const [view, setView] = useState<'agency' | 'client'>('agency');
  const [agencyTab, setAgencyTab] = useState('dashboard');
  const [clientTab, setClientTab] = useState('dashboard');

  const agencyNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const clientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'ai-agent', label: 'AI Agent', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
            <div className="max-w-md mx-auto bg-white/[0.05] rounded-lg px-4 py-1.5 text-xs text-center text-[#fafaf9]/40">
              {view === 'agency' ? 'app.myvoiceaiconnect.com/agency/dashboard' : 'app.aivoice.pro/dashboard'}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex h-[500px]">
          {view === 'agency' ? (
            <>
              {/* Agency Sidebar */}
              <div className="w-56 border-r border-white/[0.06] bg-[#050505] flex-shrink-0 relative flex flex-col">
                <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <WaveformIcon className="h-5 w-5 text-[#fafaf9]" />
                  </div>
                  <span className="font-semibold text-sm text-[#fafaf9]">Your Agency</span>
                </div>
                <nav className="p-3 space-y-1 flex-1">
                  {agencyNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAgencyTab(item.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        agencyTab === item.id
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] p-2">
                    <p className="text-[10px] text-emerald-400/80">Current Plan</p>
                    <p className="text-xs font-medium text-emerald-300">Professional</p>
                  </div>
                </div>
              </div>
              {/* Agency Main */}
              <div className="flex-1 overflow-y-auto bg-[#050505] text-[#fafaf9]">
                <AgencyDashboard activeTab={agencyTab} />
              </div>
            </>
          ) : (
            <>
              {/* Client Sidebar */}
              <div className="w-56 border-r flex-shrink-0 flex flex-col" style={{ backgroundColor: 'rgb(23, 90, 72)' }}>
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-sm text-white truncate">Smith Plumbing</span>
                </div>
                <nav className="p-3 space-y-1 flex-1">
                  {clientNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setClientTab(item.id)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: clientTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: clientTab === item.id ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
                <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Powered by</p>
                    <p className="text-xs font-medium text-white">AI Voice Pro</p>
                  </div>
                </div>
              </div>
              {/* Client Main */}
              <div className="flex-1 overflow-y-auto">
                <ClientDashboard activeTab={clientTab} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}