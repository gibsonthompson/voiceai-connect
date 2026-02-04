'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, Loader2, User, CreditCard, Link2, HelpCircle, 
  Check, Copy, Mail, Building2
} from 'lucide-react';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_phone: string;
  industry: string;
  business_city: string;
  business_state: string;
  vapi_phone_number: string;
  subscription_status: string;
  plan_type: string;
  trial_ends_at: string | null;
  monthly_call_limit: number;
  calls_this_month: number;
  google_calendar_connected: boolean;
  created_at: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    support_email: string | null;
    support_phone: string | null;
  } | null;
}

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  agencyName: string;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteTheme?: 'light' | 'dark' | 'auto';
}

interface Props {
  client: Client;
  branding: Branding;
}

const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'Not set';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

export function ClientSettingsContent({ client: initialClient, branding }: Props) {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [email, setEmail] = useState(client.email || '');
  const [ownerPhone, setOwnerPhone] = useState(client.owner_phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Theme based on agency setting
  const isDark = branding.websiteTheme === 'dark';
  const primaryColor = branding.primaryColor;
  const primaryLight = isLightColor(primaryColor);

  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.7)',
    textMuted4: 'rgba(250, 250, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111111',
    inputBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    inputBg: '#ffffff',
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/client/${client.id}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, owner_phone: ownerPhone }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Settings saved successfully!');
        setClient({ ...client, email, owner_phone: ownerPhone });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyNumber = async () => {
    if (!client.vapi_phone_number) return;
    const digitsOnly = client.vapi_phone_number.replace(/\D/g, '');
    const formattedForCopy = `+${digitsOnly}`;
    
    try {
      await navigator.clipboard.writeText(formattedForCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleConnectCalendar = () => {
    window.location.href = '/api/auth/google-calendar';
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

    setDisconnectingCalendar(true);
    try {
      const response = await fetch('/api/auth/google-calendar/disconnect', { method: 'POST' });
      if (response.ok) {
        setMessage('Google Calendar disconnected');
        setClient({ ...client, google_calendar_connected: false });
      } else {
        setMessage('Failed to disconnect calendar');
      }
    } catch (error) {
      setMessage('Error disconnecting calendar');
    } finally {
      setDisconnectingCalendar(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/client/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          planTier: client.plan_type || 'pro',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('Failed to create checkout');
        setUpgrading(false);
      }
    } catch (error) {
      setMessage('Error creating checkout');
      setUpgrading(false);
    }
  };

  const getDaysRemaining = (): number | null => {
    if (!client.trial_ends_at) return null;
    const diffTime = new Date(client.trial_ends_at).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const hasChanges = email !== (client.email || '') || ownerPhone !== (client.owner_phone || '');
  const daysRemaining = getDaysRemaining();

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Status Message */}
      {message && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto ${
          message.includes('success') || message.includes('Success')
            ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Page Title */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Manage your account and preferences</p>
      </div>

      <div className="max-w-3xl">
        {/* Business Overview */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Building2 className="w-4 h-4" style={{ color: primaryColor }} />
            Business Details
          </h2>
          <div 
            className="rounded-xl border p-3 sm:p-4 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Business Name</label>
                <div className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.text }}>{client.business_name}</div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Industry</label>
                <div className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.text }}>{client.industry || 'Not set'}</div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Location</label>
                <div className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.text }}>
                  {client.business_city && client.business_state 
                    ? `${client.business_city}, ${client.business_state}` 
                    : 'Not set'}
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Member Since</label>
                <div className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.text }}>{formatDate(client.created_at)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Phone Number */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Phone className="w-4 h-4" style={{ color: primaryColor }} />
            AI Phone Number
          </h2>
          <div 
            className="rounded-xl border p-3 sm:p-4 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Your AI Receptionist</label>
                <div className="text-base sm:text-xl font-bold truncate" style={{ color: primaryColor }}>
                  {client.vapi_phone_number ? formatPhoneNumber(client.vapi_phone_number) : 'Setting up...'}
                </div>
              </div>
              <button
                onClick={handleCopyNumber}
                disabled={!client.vapi_phone_number}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50 flex-shrink-0"
                style={{ backgroundColor: theme.bg, color: theme.textMuted }}
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <User className="w-4 h-4" style={{ color: primaryColor }} />
            Contact Information
          </h2>
          <div 
            className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Owner Phone *</label>
              <input 
                type="tel" 
                value={ownerPhone} 
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
                placeholder="+1 (555) 123-4567" 
              />
              <p className="text-[10px] sm:text-xs mt-1 sm:mt-1.5" style={{ color: theme.textMuted4 }}>📱 SMS notifications sent here</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Email *</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
                placeholder="your@email.com" 
              />
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasChanges ? primaryColor : theme.bg,
                color: hasChanges ? (primaryLight ? '#111827' : '#ffffff') : theme.textMuted4,
                border: hasChanges ? 'none' : `1px solid ${theme.border}`,
              }}
            >
              {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
            Subscription
          </h2>
          <div 
            className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Current Plan</label>
                <div className="text-base sm:text-xl font-bold capitalize" style={{ color: primaryColor }}>
                  {client.plan_type || 'Trial'}
                </div>
              </div>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                client.subscription_status === 'active' 
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  : client.subscription_status === 'trial' 
                  ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                  : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                {client.subscription_status === 'active' ? 'Active' : 
                 client.subscription_status === 'trial' ? 'Trial' : client.subscription_status || 'Unknown'}
              </span>
            </div>
            
            {client.subscription_status === 'trial' && daysRemaining !== null && (
              <div 
                className="p-2 sm:p-3 rounded-lg"
                style={{ 
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid #fde68a',
                }}
              >
                <div className="font-semibold text-xs sm:text-sm" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in trial
                </div>
                <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: isDark ? '#fcd34d' : '#b45309' }}>
                  Ends {formatDate(client.trial_ends_at)}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: primaryColor }}>{client.monthly_call_limit || '∞'}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Limit</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: primaryColor }}>{client.calls_this_month || 0}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Used</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: primaryColor }}>
                  {client.monthly_call_limit ? Math.max(0, client.monthly_call_limit - (client.calls_this_month || 0)) : '∞'}
                </div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Left</div>
              </div>
            </div>
            
            {client.subscription_status === 'trial' ? (
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
              >
                {upgrading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Upgrade Now'
                )}
              </button>
            ) : (
              <button 
                className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition"
                style={{ backgroundColor: theme.bg, color: theme.textMuted }}
              >
                Manage Subscription
              </button>
            )}
          </div>
        </section>

        {/* Integrations */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Link2 className="w-4 h-4" style={{ color: primaryColor }} />
            Integrations
          </h2>
          
          {/* Google Calendar - Coming Soon */}
          <div 
            className="rounded-xl border p-3 sm:p-4 mb-3 shadow-sm relative overflow-hidden"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            {/* Coming Soon Overlay */}
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(17, 17, 17, 0.7)' : 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(1px)' }}
            >
              <div 
                className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                style={{ backgroundColor: isDark ? '#fafaf9' : '#111827', color: isDark ? '#111827' : '#ffffff' }}
              >
                🚀 Coming Soon
              </div>
            </div>

            {/* Original Content (dimmed behind overlay) */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 opacity-60">
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 border rounded-lg flex items-center justify-center flex-shrink-0" 
                style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm" style={{ color: theme.text }}>Google Calendar</h3>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>AI books appointments directly to your calendar</p>
              </div>
            </div>
            <div className="opacity-60">
              <button 
                disabled
                className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-not-allowed"
                style={{ backgroundColor: theme.bg, color: theme.textMuted4 }}
              >
                Connect Calendar
              </button>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-4 sm:mb-6">
          <div 
            className="rounded-xl p-3 sm:p-4"
            style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.1 : 0.05), border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
              <div className="min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-1" style={{ color: theme.text }}>Need Help?</h4>
                <p className="text-xs sm:text-sm mb-2" style={{ color: theme.textMuted }}>Contact {branding.agencyName} for support:</p>
                {branding.supportPhone && (
                  <a 
                    href={`tel:${branding.supportPhone}`}
                    className="flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-lg hover:opacity-80 transition"
                    style={{ color: primaryColor }}
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {formatPhoneNumber(branding.supportPhone)}
                  </a>
                )}
                {branding.supportEmail && (
                  <a 
                    href={`mailto:${branding.supportEmail}`}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:opacity-80 transition mt-1 truncate"
                    style={{ color: primaryColor }}
                  >
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{branding.supportEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}