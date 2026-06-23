'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, Loader2, User, CreditCard, Link2,
  Check, Copy, Lock, Eye, EyeOff, AlertCircle,
  PhoneForwarded, PhoneIncoming, Headphones, Smartphone, X, Shield
} from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';
import AddToHomeScreenModal from '@/components/client/AddToHomeScreenModal';
import ClientBrandingSection from '@/components/client/ClientBrandingSection';
import ClientTeamSection from '@/components/client/ClientTeamSection';
import { useClient } from '@/lib/client-context';

interface Client {
  id: string; business_name: string; email: string; owner_phone: string; industry: string;
  business_city: string; business_state: string; vapi_phone_number: string; subscription_status: string;
  plan_type: string; trial_ends_at: string | null; monthly_call_limit: number; calls_this_month: number;
  google_calendar_connected: boolean; call_mode?: string; ring_timeout?: number; created_at: string;
  hipaa_mode?: boolean;
  forwarding_confirmed?: boolean;
  agency: { id: string; name: string; slug: string; logo_url: string | null; primary_color: string; secondary_color: string; accent_color: string; support_email: string | null; support_phone: string | null; allow_client_branding?: boolean; } | null;
}

interface Branding {
  primaryColor: string; secondaryColor: string; accentColor: string; agencyName: string;
  logoUrl: string | null; supportEmail: string | null; supportPhone: string | null; websiteTheme?: 'light' | 'dark' | 'auto';
}

