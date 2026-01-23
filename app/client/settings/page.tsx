'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Loader2, User, CreditCard, Link2, HelpCircle, LogOut, 
  ExternalLink, Check, Copy, Mail, Building2, MapPin
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
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
  };
}

interface Branding {
  primaryColor: string;
  accentColor: string;
  agencyName: string;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ClientSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [branding, setBranding] = useState<Branding>({
    primaryColor: '#3b82f6',
    accentColor: '#60a5fa',
    agencyName: 'VoiceAI',
    logoUrl: null,
    supportEmail: null,
    supportPhone: null,
  });
  
  // Form state
  const [email, setEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      // Get client data from localStorage or API
      const storedClient = localStorage.getItem('client');
      if (storedClient) {
        const clientData = JSON.parse(storedClient);
        
        // Fetch full client details from backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        
        const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClient(data.client);
          setEmail(data.client.email || '');
          setOwnerPhone(data.client.owner_phone || '');
          
          if (data.client.agency) {
            setBranding({
              primaryColor: data.client.agency.primary_color || '#3b82f6',
              accentColor: data.client.agency.accent_color || '#60a5fa',
              agencyName: data.client.agency.name || 'VoiceAI',
              logoUrl: data.client.agency.logo_url,
              supportEmail: data.client.agency.support_email,
              supportPhone: data.client.agency.support_phone,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    
    setSaving(true);
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
      
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
        setTimeout(() => setMessage(''), 3000);
        fetchClientData();
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
    if (!client?.vapi_phone_number) return;
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
        fetchClientData();
      } else {
        setMessage('Failed to disconnect calendar');
      }
    } catch (error) {
      setMessage('Error disconnecting calendar');
    } finally {
      setDisconnectingCalendar(false);
    }
  };

  const handleSignOut = async () => {
    // Clear cookies and localStorage
    document.cookie = 'auth_token=; path=/; max-age=0';
    localStorage.removeItem('user');
    localStorage.removeItem('client');
    router.push('/client/login');
  };

  const getDaysRemaining = (): number | null => {
    if (!client?.trial_ends_at) return null;
    const diffTime = new Date(client.trial_ends_at).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const primaryColor = branding.primaryColor;
  const primaryLight = isLightColor(primaryColor);
  const hasChanges = client && (email !== (client.email || '') || ownerPhone !== (client.owner_phone || ''));
  const daysRemaining = getDaysRemaining();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Error loading settings</h2>
          <p className="text-white/50">Please try again or contact support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.agencyName} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium">Settings</span>
            </div>
            <Link 
              href="/client/dashboard"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium text-sm ${
            message.includes('success') || message.includes('Success')
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message}
          </div>
        )}

