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
  const { agency, loading: contextLoading } = useAgency();
  
  const [client, setClient] = useState<Client | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'trial':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'past_due':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/[0.06] text-[#fafaf9]/50 border-white/[0.08]';
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link 
          href="/agency/clients"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="text-center py-16 sm:py-20">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-500/10">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-red-400/50" />
          </div>
          <p className="mt-4 font-medium text-[#fafaf9]/70">{error || 'Client not found'}</p>
          <Link 
            href="/agency/clients"
            className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button & Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/clients"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-emerald-500/10 flex-shrink-0">
              <span className="text-lg sm:text-2xl font-medium text-emerald-400">
                {client.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">{client.business_name}</h1>
              <p className="mt-0.5 sm:mt-1 text-sm text-[#fafaf9]/50 truncate">{client.email}</p>
            </div>
          </div>
          
          <span className={`inline-flex items-center self-start rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium capitalize ${getStatusStyle(client.subscription_status || client.status)}`}>
            {client.subscription_status || client.status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-[#fafaf9]/50">AI Phone</p>
              <p className="font-medium text-xs sm:text-base truncate">{client.vapi_phone_number || 'Not assigned'}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500/10 flex-shrink-0">
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-[#fafaf9]/50">Calls</p>
              <p className="font-medium text-xs sm:text-base">{client.calls_this_month || 0} / {client.monthly_call_limit || 50}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500/10 flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-[#fafaf9]/50">Plan</p>
              <p className="font-medium text-xs sm:text-base capitalize truncate">{client.plan_type || 'starter'}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/10 flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-[#fafaf9]/50">Joined</p>
              <p className="font-medium text-xs sm:text-base">{new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Client Details */}
        <div className="lg:col-span-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
          <h3 className="font-medium mb-4 sm:mb-5 text-sm sm:text-base">Business Details</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Owner</p>
                <p className="mt-0.5 text-sm truncate">{client.owner_name || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Phone</p>
                <p className="mt-0.5 text-sm truncate">{client.owner_phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Email</p>
                <p className="mt-0.5 text-sm truncate">{client.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Location</p>
                <p className="mt-0.5 text-sm">
                  {client.business_city && client.business_state 
                    ? `${client.business_city}, ${client.business_state}` 
                    : 'Not provided'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Industry</p>
                <p className="mt-0.5 text-sm capitalize">{client.industry || 'Not specified'}</p>
              </div>
            </div>
            {client.business_website && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-[#fafaf9]/30 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-[#fafaf9]/40">Website</p>
                  <a 
                    href={client.business_website.startsWith('http') ? client.business_website : `https://${client.business_website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-0.5 text-sm text-emerald-400 hover:text-emerald-300 hover:underline block truncate"
                  >
                    {client.business_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Calls */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4">
            <h3 className="font-medium text-sm sm:text-base">Recent Calls</h3>
            <Link 
              href={`/agency/clients/${client.id}/calls`}
              className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All
            </Link>
          </div>
          
          {recentCalls.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/[0.04]">
                <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6 text-[#fafaf9]/30" />
              </div>
              <p className="mt-4 text-sm text-[#fafaf9]/50">No calls yet</p>
              <p className="text-xs sm:text-sm text-[#fafaf9]/30 mt-1">
                Calls will appear here once received
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/agency/clients/${client.id}/calls/${call.id}`}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/[0.04] flex-shrink-0">
                      <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-[#fafaf9]/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{call.customer_name || call.caller_phone || 'Unknown'}</p>
                      <p className="text-xs sm:text-sm text-[#fafaf9]/50">
                        {call.duration ? `${Math.round(call.duration / 60)} min` : 'No duration'}
                        {call.urgency_level && call.urgency_level !== 'normal' && (
                          <span className={`ml-2 ${call.urgency_level === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                            • {call.urgency_level}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm text-[#fafaf9]/50">
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#fafaf9]/30">
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