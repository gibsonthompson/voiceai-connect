'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone, Loader2, Bot, Mic, MessageSquare, Calendar, Shield,
  Play, Pause, Check, RotateCcw, AlertCircle, ArrowRight
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import UpgradePrompt from '@/components/client/UpgradePrompt';
import { SectionCard as SharedSectionCard } from '@/components/client/SectionCard';
import AISettingsSection from '@/components/client/AISettingsSection';
import ToolConfigSection from '@/components/client/ToolConfigSection';
import WebCallModal from '@/components/agency/WebCallModal';

interface VoiceOption { id: string; name: string; gender: 'male' | 'female'; accent: string; style: string; description: string; previewUrl: string; recommended?: boolean; }
interface CalendarStatus { connected: boolean; token_valid: boolean; calendar_access?: boolean; plan_allowed: boolean; plan_message: string | null; email?: string | null; }
interface GhlStatus { connected: boolean; token_valid: boolean; provider?: string | null; location_id?: string | null; calendar_id?: string | null; needs_calendar?: boolean; calendars?: { id: string; name: string | null }[]; }

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}.fu4{animation-delay:160ms}.fu5{animation-delay:200ms}@keyframes toastIn{from{opacity:0;transform:translate(-50%,-14px)}to{opacity:1;transform:translate(-50%,0)}}.toast-in{animation:toastIn .28s ease-out both}@keyframes savedIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.saved-in{animation:savedIn .3s ease-out both}`;

// Defined at module scope (NOT inside the page component) so their identity is
// stable across renders. Defining them inside the component recreates them on
// every keystroke, which remounts their children (e.g. the greeting textarea)
// and drops focus after each character typed.
// The real multi-color Google "G" mark, used on the Connect button.
const GoogleGIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

// The Microsoft four-square mark, used on the Connect Outlook / Microsoft 365
// button (recognizable for both work Microsoft 365 and personal Outlook accounts).
const OutlookIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="6" y="6" width="16" height="16" fill="#F25022" />
    <rect x="26" y="6" width="16" height="16" fill="#7FBA00" />
    <rect x="6" y="26" width="16" height="16" fill="#00A4EF" />
    <rect x="26" y="26" width="16" height="16" fill="#FFB900" />
  </svg>
);

// Neutral calendar mark for the section icon. The section now covers several
// providers (built-in, Google, Outlook), so the icon is provider-neutral rather
// than any one brand's logo. SectionCard sizes it like every other section icon.
const SectionCalendarIcon = (props: { className?: string }) => (
  <Calendar {...props} />
);

const SectionCard = ({ icon, title, subtitle, live, children, theme, primaryColor }: { icon: any; title: string; subtitle?: string; live?: boolean; children: React.ReactNode; theme: any; primaryColor: string; glass?: any }) => (
  <SharedSectionCard icon={icon} title={title} subtitle={subtitle} live={live} theme={theme} primaryColor={primaryColor}>{children}</SharedSectionCard>
);

// Appointment-length options for the built-in calendar.
const DURATIONS = [15, 30, 45, 60, 90, 120];

const SaveButton = ({ onClick, disabled, loading: btnLoading, label, primaryColor, theme }: { onClick: () => void; disabled: boolean; loading: boolean; label: string; primaryColor: string; theme: any }) => (
  <button onClick={onClick} disabled={disabled} className="w-full mt-3 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
    {btnLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : label}
  </button>
);

// Persistent inline confirmation that appears where the Save button was, so a
// successful save is visible right where the user is looking (the Save button
// disappears on success, which by itself reads as "nothing happened").
const SavedInline = ({ text, theme }: { text: string; theme: any }) => (
  <div className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold saved-in" style={{ backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }}>
    <Check className="w-4 h-4 flex-shrink-0" /> {text}
  </div>
);

const UnsavedHint = ({ text, theme }: { text: string; theme: any }) => (
  <p className="mt-3 text-[11px] text-center font-medium" style={{ color: theme.warning }}>{text}</p>
);

export default function ClientAIAgentPage() {
  const { client, branding, loading, isFeatureEnabled } = useClient();
  // White-glove / manual billing: hide self-serve upgrade CTAs on locked features.
  const hideBilling = !!(client?.agency as any)?.hide_client_billing;
  // Calendar is shown only when the agency has turned it on for this client
  // (same flag that gates the Calendar tab and page). When the agency hides it,
  // none of the calendar connect options below appear.
  // CRM (GoHighLevel) calendar is held back until the GoHighLevel app is approved.
  // Flip this to true to bring the Connect-your-CRM-calendar option back.
  const CRM_CALENDAR_ENABLED = false;
  const theme = useClientTheme();
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [testCallOpen, setTestCallOpen] = useState(false);
  const primaryColor = theme.primary;

  const [voices, setVoices] = useState<{ female: VoiceOption[]; male: VoiceOption[] }>({ female: [], male: [] });
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  // Metadata (name/accent/gender) for the saved voice, so a voice set on the
  // assistant but absent from the fetched list still shows its real name rather
  // than a generic "Current voice" placeholder.
  const [currentVoiceMeta, setCurrentVoiceMeta] = useState<any>(null);
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  // Open on Female + American (the most-picked default, and keeps the list
  // short, All is long enough to crowd the panel). A guard below falls back to
  // All if a given client's voice set happens to have no female/American voices.
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('female');
  const [accentFilter, setAccentFilter] = useState('American');
  const voiceFiltersAdjusted = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Greeting-in-voice preview: cache synthesized audio per voice+text for the
  // session so re-tapping a voice doesn't re-bill ElevenLabs; track which voice
  // is currently being synthesized to show a spinner.
  const previewCacheRef = useRef<Map<string, string>>(new Map());
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const [greetingMessage, setGreetingMessage] = useState('');
  const [originalGreeting, setOriginalGreeting] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [greetingSaved, setGreetingSaved] = useState(false);

  // Google Calendar state
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);
  // Built-in (native) calendar state
  const [nativeSettings, setNativeSettings] = useState<any>(null);
  const [nativeBusy, setNativeBusy] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [durationSaved, setDurationSaved] = useState(false);
  const [nativeErr, setNativeErr] = useState<string | null>(null);

  // GoHighLevel state
  const [ghlStatus, setGhlStatus] = useState<GhlStatus | null>(null);
  const [ghlLoading, setGhlLoading] = useState(true);
  const [disconnectingGhl, setDisconnectingGhl] = useState(false);

  useEffect(() => { if (client) { fetchVoices(); fetchCurrentVoice(); fetchGreeting(); fetchCalendarStatus(); fetchNativeSettings(); fetchGhlStatus(); } }, [client]);

  // Once voices load, make sure the Female/American defaults actually have
  // voices for this client; if not, fall back to All so the panel never opens
  // empty. Runs once (ref-gated), so it never overrides a later manual choice.
  useEffect(() => {
    const total = (voices.female?.length || 0) + (voices.male?.length || 0);
    if (total === 0 || voiceFiltersAdjusted.current) return;
    voiceFiltersAdjusted.current = true;
    const femaleEmpty = (voices.female?.length || 0) === 0;
    if (femaleEmpty && voiceFilter === 'female') setVoiceFilter('all');
    const genderPool = (!femaleEmpty && voiceFilter === 'female')
      ? (voices.female || [])
      : [...(voices.female || []), ...(voices.male || [])];
    if (accentFilter === 'American' && !genderPool.some(v => v.accent === 'American')) setAccentFilter('all');
  }, [voices]);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } previewCacheRef.current.forEach(url => { try { URL.revokeObjectURL(url); } catch {} }); previewCacheRef.current.clear(); }; }, []);

  // Handle calendar redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Returning from the Google round-trip lands at the top of this long page;
    // scroll the calendar section back into view so the result shows in place.
    const cameBackFromCalendar = params.get('success') === 'calendar_connected' || (params.get('error') || '').startsWith('calendar_');
    if (cameBackFromCalendar) {
      setTimeout(() => document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    }
    if (params.get('success') === 'calendar_connected') {
      showMessage('Calendar connected successfully!');
      setCalendarStatus(prev => prev ? { ...prev, connected: true, token_valid: true } : null);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const error = params.get('error');
    if (error === 'plan_upgrade_required') {
      showMessage('Calendar integration requires a higher plan. Please contact your provider to upgrade.', true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'calendar_denied') {
      showMessage('Calendar access was denied. Please try again and grant calendar permissions.', true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'calendar_scope_missing') {
      showMessage('The calendar permission was left unchecked, so bookings will not work. Please reconnect and allow access to view and edit your calendar events.', true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error?.startsWith('calendar_')) {
      showMessage('Failed to connect the calendar. Please try again.', true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    // GoHighLevel round-trip result
    if (params.get('success') === 'crm_connected') {
      showMessage('CRM calendar connected successfully!');
      setGhlStatus(prev => (prev ? { ...prev, connected: true, token_valid: true } : { connected: true, token_valid: true }));
      setTimeout(() => document.getElementById('ghl-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      window.history.replaceState({}, '', window.location.pathname);
    } else if ((error || '').startsWith('crm_')) {
      showMessage('Failed to connect your CRM calendar. Please try again.', true);
      setTimeout(() => document.getElementById('ghl-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const fetchVoices = async () => { if (!client) return; setVoicesLoading(true); setVoicesError(null); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voices`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }); if (!r.ok) throw new Error('Failed'); const d = await r.json(); if (d.success && d.grouped) setVoices(d.grouped); else throw new Error('Invalid'); } catch (e: any) { setVoicesError(e.message); } finally { setVoicesLoading(false); } };
  const fetchCurrentVoice = async () => { if (!client) return; try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setCurrentVoiceId(d.voice_id); setSelectedVoiceId(d.voice_id); setCurrentVoiceMeta(d.voice || null); } } } catch {} };
  const fetchGreeting = async () => { if (!client) return; setGreetingLoading(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setGreetingMessage(d.greeting_message); setOriginalGreeting(d.greeting_message); } } } catch {} finally { setGreetingLoading(false); } };

  // Which calendar provider this client is on, for this section (Google or
  // Microsoft). Microsoft wins when it is the selected provider or already
  // connected; otherwise Google (the default). GHL/native have their own sections.
  const calendarProvider = (): 'google' | 'microsoft' =>
    (((client as any)?.calendar_provider === 'microsoft') || (client as any)?.microsoft_calendar_connected) ? 'microsoft' : 'google';

  const fetchCalendarStatus = async () => {
    if (!client) return;
    const provider = calendarProvider();
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/${provider}-calendar/status/${client.id}`);
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar status:', err);
      const connected = provider === 'microsoft' ? ((client as any).microsoft_calendar_connected || false) : (client.google_calendar_connected || false);
      const email = provider === 'microsoft' ? ((client as any).microsoft_calendar_email || null) : ((client as any).google_calendar_email || null);
      setCalendarStatus({ connected, token_valid: connected, calendar_access: connected, plan_allowed: true, plan_message: null, email });
    } finally {
      setCalendarLoading(false);
    }
  };

  // Pass the origin + page we are on so the backend returns us to the SAME
  // origin after OAuth. The session token is origin-scoped (localStorage), so
  // being sent to a different host (e.g. the slug subdomain when the client is
  // on the agency's custom domain) would drop the token and log them out.
  const handleConnectCalendar = () => {
    const ret = encodeURIComponent(`${window.location.origin}/client/ai-agent`);
    window.location.href = `${getBackendUrl()}/api/auth/google-calendar/connect?clientId=${client?.id}&return=${ret}`;
  };

  // Connect Outlook / Microsoft 365. Same return-origin handling as Google so
  // the client lands back on the exact host their session lives on.
  const handleConnectMicrosoft = () => {
    const ret = encodeURIComponent(`${window.location.origin}/client/ai-agent`);
    window.location.href = `${getBackendUrl()}/api/auth/microsoft-calendar/connect?clientId=${client?.id}&return=${ret}`;
  };

  const handleDisconnectCalendar = async () => {
    const provider = calendarProvider();
    const label = provider === 'microsoft' ? 'Outlook / Microsoft 365' : 'Google Calendar';
    if (!confirm(`Are you sure you want to disconnect ${label}? Your AI receptionist will no longer be able to book appointments.`)) return;
    setDisconnectingCalendar(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/${provider}-calendar/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ clientId: client?.id }),
      });
      const data = await response.json();
      if (data.success) {
        showMessage(`${label} disconnected`);
        setCalendarStatus(prev => prev ? { ...prev, connected: false, token_valid: false } : null);
      } else {
        showMessage(data.error || 'Failed to disconnect calendar', true);
      }
    } catch {
      showMessage('Error disconnecting calendar', true);
    } finally {
      setDisconnectingCalendar(false);
    }
  };

  // ── Built-in (native) calendar: enable / disable / default length ──────────
  const fetchNativeSettings = async () => {
    if (!client) return;
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/settings`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setNativeSettings(d); }
    } catch { /* leave null; the options view still renders */ }
  };

  const enableNative = async () => {
    if (!client) return;
    setNativeBusy(true); setNativeErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/enable`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({}) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not turn on the calendar');
      await fetchNativeSettings();
      showMessage('Built-in calendar turned on.');
    } catch (e: any) { setNativeErr(e.message); } finally { setNativeBusy(false); }
  };

  const disableNative = async () => {
    if (!client) return;
    if (!confirm('Turn off the built-in calendar? Your AI will stop booking here. Existing appointments are kept.')) return;
    setNativeBusy(true); setNativeErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/disable`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({}) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not turn off the calendar');
      await fetchNativeSettings();
    } catch (e: any) { setNativeErr(e.message); } finally { setNativeBusy(false); }
  };

  const saveDuration = async (minutes: number) => {
    if (!client) return;
    setNativeSettings((s: any) => (s ? { ...s, appointment_duration: minutes } : s));
    setSavingDuration(true); setDurationSaved(false); setNativeErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ appointment_duration: minutes }) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not save');
      setDurationSaved(true); setTimeout(() => setDurationSaved(false), 2200);
    } catch (e: any) { setNativeErr(e.message); } finally { setSavingDuration(false); }
  };

  // GoHighLevel: status is public (no auth header), same pattern as the calendar
  // status check. Connect/disconnect mirror the Google flow.
  const fetchGhlStatus = async () => {
    if (!client) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/crm-calendar/status/${client.id}`);
      if (response.ok) {
        const data = await response.json();
        setGhlStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch GoHighLevel status:', err);
      setGhlStatus({ connected: (client as any).ghl_connected || false, token_valid: false });
    } finally {
      setGhlLoading(false);
    }
  };

  const handleConnectGhl = () => {
    const ret = encodeURIComponent(`${window.location.origin}/client/ai-agent`);
    window.location.href = `${getBackendUrl()}/api/auth/crm-calendar/connect?clientId=${client?.id}&return=${ret}`;
  };

  const handleDisconnectGhl = async () => {
    if (!confirm('Disconnect your CRM calendar? Your AI will stop booking into it.')) return;
    setDisconnectingGhl(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/crm-calendar/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ clientId: client?.id }),
      });
      const data = await response.json();
      if (data.success) {
        showMessage('CRM calendar disconnected');
        setGhlStatus(prev => prev ? { ...prev, connected: false, token_valid: false } : null);
      } else {
        showMessage(data.error || 'Failed to disconnect your CRM calendar', true);
      }
    } catch {
      showMessage('Error disconnecting your CRM calendar', true);
    } finally {
      setDisconnectingGhl(false);
    }
  };

  // Text spoken in the preview: the greeting exactly as currently typed (so it
  // reflects unsaved edits), falling back to a generic line if it's basically empty.
  const buildPreviewText = (): string => {
    const g = greetingMessage.trim();
    if (g.length >= 5) return g.slice(0, 500);
    const bn = client?.business_name || branding?.businessName || 'our office';
    return `Hey, thanks for calling ${bn}. This call may be recorded. How can we help you today?`;
  };

  const playFromUrl = (voiceId: string, url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => setPlayingVoiceId(null);
    audio.play().catch(() => setPlayingVoiceId(null));
    setPlayingVoiceId(voiceId);
  };

  const handlePlayPreview = async (voice: VoiceOption) => {
    // Tapping the playing voice again stops it.
    if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); setPlayingVoiceId(null); return; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    const text = buildPreviewText();
    const cacheKey = `${voice.id}::${text}`;
    const cachedUrl = previewCacheRef.current.get(cacheKey);
    if (cachedUrl) { playFromUrl(voice.id, cachedUrl); return; }

    setPreviewLoadingId(voice.id);
    try {
      const r = await fetch(`/api/voice-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voice.id, text }),
      });
      if (!r.ok) throw new Error('preview failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      previewCacheRef.current.set(cacheKey, url);
      setPreviewLoadingId(null);
      playFromUrl(voice.id, url);
    } catch {
      setPreviewLoadingId(null);
      // Fall back to the stock ElevenLabs sample so the button still does something
      // (e.g. before ELEVENLABS_API_KEY is configured).
      if (voice.previewUrl) playFromUrl(voice.id, voice.previewUrl);
      else showMessage('Could not play preview', true);
    }
  };
  const handleSaveVoice = async () => { if (selectedVoiceId === currentVoiceId || !client) return; setSavingVoice(true); setVoiceSaved(false); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ voice_id: selectedVoiceId }) }); const d = await r.json(); if (d.success) { setCurrentVoiceId(selectedVoiceId); setVoiceSaved(true); setTimeout(() => setVoiceSaved(false), 6000); showMessage('Voice saved. Callers will hear it on the next call.'); } else { showMessage('Failed to save voice. Please try again.', true); setSelectedVoiceId(currentVoiceId); } } catch { showMessage('Error saving voice. Please try again.', true); setSelectedVoiceId(currentVoiceId); } finally { setSavingVoice(false); } };
  const handleSaveGreeting = async () => { if (greetingMessage === originalGreeting || !client) return; setSavingGreeting(true); setGreetingSaved(false); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ greeting_message: greetingMessage }) }); const d = await r.json(); if (d.success) { setOriginalGreeting(greetingMessage); setGreetingSaved(true); setTimeout(() => setGreetingSaved(false), 6000); showMessage('Greeting saved. Callers will hear it on the next call.'); } else { showMessage(d.error || 'Failed to save greeting. Please try again.', true); } } catch { showMessage('Error saving greeting. Please try again.', true); } finally { setSavingGreeting(false); } };
  const handleResetGreeting = () => { if (!client?.business_name) return; setGreetingMessage(`Hey, thanks for calling ${client.business_name}. This call may be recorded. How can we help you today?`); };
  // Test the assistant with a browser web call (mic in the browser), not by
  // dialing the number. The modal builds a fresh assistant from the client's
  // current settings, so the test reflects exactly what callers would hear.
  const handleTestCall = () => setTestCallOpen(true);
  const showMessage = (text: string, isError = false) => { setMessage(text); setMessageError(isError); setTimeout(() => setMessage(''), 5000); };

  const getAllVoices = (): VoiceOption[] => [...(voices.female || []), ...(voices.male || [])];
  // Fixed accent order (American, British, Australian), then any others A-Z.
  const getAvailableAccents = (): string[] => {
    const order = ['American', 'British', 'Australian'];
    return [...new Set(getAllVoices().map(v => v.accent).filter(Boolean))].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  };
  const getFilteredVoices = () => { let f: VoiceOption[]; if (voiceFilter === 'female') f = voices.female || []; else if (voiceFilter === 'male') f = voices.male || []; else f = getAllVoices(); if (accentFilter !== 'all') f = f.filter(v => v.accent === accentFilter); return f; };

  // Always show a voice as selected. If the client hasn't saved one yet, default
  // the picker to the first available voice so nothing renders unselected.
  useEffect(() => {
    if (currentVoiceId || selectedVoiceId) return;
    const all = [...(voices.female || []), ...(voices.male || [])];
    if (all.length > 0) setSelectedVoiceId(all[0].id);
  }, [voices, currentVoiceId]);

  const hasVoiceChanges = selectedVoiceId !== currentVoiceId;
  const hasGreetingChanges = greetingMessage !== originalGreeting;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);
  const filteredVoices = getFilteredVoices();
  const activeVoiceId = selectedVoiceId || currentVoiceId;
  const shownVoices: VoiceOption[] = (activeVoiceId && !getAllVoices().some(v => v.id === activeVoiceId))
    ? ([{ id: activeVoiceId, name: currentVoiceMeta?.name || 'Current voice', gender: currentVoiceMeta?.gender || 'female', accent: currentVoiceMeta?.accent || 'Active', style: currentVoiceMeta?.style || '', description: currentVoiceMeta?.description || 'Currently set on your assistant \u2014 pick one below to change it.', recommended: false } as any, ...filteredVoices])
    : filteredVoices;
  const availableAccents = getAvailableAccents();
  const isNativeActive = (client as any)?.calendar_provider === 'native' || !!nativeSettings?.is_native;
  const isExternalConnected = !!(calendarStatus?.connected || client?.google_calendar_connected || (client as any)?.microsoft_calendar_connected);
  const isCalendarLive = isNativeActive || isExternalConnected;
  const isCalendarPlanAllowed = (client as any)?.is_test_client || calendarStatus?.plan_allowed !== false;
  const isGhlConnected = ghlStatus?.connected || (client as any)?.ghl_connected;

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)' };
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* Fixed toast: pinned to the top of the viewport (position: fixed) so the
          confirmation is visible no matter where the user has scrolled. The old
          version rendered at the top of the page content, which put it off-screen
          whenever the user saved a section lower down (voice, greeting), making
          every save look like it did nothing. */}
      {message && (
        // Centered on the CONTENT column, not the whole window. The client portal
        // has a fixed 16rem (w-64) sidebar on lg screens and the main pane is
        // lg:pl-64, so content-center sits at 50% + 8rem. On mobile there is no
        // in-flow sidebar, so plain 50% is already centered.
        <div className="fixed left-1/2 lg:left-[calc(50%+8rem)] -translate-x-1/2 z-[100] toast-in w-[calc(100vw-2rem)] max-w-sm px-1"
          style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
            style={messageError
              ? { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
              : { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }}>
            {messageError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
            <p className="text-sm font-semibold leading-snug">{message}</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="mb-5 sm:mb-7 text-center fu fu1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06) }}>
          <Bot className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>AI Agent</h2>
        <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: theme.textMuted }}>Voice, personality, and behavior settings</p>
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Test Call */}
        <section className="mb-4 sm:mb-5 fu fu1">
          <button onClick={handleTestCall} disabled={!client}
            className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Test Your AI Agent</span>
          </button>
          <p className="text-center text-[11px] mt-1.5" style={{ color: theme.textMuted4 }}>Talk to your AI right here in your browser to hear your settings in action</p>
        </section>

        {/* Calendar: built-in, Google, and Outlook, all in one section */}
        <div id="calendar-section" className="fu fu2 scroll-mt-6">
          <SectionCard icon={SectionCalendarIcon} title="Calendar" subtitle={isNativeActive ? 'Your AI books into the built-in calendar' : isExternalConnected ? 'Your AI can book appointments to your calendar' : 'Let your AI book appointments to your calendar'} live={isCalendarLive} theme={theme} primaryColor={primaryColor} glass={glass}>
            {calendarLoading ? (
              <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 }} /></div>
            ) : !isCalendarPlanAllowed ? (
              <div className="space-y-2.5">
                <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                  <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>Calendar integration is not included in your current plan.</p>
                </div>
                <button disabled className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed opacity-50" style={{ backgroundColor: theme.bg, color: theme.textMuted4, border: `1px solid ${theme.border}` }}>
                  <Calendar className="w-4 h-4 inline mr-1.5" />Upgrade to Connect Calendar
                </button>
              </div>
            ) : isNativeActive ? (
              <div className="space-y-3">
                {/* Built-in calendar active */}
                <div className="flex items-center gap-3 rounded-xl p-3 sm:p-3.5" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.success }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: theme.success }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: theme.successText }}>Built-in calendar active</p>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>The AI books on the call and every booking triggers your automations.</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: theme.text }}>Default appointment length</p>
                    {savingDuration ? (<span className="text-[11px] flex items-center gap-1" style={{ color: theme.textMuted }}><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>) : durationSaved ? (<span className="text-[11px] flex items-center gap-1" style={{ color: theme.successText }}><Check className="w-3 h-3" /> Saved</span>) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map((m) => {
                      const active = (((nativeSettings?.appointment_duration) || (client as any)?.appointment_duration || 30) === m);
                      return (
                        <button key={m} onClick={() => saveDuration(m)} disabled={savingDuration} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-60" style={{ backgroundColor: active ? primaryColor : (theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'), color: active ? theme.primaryText : theme.textMuted }}>{m} min</button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg text-[11px] sm:text-xs leading-relaxed" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                  Your open times come from the business hours on your <a href="/client/my-business" className="font-semibold underline" style={{ color: primaryColor }}>My Business</a> page. See and manage every booking on the <a href="/client/calendar" className="font-semibold underline" style={{ color: primaryColor }}>Calendar</a> tab.
                </div>

                <button onClick={disableNative} disabled={nativeBusy} className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
                  {nativeBusy ? (<span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Turning off...</span>) : 'Turn off built-in calendar'}
                </button>
                {nativeErr && <p className="text-[11px] font-medium text-center" style={{ color: theme.error }}>{nativeErr}</p>}
              </div>
            ) : isExternalConnected ? (
              <div className="space-y-3">
                {calendarStatus?.calendar_access === false ? (
                  <div className="flex items-start gap-2.5 rounded-xl p-3 sm:p-3.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight" style={{ color: theme.warningText }}>Connected, but no calendar access</p>
                      <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>The calendar permission was left unchecked, so the AI can&apos;t book yet. Disconnect, then connect again and allow access to view and edit your calendar events.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3.5 rounded-2xl p-3.5 sm:p-4" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                      {calendarProvider() === 'microsoft' ? <OutlookIcon className="w-6 h-6" /> : <GoogleGIcon className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold leading-tight" style={{ color: theme.successText }}>{calendarProvider() === 'microsoft' ? 'Outlook' : 'Google Calendar'}</p>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.successBorder}` }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.success }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: theme.success }} />
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.success }}>Connected</span>
                        </span>
                      </div>
                      {calendarStatus?.email ? (
                        <p className="text-[11px] sm:text-xs mt-1 truncate" style={{ color: theme.textMuted }} title={calendarStatus.email}>Booking into {calendarStatus.email}</p>
                      ) : (
                        <p className="text-[11px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>Your AI books appointments straight into your calendar.</p>
                      )}
                    </div>
                  </div>
                )}

                {calendarStatus && !calendarStatus.token_valid && (
                  <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>Calendar connection may have expired. Disconnect and connect again to keep bookings flowing.</p>
                  </div>
                )}

                <button onClick={handleDisconnectCalendar} disabled={disconnectingCalendar} className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                  {disconnectingCalendar ? (<span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</span>) : 'Disconnect calendar'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  Your AI can book appointments right on the call, then text you the details. Use the built-in calendar, or connect the account you already use.
                </p>

                <button onClick={enableNative} disabled={nativeBusy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition hover:shadow-sm disabled:opacity-50" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                  {nativeBusy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Turning on...</>) : (<>Use the built-in calendar <ArrowRight className="w-4 h-4" /></>)}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
                  <span className="text-[11px] font-medium" style={{ color: theme.textMuted4 }}>or connect an account</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
                </div>

                <div className="space-y-2.5">
                  <button onClick={handleConnectCalendar} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition hover:shadow-sm" style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
                    <GoogleGIcon className="w-[18px] h-[18px]" /> Connect Google Calendar
                  </button>
                  <button onClick={handleConnectMicrosoft} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition hover:shadow-sm" style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
                    <OutlookIcon className="w-[18px] h-[18px]" /> Connect Outlook / Microsoft 365
                  </button>
                </div>

                {nativeErr && <p className="text-[11px] font-medium text-center" style={{ color: theme.error }}>{nativeErr}</p>}

                <p className="text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
                  Powered by our scheduling partner, VoiceAI Connect, so Google or Microsoft shows their name when you approve. Your calendar stays private.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* GoHighLevel Integration (held back until the GoHighLevel app is approved) */}
        {CRM_CALENDAR_ENABLED && (
        <div id="ghl-section" className="fu fu2 scroll-mt-6">
          <SectionCard icon={SectionCalendarIcon} title="CRM Calendar" subtitle={isGhlConnected ? 'Your AI books into your CRM calendar' : 'Connect your CRM calendar so your AI books there'} live={!!isGhlConnected} theme={theme} primaryColor={primaryColor} glass={glass}>
            {ghlLoading ? (
              <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 }} /></div>
            ) : isGhlConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl p-3 sm:p-3.5" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.success }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: theme.success }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: theme.successText }}>CRM calendar connected</p>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>Your AI books appointments straight into your CRM calendar.</p>
                  </div>
                </div>

                {ghlStatus?.needs_calendar && (
                  <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>No calendar found in your CRM yet. Create one there, then reconnect.</p>
                  </div>
                )}

                {ghlStatus && ghlStatus.token_valid === false && (
                  <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>Your CRM calendar connection may have expired. Reconnect to keep bookings flowing.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleConnectGhl} className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}><RotateCcw className="w-3.5 h-3.5" /> Reconnect</button>
                  <button onClick={handleDisconnectGhl} disabled={disconnectingGhl} className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
                    {disconnectingGhl ? (<span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</span>) : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  Already use a CRM for scheduling? Connect its calendar and the AI books appointments straight into it, so your contacts and automations there keep running off every call.
                </p>

                <button onClick={handleConnectGhl} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition hover:shadow-sm" style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
                  <Calendar className="w-[18px] h-[18px]" /> Connect your CRM calendar
                </button>

                <p className="text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
                  Optional. Your AI already books and texts on its own, connect your CRM calendar only if you already run your scheduling and automations there.
                </p>
              </div>
            )}
          </SectionCard>
        </div>
        )}

        {/* Voice Selection */}
        <div className="fu fu2">
          {!isFeatureEnabled('custom_voice') ? (
            <SectionCard icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice" theme={theme} primaryColor={primaryColor} glass={glass}><UpgradePrompt feature="custom_voice" primaryColor={primaryColor} isDark={theme.isDark} hideUpgrade={hideBilling} /></SectionCard>
          ) : (
            <SectionCard icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice" live theme={theme} primaryColor={primaryColor} glass={glass}>
              {voicesLoading && <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} /><span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading voices...</span></div>}
              {voicesError && !voicesLoading && (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                  <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: theme.error }} />
                  <p className="text-sm font-medium mb-2" style={{ color: theme.error }}>{voicesError}</p>
                  <button onClick={fetchVoices} className="text-sm underline" style={{ color: theme.error }}>Try again</button>
                </div>
              )}
              {!voicesLoading && !voicesError && totalVoices > 0 && (<>
                <div className="flex gap-1.5 mb-3">
                  {(['female','male','all'] as const).map(f => (
                    <button key={f} onClick={() => setVoiceFilter(f)} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition"
                      style={{ backgroundColor: voiceFilter === f ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', color: voiceFilter === f ? theme.primaryText : theme.textMuted }}>
                      {f === 'all' ? `All (${totalVoices})` : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                {availableAccents.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {availableAccents.map(a => { const flag = a === 'British' ? '🇬🇧' : a === 'American' ? '🇺🇸' : a === 'Australian' ? '🇦🇺' : '🌍'; return (
                      <button key={a} onClick={() => setAccentFilter(a)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                        style={{ backgroundColor: accentFilter === a ? hexToRgba(primaryColor, 0.12) : 'transparent', color: accentFilter === a ? primaryColor : theme.textMuted, border: `1px solid ${accentFilter === a ? hexToRgba(primaryColor, 0.25) : 'transparent'}` }}>
                        {flag} {a}
                      </button>
                    ); })}
                    <button onClick={() => setAccentFilter('all')} className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                      style={{ backgroundColor: accentFilter === 'all' ? hexToRgba(primaryColor, 0.12) : 'transparent', color: accentFilter === 'all' ? primaryColor : theme.textMuted, border: `1px solid ${accentFilter === 'all' ? hexToRgba(primaryColor, 0.25) : 'transparent'}` }}>
                      🌍 All
                    </button>
                  </div>
                )}
                {filteredVoices.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {shownVoices.map((voice: any) => { const sel = selectedVoiceId === voice.id; const cur = currentVoiceId === voice.id; const playing = playingVoiceId === voice.id; return (
                      <div key={voice.id} onClick={() => setSelectedVoiceId(voice.id)}
                        className="relative p-3 rounded-xl cursor-pointer transition-all"
                        style={{ ...glass, borderColor: sel ? primaryColor : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), borderWidth: '2px', backgroundColor: sel ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : glass.backgroundColor }}>
                        {cur && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-white text-[8px] font-bold rounded-full" style={{ backgroundColor: theme.success }}>CURRENT</span>}
                        {voice.recommended && !cur && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>★</span>}
                        <div className="flex items-start gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handlePlayPreview(voice); }}
                            disabled={previewLoadingId === voice.id}
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                            style={{ backgroundColor: playing ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: playing ? theme.primaryText : theme.textMuted }}>
                            {previewLoadingId === voice.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-[13px] truncate" style={{ color: theme.text }}>{voice.name}</span>
                              {sel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />}
                              {voice.custom && <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}>CUSTOM</span>}
                            </div>
                            <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>{voice.custom ? 'Custom voice' : `${voice.accent}${voice.accent && voice.style ? ' · ' : ''}${voice.style}`}</p>
                          </div>
                        </div>
                      </div>
                    ); })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>No voices match</p>
                    <button onClick={() => { setVoiceFilter('all'); setAccentFilter('all'); }} className="mt-2 text-xs font-medium" style={{ color: primaryColor }}>Clear filters</button>
                  </div>
                )}
                {hasVoiceChanges ? (
                  <>
                    <UnsavedHint text="You have an unsaved voice change. Click Save Voice to apply it." theme={theme} />
                    <SaveButton onClick={handleSaveVoice} disabled={savingVoice} loading={savingVoice} label="Save Voice" primaryColor={primaryColor} theme={theme} />
                  </>
                ) : voiceSaved ? (
                  <SavedInline text="Voice saved. Callers hear it on the next call." theme={theme} />
                ) : null}
              </>)}
            </SectionCard>
          )}
        </div>

        {/* Greeting */}
        <div className="fu fu3">
          {!isFeatureEnabled('custom_greeting') ? (
            <SectionCard icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first" theme={theme} primaryColor={primaryColor} glass={glass}><UpgradePrompt feature="custom_greeting" primaryColor={primaryColor} isDark={theme.isDark} hideUpgrade={hideBilling} /></SectionCard>
          ) : (
            <SectionCard icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first" live theme={theme} primaryColor={primaryColor} glass={glass}>
              {greetingLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} /></div> : (<>
                <textarea value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} rows={3} maxLength={500}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition" style={inputStyle} placeholder="Hey, thanks for calling [Business Name]. This call may be recorded. How can we help you today?" />
                <div className="flex items-center justify-between mt-2">
                  <button onClick={handleResetGreeting} className="flex items-center gap-1 text-[11px]" style={{ color: theme.textMuted4 }}><RotateCcw className="w-3 h-3" /> Reset</button>
                  <span className="text-[11px]" style={{ color: theme.textMuted4 }}>{greetingMessage.length}/500</span>
                </div>
                {hasGreetingChanges ? (
                  <>
                    {greetingMessage.length < 10
                      ? <UnsavedHint text="Greeting must be at least 10 characters to save." theme={theme} />
                      : <UnsavedHint text="You have unsaved changes. Click Save Greeting to apply them." theme={theme} />}
                    <SaveButton onClick={handleSaveGreeting} disabled={savingGreeting || greetingMessage.length < 10} loading={savingGreeting} label="Save Greeting" primaryColor={primaryColor} theme={theme} />
                  </>
                ) : greetingSaved ? (
                  <SavedInline text="Saved. Callers hear this greeting on the next call." theme={theme} />
                ) : null}
              </>)}
            </SectionCard>
          )}
        </div>

        {/* AI Behavior */}
        <div className="fu fu3">
          <SectionCard icon={Bot} title="AI Personality & Behavior" theme={theme} primaryColor={primaryColor}>
            <AISettingsSection clientId={client.id} theme={theme} compact />
          </SectionCard>
        </div>

        {/* AI Tools */}
        <div className="fu fu4">
          <SectionCard icon={Shield} title="AI Tools" theme={theme} primaryColor={primaryColor}>
            <ToolConfigSection clientId={client.id} theme={theme} compact industry={client.industry} client={client} />
          </SectionCard>
        </div>

        {/* Tip */}
        <div className="rounded-2xl p-4 fu fu5" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.06 : 0.03), border: `1px solid ${hexToRgba(primaryColor, 0.12)}` }}>
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <h4 className="font-semibold text-[13px] mb-0.5" style={{ color: primaryColor }}>Pro Tip</h4>
              <p className="text-xs" style={{ color: theme.textMuted }}>After changes, tap &quot;Test Your AI&quot; to hear them in action!</p>
            </div>
          </div>
        </div>
      </div>

      {client && (
        <WebCallModal clientId={client.id} open={testCallOpen} onClose={() => setTestCallOpen(false)} theme={theme} />
      )}
    </div>
  );
}