        {/* Business Overview */}
        <section className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: primaryColor }} />
            Business Details
          </h2>
          <div className="bg-[#111] rounded-xl border border-white/10 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-xs block mb-1">Business Name</label>
                <div className="text-white font-medium text-sm">{client.business_name}</div>
              </div>
              <div>
                <label className="text-white/40 text-xs block mb-1">Industry</label>
                <div className="text-white font-medium text-sm">{client.industry || 'Not set'}</div>
              </div>
              <div>
                <label className="text-white/40 text-xs block mb-1">Location</label>
                <div className="text-white font-medium text-sm">
                  {client.business_city && client.business_state 
                    ? `${client.business_city}, ${client.business_state}` 
                    : 'Not set'}
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs block mb-1">Member Since</label>
                <div className="text-white font-medium text-sm">{formatDate(client.created_at)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Phone Number */}
        <section className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: primaryColor }} />
            AI Phone Number
          </h2>
          <div className="bg-[#111] rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-white/40 text-xs block mb-1">Your AI Receptionist</label>
                <div className="text-xl font-bold" style={{ color: primaryColor }}>
                  {client.vapi_phone_number ? formatPhoneNumber(client.vapi_phone_number) : 'Setting up...'}
                </div>
              </div>
              <button
                onClick={handleCopyNumber}
                disabled={!client.vapi_phone_number}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 transition disabled:opacity-50"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: primaryColor }} />
            Contact Information
          </h2>
          <div className="bg-[#111] rounded-xl border border-white/10 p-4 space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Owner Phone *</label>
              <input 
                type="tel" 
                value={ownerPhone} 
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition text-sm"
                placeholder="+1 (555) 123-4567" 
              />
              <p className="text-white/40 text-xs mt-1.5">📱 SMS notifications sent here</p>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Email *</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition text-sm"
                placeholder="your@email.com" 
              />
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasChanges ? primaryColor : 'rgba(255,255,255,0.1)',
                color: hasChanges ? (primaryLight ? '#0a0a0a' : '#f5f5f0') : 'rgba(255,255,255,0.5)',
              }}
            >
              {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
            Subscription
          </h2>
          <div className="bg-[#111] rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white/40 text-xs block mb-1">Current Plan</label>
                <div className="text-xl font-bold capitalize" style={{ color: primaryColor }}>
                  {client.plan_type || 'Trial'}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                client.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 
                client.subscription_status === 'trial' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {client.subscription_status === 'active' ? 'Active' : 
                 client.subscription_status === 'trial' ? 'Trial' : client.subscription_status || 'Unknown'}
              </span>
            </div>
            
            {client.subscription_status === 'trial' && daysRemaining !== null && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                <div className="text-amber-400 font-semibold text-sm">
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in trial
                </div>
                <div className="text-amber-400/70 text-xs mt-0.5">Ends {formatDate(client.trial_ends_at)}</div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold" style={{ color: primaryColor }}>{client.monthly_call_limit || '∞'}</div>
                <div className="text-white/40 text-xs">Limit</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold" style={{ color: primaryColor }}>{client.calls_this_month || 0}</div>
                <div className="text-white/40 text-xs">Used</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold" style={{ color: primaryColor }}>
                  {client.monthly_call_limit ? Math.max(0, client.monthly_call_limit - (client.calls_this_month || 0)) : '∞'}
                </div>
                <div className="text-white/40 text-xs">Left</div>
              </div>
            </div>
            
            {client.subscription_status === 'trial' ? (
              <button 
                className="w-full py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
              >
                Upgrade Now
              </button>
            ) : (
              <button className="w-full py-3 bg-white/5 text-white/70 rounded-xl font-semibold text-sm hover:bg-white/10 transition">
                Manage Subscription
              </button>
            )}
          </div>
        </section>

        {/* Integrations */}
        <section className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" style={{ color: primaryColor }} />
            Integrations
          </h2>
          
          {/* Google Calendar */}
          <div className="bg-[#111] rounded-xl border border-white/10 p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">Google Calendar</h3>
                <p className="text-white/40 text-xs">AI books appointments directly to your calendar</p>
              </div>
              {client.google_calendar_connected && (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                  Connected
                </span>
              )}
            </div>
            {client.google_calendar_connected ? (
              <button 
                onClick={handleDisconnectCalendar} 
                disabled={disconnectingCalendar}
                className="w-full py-2.5 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition disabled:opacity-50"
              >
                {disconnectingCalendar ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button 
                onClick={handleConnectCalendar} 
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition"
                style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
              >
                Connect Calendar
              </button>
            )}
          </div>
        </section>

        {/* Support */}
        <section className="mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
              <div>
                <h4 className="text-white font-semibold text-sm mb-1">Need Help?</h4>
                <p className="text-white/50 text-sm mb-2">Contact {branding.agencyName} for support:</p>
                {branding.supportPhone && (
                  <a 
                    href={`tel:${branding.supportPhone}`}
                    className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition"
                    style={{ color: primaryColor }}
                  >
                    <Phone className="w-4 h-4" />
                    {formatPhoneNumber(branding.supportPhone)}
                  </a>
                )}
                {branding.supportEmail && (
                  <a 
                    href={`mailto:${branding.supportEmail}`}
                    className="flex items-center gap-2 text-sm hover:opacity-80 transition mt-1"
                    style={{ color: primaryColor }}
                  >
                    <Mail className="w-4 h-4" />
                    {branding.supportEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <div className="text-center">
          <button 
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-white/40 text-sm font-medium hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}