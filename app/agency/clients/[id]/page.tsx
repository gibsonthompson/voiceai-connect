'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, Globe,
  PhoneCall, CreditCard, Calendar, Clock, ChevronRight, Loader2,
  Copy, Check, ExternalLink, Save, RotateCcw, AlertCircle, Bot,
  Brain, Zap
} from 'lucide-react';
import { useAgency } from '../../context';
import { useTheme } from '@/hooks/useTheme';
import { getDemoClientDetail } from '../../demoData';

// ─── Industry Intelligence Stats (matches industry-knowledge-bases.js) ───
const INDUSTRY_INTELLIGENCE: Record<string, {
  label: string;
  services: number;
  faqs: number;
  terms: number;
  features: string[];
}> = {
  home_services: {
    label: 'Home Services',
    services: 47,
    faqs: 10,
    terms: 9,
    features: ['Emergency Triage', 'Seasonal Awareness', 'Urgency Detection'],
  },
  medical: {
    label: 'Medical & Dental',
    services: 38,
    faqs: 11,
    terms: 8,
    features: ['HIPAA Compliant', 'Emergency Triage', 'Insurance Terminology'],
  },
  professional_services: {
    label: 'Professional Services',
    services: 32,
    faqs: 8,
    terms: 7,
    features: ['Engagement Flow', 'NDA Awareness', 'Retainer Handling'],
  },
  restaurants: {
    label: 'Restaurants',
    services: 12,
    faqs: 12,
    terms: 7,
    features: ['Allergen Awareness', 'Reservation Logic', 'Peak Hour Handling'],
  },
  salon_spa: {
    label: 'Salon & Spa',
    services: 42,
    faqs: 11,
    terms: 6,
    features: ['Duration Estimates', 'Upsell Suggestions', 'Cancellation Policy'],
  },
  retail: {
    label: 'Retail',
    services: 10,
    faqs: 11,
    terms: 5,
    features: ['Inventory Checks', 'Return Policy', 'Order Status Handling'],
  },
  fitness: {
    label: 'Fitness',
    services: 28,
    faqs: 12,
    terms: 9,
    features: ['Trial Offers', 'Class Schedules', 'Membership Freeze'],
  },
  legal: {
    label: 'Legal Services',
    services: 35,
    faqs: 8,
    terms: 10,
    features: ['Privilege Compliant', 'No Legal Advice', 'Intake Flow'],
  },
  real_estate: {
    label: 'Real Estate',
    services: 24,
    faqs: 10,
    terms: 12,
    features: ['Buyer/Seller Routing', 'Seasonal Market', 'Mortgage Referrals'],
  },
  financial: {
    label: 'Financial Services',
    services: 30,
    faqs: 10,
    terms: 10,
    features: ['Compliance Safe', 'Tax Season Aware', 'No Financial Advice'],
  },
  automotive: {
    label: 'Automotive',
    services: 40,
    faqs: 12,
    terms: 10,
    features: ['Safety Priority', 'Maintenance Schedules', 'OEM/Aftermarket'],
  },
};

// Map client.industry values to knowledge base keys
const INDUSTRY_KEY_MAP: Record<string, string> = {
  'Home Services (plumbing, HVAC, contractors)': 'home_services',
  'Medical/Dental': 'medical',
  'Retail/E-commerce': 'retail',
  'Professional Services (legal, accounting)': 'professional_services',
  'Restaurants/Food Service': 'restaurants',
  'Salon/Spa (hair, nails, skincare)': 'salon_spa',
  'home_services': 'home_services',
  'medical': 'medical',
  'medical_dental': 'medical',
  'retail': 'retail',
  'professional_services': 'professional_services',
  'restaurants': 'restaurants',
  'restaurant': 'restaurants',
  'salon_spa': 'salon_spa',
  'beauty_wellness': 'salon_spa',
  'fitness': 'fitness',
  'legal': 'legal',
  'real_estate': 'real_estate',
  'financial_services': 'financial',
  'financial': 'financial',
  'automotive': 'automotive',
  'general': 'professional_services',
  'other': 'professional_services',
};

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  business_city?: string;
  business_state?: string;
  business_website?: string;
  industry?: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  monthly_call_limit?: number;
  created_at: string;
  vapi_phone_number: string;
  vapi_assistant_id?: string;
  trial_ends_at?: string;
}

