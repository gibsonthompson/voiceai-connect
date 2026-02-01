'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, PhoneCall, DollarSign, Calendar, Globe, ArrowLeft,
  Loader2, Mail, MapPin, Building2, User, ChevronRight
} from 'lucide-react';
import { useAgency } from '../../context';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  business_city: string;
  business_state: string;
  business_website: string;
  industry: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  monthly_call_limit: number;
  vapi_phone_number: string;
  vapi_assistant_id: string;
  created_at: string;
  trial_ends_at: string | null;
}

interface Call {
  id: string;
  caller_phone: string;
  customer_name: string;
  duration: number;
  created_at: string;
  call_status: string;
  urgency_level: string;
  ai_summary: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { agency, branding, loading: contextLoading } = useAgency();
  
  const [client, setClient] = useState<Client | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';

  useEffect(() => {
    if (agency && clientId) {
      fetchClientData();
    }
  }, [agency, clientId]);

  const fetchClientData = async () => {
    if (!agency || !clientId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const clientRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!clientRes.ok) {
        if (clientRes.status === 404) {
          setError('Client not found');
        } else {
          setError('Failed to load client');
        }
        setLoading(false);
        return;
      }

      const clientData = await clientRes.json();
      setClient(clientData.client);

      const callsRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/calls?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setRecentCalls(callsData.calls || []);
      }
    } catch (err) {
      console.error('Failed to fetch client data:', err);
      setError('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter':
        return agency.price_starter || 4900;
      case 'pro':
        return agency.price_pro || 9900;
      case 'growth':
        return agency.price_growth || 14900;
      default:
        return 0;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: `${primaryColor}15`, text: primaryColor, border: `${primaryColor}30` };
      case 'trial':
        return { bg: 'rgba(245,158,11,0.1)', text: isDark ? '#fbbf24' : '#d97706', border: 'rgba(245,158,11,0.2)' };
      case 'past_due':
        return { bg: 'rgba(249,115,22,0.1)', text: isDark ? '#fb923c' : '#ea580c', border: 'rgba(249,115,22,0.2)' };
      case 'suspended':
      case 'cancelled':
        return { bg: 'rgba(239,68,68,0.1)', text: isDark ? '#f87171' : '#dc2626', border: 'rgba(239,68,68,0.2)' };
      default:
        return { bg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', text: mutedTextColor, border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' };
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link 
          href="/agency/clients"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="text-center py-16 sm:py-20">
          <div 
            className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: isDark ? '#f87171' : '#dc2626', opacity: 0.5 }} />
          </div>
          <p className="mt-4 font-medium" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>{error || 'Client not found'}</p>
          <Link 
            href="/agency/clients"
            className="mt-4 inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to clients
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(client.subscription_status || client.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button & Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/clients"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <span className="text-lg sm:text-2xl font-medium" style={{ color: primaryColor }}>
                {client.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">{client.business_name}</h1>
              <p className="mt-0.5 sm:mt-1 text-sm truncate" style={{ color: mutedTextColor }}>{client.email}</p>
            </div>
          </div>
          
          <span 
            className="inline-flex items-center self-start rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium capitalize"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
          >
            {client.subscription_status || client.status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>AI Phone</p>
              <p className="font-medium text-xs sm:text-base truncate">{client.vapi_phone_number || 'Not assigned'}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Calls</p>
              <p className="font-medium text-xs sm:text-base">{client.calls_this_month || 0} / {client.monthly_call_limit || 50}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
            >
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Plan</p>
              <p className="font-medium text-xs sm:text-base capitalize truncate">{client.plan_type || 'starter'}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Joined</p>
              <p className="font-medium text-xs sm:text-base">{new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Client Details */}
        <div 
          className="lg:col-span-1 rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <h3 className="font-medium mb-4 sm:mb-5 text-sm sm:text-base">Business Details</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Owner</p>
                <p className="mt-0.5 text-sm truncate">{client.owner_name || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Phone</p>
                <p className="mt-0.5 text-sm truncate">{client.owner_phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Email</p>
                <p className="mt-0.5 text-sm truncate">{client.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Location</p>
                <p className="mt-0.5 text-sm">
                  {client.business_city && client.business_state 
                    ? `${client.business_city}, ${client.business_state}` 
                    : 'Not provided'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Industry</p>
                <p className="mt-0.5 text-sm capitalize">{client.industry || 'Not specified'}</p>
              </div>
            </div>
            {client.business_website && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mutedTextColor }} />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>Website</p>
                  <a 
                    href={client.business_website.startsWith('http') ? client.business_website : `https://${client.business_website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-0.5 text-sm block truncate transition-colors"
                    style={{ color: primaryColor }}
                  >
                    {client.business_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Calls */}
        <div 
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div 
            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base">Recent Calls</h3>
            <Link 
              href={`/agency/clients/${client.id}/calls`}
              className="text-xs sm:text-sm transition-colors"
              style={{ color: primaryColor }}
            >
              View All
            </Link>
          </div>
          
          {recentCalls.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div 
                className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}
              >
                <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: mutedTextColor }} />
              </div>
              <p className="mt-4 text-sm" style={{ color: mutedTextColor }}>No calls yet</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: isDark ? 'rgba(250,250,249,0.3)' : '#9ca3af' }}>
                Calls will appear here once received
              </p>
            </div>
          ) : (
            <div>
              {recentCalls.map((call, idx) => (
                <Link
                  key={call.id}
                  href={`/agency/clients/${client.id}/calls/${call.id}`}
                  className={`flex items-center justify-between p-3 sm:p-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                  style={{ borderBottom: idx < recentCalls.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}
                    >
                      <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: mutedTextColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{call.customer_name || call.caller_phone || 'Unknown'}</p>
                      <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>
                        {call.duration ? `${Math.round(call.duration / 60)} min` : 'No duration'}
                        {call.urgency_level && call.urgency_level !== 'normal' && (
                          <span 
                            className="ml-2"
                            style={{ color: call.urgency_level === 'high' ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#fbbf24' : '#d97706') }}
                          >
                            • {call.urgency_level}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] sm:text-xs" style={{ color: isDark ? 'rgba(250,250,249,0.3)' : '#9ca3af' }}>
                      {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}