'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone, Loader2, Bot, Mic, MessageSquare, Calendar,
  Play, Pause, Check, RotateCcw, AlertCircle, Link2
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import UpgradePrompt from '@/components/client/UpgradePrompt';
import AISettingsSection from '@/components/client/AISettingsSection';
import ToolConfigSection from '@/components/client/ToolConfigSection';

interface VoiceOption { id: string; name: string; gender: 'male' | 'female'; accent: string; style: string; description: string; previewUrl: string; recommended?: boolean; }
interface CalendarStatus { connected: boolean; token_valid: boolean; plan_allowed: boolean; plan_message: string | null; }

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}.fu4{animation-delay:160ms}.fu5{animation-delay:200ms}`;

export default function ClientAIAgentPage() {
  const { client, branding, loading, isFeatureEnabled } = useClient();
  const theme = useClientTheme();
  const [message, setMessage] = useState('');
  const primaryColor = theme.primary;

  const [voices, setVoices] = useState<{ female: VoiceOption[]; male: VoiceOption[] }>({ female: [], male: [] });
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [savingVoice, setSavingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const [accentFilter, setAccentFilter] = useState('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [greetingMessage, setGreetingMessage] = useState('');
  const [originalGreeting, setOriginalGreeting] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [savingGreeting, setSavingGreeting] = useState(false);

  // Google Calendar state
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);

  useEffect(() => { if (client) { fetchVoices(); fetchCurrentVoice(); fetchGreeting(); fetchCalendarStatus(); } }, [client]);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  // Handle calendar redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'calendar_connected') {
      showMessage('Google Calendar connected successfully!');
      setCalendarStatus(prev => prev ? { ...prev, connected: true, token_valid: true } : null);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const error = params.get('error');
    if (error === 'plan_upgrade_required') {
      showMessage('Calendar integration requires a higher plan. Please contact your provider to upgrade.', true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'calendar_denied') {
      showMessage('Google Calendar access was denied. Please try again and grant calendar permissions.', true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error?.startsWith('calendar_')) {
      showMessage('Failed to connect Google Calendar. Please try again.', true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const fetchVoices = async () => { setVoicesLoading(true); setVoicesError(null); try { const r = await fetch(`${getBackendUrl()}/api/voices`); if (!r.ok) throw new Error('Failed'); const d = await r.json(); if (d.success && d.grouped) setVoices(d.grouped); else throw new Error('Invalid'); } catch (e: any) { setVoicesError(e.message); } finally { setVoicesLoading(false); } };
  const fetchCurrentVoice = async () => { if (!client) return; try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setCurrentVoiceId(d.voice_id); setSelectedVoiceId(d.voice_id); } } } catch {} };
  const fetchGreeting = async () => { if (!client) return; setGreetingLoading(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setGreetingMessage(d.greeting_message); setOriginalGreeting(d.greeting_message); } } } catch {} finally { setGreetingLoading(false); } };

  const fetchCalendarStatus = async () => {
    if (!client) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/google-calendar/status/${client.id}`);
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar status:', err);
      setCalendarStatus({ connected: client.google_calendar_connected || false, token_valid: false, plan_allowed: true, plan_message: null });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleConnectCalendar = () => { window.location.href = `${getBackendUrl()}/api/auth/google-calendar/connect?clientId=${client?.id}`; };

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Your AI receptionist will no longer be able to book appointments.')) return;
    setDisconnectingCalendar(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/google-calendar/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ clientId: client?.id }),
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Google Calendar disconnected');
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

  const handlePlayPreview = (voice: VoiceOption) => { if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); setPlayingVoiceId(null); return; } if (audioRef.current) audioRef.current.pause(); const audio = new Audio(voice.previewUrl); audioRef.current = audio; audio.onended = () => setPlayingVoiceId(null); audio.onerror = () => { setPlayingVoiceId(null); showMessage('Failed to play', true); }; audio.play(); setPlayingVoiceId(voice.id); };
  const handleSaveVoice = async () => { if (selectedVoiceId === currentVoiceId || !client) return; setSavingVoice(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ voice_id: selectedVoiceId }) }); const d = await r.json(); if (d.success) { setCurrentVoiceId(selectedVoiceId); showMessage('Voice updated!'); } else { showMessage('Failed', true); setSelectedVoiceId(currentVoiceId); } } catch { showMessage('Error', true); setSelectedVoiceId(currentVoiceId); } finally { setSavingVoice(false); } };
  const handleSaveGreeting = async () => { if (greetingMessage === originalGreeting || !client) return; setSavingGreeting(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ greeting_message: greetingMessage }) }); const d = await r.json(); if (d.success) { setOriginalGreeting(greetingMessage); showMessage('Greeting updated!'); } else { showMessage(d.error || 'Failed', true); } } catch { showMessage('Error', true); } finally { setSavingGreeting(false); } };
  const handleResetGreeting = () => { if (!client?.business_name) return; setGreetingMessage(`Hi, you've reached ${client.business_name}. This call may be recorded for quality and training purposes. How can I help you today?`); };
  const handleTestCall = () => { if (client?.vapi_phone_number) window.location.href = `tel:${client.vapi_phone_number}`; };
  const showMessage = (text: string, isError = false) => { setMessage(isError ? `❌ ${text}` : `✅ ${text}`); setTimeout(() => setMessage(''), 4000); };

  const getAllVoices = (): VoiceOption[] => [...(voices.female || []), ...(voices.male || [])];
  const getAvailableAccents = (): string[] => [...new Set(getAllVoices().map(v => v.accent))].sort();
  const getFilteredVoices = () => { let f: VoiceOption[]; if (voiceFilter === 'female') f = voices.female || []; else if (voiceFilter === 'male') f = voices.male || []; else f = getAllVoices(); if (accentFilter !== 'all') f = f.filter(v => v.accent === accentFilter); return f; };

  const hasVoiceChanges = selectedVoiceId !== currentVoiceId;
  const hasGreetingChanges = greetingMessage !== originalGreeting;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);
  const filteredVoices = getFilteredVoices();
  const availableAccents = getAvailableAccents();
  const isCalendarConnected = calendarStatus?.connected || client?.google_calendar_connected;
  const isCalendarPlanAllowed = calendarStatus?.plan_allowed !== false;

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)' };
  const inputStyle = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  const SectionCard = ({ icon: Icon, title, subtitle, live, children }: { icon: any; title: string; subtitle: string; live?: boolean; children: React.ReactNode }) => (
    <section className="mb-4 sm:mb-5">
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06) }}>
              <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm tracking-tight" style={{ color: theme.text }}>{title}</h3>
                {live && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.12 : 0.08), color: primaryColor }}>Live</span>}
              </div>
              <p className="text-[11px]" style={{ color: theme.textMuted4 }}>{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </section>
  );

  const SaveButton = ({ onClick, disabled, loading: btnLoading, label }: { onClick: () => void; disabled: boolean; loading: boolean; label: string }) => (
    <button onClick={onClick} disabled={disabled} className="w-full mt-3 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
      {btnLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {message && (
        <div className="mb-4 p-3 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto"
          style={message.includes('✅') ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` } : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}>
          {message}
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
          <button onClick={handleTestCall} disabled={!client?.vapi_phone_number}
            className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Test Your AI Agent</span>
          </button>
          <p className="text-center text-[11px] mt-1.5" style={{ color: theme.textMuted4 }}>Call your AI number to hear your settings in action</p>
        </section>

        {/* Google Calendar Integration */}
        <div className="fu fu2">
          <SectionCard icon={Calendar} title="Google Calendar" subtitle={isCalendarConnected ? 'Your AI can book appointments to your calendar' : 'Let your AI book appointments to your calendar'} live={!!isCalendarConnected}>
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
            ) : isCalendarConnected ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
                  <Check className="w-4 h-4" style={{ color: theme.success }} />
                  <p className="text-xs sm:text-sm font-medium" style={{ color: theme.successText }}>Calendar connected</p>
                </div>
                {calendarStatus && !calendarStatus.token_valid && (
                  <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                    <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>Calendar connection may have expired.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleConnectCalendar} className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Reconnect</button>
                  <button onClick={handleDisconnectCalendar} disabled={disconnectingCalendar} className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
                    {disconnectingCalendar ? (<span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</span>) : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleConnectCalendar} className="w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                <Calendar className="w-4 h-4 inline mr-1.5" />Connect Google Calendar
              </button>
            )}
          </SectionCard>
        </div>

        {/* Voice Selection */}
        <div className="fu fu2">
          {!isFeatureEnabled('custom_voice') ? (
            <SectionCard icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice"><UpgradePrompt feature="custom_voice" primaryColor={primaryColor} isDark={theme.isDark} /></SectionCard>
          ) : (
            <SectionCard icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice" live>
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
                  {(['all','female','male'] as const).map(f => (
                    <button key={f} onClick={() => setVoiceFilter(f)} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition"
                      style={{ backgroundColor: voiceFilter === f ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', color: voiceFilter === f ? theme.primaryText : theme.textMuted }}>
                      {f === 'all' ? `All (${totalVoices})` : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                {availableAccents.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <button onClick={() => setAccentFilter('all')} className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                      style={{ backgroundColor: accentFilter === 'all' ? hexToRgba(primaryColor, 0.12) : 'transparent', color: accentFilter === 'all' ? primaryColor : theme.textMuted, border: `1px solid ${accentFilter === 'all' ? hexToRgba(primaryColor, 0.25) : 'transparent'}` }}>
                      🌍 All
                    </button>
                    {availableAccents.map(a => { const flag = a === 'British' ? '🇬🇧' : a === 'American' ? '🇺🇸' : a === 'Australian' ? '🇦🇺' : '🌍'; return (
                      <button key={a} onClick={() => setAccentFilter(a)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                        style={{ backgroundColor: accentFilter === a ? hexToRgba(primaryColor, 0.12) : 'transparent', color: accentFilter === a ? primaryColor : theme.textMuted, border: `1px solid ${accentFilter === a ? hexToRgba(primaryColor, 0.25) : 'transparent'}` }}>
                        {flag} {a}
                      </button>
                    ); })}
                  </div>
                )}
                {filteredVoices.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredVoices.map(voice => { const sel = selectedVoiceId === voice.id; const cur = currentVoiceId === voice.id; const playing = playingVoiceId === voice.id; return (
                      <div key={voice.id} onClick={() => setSelectedVoiceId(voice.id)}
                        className="relative p-3 rounded-xl cursor-pointer transition-all"
                        style={{ ...glass, borderColor: sel ? primaryColor : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), borderWidth: '2px', backgroundColor: sel ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : glass.backgroundColor }}>
                        {cur && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-white text-[8px] font-bold rounded-full" style={{ backgroundColor: theme.success }}>CURRENT</span>}
                        {voice.recommended && !cur && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>★</span>}
                        <div className="flex items-start gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handlePlayPreview(voice); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                            style={{ backgroundColor: playing ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: playing ? theme.primaryText : theme.textMuted }}>
                            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-[13px] truncate" style={{ color: theme.text }}>{voice.name}</span>
                              {sel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />}
                            </div>
                            <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>{voice.accent} · {voice.style}</p>
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
                {hasVoiceChanges && <SaveButton onClick={handleSaveVoice} disabled={savingVoice} loading={savingVoice} label="Save Voice" />}
              </>)}
            </SectionCard>
          )}
        </div>

        {/* Greeting */}
        <div className="fu fu3">
          {!isFeatureEnabled('custom_greeting') ? (
            <SectionCard icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first"><UpgradePrompt feature="custom_greeting" primaryColor={primaryColor} isDark={theme.isDark} /></SectionCard>
          ) : (
            <SectionCard icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first" live>
              {greetingLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} /></div> : (<>
                <textarea value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} rows={3} maxLength={500}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition" style={inputStyle} placeholder="Hi, you've reached [Business Name]..." />
                <div className="flex items-center justify-between mt-2">
                  <button onClick={handleResetGreeting} className="flex items-center gap-1 text-[11px]" style={{ color: theme.textMuted4 }}><RotateCcw className="w-3 h-3" /> Reset</button>
                  <span className="text-[11px]" style={{ color: theme.textMuted4 }}>{greetingMessage.length}/500</span>
                </div>
                {hasGreetingChanges && <SaveButton onClick={handleSaveGreeting} disabled={savingGreeting || greetingMessage.length < 10} loading={savingGreeting} label="Save Greeting" />}
              </>)}
            </SectionCard>
          )}
        </div>

        {/* AI Behavior */}
        <div className="fu fu3">
          <div className="mb-4 sm:mb-5 rounded-2xl overflow-hidden" style={glass}>
            <div className="p-4 sm:p-5">
              <AISettingsSection clientId={client.id} theme={theme} />
            </div>
          </div>
        </div>

        {/* AI Tools */}
        <div className="fu fu4">
          <div className="mb-4 sm:mb-5 rounded-2xl overflow-hidden" style={glass}>
            <div className="p-4 sm:p-5">
              <ToolConfigSection clientId={client.id} theme={theme} />
            </div>
          </div>
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
    </div>
  );
}