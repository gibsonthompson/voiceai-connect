'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, Loader2, User, CreditCard, Link2, HelpCircle, 
  Check, Copy, Mail, Building2, Lock, Eye, EyeOff, Calendar, AlertCircle
} from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';

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

interface CalendarStatus {
  connected: boolean;
  token_valid: boolean;
  plan_allowed: boolean;
  plan_message: string | null;
}

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
  const theme = useClientTheme();
  const [client, setClient] = useState(initialClient);
  const [email, setEmail] = useState(client.email || '');
  const [ownerPhone, setOwnerPhone] = useState(client.owner_phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Calendar integration state
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  // Fetch calendar status on mount
  useEffect(() => {
    const fetchCalendarStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/google-calendar/status/${client.id}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarStatus(data);
          // Sync local state if backend says connected but local says not (or vice versa)
          if (data.connected !== client.google_calendar_connected) {
            setClient(prev => ({ ...prev, google_calendar_connected: data.connected }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch calendar status:', err);
        // Fall back to client's stored value
        setCalendarStatus({
          connected: client.google_calendar_connected || false,
          token_valid: false,
          plan_allowed: true, // Default to allowed if we can't check
          plan_message: null,
        });
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarStatus();
  }, [client.id, backendUrl]);

  // Check URL params for calendar connection result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'calendar_connected') {
      setMessage('Google Calendar connected successfully!');
      setClient(prev => ({ ...prev, google_calendar_connected: true }));
      setCalendarStatus(prev => prev ? { ...prev, connected: true, token_valid: true } : null);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setMessage(''), 4000);
    }
    const error = params.get('error');
    if (error === 'plan_upgrade_required') {
      setMessage('Calendar integration requires a higher plan. Please contact your provider to upgrade.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    } else if (error === 'calendar_denied') {
      setMessage('Google Calendar access was denied. Please try again and grant calendar permissions.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    } else if (error?.startsWith('calendar_')) {
      setMessage('Failed to connect Google Calendar. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/client/${client.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleChangePassword = async () => {
    setPasswordMessage('');
    if (!currentPassword) { setPasswordMessage('Current password is required'); return; }
    if (!newPassword || newPassword.length < 6) { setPasswordMessage('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setPasswordMessage('Password changed successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setPasswordMessage(''), 3000);
      } else {
        setPasswordMessage(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordMessage('Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCopyNumber = async () => {
    if (!client.vapi_phone_number) return;
    const digitsOnly = client.vapi_phone_number.replace(/\D/g, '');
    try {
      await navigator.clipboard.writeText(`+${digitsOnly}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleConnectCalendar = () => {
    // Redirect to backend OAuth endpoint with clientId
    window.location.href = `${backendUrl}/api/auth/google-calendar/connect?clientId=${client.id}`;
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Your AI receptionist will no longer be able to book appointments.')) return;
    setDisconnectingCalendar(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/auth/google-calendar/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Google Calendar disconnected');
        setClient(prev => ({ ...prev, google_calendar_connected: false }));
        setCalendarStatus(prev => prev ? { ...prev, connected: false, token_valid: false } : null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to disconnect calendar');
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
      const response = await fetch(`${backendUrl}/api/client/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ clientId: client.id, planTier: client.plan_type || 'pro' }),
      });
      const data = await response.json();
      if (data.url) { window.location.href = data.url; }
      else { setMessage('Failed to create checkout'); setUpgrading(false); }
    } catch (error) { setMessage('Error creating checkout'); setUpgrading(false); }
  };

  const getDaysRemaining = (): number | null => {
    if (!client.trial_ends_at) return null;
    const diffTime = new Date(client.trial_ends_at).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const hasChanges = email !== (client.email || '') || ownerPhone !== (client.owner_phone || '');
  const daysRemaining = getDaysRemaining();
  const hasPasswordChanges = currentPassword || newPassword || confirmPassword;

  const isCalendarConnected = calendarStatus?.connected || client.google_calendar_connected;
  const isCalendarPlanAllowed = calendarStatus?.plan_allowed !== false; // Default to true if unknown

  const getMessageStyle = (msg: string) => {
    const isSuccess = msg.includes('success') || msg.includes('Success');
    return isSuccess
      ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
      : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` };
  };

  const getStatusStyle = (status: string) => {
    if (status === 'active') return { backgroundColor: theme.successBg, color: theme.success };
    if (status === 'trial') return { backgroundColor: theme.warningBg, color: theme.warning };
    return { backgroundColor: theme.errorBg, color: theme.error };
  };

  const statusStyle = getStatusStyle(client.subscription_status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Status Message */}
      {message && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto" style={getMessageStyle(message)}>
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
            <Building2 className="w-4 h-4" style={{ color: theme.primary }} />
            Business Details
          </h2>
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
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
                  {client.business_city && client.business_state ? `${client.business_city}, ${client.business_state}` : 'Not set'}
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
            <Phone className="w-4 h-4" style={{ color: theme.primary }} />
            AI Phone Number
          </h2>
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Your AI Receptionist</label>
                <div className="text-base sm:text-xl font-bold truncate" style={{ color: theme.primary }}>
                  {client.vapi_phone_number ? formatPhoneNumber(client.vapi_phone_number) : 'Setting up...'}
                </div>
              </div>
              <button
                onClick={handleCopyNumber}
                disabled={!client.vapi_phone_number}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50 flex-shrink-0"
                style={{ backgroundColor: theme.bg, color: theme.textMuted }}
              >
                {isCopied ? <Check className="w-4 h-4" style={{ color: theme.success }} /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <User className="w-4 h-4" style={{ color: theme.primary }} />
            Contact Information
          </h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Owner Phone *</label>
              <input 
                type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                placeholder="+1 (555) 123-4567" 
              />
              <p className="text-[10px] sm:text-xs mt-1 sm:mt-1.5" style={{ color: theme.textMuted4 }}>📱 SMS notifications sent here</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Email *</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                placeholder="your@email.com" 
              />
            </div>
            <button 
              onClick={handleSave} disabled={saving || !hasChanges}
              className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasChanges ? theme.primary : theme.bg,
                color: hasChanges ? theme.primaryText : theme.textMuted4,
                border: hasChanges ? 'none' : `1px solid ${theme.border}`,
              }}
            >
              {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </div>
        </section>

        {/* Change Password */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Lock className="w-4 h-4" style={{ color: theme.primary }} />
            Change Password
          </h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            {passwordMessage && (
              <div className="p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm font-medium" style={getMessageStyle(passwordMessage)}>
                {passwordMessage}
              </div>
            )}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition pr-10"
                  style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                  placeholder="Enter current password" 
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted4 }}>
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition pr-10"
                    style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                    placeholder="Min 6 characters" 
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted4 }}>
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Confirm New Password</label>
                <input 
                  type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                  placeholder="Confirm new password" 
                />
              </div>
            </div>
            <button 
              onClick={handleChangePassword} disabled={changingPassword || !hasPasswordChanges}
              className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasPasswordChanges ? theme.primary : theme.bg,
                color: hasPasswordChanges ? theme.primaryText : theme.textMuted4,
                border: hasPasswordChanges ? 'none' : `1px solid ${theme.border}`,
              }}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <CreditCard className="w-4 h-4" style={{ color: theme.primary }} />
            Subscription
          </h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Current Plan</label>
                <div className="text-base sm:text-xl font-bold capitalize" style={{ color: theme.primary }}>
                  {client.plan_type || 'Trial'}
                </div>
              </div>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold" style={statusStyle}>
                {client.subscription_status === 'active' ? 'Active' : 
                 client.subscription_status === 'trial' ? 'Trial' : client.subscription_status || 'Unknown'}
              </span>
            </div>
            
            {client.subscription_status === 'trial' && daysRemaining !== null && (
              <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                <div className="font-semibold text-xs sm:text-sm" style={{ color: theme.warningText }}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in trial
                </div>
                <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.warningText }}>
                  Ends {formatDate(client.trial_ends_at)}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{client.monthly_call_limit || '∞'}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Limit</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{client.calls_this_month || 0}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Used</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                <div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>
                  {client.monthly_call_limit ? Math.max(0, client.monthly_call_limit - (client.calls_this_month || 0)) : '∞'}
                </div>
                <div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Left</div>
              </div>
            </div>
            
            {client.subscription_status === 'trial' ? (
              <button 
                onClick={handleUpgrade} disabled={upgrading}
                className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                {upgrading ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</span>
                ) : 'Upgrade Now'}
              </button>
            ) : (
              <button className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>
                Manage Subscription
              </button>
            )}
          </div>
        </section>

        {/* Integrations */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Link2 className="w-4 h-4" style={{ color: theme.primary }} />
            Integrations
          </h2>

          {/* Google Calendar */}
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border rounded-lg flex items-center justify-center flex-shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs sm:text-sm" style={{ color: theme.text }}>Google Calendar</h3>
                  {isCalendarConnected && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: theme.successBg, color: theme.success }}>
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                  {isCalendarConnected
                    ? 'Your AI receptionist can book appointments directly to your calendar'
                    : 'Let your AI receptionist book appointments directly to your calendar'
                  }
                </p>
              </div>
            </div>

            {calendarLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 }} />
              </div>
            ) : !isCalendarPlanAllowed ? (
              /* Plan doesn't include calendar — show upgrade prompt */
              <div className="space-y-2.5">
                <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                  <div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>
                      Calendar integration is not included in your current plan.
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.warningText }}>
                      Contact your provider to upgrade and unlock this feature.
                    </p>
                  </div>
                </div>
                <button 
                  disabled
                  className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed opacity-50"
                  style={{ backgroundColor: theme.bg, color: theme.textMuted4, border: `1px solid ${theme.border}` }}
                >
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Upgrade to Connect Calendar
                </button>
              </div>
            ) : isCalendarConnected ? (
              /* Connected — show disconnect button */
              <div className="space-y-2.5">
                {calendarStatus && !calendarStatus.token_valid && (
                  <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <div>
                      <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>
                        Calendar connection may have expired.
                      </p>
                      <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.warningText }}>
                        Try disconnecting and reconnecting if appointments aren&apos;t booking correctly.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleConnectCalendar}
                    className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  >
                    Reconnect
                  </button>
                  <button
                    onClick={handleDisconnectCalendar}
                    disabled={disconnectingCalendar}
                    className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}
                  >
                    {disconnectingCalendar ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...
                      </span>
                    ) : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
              /* Not connected, plan allows — show connect button */
              <button
                onClick={handleConnectCalendar}
                className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Connect Google Calendar
              </button>
            )}
          </div>
        </section>

        {/* Support */}
        <section className="mb-4 sm:mb-6">
          <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.05), border: `1px solid ${hexToRgba(theme.primary, 0.2)}` }}>
            <div className="flex items-start gap-2 sm:gap-3">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
              <div className="min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-1" style={{ color: theme.text }}>Need Help?</h4>
                <p className="text-xs sm:text-sm mb-2" style={{ color: theme.textMuted }}>Contact {branding.agencyName} for support:</p>
                {branding.supportPhone && (
                  <a href={`tel:${branding.supportPhone}`} className="flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-lg hover:opacity-80 transition" style={{ color: theme.primary }}>
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {formatPhoneNumber(branding.supportPhone)}
                  </a>
                )}
                {branding.supportEmail && (
                  <a href={`mailto:${branding.supportEmail}`} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:opacity-80 transition mt-1 truncate" style={{ color: theme.primary }}>
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