interface Call {
  id: string;
  customer_name: string;
  caller_phone: string;
  customer_phone?: string;
  created_at: string;
  urgency_level: string;
  call_status: string;
  duration_seconds?: number;
  duration?: number;
  service_requested?: string;
}

export default function AgencyClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();

  const [client, setClient] = useState<Client | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── AI Prompt State ──
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptResetting, setPromptResetting] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!agency || !clientId) return;

    if (demoMode) {
      const demoData = getDemoClientDetail(clientId);
      setClient(demoData.client as Client);
      setRecentCalls(demoData.calls as Call[]);
      setLoading(false);
      setPromptLoading(false);
      setSystemPrompt('You are the phone assistant for Demo Business...');
      setOriginalPrompt('You are the phone assistant for Demo Business...');
      return;
    }

    fetchClientData();
  }, [agency, clientId, demoMode]);

  useEffect(() => {
    if (client?.vapi_assistant_id && agency && !demoMode) {
      fetchPrompt();
    }
  }, [client?.id, client?.vapi_assistant_id]);

  const fetchClientData = async () => {
    if (!agency || !clientId) return;
    try {
      const token = localStorage.getItem('auth_token');

      const clientRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!clientRes.ok) {
        setError('Client not found');
        return;
      }
      const clientData = await clientRes.json();
      setClient(clientData.client);

      const callsRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/calls`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setRecentCalls((callsData.calls || []).slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch client:', e);
      setError('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  // ── Prompt Handlers ──

  const fetchPrompt = async () => {
    if (!agency || !clientId) return;
    setPromptLoading(true);
    setPromptError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load prompt');
      }

      const data = await res.json();
      setSystemPrompt(data.system_prompt || '');
      setOriginalPrompt(data.system_prompt || '');
    } catch (err) {
      console.error('Failed to fetch prompt:', err);
      setPromptError(err instanceof Error ? err.message : 'Failed to load prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!agency || !clientId) return;
    setPromptSaving(true);
    setPromptError(null);
    setPromptSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ system_prompt: systemPrompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save prompt');
      }

      const data = await res.json();
      setOriginalPrompt(data.system_prompt);
      setSystemPrompt(data.system_prompt);
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setPromptError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPromptSaving(false);
    }
  };

  const handleResetPrompt = async () => {
    if (!agency || !clientId) return;
    if (!confirm('Reset to the default industry prompt? Your custom changes will be lost.')) return;

    setPromptResetting(true);
    setPromptError(null);
    setPromptSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset prompt');
      }

      const data = await res.json();
      setSystemPrompt(data.system_prompt);
      setOriginalPrompt(data.system_prompt);
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } catch (err) {
      console.error('Failed to reset prompt:', err);
      setPromptError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setPromptResetting(false);
    }
  };

  const promptHasChanges = systemPrompt !== originalPrompt;

  // ── Helpers ──

  const copyPhoneNumber = () => {
    if (!client?.vapi_phone_number) return;
    navigator.clipboard.writeText(client.vapi_phone_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'pro': return 'Professional';
      case 'growth': return 'Growth';
      default: return plan || 'Starter';
    }
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter': return agency.price_starter || 4900;
      case 'pro': return agency.price_pro || 9900;
      case 'growth': return agency.price_growth || 14900;
      default: return 0;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'trial':
      case 'trialing':
        return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'past_due':
        return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'suspended':
      case 'cancelled':
        return { bg: theme.errorBg, text: theme.errorText, border: theme.errorBorder };
      default:
        return { bg: theme.hover, text: theme.textMuted, border: theme.border };
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // ── Resolve industry intelligence for this client ──
  const industryKey = client?.industry ? (INDUSTRY_KEY_MAP[client.industry] || 'professional_services') : null;
  const intelligence = industryKey ? INDUSTRY_INTELLIGENCE[industryKey] : null;

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link 
          href="/agency/clients"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-6 hover:opacity-80"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="text-center py-20">
          <div 
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.errorBg }}
          >
            <Building2 className="h-8 w-8" style={{ color: theme.errorText, opacity: 0.5 }} />
          </div>
          <p className="mt-4 font-medium" style={{ color: theme.textMuted }}>{error || 'Client not found'}</p>
          <Link 
            href="/agency/clients"
            className="mt-4 inline-flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: theme.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to clients
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(client.subscription_status || client.status);
  const callsUsed = client.calls_this_month || 0;
  const callLimit = client.monthly_call_limit;
  const callPercent = callLimit ? Math.min(100, (callsUsed / callLimit) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <Link 
        href="/agency/clients"
        className="inline-flex items-center gap-2 text-sm transition-colors mb-4 sm:mb-6 hover:opacity-80"
        style={{ color: theme.textMuted }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: theme.primary15 }}
            >
              <span className="text-xl sm:text-2xl font-medium" style={{ color: theme.primary }}>
                {client.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{client.business_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span 
                  className="inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {client.subscription_status || client.status}
                </span>
                <span className="text-sm" style={{ color: theme.textMuted }}>
                  {getPlanLabel(client.plan_type)} — ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* AI Phone Number Card */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">AI Phone Number</h2>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: theme.primary }}>
                    {client.vapi_phone_number ? formatPhone(client.vapi_phone_number) : 'Not provisioned'}
                  </p>
                  {client.vapi_assistant_id && (
                    <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                      Assistant: {client.vapi_assistant_id.slice(0, 12)}...
                    </p>
                  )}
                </div>
                {client.vapi_phone_number && (
                  <button
                    onClick={copyPhoneNumber}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: theme.hover, color: theme.textMuted }}
                  >
                    {copied ? <Check className="h-4 w-4" style={{ color: theme.primary }} /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">Business Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                    <User className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: theme.textMuted }}>Owner</p>
                    <p className="text-sm truncate">{client.owner_name || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                    <Mail className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: theme.textMuted }}>Email</p>
                    <p className="text-sm truncate">{client.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                    <Phone className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: theme.textMuted }}>Phone</p>
                    <p className="text-sm">{client.owner_phone ? formatPhone(client.owner_phone) : '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                    <MapPin className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: theme.textMuted }}>Location</p>
                    <p className="text-sm">
                      {client.business_city && client.business_state 
                        ? `${client.business_city}, ${client.business_state}` 
                        : '—'}
                    </p>
                  </div>
                </div>

                {client.industry && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                      <Building2 className="h-4 w-4" style={{ color: theme.textMuted }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: theme.textMuted }}>Industry</p>
                      <p className="text-sm">{client.industry}</p>
                    </div>
                  </div>
                )}

                {client.business_website && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                      <Globe className="h-4 w-4" style={{ color: theme.textMuted }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: theme.textMuted }}>Website</p>
                      <a 
                        href={client.business_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm truncate block hover:underline"
                        style={{ color: theme.primary }}
                      >
                        {client.business_website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── AI Receptionist Prompt ── */}
          {client.vapi_assistant_id && (
            <div 
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" style={{ color: theme.primary }} />
                    <h2 className="font-semibold text-sm sm:text-base">AI Receptionist Prompt</h2>
                  </div>
                  {promptHasChanges && (
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: theme.warningBg, color: theme.warningText }}
                    >
                      Unsaved changes
                    </span>
                  )}
                </div>

                <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                  This is the system prompt that controls how this client&apos;s AI receptionist behaves on calls. Changes take effect immediately on the next call.
                </p>

                {promptError && (
                  <div 
                    className="mb-4 rounded-lg p-3 flex items-center gap-2"
                    style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
                    <p className="text-xs" style={{ color: theme.errorText }}>{promptError}</p>
                  </div>
                )}

                {promptSaved && (
                  <div 
                    className="mb-4 rounded-lg p-3 flex items-center gap-2"
                    style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}
                  >
                    <Check className="h-4 w-4" style={{ color: theme.primary }} />
                    <p className="text-xs" style={{ color: theme.primary }}>
                      Prompt updated — changes are live on the next call.
                    </p>
                  </div>
                )}

                {promptLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
                  </div>
                ) : (
                  <>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={14}
                      className="w-full rounded-xl px-4 py-3 text-sm font-mono transition-colors resize-y focus:outline-none"
                      style={{
                        backgroundColor: theme.input,
                        border: `1px solid ${theme.inputBorder}`,
                        color: theme.text,
                        minHeight: '200px',
                      }}
                      placeholder="Enter system prompt..."
                    />

                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        onClick={handleResetPrompt}
                        disabled={promptResetting || promptSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: theme.input,
                          border: `1px solid ${theme.inputBorder}`,
                          color: theme.textMuted,
                        }}
                      >
                        {promptResetting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Reset to Default
                      </button>

                      <button
                        onClick={handleSavePrompt}
                        disabled={promptSaving || promptResetting || !promptHasChanges}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                      >
                        {promptSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Prompt
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recent Calls */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">Recent Calls</h2>
              </div>
              <Link
                href={`/agency/clients/${clientId}/calls`}
                className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-colors"
                style={{ color: theme.primary }}
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {recentCalls.length === 0 ? (
              <div className="px-4 sm:px-6 pb-6 text-center py-8">
                <PhoneCall className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.4 }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>No calls yet</p>
              </div>
            ) : (
              <div>
                {recentCalls.map((call, idx) => (
                  <Link
                    key={call.id}
                    href={`/agency/clients/${clientId}/calls/${call.id}`}
                    className="flex items-center justify-between px-4 sm:px-6 py-3 transition-colors"
                    style={{ 
                      borderTop: `1px solid ${theme.borderSubtle}`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PhoneCall className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{call.customer_name || 'Unknown Caller'}</p>
                        <p className="text-xs" style={{ color: theme.textMuted }}>
                          {call.service_requested || 'General inquiry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs" style={{ color: theme.textMuted }}>
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 sm:space-y-6">

          {/* ════════════════════════════════════════════════════════════════
              RECEPTIONIST INTELLIGENCE CARD — NEW
              Shows pre-loaded industry knowledge stats + feature badges
              ════════════════════════════════════════════════════════════════ */}
          {intelligence && client.vapi_assistant_id && (
            <div 
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4" style={{ color: theme.primary }} />
                  <h2 className="font-semibold text-sm sm:text-base">Receptionist Intelligence</h2>
                </div>
                <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                  Pre-loaded {intelligence.label} knowledge
                </p>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div 
                    className="rounded-lg p-2.5 text-center"
                    style={{ backgroundColor: theme.hover }}
                  >
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>{intelligence.services}</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Services</p>
                  </div>
                  <div 
                    className="rounded-lg p-2.5 text-center"
                    style={{ backgroundColor: theme.hover }}
                  >
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>{intelligence.faqs}</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>FAQs</p>
                  </div>
                  {intelligence.terms > 0 && (
                    <div 
                      className="rounded-lg p-2.5 text-center"
                      style={{ backgroundColor: theme.hover }}
                    >
                      <p className="text-lg font-bold" style={{ color: theme.primary }}>{intelligence.terms}</p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>Terms</p>
                    </div>
                  )}
                  <div 
                    className="rounded-lg p-2.5 text-center"
                    style={{ backgroundColor: theme.hover }}
                  >
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>3</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Urgency Levels</p>
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {intelligence.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: theme.primary + '12', color: theme.primary }}
                    >
                      <Zap className="h-3 w-3" />
                      {feature}
                    </span>
                  ))}
                  {client.business_website && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: theme.primary + '12', color: theme.primary }}
                    >
                      <Globe className="h-3 w-3" />
                      Website Integrated
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subscription Card */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">Subscription</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.textMuted }}>Plan</span>
                  <span className="text-sm font-medium">{getPlanLabel(client.plan_type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.textMuted }}>Price</span>
                  <span className="text-sm font-medium">${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.textMuted }}>Status</span>
                  <span 
                    className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    {client.subscription_status || client.status}
                  </span>
                </div>
                {client.trial_ends_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: theme.textMuted }}>Trial Ends</span>
                    <span className="text-sm">{new Date(client.trial_ends_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call Usage Card */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">Call Usage</h2>
              </div>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold" style={{ color: theme.primary }}>{callsUsed}</p>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  calls this month{callLimit ? ` of ${callLimit}` : ''}
                </p>
              </div>

              {callLimit && (
                <div>
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: theme.hover }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${callPercent}%`,
                        backgroundColor: callPercent > 90 ? '#ef4444' : callPercent > 70 ? '#f59e0b' : theme.primary,
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-right" style={{ color: theme.textMuted }}>
                    {Math.max(0, callLimit - callsUsed)} remaining
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Card */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4" style={{ color: theme.primary }} />
                <h2 className="font-semibold text-sm sm:text-base">Quick Info</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: theme.textMuted }}>Client Since</span>
                  <span className="text-sm">
                    {new Date(client.created_at).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link 
              href={`/agency/clients/${clientId}/calls`}
              className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              <PhoneCall className="h-4 w-4" />
              View Call History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}