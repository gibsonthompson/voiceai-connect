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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ReferralsPage() {
  const { agency, branding } = useAgency();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? '#0a0a0a' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          text: primaryColor, 
          bg: `${primaryColor}15`, 
          border: `${primaryColor}30` 
        };
      case 'trial':
        return { 
          text: isDark ? '#fbbf24' : '#d97706', 
          bg: 'rgba(245,158,11,0.1)', 
          border: 'rgba(245,158,11,0.2)' 
        };
      case 'pending':
        return { 
          text: isDark ? '#60a5fa' : '#2563eb', 
          bg: 'rgba(59,130,246,0.1)', 
          border: 'rgba(59,130,246,0.2)' 
        };
      case 'transferred':
        return { 
          text: primaryColor, 
          bg: `${primaryColor}15`, 
          border: `${primaryColor}30` 
        };
      default:
        return { 
          text: mutedTextColor, 
          bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
          border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
        };
    }
  };

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

  // Stat Card Component
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
      <div 
        className="rounded-2xl p-5 transition-all"
        style={{ 
          backgroundColor: highlight ? `${primaryColor}10` : cardBg,
          border: highlight ? `1px solid ${primaryColor}30` : `1px solid ${borderColor}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: highlight ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6') }}
          >
            <Icon className="h-5 w-5" style={{ color: highlight ? primaryColor : mutedTextColor }} />
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs" style={{ color: primaryColor }}>
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm mb-1" style={{ color: mutedTextColor }}>{label}</p>
        <p className="text-2xl font-semibold" style={{ color: highlight ? primaryColor : textColor }}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs mt-1" style={{ color: mutedTextColor }}>{subValue}</p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className="mt-4 text-sm" style={{ color: mutedTextColor }}>Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div 
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
          }}
        >
          <p style={{ color: isDark ? '#f87171' : '#dc2626' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Gift className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-semibold">Referral Program</h1>
        </div>
        <p style={{ color: mutedTextColor }}>
          Earn 20% recurring commission for every agency you refer
        </p>
      </div>

      {/* Referral Link Card */}
      <div 
        className="rounded-2xl p-6 mb-8"
        style={{ 
          backgroundColor: `${primaryColor}08`,
          border: `1px solid ${primaryColor}30`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              Your Referral Link
            </h2>
            <p className="text-sm mt-1" style={{ color: mutedTextColor }}>
              Share this link to earn commissions
            </p>
          </div>
          
          {!editingCode ? (
            <button
              onClick={() => setEditingCode(true)}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: primaryColor }}
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
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: mutedTextColor }}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {editingCode ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div 
              className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
            >
              <span className="text-sm whitespace-nowrap" style={{ color: mutedTextColor }}>
                {process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com'}/signup?ref=
              </span>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: textColor }}
                placeholder="your-code"
                maxLength={30}
              />
            </div>
            <button
              onClick={handleUpdateCode}
              disabled={savingCode || !newCode.trim()}
              className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor, color: '#050505' }}
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
            <div 
              className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
            >
              <span className="text-sm truncate flex-1">
                {data?.referralLink}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                isDark ? 'hover:bg-white/[0.1]' : 'hover:bg-black/[0.02]'
              }`}
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                border: `1px solid ${inputBorder}`,
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" style={{ color: primaryColor }} />
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
        <div 
          className="rounded-2xl p-6 mb-8"
          style={{ 
            backgroundColor: cardBg, 
            border: `1px solid ${borderColor}`,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Request Payout</h3>
              <p className="text-sm mt-1" style={{ color: mutedTextColor }}>
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
              className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ backgroundColor: primaryColor, color: '#050505' }}
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
            <div 
              className="mt-4 rounded-xl p-4 flex items-center gap-3"
              style={{
                backgroundColor: payoutMessage.type === 'success' ? `${primaryColor}15` : (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'),
                border: payoutMessage.type === 'success' ? `1px solid ${primaryColor}30` : (isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca'),
              }}
            >
              {payoutMessage.type === 'success' ? (
                <Check className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
              )}
              <p className="text-sm" style={{ 
                color: payoutMessage.type === 'success' ? primaryColor : (isDark ? '#f87171' : '#dc2626')
              }}>
                {payoutMessage.text}
              </p>
            </div>
          )}

          {!data?.canReceivePayouts && (
            <div 
              className="mt-4 rounded-xl p-4 flex items-center gap-3"
              style={{
                backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
              <p className="text-sm" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>
                Set up Stripe Connect in Settings → Billing to receive payouts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referrals List */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ 
            backgroundColor: cardBg, 
            border: `1px solid ${borderColor}`,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <h3 className="font-medium">Your Referrals</h3>
          </div>
          
          {data?.referrals && data.referrals.length > 0 ? (
            <div style={{ borderTop: `1px solid ${borderColor}` }}>
              {data.referrals.map((referral, idx) => {
                const statusColors = getStatusColor(referral.subscription_status);
                return (
                  <div 
                    key={referral.id} 
                    className={`p-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    style={{ borderBottom: idx < data.referrals.length - 1 ? `1px solid ${borderColor}` : 'none' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{referral.name}</p>
                        <p className="text-sm" style={{ color: mutedTextColor }}>
                          Joined {formatDate(referral.created_at)}
                        </p>
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: statusColors.bg,
                          border: `1px solid ${statusColors.border}`,
                          color: statusColors.text,
                        }}
                      >
                        {referral.subscription_status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-3" style={{ color: mutedTextColor }} />
              <p className="text-sm" style={{ color: mutedTextColor }}>No referrals yet</p>
              <p className="text-xs mt-1" style={{ color: mutedTextColor }}>Share your link to start earning</p>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ 
            backgroundColor: cardBg, 
            border: `1px solid ${borderColor}`,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <h3 className="font-medium">Commission History</h3>
          </div>
          
          {data?.commissions && data.commissions.length > 0 ? (
            <div style={{ borderTop: `1px solid ${borderColor}` }}>
              {data.commissions.map((commission, idx) => {
                const statusColors = getStatusColor(commission.status);
                return (
                  <div 
                    key={commission.id} 
                    className={`p-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    style={{ borderBottom: idx < data.commissions.length - 1 ? `1px solid ${borderColor}` : 'none' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: primaryColor }}>
                          +{formatCurrency(commission.commission_amount_cents)}
                        </p>
                        <p className="text-sm" style={{ color: mutedTextColor }}>
                          From {commission.referred?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: statusColors.bg,
                            border: `1px solid ${statusColors.border}`,
                            color: statusColors.text,
                          }}
                        >
                          {commission.status}
                        </span>
                        <p className="text-xs mt-1" style={{ color: mutedTextColor }}>
                          {formatDate(commission.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <DollarSign className="h-10 w-10 mx-auto mb-3" style={{ color: mutedTextColor }} />
              <p className="text-sm" style={{ color: mutedTextColor }}>No commissions yet</p>
              <p className="text-xs mt-1" style={{ color: mutedTextColor }}>Commissions appear when referrals pay</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div 
        className="mt-8 rounded-2xl p-6"
        style={{ 
          backgroundColor: cardBg, 
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h3 className="font-medium mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { num: '1', title: 'Share Your Link', desc: 'Share your unique referral link with other agency owners' },
            { num: '2', title: 'They Sign Up', desc: "When they create an agency using your link, they're linked to you" },
            { num: '3', title: 'Earn 20% Forever', desc: 'Earn 20% of their subscription fee every month they stay subscribed' },
          ].map((step) => (
            <div key={step.num} className="flex gap-4">
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {step.num}
              </div>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs mt-1" style={{ color: mutedTextColor }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}