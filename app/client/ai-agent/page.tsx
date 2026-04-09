'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, Loader2, Bot, Mic, MessageSquare, Clock, BookOpen, 
  Play, Pause, Check, ChevronDown, RotateCcw, Sparkles, AlertCircle,
  Plus, Trash2, Globe, Briefcase, HelpCircle, FileText
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import UpgradePrompt from '@/components/client/UpgradePrompt';

interface VoiceOption { id: string; name: string; gender: 'male' | 'female'; accent: string; style: string; description: string; previewUrl: string; recommended?: boolean; }
interface BusinessHours { monday: { open: string; close: string; closed: boolean }; tuesday: { open: string; close: string; closed: boolean }; wednesday: { open: string; close: string; closed: boolean }; thursday: { open: string; close: string; closed: boolean }; friday: { open: string; close: string; closed: boolean }; saturday: { open: string; close: string; closed: boolean }; sunday: { open: string; close: string; closed: boolean }; }
interface Service { id: string; name: string; price: string; description: string; }
interface FAQ { id: string; question: string; answer: string; }

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TIME_OPTIONS = [
  '6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM'
];

const formatDate = (d: string | null) => { if (!d) return 'Never'; return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); };

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}.fu4{animation-delay:160ms}`;

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

  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '9:00 AM', close: '5:00 PM', closed: false }, tuesday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    wednesday: { open: '9:00 AM', close: '5:00 PM', closed: false }, thursday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    friday: { open: '9:00 AM', close: '5:00 PM', closed: false }, saturday: { open: '10:00 AM', close: '2:00 PM', closed: false },
    sunday: { open: '9:00 AM', close: '5:00 PM', closed: true },
  });

  const [kbExpanded, setKbExpanded] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [savingKB, setSavingKB] = useState(false);
  const [kbLastUpdated, setKbLastUpdated] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [services, setServices] = useState<Service[]>([{ id: '1', name: '', price: '', description: '' }]);
  const [faqs, setFaqs] = useState<FAQ[]>([{ id: '1', question: '', answer: '' }]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => { if (client) { fetchVoices(); fetchCurrentVoice(); fetchGreeting(); fetchKnowledgeBase(); } }, [client]);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const fetchVoices = async () => { setVoicesLoading(true); setVoicesError(null); try { const r = await fetch(`${getBackendUrl()}/api/voices`); if (!r.ok) throw new Error('Failed'); const d = await r.json(); if (d.success && d.grouped) setVoices(d.grouped); else throw new Error('Invalid'); } catch (e: any) { setVoicesError(e.message); } finally { setVoicesLoading(false); } };
  const fetchCurrentVoice = async () => { if (!client) return; try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setCurrentVoiceId(d.voice_id); setSelectedVoiceId(d.voice_id); } } } catch {} };
  const fetchGreeting = async () => { if (!client) return; setGreetingLoading(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setGreetingMessage(d.greeting_message); setOriginalGreeting(d.greeting_message); } } } catch {} finally { setGreetingLoading(false); } };
  
  const fetchKnowledgeBase = async () => {
    if (!client) return; setKbLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/knowledge-base`, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.data) {
          setWebsite(d.websiteUrl || '');
          if (d.data.services) parseServices(d.data.services);
          if (d.data.faqs) parseFAQs(d.data.faqs);
          if (d.data.businessHours) parseBusinessHours(d.data.businessHours);
          setAdditionalInfo(d.data.additionalInfo || '');
          setKbLastUpdated(d.updated_at || null);
        }
      }
    } catch {} finally { setKbLoading(false); }
  };

  const parseServices = (t: string) => { const lines = t.split('\n').filter(l => l.trim()); const parsed: Service[] = []; lines.forEach((line, i) => { const clean = line.trim().replace(/^-\s*/, ''); if (!clean) return; const parts = clean.split(/\s+-\s+/); let name = '', price = '', desc: string[] = []; parts.forEach((p, j) => { const tr = p.trim(); if (j === 0) name = tr; else if (tr.startsWith('$')) price = tr; else if (tr) desc.push(tr); }); if (name) parsed.push({ id: `${i + 1}`, name, price, description: desc.join(' - ') }); }); setServices(parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }]); };
  const parseFAQs = (t: string) => { const parsed: FAQ[] = []; const lines = t.split('\n'); let q = '', a = ''; lines.forEach(l => { if (l.trim().startsWith('Q:')) { if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); q = l.replace(/^Q:\s*/i, '').trim(); a = ''; } else if (l.trim().startsWith('A:')) { a = l.replace(/^A:\s*/i, '').trim(); } }); if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); setFaqs(parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }]); };
  const parseBusinessHours = (t: string) => { const lines = t.split('\n'); const nh = { ...businessHours }; lines.forEach(l => { const lo = l.toLowerCase(); Object.keys(nh).forEach(day => { if (lo.includes(day)) { if (lo.includes('closed')) { nh[day as keyof BusinessHours].closed = true; } else { const m = l.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i); if (m) { nh[day as keyof BusinessHours].open = m[1]; nh[day as keyof BusinessHours].close = m[2]; nh[day as keyof BusinessHours].closed = false; } } } }); }); setBusinessHours(nh); };

  const formatServices = (): string => services.filter(s => s.name.trim()).map(s => { const p = [`- ${s.name}`]; if (s.price) p.push(s.price); if (s.description) p.push(s.description); return p.join(' - '); }).join('\n');
  const formatFAQs = (): string => faqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  const formatBusinessHoursForSave = (): string => ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => { const day = businessHours[d as keyof BusinessHours]; return day.closed ? `${d.charAt(0).toUpperCase() + d.slice(1)}: Closed` : `${d.charAt(0).toUpperCase() + d.slice(1)}: ${day.open} - ${day.close}`; }).join('\n');

  const handlePlayPreview = (voice: VoiceOption) => { if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); setPlayingVoiceId(null); return; } if (audioRef.current) audioRef.current.pause(); const audio = new Audio(voice.previewUrl); audioRef.current = audio; audio.onended = () => setPlayingVoiceId(null); audio.onerror = () => { setPlayingVoiceId(null); showMessage('Failed to play', true); }; audio.play(); setPlayingVoiceId(voice.id); };

  const handleSaveVoice = async () => { if (selectedVoiceId === currentVoiceId || !client) return; setSavingVoice(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/voice`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify({ voice_id: selectedVoiceId }) }); const d = await r.json(); if (d.success) { setCurrentVoiceId(selectedVoiceId); showMessage('Voice updated!'); } else { showMessage('Failed', true); setSelectedVoiceId(currentVoiceId); } } catch { showMessage('Error', true); setSelectedVoiceId(currentVoiceId); } finally { setSavingVoice(false); } };
  const handleSaveGreeting = async () => { if (greetingMessage === originalGreeting || !client) return; setSavingGreeting(true); try { const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/greeting`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify({ greeting_message: greetingMessage }) }); const d = await r.json(); if (d.success) { setOriginalGreeting(greetingMessage); showMessage('Greeting updated!'); } else { showMessage(d.error || 'Failed', true); } } catch { showMessage('Error', true); } finally { setSavingGreeting(false); } };
  const handleResetGreeting = () => { if (!client?.business_name) return; setGreetingMessage(`Hi, you've reached ${client.business_name}. This call may be recorded for quality and training purposes. How can I help you today?`); };
  const handleSaveBusinessHours = async () => { if (!client) return; setSavingHours(true); try { const r = await fetch(`${getBackendUrl()}/api/knowledge-base/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify({ clientId: client.id, businessHours: formatBusinessHoursForSave() }) }); const d = await r.json(); if (d.success) { showMessage('Hours updated!'); await fetchKnowledgeBase(); } else showMessage(d.error || 'Failed', true); } catch { showMessage('Error', true); } finally { setSavingHours(false); } };
  const handleSaveKnowledgeBase = async () => { if (!client) return; setSavingKB(true); try { const r = await fetch(`${getBackendUrl()}/api/knowledge-base/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify({ clientId: client.id, websiteUrl: website, businessHours: formatBusinessHoursForSave(), services: formatServices(), faqs: formatFAQs(), additionalInfo }) }); const d = await r.json(); if (d.success) { setKbLastUpdated(new Date().toISOString()); showMessage('Knowledge base updated!'); await fetchKnowledgeBase(); } else showMessage(d.error || 'Failed', true); } catch { showMessage('Error', true); } finally { setSavingKB(false); } };
  const handleTestCall = () => { if (client?.vapi_phone_number) window.location.href = `tel:${client.vapi_phone_number}`; };

  const showMessage = (text: string, isError = false) => { setMessage(isError ? `❌ ${text}` : `✅ ${text}`); setTimeout(() => setMessage(''), 3000); };

  const addService = () => setServices(p => [...p, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  const removeService = (id: string) => { if (services.length > 1) setServices(p => p.filter(s => s.id !== id)); };
  const updateService = (id: string, f: keyof Service, v: string) => setServices(p => p.map(s => s.id === id ? { ...s, [f]: v } : s));
  const addFAQ = () => setFaqs(p => [...p, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFAQ = (id: string) => { if (faqs.length > 1) setFaqs(p => p.filter(f => f.id !== id)); };
  const updateFAQ = (id: string, f: keyof FAQ, v: string) => setFaqs(p => p.map(fq => fq.id === id ? { ...fq, [f]: v } : fq));
  const updateBusinessHoursField = (day: keyof BusinessHours, field: 'open' | 'close' | 'closed', value: string | boolean) => { setBusinessHours(p => ({ ...p, [day]: { ...p[day], [field]: value } })); };

  const getAllVoices = (): VoiceOption[] => [...(voices.female || []), ...(voices.male || [])];
  const getAvailableAccents = (): string[] => [...new Set(getAllVoices().map(v => v.accent))].sort();
  const getFilteredVoices = () => { let f: VoiceOption[]; if (voiceFilter === 'female') f = voices.female || []; else if (voiceFilter === 'male') f = voices.male || []; else f = getAllVoices(); if (accentFilter !== 'all') f = f.filter(v => v.accent === accentFilter); return f; };
  const getHoursSummary = () => { const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']; const wd = days.slice(0,5); const same = wd.every(d => { const day = businessHours[d as keyof BusinessHours]; const m = businessHours.monday; return day.closed === m.closed && day.open === m.open && day.close === m.close; }); if (same && !businessHours.monday.closed) return [`M-F: ${businessHours.monday.open.replace(' ','')}-${businessHours.monday.close.replace(' ','')}`, businessHours.saturday.closed ? 'Sat: Closed' : `Sat: ${businessHours.saturday.open.replace(' ','')}-${businessHours.saturday.close.replace(' ','')}`, businessHours.sunday.closed ? 'Sun: Closed' : `Sun: ${businessHours.sunday.open.replace(' ','')}-${businessHours.sunday.close.replace(' ','')}`]; return days.map(d => { const day = businessHours[d as keyof BusinessHours]; const n = d.charAt(0).toUpperCase() + d.slice(1,3); return day.closed ? `${n}: Closed` : `${n}: ${day.open.replace(' ','')}-${day.close.replace(' ','')}`; }); };

  const hasVoiceChanges = selectedVoiceId !== currentVoiceId;
  const hasGreetingChanges = greetingMessage !== originalGreeting;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);
  const filteredVoices = getFilteredVoices();
  const availableAccents = getAvailableAccents();

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)' };
  const inputStyle = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  const SectionCard = ({ icon: Icon, title, subtitle, live, children, className = '' }: { icon: any; title: string; subtitle: string; live?: boolean; children: React.ReactNode; className?: string }) => (
    <section className={`mb-4 sm:mb-5 ${className}`}>
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
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Your AI Receptionist</h2>
        <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: theme.textMuted }}>Customize how your AI answers calls</p>
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Test Call */}
        <section className="mb-4 sm:mb-5 fu fu1">
          <button onClick={handleTestCall} disabled={!client?.vapi_phone_number}
            className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Test Your AI Receptionist</span>
          </button>
          <p className="text-center text-[11px] mt-1.5" style={{ color: theme.textMuted4 }}>Call your AI number to hear your settings in action</p>
        </section>

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

        {/* Business Hours */}
        <div className="fu fu3">
          {!isFeatureEnabled('business_hours') ? (
            <SectionCard icon={Clock} title="Business Hours" subtitle="When you're available"><UpgradePrompt feature="business_hours" primaryColor={primaryColor} isDark={theme.isDark} /></SectionCard>
          ) : (
            <SectionCard icon={Clock} title="Business Hours" subtitle="When you're available" live>
              <div onClick={() => setHoursExpanded(!hoursExpanded)} className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {getHoursSummary().slice(0,3).map((h,i) => <span key={i} className="px-2 py-1 rounded-lg text-[11px]" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', color: theme.textMuted }}>{h}</span>)}
                </div>
                <button className="flex items-center gap-1 text-[13px] font-medium ml-2 flex-shrink-0" style={{ color: primaryColor }}>
                  {hoursExpanded ? 'Hide' : 'Edit'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {hoursExpanded && (
                <div className="mt-4 space-y-2">
                  {(Object.keys(businessHours) as Array<keyof BusinessHours>).map(day => (
                    <div key={day} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                      <span className="w-10 sm:w-14 text-[11px] font-medium capitalize" style={{ color: theme.textMuted }}>{day.slice(0,3)}</span>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={businessHours[day].closed} onChange={(e) => updateBusinessHoursField(day, 'closed', e.target.checked)} className="w-3.5 h-3.5 rounded" /><span className="text-[11px]" style={{ color: theme.textMuted }}>Closed</span></label>
                      {!businessHours[day].closed && (
                        <div className="flex items-center gap-1 ml-auto">
                          <select value={businessHours[day].open} onChange={(e) => updateBusinessHoursField(day, 'open', e.target.value)} className="px-2 py-1 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                          <span className="text-[10px]" style={{ color: theme.textMuted4 }}>–</span>
                          <select value={businessHours[day].close} onChange={(e) => updateBusinessHoursField(day, 'close', e.target.value)} className="px-2 py-1 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                        </div>
                      )}
                    </div>
                  ))}
                  <SaveButton onClick={handleSaveBusinessHours} disabled={savingHours} loading={savingHours} label="Save Hours" />
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* Knowledge Base */}
        <div className="fu fu4">
          {!isFeatureEnabled('knowledge_base') ? (
            <SectionCard icon={BookOpen} title="Knowledge Base" subtitle="Teach your AI about your business"><UpgradePrompt feature="knowledge_base" primaryColor={primaryColor} isDark={theme.isDark} /></SectionCard>
          ) : (
            <SectionCard icon={BookOpen} title="Knowledge Base" subtitle="Teach your AI about your business" live>
              <div onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center justify-between cursor-pointer group">
                <div className="text-[13px]" style={{ color: theme.textMuted }}>Updated: {formatDate(kbLastUpdated)}</div>
                <button className="flex items-center gap-1 text-[13px] font-medium" style={{ color: primaryColor }}>
                  {kbExpanded ? 'Hide' : 'Edit'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {kbExpanded && (
                <div className="mt-4 space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><Globe className="w-4 h-4" style={{ color: primaryColor }} /> Website</label>
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><Briefcase className="w-4 h-4" style={{ color: primaryColor }} /> Services & Pricing</label>
                    <div className="space-y-2">
                      {services.map(s => (
                        <div key={s.id} className="p-3 rounded-xl space-y-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                          <div className="flex gap-2">
                            <input type="text" value={s.name} onChange={(e) => updateService(s.id, 'name', e.target.value)} placeholder="Service name" className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none min-w-0" style={inputStyle} />
                            <input type="text" value={s.price} onChange={(e) => updateService(s.id, 'price', e.target.value)} placeholder="$100" className="w-20 px-3 py-2 text-sm rounded-lg focus:outline-none" style={inputStyle} />
                            <button onClick={() => removeService(s.id)} disabled={services.length === 1} className="p-2 disabled:opacity-30" style={{ color: theme.textMuted4 }}><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <textarea value={s.description} onChange={(e) => updateService(s.id, 'description', e.target.value)} placeholder="Brief description..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none resize-none" style={inputStyle} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addService} className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl transition" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) }}><Plus className="w-4 h-4" /> Add Service</button>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><HelpCircle className="w-4 h-4" style={{ color: primaryColor }} /> FAQs</label>
                    <div className="space-y-2">
                      {faqs.map(f => (
                        <div key={f.id} className="p-3 rounded-xl space-y-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                          <div className="flex gap-2">
                            <input type="text" value={f.question} onChange={(e) => updateFAQ(f.id, 'question', e.target.value)} placeholder="Question..." className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none min-w-0" style={inputStyle} />
                            <button onClick={() => removeFAQ(f.id)} disabled={faqs.length === 1} className="p-2 disabled:opacity-30" style={{ color: theme.textMuted4 }}><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <textarea value={f.answer} onChange={(e) => updateFAQ(f.id, 'answer', e.target.value)} placeholder="Answer..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none resize-none" style={inputStyle} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addFAQ} className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl transition" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) }}><Plus className="w-4 h-4" /> Add FAQ</button>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><FileText className="w-4 h-4" style={{ color: primaryColor }} /> Additional Info</label>
                    <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Policies, service areas, payment methods..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} />
                  </div>
                  <SaveButton onClick={handleSaveKnowledgeBase} disabled={savingKB} loading={savingKB} label="Update AI Knowledge" />
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* Tip */}
        <div className="rounded-2xl p-4 fu fu4" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.06 : 0.03), border: `1px solid ${hexToRgba(primaryColor, 0.12)}` }}>
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <h4 className="font-semibold text-[13px] mb-0.5" style={{ color: primaryColor }}>Pro Tip</h4>
              <p className="text-xs" style={{ color: theme.textMuted }}>After changes, tap "Test Your AI" to hear them in action!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}