interface Props { client: Client; branding: Branding; }

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'Not set';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return phone;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
  const [showPwaModal, setShowPwaModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [callMode, setCallMode] = useState<'primary' | 'fallback'>((client.call_mode as 'primary' | 'fallback') || 'primary');
  const [ringTimeout, setRingTimeout] = useState(client.ring_timeout || 20);
  const [callModeLoading, setCallModeLoading] = useState(true);
  const [savingCallMode, setSavingCallMode] = useState(false);
  const [callModeMessage, setCallModeMessage] = useState('');

  const [hipaaMode, setHipaaMode] = useState(client.hipaa_mode || false);
  const [savingHipaa, setSavingHipaa] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || null;

  const { user, client: ctxClient } = useClient();
  const isOwner = !user || user.role === 'client' || user.role === 'super_admin';

  // Loop guard: if the business line is forwarded to the AI number, the AI is
  // already the first point of answer. Fallback (AI rings the owner back) would
  // dial a number that may itself be forwarded to the AI, causing a call loop.
  // So whenever forwarding is confirmed, Call Handling is locked to Primary.
  // Fallback is only valid when NOT forwarding (the AI number is published directly).
  const forwardingOn = !!((ctxClient as any)?.forwarding_confirmed ?? (client as any)?.forwarding_confirmed);

  // The signed-in user's own login, fetched from the token-scoped endpoint so
  // each person only ever sees their OWN credentials. visible_password is null
  // when the user has set their own password (we then point them to Change
  // Password instead of showing a value).
  const [myCreds, setMyCreds] = useState<{ email: string; visible_password: string | null; has_custom_password: boolean } | null>(null);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [credCopied, setCredCopied] = useState<'user' | 'pass' | null>(null);
  useEffect(() => {
    const fetchCreds = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${backendUrl}/api/client/${client.id}/my-credentials`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setMyCreds({ email: d.email, visible_password: d.visible_password ?? null, has_custom_password: !!d.has_custom_password }); }
      } catch {}
    };
    fetchCreds();
  }, [client.id, backendUrl]);
  const copyCred = async (text: string, which: 'user' | 'pass') => { try { await navigator.clipboard.writeText(text); setCredCopied(which); setTimeout(() => setCredCopied(null), 1500); } catch {} };

  useEffect(() => { const fetchCallMode = async () => { try { const response = await fetch(`${backendUrl}/api/client/${client.id}/call-mode`); if (response.ok) { const data = await response.json(); setCallMode(data.call_mode || 'primary'); setRingTimeout(data.ring_timeout || 20); } } catch (err) { console.error('Failed to fetch call mode:', err); } finally { setCallModeLoading(false); } }; fetchCallMode(); }, [client.id, backendUrl]);

  const handleSave = async () => { setSaving(true); setMessage(''); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/client/${client.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, owner_phone: ownerPhone }) }); const data = await response.json(); if (data.success) { setMessage('Settings saved successfully!'); setClient({ ...client, email, owner_phone: ownerPhone }); setTimeout(() => setMessage(''), 3000); } else { setMessage(data.error || 'Failed to save settings'); } } catch (error) { setMessage('Error saving settings'); } finally { setSaving(false); } };

  const handleCallModeChange = async (newMode: 'primary' | 'fallback') => { if (newMode === 'fallback' && forwardingOn) { setCallModeMessage('Turn off call forwarding first. With forwarding on, the AI answers first to avoid a calling loop.'); setTimeout(() => setCallModeMessage(''), 5000); return; } const currentOwnerPhone = client.owner_phone || ownerPhone; if (newMode === 'fallback' && !currentOwnerPhone) { setCallModeMessage('Please add your phone number in Contact Information first.'); setTimeout(() => setCallModeMessage(''), 4000); return; } setSavingCallMode(true); setCallModeMessage(''); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/client/${client.id}/call-mode`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ call_mode: newMode, ring_timeout: ringTimeout }) }); const data = await response.json(); if (data.success) { setCallMode(newMode); setCallModeMessage(newMode === 'fallback' ? 'Fallback mode enabled! Calls will ring your phone first.' : 'Primary mode enabled! AI will answer all calls directly.'); setTimeout(() => setCallModeMessage(''), 4000); } else { setCallModeMessage(data.error || 'Failed to update call mode'); setTimeout(() => setCallModeMessage(''), 5000); } } catch (error) { setCallModeMessage('Error updating call mode'); setTimeout(() => setCallModeMessage(''), 5000); } finally { setSavingCallMode(false); } };

  const handleChangePassword = async () => { setPasswordMessage(''); if (!currentPassword) { setPasswordMessage('Current password is required'); return; } if (!newPassword || newPassword.length < 6) { setPasswordMessage('New password must be at least 6 characters'); return; } if (newPassword !== confirmPassword) { setPasswordMessage('Passwords do not match'); return; } setChangingPassword(true); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await response.json(); if (data.success) { setPasswordMessage('Password changed successfully!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPasswordMessage(''), 3000); } else { setPasswordMessage(data.error || 'Failed to change password'); } } catch (error) { setPasswordMessage('Error changing password'); } finally { setChangingPassword(false); } };

  const handleCopyNumber = async () => { if (!client.vapi_phone_number) return; const digitsOnly = client.vapi_phone_number.replace(/\D/g, ''); try { await navigator.clipboard.writeText(`+${digitsOnly}`); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (error) { console.error('Failed to copy:', error); } };

  const handleToggleHipaa = async (enabled: boolean) => {
    if (!confirm(enabled
      ? 'Enable HIPAA mode? This will disable call recordings, transcripts, and caller recognition. Booking will switch to collect-request only. This takes effect on the next call.'
      : 'Disable HIPAA mode? Call recordings, transcripts, and caller recognition will resume on the next call.'
    )) return;
    setSavingHipaa(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/client/${client.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ hipaa_mode: enabled }) });
      const data = await response.json();
      if (data.success) {
        setHipaaMode(enabled);
        setClient(prev => ({ ...prev, hipaa_mode: enabled }));
        try { const cached = localStorage.getItem('client'); if (cached) { const p = JSON.parse(cached); p.hipaa_mode = enabled; localStorage.setItem('client', JSON.stringify(p)); } } catch {}
        setMessage(enabled ? 'HIPAA mode enabled — recordings and transcripts disabled' : 'HIPAA mode disabled — standard call handling resumed');
        setTimeout(() => setMessage(''), 4000);
      } else { setMessage(data.error || 'Failed to update HIPAA mode'); }
    } catch { setMessage('Error updating HIPAA mode'); }
    finally { setSavingHipaa(false); }
  };

  const handleUpgrade = () => { window.location.href = '/client/upgrade-required'; };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/client/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ client_id: client.id }),
      });
      const data = await response.json();
      if (data.url) { window.location.href = data.url; }
      else { setMessage('Unable to open billing portal. Please contact support.'); }
    } catch { setMessage('Error opening billing portal'); }
  };

  const getDaysRemaining = (): number | null => { if (!client.trial_ends_at) return null; const diffTime = new Date(client.trial_ends_at).getTime() - Date.now(); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays > 0 ? diffDays : 0; };

  const hasChanges = email !== (client.email || '') || ownerPhone !== (client.owner_phone || '');
  const daysRemaining = getDaysRemaining();
  const hasPasswordChanges = currentPassword || newPassword || confirmPassword;

  const getMessageStyle = (msg: string) => { const isSuccess = msg.includes('success') || msg.includes('Success') || msg.includes('enabled') || msg.includes('Enabled') || msg.includes('updated'); return isSuccess ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` } : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }; };
  const getStatusStyle = (status: string) => { if (status === 'active') return { backgroundColor: theme.successBg, color: theme.success }; if (status === 'trial') return { backgroundColor: theme.warningBg, color: theme.warning }; return { backgroundColor: theme.errorBg, color: theme.error }; };
  const statusStyle = getStatusStyle(client.subscription_status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {message && (<div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto" style={getMessageStyle(message)}>{message}</div>)}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Account, security, and billing</p>
      </div>

      <div className="max-w-3xl">

        {/* Account identity — who you are and which account you're in */}
        <section className="mb-4 sm:mb-6">
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.18 : 0.1), color: theme.primary }}>{(user?.first_name || user?.email || client.business_name || '?').charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: theme.text }}>{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Signed in'}</p>
                <p className="text-[10px] sm:text-xs truncate" style={{ color: theme.textMuted4 }}>{user?.email}{client.business_name ? ` · ${client.business_name}` : ''}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: isOwner ? hexToRgba(theme.primary, 0.12) : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'), color: isOwner ? theme.primary : theme.textMuted }}>{isOwner ? 'Account Owner' : 'Team Member'}</span>
          </div>
        </section>

        {client.agency?.allow_client_branding && (
          <ClientBrandingSection clientId={client.id} theme={theme} />
        )}

        {/* HIPAA Mode — only shown for healthcare-related industries */}
        {['medical_practice','dental','mental_health','veterinary','healthcare','chiropractic','optometry','physical_therapy'].includes(client.industry) && (
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><Shield className="w-4 h-4" style={{ color: theme.primary }} />HIPAA Compliance</h2>
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: hipaaMode ? theme.primary : theme.border, backgroundColor: hipaaMode ? hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.02) : theme.card }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: theme.text }}>HIPAA Mode</span>
                  {hipaaMode && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: theme.successBg, color: theme.success }}>Active</span>}
                </div>
                <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: theme.textMuted4 }}>
                  {hipaaMode
                    ? 'HIPAA-compliant call handling is active. Call recordings and transcripts are not stored. Booking is set to collect-request only. The AI collects only name, phone, and general reason for visit.'
                    : 'Enable for healthcare practices. Disables call recordings, transcripts, and caller recognition. Forces collect-request booking mode. The AI will only collect scheduling information — no medical details.'}
                </p>
              </div>
              <button onClick={() => handleToggleHipaa(!hipaaMode)} disabled={savingHipaa} className="relative flex-shrink-0 mt-1 w-11 h-6 rounded-full transition-colors disabled:opacity-50" style={{ backgroundColor: hipaaMode ? theme.primary : theme.isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: hipaaMode ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
            {hipaaMode && (
              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}><span style={{ color: theme.success }}>✓</span> Call recordings disabled — no audio stored</div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}><span style={{ color: theme.success }}>✓</span> Transcripts disabled — no verbatim text stored</div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}><span style={{ color: theme.success }}>✓</span> Caller recognition disabled — no patient identification</div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}><span style={{ color: theme.success }}>✓</span> Collect-request booking — office confirms all appointments</div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}><span style={{ color: theme.success }}>✓</span> AI collects name, phone, and general visit type only</div>
              </div>
            )}
          </div>
        </section>
        )}

        {/* AI Phone Number */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><Phone className="w-4 h-4" style={{ color: theme.primary }} />AI Phone Number</h2>
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0"><label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Your AI Receptionist</label><div className="text-base sm:text-xl font-bold truncate" style={{ color: theme.primary }}>{client.vapi_phone_number ? formatPhoneNumber(client.vapi_phone_number) : 'Setting up...'}</div></div>
              <button onClick={handleCopyNumber} disabled={!client.vapi_phone_number} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50 flex-shrink-0" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>{isCopied ? <Check className="w-4 h-4" style={{ color: theme.success }} /> : <Copy className="w-4 h-4" />}{isCopied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </section>

        {/* Add to Home Screen */}
        <section className="mb-4 sm:mb-6">
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}><Smartphone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.primary }} /></div>
              <div className="min-w-0"><p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>Add to Home Screen</p><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Get instant access — works like a native app</p></div>
            </div>
            <button onClick={() => setShowPwaModal(true)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition hover:opacity-90 flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Install</button>
          </div>
        </section>

        {isOwner && (<>
        {/* Call Handling Mode */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><PhoneForwarded className="w-4 h-4" style={{ color: theme.primary }} />Call Handling</h2>
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            {callModeMessage && (<div className="mb-3 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm font-medium" style={getMessageStyle(callModeMessage)}>{callModeMessage}</div>)}
            {callModeLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 }} /></div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Choose how incoming calls are handled</p>
                <button onClick={() => handleCallModeChange('primary')} disabled={savingCallMode || callMode === 'primary'} className="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition" style={{ borderColor: callMode === 'primary' ? theme.primary : theme.border, backgroundColor: callMode === 'primary' ? hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.04) : theme.card, opacity: savingCallMode ? 0.7 : 1 }}>
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: callMode === 'primary' ? theme.primary : theme.border }}>{callMode === 'primary' && (<div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><PhoneIncoming className="w-3.5 h-3.5" style={{ color: callMode === 'primary' ? theme.primary : theme.textMuted4 }} /><span className="font-semibold text-xs sm:text-sm" style={{ color: callMode === 'primary' ? theme.primary : theme.text }}>Primary — AI Answers First</span></div><p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted4 }}>AI receptionist answers every call immediately. Best for businesses that want 24/7 coverage.</p></div></div>
                </button>
                <button onClick={() => handleCallModeChange('fallback')} disabled={savingCallMode || callMode === 'fallback' || forwardingOn} className="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition" style={{ borderColor: callMode === 'fallback' ? theme.primary : theme.border, backgroundColor: callMode === 'fallback' ? hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.04) : theme.card, opacity: forwardingOn ? 0.55 : (savingCallMode ? 0.7 : 1), cursor: forwardingOn ? 'not-allowed' : 'pointer' }}>
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: callMode === 'fallback' ? theme.primary : theme.border }}>{callMode === 'fallback' && (<div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><PhoneForwarded className="w-3.5 h-3.5" style={{ color: callMode === 'fallback' ? theme.primary : theme.textMuted4 }} /><span className="font-semibold text-xs sm:text-sm" style={{ color: callMode === 'fallback' ? theme.primary : theme.text }}>Fallback — Rings You First</span>{forwardingOn && (<span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: theme.textMuted4 }}><Lock className="w-2.5 h-2.5" />Off</span>)}</div><p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted4 }}>{forwardingOn ? 'Unavailable while call forwarding is on. Forwarding already sends calls to your AI, so the AI answers first.' : 'Your phone rings first. If you don\u2019t answer, the AI picks up automatically.'}</p></div></div>
                </button>
                {forwardingOn && callMode === 'fallback' && (<div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: theme.error }} /><p className="text-[10px] sm:text-xs" style={{ color: theme.errorText }}><span className="font-semibold">Conflict:</span> you have call forwarding on and your phone set to ring first. That can cause a calling loop. Tap &quot;AI Answers First&quot; above to fix it.</p></div>)}
                {forwardingOn && callMode !== 'fallback' && (<div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04), border: `1px solid ${hexToRgba(theme.primary, 0.15)}` }}><Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} /><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Your business line is forwarded to your AI number, so the AI answers first. To answer calls yourself first instead, use the &quot;I answer first&quot; option on the call forwarding card, not this setting.</p></div>)}
                {callMode === 'fallback' && !forwardingOn && (<div className="p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04), border: `1px solid ${hexToRgba(theme.primary, 0.15)}` }}><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}><span className="font-semibold" style={{ color: theme.text }}>How it works:</span> The AI transfers to your phone ({client.owner_phone ? formatPhoneNumber(client.owner_phone) : 'not set'}). If you don&apos;t pick up, the AI takes over. Use this only if you publish your AI number directly, not if you forward your business line to it.</p></div>)}
                {callMode === 'primary' && !client.owner_phone && (<div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} /><p className="text-[10px] sm:text-xs" style={{ color: theme.warningText }}>Add your phone number in Contact Information below to enable Fallback mode.</p></div>)}
                {savingCallMode && (<div className="flex items-center justify-center gap-2 py-1"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: theme.primary }} /><span className="text-xs" style={{ color: theme.textMuted }}>Updating your AI assistant...</span></div>)}
              </div>
            )}
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><User className="w-4 h-4" style={{ color: theme.primary }} />Contact Information</h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Owner Phone *</label><input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} placeholder="+1 (555) 123-4567" /><p className="text-[10px] sm:text-xs mt-1 sm:mt-1.5" style={{ color: theme.textMuted4 }}>{callMode === 'fallback' ? 'Rings this number first in Fallback mode, and the owner SMS notifications are sent here. Team members get SMS on their own number, set under Users.' : 'Owner SMS notifications are sent here. Team members get SMS on their own number, set under Users.'}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} placeholder="your@email.com" /></div>
            <button onClick={handleSave} disabled={saving || !hasChanges} className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: hasChanges ? theme.primary : theme.bg, color: hasChanges ? theme.primaryText : theme.textMuted4, border: hasChanges ? 'none' : `1px solid ${theme.border}` }}>{saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}</button>
          </div>
        </section>
        </>)}

        {/* Team-member SMS clarification (shown when the account-level sections are hidden) */}
        {!isOwner && (
          <section className="mb-4 sm:mb-6">
            <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.border}` }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted4 }} />
              <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Account phone, call handling, and billing are managed by the account owner. To get SMS call alerts on your own number, ask the owner to add your phone and turn on notifications for you under Users.</p>
            </div>
          </section>
        )}

        {/* Your Login — the signed-in user's own credentials */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><Lock className="w-4 h-4" style={{ color: theme.primary }} />Your Login</h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-2.5 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>The email and password you use to sign in to this dashboard.</p>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.bg }}>
              <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} />
              <div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-wide" style={{ color: theme.textMuted4 }}>Username</p><p className="text-xs sm:text-sm font-mono truncate" style={{ color: theme.text }}>{myCreds?.email || user?.email || '—'}</p></div>
              <button onClick={() => copyCred(myCreds?.email || user?.email || '', 'user')} className="flex-shrink-0 p-1" style={{ color: theme.textMuted4 }}>{credCopied === 'user' ? <Check className="w-3.5 h-3.5" style={{ color: theme.success }} /> : <Copy className="w-3.5 h-3.5" />}</button>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.bg }}>
              <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wide" style={{ color: theme.textMuted4 }}>Password</p>
                {myCreds && myCreds.visible_password
                  ? (<p className="text-xs sm:text-sm font-mono truncate" style={{ color: theme.text }}>{showLoginPw ? myCreds.visible_password : '\u2022'.repeat(10)}</p>)
                  : (<p className="text-[10px] sm:text-xs italic" style={{ color: theme.textMuted4 }}>You set your own password. Use Change Password below to update it.</p>)}
              </div>
              {myCreds && myCreds.visible_password && (
                <>
                  <button onClick={() => setShowLoginPw(v => !v)} className="flex-shrink-0 p-1" style={{ color: theme.textMuted4 }}>{showLoginPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                  <button onClick={() => copyCred(myCreds.visible_password || '', 'pass')} className="flex-shrink-0 p-1" style={{ color: theme.textMuted4 }}>{credCopied === 'pass' ? <Check className="w-3.5 h-3.5" style={{ color: theme.success }} /> : <Copy className="w-3.5 h-3.5" />}</button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><Lock className="w-4 h-4" style={{ color: theme.primary }} />Change Password</h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            {passwordMessage && (<div className="p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm font-medium" style={getMessageStyle(passwordMessage)}>{passwordMessage}</div>)}
            <div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Current Password</label><div className="relative"><input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition pr-10" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} placeholder="Enter current password" /><button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted4 }}>{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>New Password</label><div className="relative"><input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition pr-10" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} placeholder="Min 6 characters" /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted4 }}>{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
              <div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.textMuted }}>Confirm New Password</label><input type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} placeholder="Confirm new password" /></div>
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword || !hasPasswordChanges} className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: hasPasswordChanges ? theme.primary : theme.bg, color: hasPasswordChanges ? theme.primaryText : theme.textMuted4, border: hasPasswordChanges ? 'none' : `1px solid ${theme.border}` }}>{changingPassword ? 'Changing...' : 'Change Password'}</button>
          </div>
        </section>

        {/* Users — dashboard login accounts (owner only) */}
        {isOwner && (
        <section className="mb-4 sm:mb-6">
          <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <ClientTeamSection clientId={client.id} theme={theme} />
          </div>
        </section>
        )}

        {/* Subscription & Billing */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><CreditCard className="w-4 h-4" style={{ color: theme.primary }} />Subscription</h2>
          <div className="rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <div className="flex items-center justify-between"><div><label className="text-[10px] sm:text-xs block mb-0.5 sm:mb-1" style={{ color: theme.textMuted4 }}>Current Plan</label><div className="text-base sm:text-xl font-bold capitalize" style={{ color: theme.primary }}>{client.plan_type || 'Trial'}</div></div><span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold" style={statusStyle}>{client.subscription_status === 'active' ? 'Active' : client.subscription_status === 'trial' ? 'Trial' : client.subscription_status || 'Unknown'}</span></div>
            {client.subscription_status === 'trial' && daysRemaining !== null && (<div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}><div className="font-semibold text-xs sm:text-sm" style={{ color: theme.warningText }}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in trial</div><div className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.warningText }}>Ends {formatDate(client.trial_ends_at)}</div></div>)}
            <div className="grid grid-cols-3 gap-2 sm:gap-3"><div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}><div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{client.monthly_call_limit || '∞'}</div><div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Limit</div></div><div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}><div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{client.calls_this_month || 0}</div><div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Used</div></div><div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: theme.bg }}><div className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{client.monthly_call_limit ? Math.max(0, client.monthly_call_limit - (client.calls_this_month || 0)) : '∞'}</div><div className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Left</div></div></div>
            {(client.subscription_status === 'trial' || client.subscription_status === 'trial_expired') ? (
              <button onClick={handleUpgrade} className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Upgrade Now</button>
            ) : client.subscription_status === 'active' ? (
              <button onClick={handleManageSubscription} className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition hover:opacity-90" style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Manage Subscription</button>
            ) : (
              <button onClick={handleUpgrade} className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Reactivate</button>
            )}
          </div>
        </section>

        {/* Support */}
        {supportPhone && (
          <section className="mb-4 sm:mb-6">
            <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}><Headphones className="w-4 h-4" style={{ color: theme.primary }} />Support</h2>
            <div className="rounded-xl border p-3 sm:p-4 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}><Headphones className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} /></div><div className="min-w-0"><p className="font-semibold text-xs sm:text-sm" style={{ color: theme.text }}>AI Support Line</p><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Available 24/7</p></div></div>
                <a href={`tel:${supportPhone}`} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition hover:opacity-90 flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Call</a>
              </div>
              <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${theme.border}` }}><a href={`tel:${supportPhone}`} className="font-semibold text-sm sm:text-lg" style={{ color: theme.primary }}>{formatPhoneNumber(supportPhone)}</a></div>
            </div>
          </section>
        )}
      </div>

      <AddToHomeScreenModal clientId={client.id} theme={theme} isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} manualTrigger appName={branding.agencyName || client.business_name || 'Your App'} />
    </div>
  );
}