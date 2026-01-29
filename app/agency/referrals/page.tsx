'use client';

import { useState, useEffect } from 'react';
import { useAgency } from '../context';
import { 
  Users, DollarSign, TrendingUp, Copy, Check, ExternalLink, 
  Loader2, ArrowUpRight, Clock, Sparkles, Gift, Edit2, X,
  Banknote, AlertCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  lifetimeEarnings: number;
  availableBalance: number;
  thisMonthEarnings: number;
}

interface Referral {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_status: string;
  plan_type: string;
  created_at: string;
}

interface Commission {
  id: string;
  commission_amount_cents: number;
  status: string;
  created_at: string;
  transferred_at: string | null;
  referred: {
    name: string;
    slug: string;
  };
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  canReceivePayouts: boolean;
  stats: ReferralStats;
  referrals: Referral[];
  commissions: Commission[];
}

// ============================================================================
// HELPERS
// ============================================================================
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'trial':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'pending':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'transferred':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default:
      return 'text-[#fafaf9]/40 bg-white/5 border-white/10';
  }
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
function StatCard({ 
  label, 
  value, 
  subValue,
  icon: Icon, 
  trend,
  highlight = false 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>; 
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      highlight 
        ? 'border-emerald-500/30 bg-emerald-500/[0.08]' 
        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          highlight ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
        }`}>
          <Icon className={`h-5 w-5 ${highlight ? 'text-emerald-400' : 'text-[#fafaf9]/60'}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-[#fafaf9]/50 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-emerald-300' : 'text-[#fafaf9]'}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-[#fafaf9]/40 mt-1">{subValue}</p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ReferralsPage() {
  const { agency } = useAgency();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch referral data
  useEffect(() => {
    if (!agency?.id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        const response = await fetch(`${backendUrl}/api/agency/${agency.id}/referrals`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch referral data');
        }

        const result = await response.json();
        setData(result);
        setNewCode(result.referralCode || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agency?.id]);

  // Copy referral link
  const handleCopy = async () => {
    if (!data?.referralLink) return;
    
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = data.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Update referral code
  const handleUpdateCode = async () => {
    if (!agency?.id || !newCode.trim()) return;
    
    setSavingCode(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/referrals/code`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: newCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update code');
      }

      setData(prev => prev ? {
        ...prev,
        referralCode: result.referralCode,
        referralLink: result.referralLink,
      } : null);
      setEditingCode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update code');
    } finally {
      setSavingCode(false);
    }
  };

  // Request payout
  const handleRequestPayout = async () => {
    if (!agency?.id || !data?.canReceivePayouts) return;
    
    setRequestingPayout(true);
    setPayoutMessage(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/referrals/payout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request payout');
      }

      setPayoutMessage({ type: 'success', text: result.message });
      
      // Refresh data
      setData(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          availableBalance: 0,
        },
      } : null);
    } catch (err) {
      setPayoutMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to request payout' 
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-4 text-sm text-[#fafaf9]/40">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Gift className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#fafaf9]">Referral Program</h1>
        </div>
        <p className="text-[#fafaf9]/50">
          Earn 20% recurring commission for every agency you refer
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-medium text-[#fafaf9] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Your Referral Link
            </h2>
            <p className="text-sm text-[#fafaf9]/50 mt-1">
              Share this link to earn commissions
            </p>
          </div>
          
          {!editingCode ? (
            <button
              onClick={() => setEditingCode(true)}
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Customize Code
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingCode(false);
                setNewCode(data?.referralCode || '');
              }}
              className="flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {editingCode ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3">
              <span className="text-[#fafaf9]/40 text-sm whitespace-nowrap">
                {process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com'}/signup?ref=
              </span>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 bg-transparent text-[#fafaf9] outline-none min-w-0"
                placeholder="your-code"
                maxLength={30}
              />
            </div>
            <button
              onClick={handleUpdateCode}
              disabled={savingCode || !newCode.trim()}
              className="px-6 py-3 rounded-xl bg-emerald-500 text-[#050505] font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3">
              <span className="text-[#fafaf9] text-sm truncate flex-1">
                {data?.referralLink}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-6 py-3 rounded-xl bg-white/[0.06] text-[#fafaf9] font-medium hover:bg-white/[0.1] transition-colors border border-white/[0.08] flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Referrals"
          value={data?.stats.totalReferrals.toString() || '0'}
          subValue={`${data?.stats.activeReferrals || 0} active`}
          icon={Users}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(data?.stats.thisMonthEarnings || 0)}
          icon={TrendingUp}
        />
        <StatCard
          label="Lifetime Earnings"
          value={formatCurrency(data?.stats.lifetimeEarnings || 0)}
          icon={DollarSign}
        />
        <StatCard
          label="Available Balance"
          value={formatCurrency(data?.stats.availableBalance || 0)}
          icon={Banknote}
          highlight={(data?.stats.availableBalance || 0) >= 1000}
        />
      </div>

      {/* Payout Section */}
      {(data?.stats.availableBalance || 0) > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-[#fafaf9]">Request Payout</h3>
              <p className="text-sm text-[#fafaf9]/50 mt-1">
                {data?.canReceivePayouts 
                  ? `Minimum payout: $10. Your balance: ${formatCurrency(data?.stats.availableBalance || 0)}`
                  : 'Complete Stripe Connect onboarding to receive payouts'
                }
              </p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={
                requestingPayout || 
                !data?.canReceivePayouts || 
                (data?.stats.availableBalance || 0) < 1000
              }
              className="px-6 py-3 rounded-xl bg-emerald-500 text-[#050505] font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {requestingPayout ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  Request Payout
                </>
              )}
            </button>
          </div>
          
          {payoutMessage && (
            <div className={`mt-4 rounded-xl p-4 flex items-center gap-3 ${
              payoutMessage.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {payoutMessage.type === 'success' ? (
                <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                payoutMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {payoutMessage.text}
              </p>
            </div>
          )}

          {!data?.canReceivePayouts && (
            <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                Set up Stripe Connect in Settings → Billing to receive payouts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referrals List */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="font-medium text-[#fafaf9]">Your Referrals</h3>
          </div>
          
          {data?.referrals && data.referrals.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {data.referrals.map((referral) => (
                <div key={referral.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#fafaf9]">{referral.name}</p>
                      <p className="text-sm text-[#fafaf9]/40">
                        Joined {formatDate(referral.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.subscription_status)}`}>
                        {referral.subscription_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 text-[#fafaf9]/20 mx-auto mb-3" />
              <p className="text-[#fafaf9]/40 text-sm">No referrals yet</p>
              <p className="text-[#fafaf9]/30 text-xs mt-1">Share your link to start earning</p>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="font-medium text-[#fafaf9]">Commission History</h3>
          </div>
          
          {data?.commissions && data.commissions.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {data.commissions.map((commission) => (
                <div key={commission.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-emerald-400">
                        +{formatCurrency(commission.commission_amount_cents)}
                      </p>
                      <p className="text-sm text-[#fafaf9]/40">
                        From {commission.referred?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                      <p className="text-xs text-[#fafaf9]/30 mt-1">
                        {formatDate(commission.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <DollarSign className="h-10 w-10 text-[#fafaf9]/20 mx-auto mb-3" />
              <p className="text-[#fafaf9]/40 text-sm">No commissions yet</p>
              <p className="text-[#fafaf9]/30 text-xs mt-1">Commissions appear when referrals pay</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="font-medium text-[#fafaf9] mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-[#fafaf9] text-sm">Share Your Link</p>
              <p className="text-xs text-[#fafaf9]/50 mt-1">
                Share your unique referral link with other agency owners
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-[#fafaf9] text-sm">They Sign Up</p>
              <p className="text-xs text-[#fafaf9]/50 mt-1">
                When they create an agency using your link, they're linked to you
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-[#fafaf9] text-sm">Earn 20% Forever</p>
              <p className="text-xs text-[#fafaf9]/50 mt-1">
                Earn 20% of their subscription fee every month they stay subscribed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}