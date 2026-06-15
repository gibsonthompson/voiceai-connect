'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, Briefcase, HelpCircle, Users, Mic, Rocket,
  ChevronRight, ChevronLeft, Loader2, Phone, Play, Pause,
  Check, Plus, Trash2, Copy, CheckCircle, Sparkles, ArrowRight,
  RotateCcw, Globe, FileText, X, Smartphone, UserPlus
} from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';
import StaffMembersSection from './StaffMembersSection';
import ClientServicesSection from './ClientServicesSection';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface BusinessHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

interface FAQ { id: string; question: string; answer: string; }
interface VoiceOption { id: string; name: string; gender: string; accent: string; style: string; previewUrl: string; recommended?: boolean; }

const STEP_META = [
  { key: 'welcome', label: 'Welcome', icon: Sparkles },
  { key: 'hours', label: 'Hours', icon: Clock },
  { key: 'services', label: 'Services', icon: Briefcase },
  { key: 'faqs', label: 'Knowledge', icon: HelpCircle },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'voice', label: 'Voice', icon: Mic },
  { key: 'golive', label: 'Go Live', icon: Rocket },
];

const TIME_OPTIONS = [
  '6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM',
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM',
  '9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM',
];

const DEFAULT_HOURS: BusinessHours = {
  monday:    { open: '9:00 AM', close: '5:00 PM', closed: false },
  tuesday:   { open: '9:00 AM', close: '5:00 PM', closed: false },
  wednesday: { open: '9:00 AM', close: '5:00 PM', closed: false },
  thursday:  { open: '9:00 AM', close: '5:00 PM', closed: false },
  friday:    { open: '9:00 AM', close: '5:00 PM', closed: false },
  saturday:  { open: '10:00 AM', close: '2:00 PM', closed: false },
  sunday:    { open: '9:00 AM', close: '5:00 PM', closed: true },
};

const DAY_NAMES = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
};

// ============================================================================
// INDUSTRY FAQ TEMPLATES — reduces blank-page paralysis
// ============================================================================
const INDUSTRY_FAQ_TEMPLATES: Record<string, { q: string; a: string }[]> = {
  dental: [
    { q: 'What insurance do you accept?', a: '' },
    { q: 'Do you offer emergency appointments?', a: '' },
    { q: 'How much is a dental cleaning?', a: '' },
  ],
  medical: [
    { q: 'Are you accepting new patients?', a: '' },
    { q: 'What insurance plans do you accept?', a: '' },
    { q: 'How do I request a prescription refill?', a: '' },
  ],
  home_services: [
    { q: 'Do you offer free estimates?', a: '' },
    { q: 'What areas do you serve?', a: '' },
    { q: 'Are you licensed and insured?', a: '' },
  ],
  legal: [
    { q: 'Do you offer free consultations?', a: '' },
    { q: 'What types of cases do you handle?', a: '' },
    { q: 'What are your hourly rates?', a: '' },
  ],
  salon_spa: [
    { q: 'What are your prices?', a: '' },
    { q: 'Do you accept walk-ins?', a: '' },
    { q: 'What products do you use?', a: '' },
  ],
  restaurant: [
    { q: 'Do you take reservations?', a: '' },
    { q: 'Do you offer catering?', a: '' },
    { q: 'Do you have a gluten-free menu?', a: '' },
  ],
  real_estate: [
    { q: 'What areas do you cover?', a: '' },
    { q: 'Do you work with first-time buyers?', a: '' },
    { q: 'What is your commission structure?', a: '' },
  ],
  automotive: [
    { q: 'Do you offer free estimates?', a: '' },
    { q: 'What brands do you work on?', a: '' },
    { q: 'Do you offer loaner vehicles?', a: '' },
  ],
  fitness: [
    { q: 'Do you offer a free trial?', a: '' },
    { q: 'What are your membership options?', a: '' },
    { q: 'Do you have personal trainers?', a: '' },
  ],
  financial: [
    { q: 'Do you offer free consultations?', a: '' },
    { q: 'What services do you provide?', a: '' },
    { q: 'Are you a fiduciary?', a: '' },
  ],
};
const DEFAULT_FAQ_TEMPLATE = [
  { q: 'What are your hours?', a: '' },
  { q: 'What services do you offer?', a: '' },
  { q: 'How much do you charge?', a: '' },
];

// ============================================================================
// HELPERS
// ============================================================================

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(59,130,246,${alpha})`; }
}

/** Convert "9:00 AM" → "09:00" (24h) for checkBusinessHours in config builder */
function convertTo24h(time12h: string): string {
  const parts = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!parts) return '09:00';
  let hours = parseInt(parts[1], 10);
  const minutes = parts[2];
  const period = parts[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/** Build text representation for knowledge_base_data.businessHours */
function formatHoursText(hours: BusinessHours): string {
  return DAY_NAMES.map(d => {
    const day = hours[d];
    const label = d.charAt(0).toUpperCase() + d.slice(1);
    return day.closed ? `${label}: Closed` : `${label}: ${day.open} - ${day.close}`;
  }).join('\n');
}

/** Build JSONB for client.business_hours (24h format for checkBusinessHours) */
function formatHoursJSON(hours: BusinessHours): Record<string, any> {
  const result: Record<string, any> = {};
  DAY_NAMES.forEach(d => {
    const day = hours[d];
    if (day.closed) {
      result[d] = { open: null, close: null };
    } else {
      result[d] = { open: convertTo24h(day.open), close: convertTo24h(day.close) };
    }
  });
  return result;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1'))
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

// ============================================================================
// ANIMATIONS
// ============================================================================
const ANIM_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
.ob-fu{animation:fadeUp .5s ease-out both}
.ob-fi{animation:fadeIn .4s ease-out both}
.ob-si{animation:scaleIn .4s ease-out both}
.ob-d1{animation-delay:60ms}.ob-d2{animation-delay:120ms}.ob-d3{animation-delay:180ms}
.ob-d4{animation-delay:240ms}.ob-d5{animation-delay:300ms}
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  client: any;
  onComplete: () => void;
}

export default function OnboardingWizard({ client, onComplete }: Props) {
  const theme = useClientTheme();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Step 1: Business Hours ──────────────────────────────────────────
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [hoursLoaded, setHoursLoaded] = useState(false);

  // ── Step 3: Knowledge Base ──────────────────────────────────────────
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [kbLoaded, setKbLoaded] = useState(false);

  // ── Step 5: Voice & Greeting ────────────────────────────────────────
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [currentVoiceId, setCurrentVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [greeting, setGreeting] = useState('');
  const [originalGreeting, setOriginalGreeting] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Step 5 continued ─────────────────────────────────────────────────
  const [showAllVoices, setShowAllVoices] = useState(false);

  // ── Go Live ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const getToken = () => localStorage.getItem('auth_token');
  const totalSteps = STEP_META.length;

  // ── Scroll to top on step change ────────────────────────────────────
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // ── Cleanup audio on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  // ── Load existing data on mount ─────────────────────────────────────
  useEffect(() => { loadExistingHours(); }, []);
  useEffect(() => { loadExistingKB(); }, []);
  useEffect(() => { loadVoicesAndGreeting(); }, []);

  // ====================================================================
  // DATA LOADING
  // ====================================================================

  const loadExistingHours = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/client/${client.id}/knowledge-base`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.businessHours) {
          parseHoursFromText(data.data.businessHours);
        }
      }
    } catch {} finally { setHoursLoaded(true); }
  };

  const parseHoursFromText = (text: string) => {
    const lines = text.split('\n');
    const h = { ...DEFAULT_HOURS };
    lines.forEach(l => {
      const lo = l.toLowerCase();
      DAY_NAMES.forEach(day => {
        if (lo.includes(day)) {
          if (lo.includes('closed')) {
            h[day] = { ...h[day], closed: true };
          } else {
            const m = l.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
            if (m) h[day] = { open: m[1], close: m[2], closed: false };
          }
        }
      });
    });
    setHours(h);
  };

  const loadExistingKB = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/client/${client.id}/knowledge-base`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebsiteUrl(data.websiteUrl || '');
        setAdditionalInfo(data.data?.additionalInfo || '');
        if (data.data?.faqs) {
          parseFaqsFromText(data.data.faqs);
        } else {
          // Pre-fill with industry templates
          const templates = INDUSTRY_FAQ_TEMPLATES[client.industry] || DEFAULT_FAQ_TEMPLATE;
          setFaqs(templates.map((t, i) => ({ id: `t${i}`, question: t.q, answer: t.a })));
        }
      }
    } catch {
      const templates = INDUSTRY_FAQ_TEMPLATES[client.industry] || DEFAULT_FAQ_TEMPLATE;
      setFaqs(templates.map((t, i) => ({ id: `t${i}`, question: t.q, answer: t.a })));
    } finally { setKbLoaded(true); }
  };

  const parseFaqsFromText = (text: string) => {
    const parsed: FAQ[] = [];
    const lines = text.split('\n');
    let q = '', a = '';
    lines.forEach(l => {
      if (l.trim().startsWith('Q:')) {
        if (q && a) parsed.push({ id: `${parsed.length}`, question: q, answer: a });
        q = l.replace(/^Q:\s*/i, '').trim(); a = '';
      } else if (l.trim().startsWith('A:')) {
        a = l.replace(/^A:\s*/i, '').trim();
      }
    });
    if (q && a) parsed.push({ id: `${parsed.length}`, question: q, answer: a });

    if (parsed.length > 0) {
      setFaqs(parsed);
    } else {
      const templates = INDUSTRY_FAQ_TEMPLATES[client.industry] || DEFAULT_FAQ_TEMPLATE;
      setFaqs(templates.map((t, i) => ({ id: `t${i}`, question: t.q, answer: t.a })));
    }
  };

  const loadVoicesAndGreeting = async () => {
    try {
      // Voices
      const vRes = await fetch(`${backendUrl}/api/voices`);
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.success && vData.grouped) {
          const all = [...(vData.grouped.female || []), ...(vData.grouped.male || [])];
          setVoices(all);
        }
      }
      // Current voice
      const cvRes = await fetch(`${backendUrl}/api/client/${client.id}/voice`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (cvRes.ok) {
        const cvData = await cvRes.json();
        if (cvData.voice_id) { setCurrentVoiceId(cvData.voice_id); setSelectedVoiceId(cvData.voice_id); }
      }
      // Greeting
      const gRes = await fetch(`${backendUrl}/api/client/${client.id}/greeting`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        setGreeting(gData.greeting_message || '');
        setOriginalGreeting(gData.greeting_message || '');
      }
    } catch {} finally { setVoicesLoaded(true); }
  };

  // ====================================================================
  // SAVE FUNCTIONS
  // ====================================================================

  const saveHours = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      // Primary: structured JSONB to client.business_hours (for checkBusinessHours).
      // This is the source of truth, so a non-2xx here is a real failure.
      const hoursRes = await fetch(`${backendUrl}/api/client/${client.id}/business-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ business_hours: formatHoursJSON(hours) }),
      });
      if (!hoursRes.ok) throw new Error(`business-hours save failed (${hoursRes.status})`);

      // Secondary: text mirror to knowledge_base_data.businessHours for the KB tool.
      // Non-fatal: the hours themselves are already saved above, so a hiccup here
      // should not block the step or lose the user's input.
      try {
        await fetch(`${backendUrl}/api/knowledge-base/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ clientId: client.id, businessHours: formatHoursText(hours) }),
        });
      } catch (kbErr) {
        console.error('Hours KB mirror failed (non-fatal):', kbErr);
      }

      setCompletedSteps(prev => [...prev.filter(s => s !== 'hours'), 'hours']);
      return true;
    } catch (e) {
      console.error('Save hours failed:', e);
      setSaveError("We couldn't save your business hours. Check your connection and try again.");
      return false;
    } finally { setSaving(false); }
  };

  const saveKB = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      const faqText = faqs
        .filter(f => f.question.trim() && f.answer.trim())
        .map(f => `Q: ${f.question}\nA: ${f.answer}`)
        .join('\n\n');
      const res = await fetch(`${backendUrl}/api/knowledge-base/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          clientId: client.id,
          websiteUrl: websiteUrl,
          faqs: faqText,
          additionalInfo: additionalInfo,
        }),
      });
      if (!res.ok) throw new Error(`knowledge-base save failed (${res.status})`);
      setCompletedSteps(prev => [...prev.filter(s => s !== 'faqs'), 'faqs']);
      return true;
    } catch (e) {
      console.error('Save KB failed:', e);
      setSaveError("We couldn't save your knowledge base. Check your connection and try again.");
      return false;
    } finally { setSaving(false); }
  };

  const saveVoiceAndGreeting = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      if (selectedVoiceId && selectedVoiceId !== currentVoiceId) {
        const vRes = await fetch(`${backendUrl}/api/client/${client.id}/voice`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ voice_id: selectedVoiceId }),
        });
        if (!vRes.ok) throw new Error(`voice save failed (${vRes.status})`);
        setCurrentVoiceId(selectedVoiceId);
      }
      if (greeting && greeting !== originalGreeting) {
        const gRes = await fetch(`${backendUrl}/api/client/${client.id}/greeting`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ greeting_message: greeting }),
        });
        if (!gRes.ok) throw new Error(`greeting save failed (${gRes.status})`);
        setOriginalGreeting(greeting);
      }
      setCompletedSteps(prev => [...prev.filter(s => s !== 'voice'), 'voice']);
      return true;
    } catch (e) {
      console.error('Save voice/greeting failed:', e);
      setSaveError("We couldn't save your voice and greeting. Check your connection and try again.");
      return false;
    } finally { setSaving(false); }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/client/${client.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      if (!res.ok) throw new Error('Failed to complete onboarding');
      // Update localStorage cache
      try {
        const cached = localStorage.getItem('client');
        if (cached) {
          const p = JSON.parse(cached);
          p.onboarding_completed = true;
          localStorage.setItem('client', JSON.stringify(p));
        }
      } catch {}
      onComplete();
    } catch (e) { console.error('Complete onboarding failed:', e); }
    finally { setSaving(false); }
  };

  // ====================================================================
  // NAVIGATION
  // ====================================================================

  const handleNext = async () => {
    // Save current step data before advancing. If a save fails, stay on the
    // step so the user can fix it, the inline error is already shown.
    if (step === 1) { if (!(await saveHours())) return; }
    else if (step === 3) { if (!(await saveKB())) return; }
    else if (step === 5) { if (!(await saveVoiceAndGreeting())) return; }
    // Steps 2 (services) and 4 (staff) save via their own components
    if (step === 2) setCompletedSteps(prev => [...prev.filter(s => s !== 'services'), 'services']);
    if (step === 4) setCompletedSteps(prev => [...prev.filter(s => s !== 'staff'), 'staff']);

    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => { setSaveError(null); if (step > 0) setStep(step - 1); };

  const handleSkip = () => {
    setSaveError(null);
    const key = STEP_META[step]?.key;
    if (key) setSkippedSteps(prev => [...prev.filter(s => s !== key), key]);
    if (step < totalSteps - 1) setStep(step + 1);
  };

  // ====================================================================
  // VOICE PLAYBACK
  // ====================================================================

  const handlePlayVoice = (voice: VoiceOption) => {
    if (playingVoiceId === voice.id && audioRef.current) {
      audioRef.current.pause(); setPlayingVoiceId(null); return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => setPlayingVoiceId(null);
    audio.play();
    setPlayingVoiceId(voice.id);
  };

  // ====================================================================
  // SHARED STYLES
  // ====================================================================

  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  };
  const inputStyle = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
    color: theme.text,
  };

  // ====================================================================
  // STEP RENDERERS
  // ====================================================================

  // ── STEP 0: WELCOME ─────────────────────────────────────────────────
  const renderWelcome = () => (
    <div className="text-center max-w-md mx-auto ob-fu">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 ob-si"
        style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06) }}>
        <Sparkles className="w-8 h-8" style={{ color: theme.primary }} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>
        Let&apos;s set up your AI
      </h1>
      <p className="text-sm sm:text-base mb-8" style={{ color: theme.textMuted }}>
        {client.business_name} has a phone number and an AI receptionist. Now let&apos;s teach it about your business so it sounds like it actually works there.
      </p>
      <div className="space-y-3 text-left mb-8">
        {[
          { icon: Clock, text: 'Set your business hours' },
          { icon: Briefcase, text: 'Add the services you offer' },
          { icon: HelpCircle, text: 'Answer common caller questions' },
          { icon: Users, text: 'Add your team (optional)' },
          { icon: Mic, text: 'Pick your AI\'s voice' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 ob-fu ob-d${i + 1}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.05) }}>
              <item.icon className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <span className="text-sm" style={{ color: theme.text }}>{item.text}</span>
          </div>
        ))}
      </div>
      <p className="text-xs mb-6" style={{ color: theme.textMuted }}>
        Takes about 3 minutes · Skip anything and come back later
      </p>
      <button onClick={() => setStep(1)}
        className="w-full py-4 rounded-2xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
        Let&apos;s Go <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  // ── STEP 1: BUSINESS HOURS ──────────────────────────────────────────
  const renderHours = () => {
    const applyWeekdays = () => {
      const mon = hours.monday;
      setHours(prev => ({
        ...prev,
        tuesday: { ...mon }, wednesday: { ...mon }, thursday: { ...mon }, friday: { ...mon },
      }));
    };

    return (
      <div className="max-w-lg mx-auto ob-fu">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: theme.text }}>
          When are you open?
        </h2>
        <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
          Your AI uses this to know when to take messages vs offer appointments.
        </p>

        <div className="space-y-2 mb-4">
          {DAY_NAMES.map(day => (
            <div key={day} className="flex items-center gap-2 p-2.5 rounded-xl ob-fu" style={glass}>
              <span className="w-10 text-xs font-semibold" style={{ color: theme.textMuted }}>
                {DAY_LABELS[day]}
              </span>
              <label className="flex items-center gap-1.5 flex-shrink-0">
                <input type="checkbox" checked={hours[day].closed}
                  onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                  className="w-3.5 h-3.5 rounded" />
                <span className="text-[11px]" style={{ color: theme.textMuted }}>Closed</span>
              </label>
              {!hours[day].closed && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <select value={hours[day].open}
                    onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                    className="px-2 py-1.5 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>–</span>
                  <select value={hours[day].close}
                    onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                    className="px-2 py-1.5 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={applyWeekdays}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
          style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04) }}>
          Apply Monday&apos;s hours to all weekdays
        </button>
      </div>
    );
  };

  // ── STEP 2: SERVICES ────────────────────────────────────────────────
  const renderServices = () => (
    <div className="max-w-lg mx-auto ob-fu">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: theme.text }}>
        What do you offer?
      </h2>
      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        Add your services so the AI can tell callers what you do and book the right appointment length.
      </p>
      <ClientServicesSection clientId={client.id} theme={theme} compact industry={client.industry} />
    </div>
  );

  // ── STEP 3: FAQS / KNOWLEDGE BASE ──────────────────────────────────
  const renderFAQs = () => {
    const addFaq = () => setFaqs(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
    const removeFaq = (id: string) => { if (faqs.length > 1) setFaqs(prev => prev.filter(f => f.id !== id)); };
    const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };
    const useSuggested = () => {
      const templates = INDUSTRY_FAQ_TEMPLATES[client.industry] || DEFAULT_FAQ_TEMPLATE;
      setFaqs(templates.map((t, i) => ({ id: `s${i}`, question: t.q, answer: t.a })));
    };

    return (
      <div className="max-w-lg mx-auto ob-fu">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: theme.text }}>
          What do callers ask?
        </h2>
        <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
          Teach your AI how to answer the questions you hear every day. Fill in the answers — the questions are pre-suggested for your industry.
        </p>

        {/* FAQs */}
        <div className="space-y-3 mb-4">
          {faqs.map((faq, idx) => (
            <div key={faq.id} className={`rounded-xl p-3 space-y-2 ob-fu ob-d${Math.min(idx + 1, 5)}`} style={glass}>
              <div className="flex gap-2">
                <input type="text" value={faq.question} placeholder="What do callers ask?"
                  onChange={e => updateFaq(faq.id, 'question', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none min-w-0" style={inputStyle} />
                <button onClick={() => removeFaq(faq.id)} disabled={faqs.length <= 1}
                  className="p-2 disabled:opacity-30" style={{ color: theme.textMuted }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea value={faq.answer} placeholder="Your answer..."
                onChange={e => updateFaq(faq.id, 'answer', e.target.value)}
                rows={2} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none resize-none" style={inputStyle} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button onClick={addFaq}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition"
            style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04) }}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </button>
          <button onClick={useSuggested}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition"
            style={{ color: theme.textMuted }}>
            <RotateCcw className="w-3.5 h-3.5" /> Use Suggestions
          </button>
        </div>

        {/* Additional Info */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: theme.text }}>
            <FileText className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            Anything else your AI should know?
          </label>
          <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
            placeholder="Payment methods, cancellation policy, parking info, service area details..."
            rows={3} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} />
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: theme.text }}>
            <Globe className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            Website (optional)
          </label>
          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://yourbusiness.com"
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
        </div>
      </div>
    );
  };

  // ── STEP 4: STAFF ───────────────────────────────────────────────────
  const renderStaff = () => (
    <div className="max-w-lg mx-auto ob-fu">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: theme.text }}>
        Who&apos;s on your team?
      </h2>
      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        Add staff so the AI can say &ldquo;Let me connect you with Dr. Smith&rdquo; instead of just &ldquo;someone will call you back.&rdquo;
      </p>
      <StaffMembersSection clientId={client.id} theme={theme} compact industry={client.industry} />
    </div>
  );

  // ── STEP 5: VOICE & GREETING ────────────────────────────────────────
  const renderVoice = () => {
    const recommended = voices.filter(v => v.recommended);
    const others = voices.filter(v => !v.recommended);
    const displayVoices = showAllVoices ? voices : recommended.length > 0 ? recommended : voices.slice(0, 6);

    const resetGreeting = () => {
      setGreeting(`Hi, you've reached ${client.business_name}. This call may be recorded for quality and training purposes. How can I help you today?`);
    };

    return (
      <div className="max-w-lg mx-auto ob-fu">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: theme.text }}>
          How should your AI sound?
        </h2>
        <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
          Pick a voice and customize the opening greeting. This is what callers hear first.
        </p>

        {/* Voice Selection */}
        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: theme.textMuted }}>
          Voice
        </label>
        {!voicesLoaded ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {displayVoices.map(voice => {
                const sel = selectedVoiceId === voice.id;
                const playing = playingVoiceId === voice.id;
                return (
                  <div key={voice.id} onClick={() => setSelectedVoiceId(voice.id)}
                    className="relative p-3 rounded-xl cursor-pointer transition-all"
                    style={{ ...glass,
                      borderColor: sel ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      borderWidth: '2px',
                      backgroundColor: sel ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04) : glass.backgroundColor,
                    }}>
                    <div className="flex items-start gap-2">
                      <button onClick={e => { e.stopPropagation(); handlePlayVoice(voice); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                        style={{ backgroundColor: playing ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                          color: playing ? theme.primaryText : theme.textMuted }}>
                        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[13px] truncate" style={{ color: theme.text }}>{voice.name}</span>
                          {sel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.primary }} />}
                        </div>
                        <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{voice.accent} · {voice.style}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!showAllVoices && others.length > 0 && (
              <button onClick={() => setShowAllVoices(true)}
                className="text-xs font-medium mb-4" style={{ color: theme.primary }}>
                Show all {voices.length} voices
              </button>
            )}
          </>
        )}

        {/* Greeting */}
        <label className="text-xs font-semibold uppercase tracking-wider mb-2 mt-6 block" style={{ color: theme.textMuted }}>
          Opening Greeting
        </label>
        <textarea value={greeting} onChange={e => setGreeting(e.target.value)}
          rows={3} maxLength={500}
          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none mb-2" style={inputStyle}
          placeholder="Hi, you've reached [Business Name]..." />
        <div className="flex items-center justify-between">
          <button onClick={resetGreeting}
            className="flex items-center gap-1 text-[11px]" style={{ color: theme.textMuted }}>
            <RotateCcw className="w-3 h-3" /> Reset to default
          </button>
          <span className="text-[11px]" style={{ color: theme.textMuted }}>{greeting.length}/500</span>
        </div>
      </div>
    );
  };

  // ── STEP 6: GO LIVE ─────────────────────────────────────────────────
  const renderGoLive = () => {
    const phoneFormatted = formatPhoneNumber(client.vapi_phone_number || '');
    const copyPhone = () => {
      if (client.vapi_phone_number) {
        navigator.clipboard.writeText(client.vapi_phone_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };
    const testCall = () => {
      if (client.vapi_phone_number) window.location.href = `tel:${client.vapi_phone_number}`;
    };

    // Summary of what was completed vs skipped
    const setupItems = [
      { key: 'hours', label: 'Business hours', done: completedSteps.includes('hours') },
      { key: 'services', label: 'Services', done: completedSteps.includes('services') },
      { key: 'faqs', label: 'Knowledge base', done: completedSteps.includes('faqs') },
      { key: 'staff', label: 'Staff directory', done: completedSteps.includes('staff') },
      { key: 'voice', label: 'Voice & greeting', done: completedSteps.includes('voice') },
    ];

    return (
      <div className="max-w-lg mx-auto text-center ob-fu">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 ob-si"
          style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06) }}>
          <Rocket className="w-8 h-8" style={{ color: theme.primary }} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>
          You&apos;re ready!
        </h2>
        <p className="text-sm mb-8" style={{ color: theme.textMuted }}>
          Your AI receptionist for {client.business_name} is set up and answering calls.
        </p>

        {/* Phone number */}
        {client.vapi_phone_number && (
          <div className="rounded-2xl p-5 mb-6 ob-fu ob-d1" style={{
            backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.04),
            border: `1px solid ${hexToRgba(theme.primary, 0.15)}`,
          }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
              Your AI Phone Number
            </p>
            <p className="text-3xl font-bold tracking-tight mb-3" style={{ color: theme.primary, fontVariantNumeric: 'tabular-nums' }}>
              {phoneFormatted}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={copyPhone}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition"
                style={glass}>
                {copied ? <Check className="w-4 h-4" style={{ color: theme.primary }} /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={testCall}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                <Phone className="w-4 h-4" /> Test Call
              </button>
            </div>
          </div>
        )}

        {/* Forwarding */}
        <div className="rounded-xl p-4 mb-6 text-left ob-fu ob-d2" style={glass}>
          <p className="text-xs font-semibold mb-2" style={{ color: theme.text }}>Forward your business calls</p>
          <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
            From your office phone, dial{' '}
            <span className="font-mono font-semibold px-1.5 py-0.5 rounded text-[11px]"
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.text }}>
              *72
            </span>
            {' '}followed by your AI number. All calls will now be answered by your AI receptionist.
          </p>
        </div>

        {/* Setup summary */}
        <div className="rounded-xl p-4 mb-6 text-left ob-fu ob-d3" style={glass}>
          <p className="text-xs font-semibold mb-3" style={{ color: theme.text }}>Setup Summary</p>
          <div className="space-y-2">
            {setupItems.map(item => (
              <div key={item.key} className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: theme.primary }} />
                ) : (
                  <div className="w-4 h-4 rounded-full border flex-shrink-0"
                    style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
                )}
                <span className="text-xs" style={{ color: item.done ? theme.text : theme.textMuted }}>
                  {item.label}
                  {!item.done && skippedSteps.includes(item.key) && (
                    <span className="ml-1" style={{ color: theme.textMuted }}> — skipped</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {skippedSteps.length > 0 && (
            <p className="text-[10px] mt-3" style={{ color: theme.textMuted }}>
              You can finish skipped steps anytime from My Business and AI Agent in the sidebar.
            </p>
          )}
        </div>

        {/* Complete */}
        <button onClick={completeOnboarding} disabled={saving}
          className="w-full py-4 rounded-2xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 ob-fu ob-d4"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {saving ? 'Finishing...' : 'Go to Dashboard'}
        </button>
      </div>
    );
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  const stepRenderers = [
    renderWelcome, renderHours, renderServices, renderFAQs,
    renderStaff, renderVoice, renderGoLive,
  ];

  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const showNav = step > 0 && step < totalSteps - 1;
  // Steps that can be skipped (not welcome, not go-live)
  const canSkip = step >= 1 && step <= 5;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* ── Progress Bar ──────────────────────────────────────────────── */}
      {step > 0 && step < totalSteps - 1 && (
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3"
          style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                Step {step} of {totalSteps - 2}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: theme.primary }}>
                {STEP_META[step]?.label}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((step) / (totalSteps - 2)) * 100}%`,
                  backgroundColor: theme.primary,
                }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          {stepRenderers[step]?.()}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      {showNav && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-4"
          style={{
            borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
          }}>
          <div className="max-w-2xl mx-auto">
            {saveError && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ backgroundColor: hexToRgba('#ef4444', 0.1), color: '#ef4444', border: `1px solid ${hexToRgba('#ef4444', 0.2)}` }}>
                <X className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <button onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ color: theme.textMuted }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-2">
                {canSkip && (
                  <button onClick={handleSkip}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ color: theme.textMuted }}>
                    Skip for now
                  </button>
                )}
                <button onClick={handleNext} disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Next'}
                  {!saving && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}