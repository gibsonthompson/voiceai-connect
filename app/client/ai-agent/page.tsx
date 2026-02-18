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

// ============================================================================
// TYPES
// ============================================================================
interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
  style: string;
  description: string;
  previewUrl: string;
  recommended?: boolean;
}

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// ============================================================================
// HELPERS
// ============================================================================
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ClientAIAgentPage() {
  const { client, branding, loading, isFeatureEnabled } = useClient();
  const theme = useClientTheme();
  const [message, setMessage] = useState('');

  const primaryColor = theme.primary;
  
  const [voices, setVoices] = useState<{ female: VoiceOption[]; male: VoiceOption[] }>({ female: [], male: [] });
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [savingVoice, setSavingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const [accentFilter, setAccentFilter] = useState<string>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [greetingMessage, setGreetingMessage] = useState('');
  const [originalGreeting, setOriginalGreeting] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [savingGreeting, setSavingGreeting] = useState(false);

  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    tuesday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    wednesday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    thursday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    friday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    saturday: { open: '10:00 AM', close: '2:00 PM', closed: false },
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

  useEffect(() => {
    if (client) {
      fetchVoices();
      fetchCurrentVoice();
      fetchGreeting();
      fetchKnowledgeBase();
    }
  }, [client]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const fetchVoices = async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/voices`);
      if (!response.ok) throw new Error('Failed to load voices');
      const data = await response.json();
      if (data.success && data.grouped) {
        setVoices(data.grouped);
      } else {
        throw new Error('Invalid voices response');
      }
    } catch (error) {
      setVoicesError(error instanceof Error ? error.message : 'Failed to load voices');
    } finally {
      setVoicesLoading(false);
    }
  };

  const fetchCurrentVoice = async () => {
    if (!client) return;
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/client/${client.id}/voice`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentVoiceId(data.voice_id);
          setSelectedVoiceId(data.voice_id);
        }
      }
    } catch (error) {
      console.error('Error fetching voice:', error);
    }
  };

  const fetchGreeting = async () => {
    if (!client) return;
    setGreetingLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/client/${client.id}/greeting`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGreetingMessage(data.greeting_message);
          setOriginalGreeting(data.greeting_message);
        }
      }
    } catch (error) {
      console.error('Error fetching greeting:', error);
    } finally {
      setGreetingLoading(false);
    }
  };

  const fetchKnowledgeBase = async () => {
    if (!client) return;
    setKbLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/client/${client.id}/knowledge-base`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWebsite(data.websiteUrl || '');
          if (data.data.services) parseServices(data.data.services);
          if (data.data.faqs) parseFAQs(data.data.faqs);
          if (data.data.businessHours) parseBusinessHours(data.data.businessHours);
          setAdditionalInfo(data.data.additionalInfo || '');
          setKbLastUpdated(data.updated_at || null);
        }
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setKbLoading(false);
    }
  };

  const parseServices = (servicesText: string) => {
    const lines = servicesText.split('\n').filter(l => l.trim());
    const parsed: Service[] = [];
    lines.forEach((line, index) => {
      const cleanLine = line.trim().replace(/^-\s*/, '');
      if (!cleanLine) return;
      const parts = cleanLine.split(/\s+-\s+/);
      let name = '', price = '', descParts: string[] = [];
      parts.forEach((part, i) => {
        const trimmed = part.trim();
        if (i === 0) name = trimmed;
        else if (trimmed.startsWith('$')) price = trimmed;
        else if (trimmed) descParts.push(trimmed);
      });
      if (name) parsed.push({ id: `${index + 1}`, name, price, description: descParts.join(' - ') });
    });
    setServices(parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }]);
  };

  const parseFAQs = (faqsText: string) => {
    const parsed: FAQ[] = [];
    const lines = faqsText.split('\n');
    let currentQ = '', currentA = '';
    lines.forEach(line => {
      if (line.trim().startsWith('Q:')) {
        if (currentQ && currentA) parsed.push({ id: `${parsed.length + 1}`, question: currentQ, answer: currentA });
        currentQ = line.replace(/^Q:\s*/i, '').trim();
        currentA = '';
      } else if (line.trim().startsWith('A:')) {
        currentA = line.replace(/^A:\s*/i, '').trim();
      }
    });
    if (currentQ && currentA) parsed.push({ id: `${parsed.length + 1}`, question: currentQ, answer: currentA });
    setFaqs(parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }]);
  };

  const parseBusinessHours = (hoursText: string) => {
    const lines = hoursText.split('\n');
    const newHours = { ...businessHours };
    lines.forEach(line => {
      const lower = line.toLowerCase();
      Object.keys(newHours).forEach(day => {
        if (lower.includes(day)) {
          if (lower.includes('closed')) {
            newHours[day as keyof BusinessHours].closed = true;
          } else {
            const timeMatch = line.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
            if (timeMatch) {
              newHours[day as keyof BusinessHours].open = timeMatch[1];
              newHours[day as keyof BusinessHours].close = timeMatch[2];
              newHours[day as keyof BusinessHours].closed = false;
            }
          }
        }
      });
    });
    setBusinessHours(newHours);
  };

  const formatServices = (): string => {
    return services.filter(s => s.name.trim()).map(s => {
      const parts = [`- ${s.name}`];
      if (s.price) parts.push(s.price);
      if (s.description) parts.push(s.description);
      return parts.join(' - ');
    }).join('\n');
  };

  const formatFAQs = (): string => {
    return faqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  };

  const formatBusinessHoursForSave = (): string => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(d => {
      const dayData = businessHours[d as keyof BusinessHours];
      const dayName = d.charAt(0).toUpperCase() + d.slice(1);
      return dayData.closed ? `${dayName}: Closed` : `${dayName}: ${dayData.open} - ${dayData.close}`;
    }).join('\n');
  };

  const handlePlayPreview = (voice: VoiceOption) => {
    if (playingVoiceId === voice.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => { setPlayingVoiceId(null); showMessage('Failed to play preview', true); };
    audio.play();
    setPlayingVoiceId(voice.id);
  };

  const handleSaveVoice = async () => {
    if (selectedVoiceId === currentVoiceId || !client) return;
    setSavingVoice(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/client/${client.id}/voice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ voice_id: selectedVoiceId }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentVoiceId(selectedVoiceId);
        showMessage('Voice updated!');
      } else {
        showMessage('Failed to update voice', true);
        setSelectedVoiceId(currentVoiceId);
      }
    } catch (error) {
      showMessage('Error updating voice', true);
      setSelectedVoiceId(currentVoiceId);
    } finally {
      setSavingVoice(false);
    }
  };

  const handleSaveGreeting = async () => {
    if (greetingMessage === originalGreeting || !client) return;
    setSavingGreeting(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/client/${client.id}/greeting`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ greeting_message: greetingMessage }),
      });
      const data = await response.json();
      if (data.success) {
        setOriginalGreeting(greetingMessage);
        showMessage('Greeting updated!');
      } else {
        showMessage(data.error || 'Failed to update greeting', true);
      }
    } catch (error) {
      showMessage('Error updating greeting', true);
    } finally {
      setSavingGreeting(false);
    }
  };

  const handleResetGreeting = () => {
    if (!client?.business_name) return;
    setGreetingMessage(`Hi, you've reached ${client.business_name}. This call may be recorded for quality and training purposes. How can I help you today?`);
  };

  const handleSaveBusinessHours = async () => {
    if (!client) return;
    setSavingHours(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/knowledge-base/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clientId: client.id, businessHours: formatBusinessHoursForSave() }),
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Business hours updated!');
        await fetchKnowledgeBase();
      } else {
        showMessage(data.error || 'Failed to update hours', true);
      }
    } catch (error) {
      showMessage('Error updating hours', true);
    } finally {
      setSavingHours(false);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!client) return;
    setSavingKB(true);
    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      const response = await fetch(`${backendUrl}/api/knowledge-base/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          clientId: client.id,
          websiteUrl: website,
          businessHours: formatBusinessHoursForSave(),
          services: formatServices(),
          faqs: formatFAQs(),
          additionalInfo,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setKbLastUpdated(new Date().toISOString());
        showMessage('Knowledge base updated!');
        await fetchKnowledgeBase();
      } else {
        showMessage(data.error || 'Failed to update', true);
      }
    } catch (error) {
      showMessage('Error updating knowledge base', true);
    } finally {
      setSavingKB(false);
    }
  };

  const handleTestCall = () => {
    if (client?.vapi_phone_number) window.location.href = `tel:${client.vapi_phone_number}`;
  };

  const showMessage = (text: string, isError = false) => {
    setMessage(isError ? `❌ ${text}` : `✅ ${text}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const addService = () => setServices(prev => [...prev, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  const removeService = (id: string) => { if (services.length > 1) setServices(prev => prev.filter(s => s.id !== id)); };
  const updateService = (id: string, field: keyof Service, value: string) => setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addFAQ = () => setFaqs(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFAQ = (id: string) => { if (faqs.length > 1) setFaqs(prev => prev.filter(f => f.id !== id)); };
  const updateFAQ = (id: string, field: keyof FAQ, value: string) => setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

  const updateBusinessHoursField = (day: keyof BusinessHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const getAllVoices = (): VoiceOption[] => [...(voices.female || []), ...(voices.male || [])];

  const getAvailableAccents = (): string[] => {
    const accents = [...new Set(getAllVoices().map(v => v.accent))];
    return accents.sort();
  };

  const getFilteredVoices = () => {
    let filtered: VoiceOption[];
    if (voiceFilter === 'female') filtered = voices.female || [];
    else if (voiceFilter === 'male') filtered = voices.male || [];
    else filtered = getAllVoices();
    if (accentFilter !== 'all') filtered = filtered.filter(v => v.accent === accentFilter);
    return filtered;
  };

  const getHoursSummary = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekdays = days.slice(0, 5);
    const allWeekdaysSame = weekdays.every(d => {
      const day = businessHours[d as keyof BusinessHours];
      const mon = businessHours.monday;
      return day.closed === mon.closed && day.open === mon.open && day.close === mon.close;
    });
    if (allWeekdaysSame && !businessHours.monday.closed) {
      return [
        `M-F: ${businessHours.monday.open.replace(' ', '')}-${businessHours.monday.close.replace(' ', '')}`,
        businessHours.saturday.closed ? 'Sat: Closed' : `Sat: ${businessHours.saturday.open.replace(' ', '')}-${businessHours.saturday.close.replace(' ', '')}`,
        businessHours.sunday.closed ? 'Sun: Closed' : `Sun: ${businessHours.sunday.open.replace(' ', '')}-${businessHours.sunday.close.replace(' ', '')}`
      ];
    }
    return days.map(d => {
      const day = businessHours[d as keyof BusinessHours];
      const name = d.charAt(0).toUpperCase() + d.slice(1, 3);
      return day.closed ? `${name}: Closed` : `${name}: ${day.open.replace(' ', '')}-${day.close.replace(' ', '')}`;
    });
  };

  const hasVoiceChanges = selectedVoiceId !== currentVoiceId;
  const hasGreetingChanges = greetingMessage !== originalGreeting;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);
  const filteredVoices = getFilteredVoices();
  const availableAccents = getAvailableAccents();

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
      </div>
    );
  }

  // Helper for section headers with feature gating
  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <div className="p-3 sm:p-4 border-b" style={{ borderColor: theme.border }}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.2 : 0.1) }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{title}</h3>
          <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const SectionHeaderLive = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <div className="p-3 sm:p-4 border-b" style={{ borderColor: theme.border }}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.2 : 0.1) }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{title}</h3>
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full uppercase" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.2 : 0.1), color: primaryColor }}>Live</span>
          </div>
          <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Status Message */}
      {message && (
        <div 
          className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto"
          style={message.includes('✅') 
            ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
            : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
          }
        >
          {message}
        </div>
      )}

      {/* Hero */}
      <div className="mb-4 sm:mb-6 text-center">
        <div 
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
          style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.2 : 0.1) }}
        >
          <Bot className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1" style={{ color: theme.text }}>
          Your AI Receptionist
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
          Customize how your AI answers calls
        </p>
      </div>

      {/* Content Container */}
      <div className="max-w-3xl mx-auto">
        {/* Test Your AI Button */}
        <section className="mb-4 sm:mb-6">
          <button
            onClick={handleTestCall}
            disabled={!client?.vapi_phone_number}
            className="w-full rounded-xl p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-3 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: primaryColor, color: theme.primaryText }}
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Test Your AI Receptionist</span>
          </button>
          <p className="text-center text-[10px] sm:text-xs mt-1.5 sm:mt-2" style={{ color: theme.textMuted4 }}>
            Call your AI number to hear your settings in action
          </p>
        </section>

        {/* Voice Selection */}
        <section className="mb-4 sm:mb-6">
          {!isFeatureEnabled('custom_voice') ? (
            <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
              <SectionHeader icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice" />
              <div className="p-4">
                <UpgradePrompt feature="custom_voice" primaryColor={primaryColor} isDark={theme.isDark} />
              </div>
            </div>
          ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <SectionHeaderLive icon={Mic} title="Voice Selection" subtitle="Choose your AI's voice" />
            <div className="p-3 sm:p-4">
              {voicesLoading && (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-xs sm:text-sm" style={{ color: theme.textMuted }}>Loading voices...</span>
                </div>
              )}

              {voicesError && !voicesLoading && (
                <div className="rounded-lg p-3 sm:p-4 text-center" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: theme.error }} />
                  <p className="text-xs sm:text-sm font-medium mb-2" style={{ color: theme.error }}>{voicesError}</p>
                  <button onClick={fetchVoices} className="text-xs sm:text-sm underline hover:no-underline" style={{ color: theme.error }}>Try again</button>
                </div>
              )}

              {!voicesLoading && !voicesError && totalVoices > 0 && (
                <>
                  {/* Gender Filter */}
                  <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    {(['all', 'female', 'male'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setVoiceFilter(filter)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition"
                        style={{
                          backgroundColor: voiceFilter === filter ? primaryColor : theme.bg,
                          color: voiceFilter === filter ? theme.primaryText : theme.textMuted,
                        }}
                      >
                        {filter === 'all' ? `All (${totalVoices})` : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Accent Filter */}
                  {availableAccents.length > 1 && (
                    <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <button
                        onClick={() => setAccentFilter('all')}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1"
                        style={{
                          backgroundColor: accentFilter === 'all' ? hexToRgba(primaryColor, theme.isDark ? 0.25 : 0.15) : theme.bg,
                          color: accentFilter === 'all' ? primaryColor : theme.textMuted,
                          border: accentFilter === 'all' ? `1px solid ${hexToRgba(primaryColor, 0.3)}` : '1px solid transparent',
                        }}
                      >
                        🌍 All Accents
                      </button>
                      {availableAccents.map((accent) => {
                        const flag = accent === 'British' ? '🇬🇧' : accent === 'American' ? '🇺🇸' : accent === 'Australian' ? '🇦🇺' : '🌍';
                        return (
                          <button
                            key={accent}
                            onClick={() => setAccentFilter(accent)}
                            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1"
                            style={{
                              backgroundColor: accentFilter === accent ? hexToRgba(primaryColor, theme.isDark ? 0.25 : 0.15) : theme.bg,
                              color: accentFilter === accent ? primaryColor : theme.textMuted,
                              border: accentFilter === accent ? `1px solid ${hexToRgba(primaryColor, 0.3)}` : '1px solid transparent',
                            }}
                          >
                            {flag} {accent}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Voice Grid */}
                  {filteredVoices.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {filteredVoices.map((voice) => {
                        const isSelected = selectedVoiceId === voice.id;
                        const isCurrent = currentVoiceId === voice.id;
                        const isPlaying = playingVoiceId === voice.id;
                        return (
                          <div
                            key={voice.id}
                            onClick={() => setSelectedVoiceId(voice.id)}
                            className="relative p-2 sm:p-3 rounded-xl border-2 cursor-pointer transition-all"
                            style={{ borderColor: isSelected ? primaryColor : theme.border, backgroundColor: isSelected ? hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.05) : theme.card }}
                          >
                            {isCurrent && (
                              <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-white text-[8px] sm:text-[9px] font-bold rounded-full" style={{ backgroundColor: theme.success }}>CURRENT</span>
                            )}
                            {voice.recommended && !isCurrent && (
                              <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-full" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>★</span>
                            )}
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePlayPreview(voice); }}
                                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
                                style={{ backgroundColor: isPlaying ? primaryColor : theme.bg, color: isPlaying ? theme.primaryText : theme.textMuted }}
                              >
                                {isPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: theme.text }}>{voice.name}</span>
                                  {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: primaryColor }} />}
                                </div>
                                <p className="text-[9px] sm:text-[10px] truncate" style={{ color: theme.textMuted4 }}>
                                  {voice.accent} · {voice.style}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-xs sm:text-sm" style={{ color: theme.textMuted4 }}>No voices match this filter</p>
                      <button onClick={() => { setVoiceFilter('all'); setAccentFilter('all'); }} className="mt-2 text-xs sm:text-sm font-medium hover:opacity-80 transition" style={{ color: primaryColor }}>Clear filters</button>
                    </div>
                  )}

                  {hasVoiceChanges && (
                    <button onClick={handleSaveVoice} disabled={savingVoice} className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                      {savingVoice ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Voice'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          )}
        </section>

        {/* Greeting Message */}
        <section className="mb-4 sm:mb-6">
          {!isFeatureEnabled('custom_greeting') ? (
            <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
              <SectionHeader icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first" />
              <div className="p-4">
                <UpgradePrompt feature="custom_greeting" primaryColor={primaryColor} isDark={theme.isDark} />
              </div>
            </div>
          ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <SectionHeaderLive icon={MessageSquare} title="Greeting Message" subtitle="What your AI says first" />
            <div className="p-3 sm:p-4">
              {greetingLoading ? (
                <div className="flex items-center justify-center py-4 sm:py-6">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-xs sm:text-sm" style={{ color: theme.textMuted }}>Loading...</span>
                </div>
              ) : (
                <>
                  <textarea
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                    placeholder="Hi, you've reached [Business Name]. How can I help you today?"
                  />
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                    <button onClick={handleResetGreeting} className="flex items-center gap-1 text-[10px] sm:text-xs hover:opacity-80 transition" style={{ color: theme.textMuted4 }}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                    <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>{greetingMessage.length}/500</span>
                  </div>
                  {hasGreetingChanges && (
                    <button onClick={handleSaveGreeting} disabled={savingGreeting || greetingMessage.length < 10} className="w-full mt-2 sm:mt-3 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                      {savingGreeting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Greeting'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          )}
        </section>

        {/* Business Hours */}
        <section className="mb-4 sm:mb-6">
          {!isFeatureEnabled('business_hours') ? (
            <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
              <SectionHeader icon={Clock} title="Business Hours" subtitle="When you're available" />
              <div className="p-4">
                <UpgradePrompt feature="business_hours" primaryColor={primaryColor} isDark={theme.isDark} />
              </div>
            </div>
          ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <SectionHeaderLive icon={Clock} title="Business Hours" subtitle="When you're available" />
            <div className="p-3 sm:p-4">
              <div onClick={() => setHoursExpanded(!hoursExpanded)} className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-wrap gap-1 sm:gap-2 flex-1 min-w-0">
                  {getHoursSummary().slice(0, 3).map((h, i) => (
                    <span key={i} className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>{h}</span>
                  ))}
                </div>
                <button className="flex items-center gap-1 text-xs sm:text-sm font-medium group-hover:opacity-80 ml-2 flex-shrink-0" style={{ color: primaryColor }}>
                  {hoursExpanded ? 'Hide' : 'Edit'}
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {hoursExpanded && (
                <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                  {(Object.keys(businessHours) as Array<keyof BusinessHours>).map(day => (
                    <div key={day} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: theme.bg }}>
                      <span className="w-10 sm:w-16 text-[10px] sm:text-xs font-medium capitalize" style={{ color: theme.textMuted }}>{day.slice(0, 3)}</span>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={businessHours[day].closed} onChange={(e) => updateBusinessHoursField(day, 'closed', e.target.checked)} className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded" />
                        <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Closed</span>
                      </label>
                      {!businessHours[day].closed && (
                        <div className="flex items-center gap-1 ml-auto">
                          <select value={businessHours[day].open} onChange={(e) => updateBusinessHoursField(day, 'open', e.target.value)} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border rounded focus:outline-none" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}>
                            {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                          <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>-</span>
                          <select value={businessHours[day].close} onChange={(e) => updateBusinessHoursField(day, 'close', e.target.value)} className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border rounded focus:outline-none" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}>
                            {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={handleSaveBusinessHours} disabled={savingHours} className="w-full mt-2 sm:mt-3 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition disabled:opacity-50" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                    {savingHours ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Sparkles className="w-4 h-4" /> Save Hours</>}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </section>

        {/* Knowledge Base */}
        <section className="mb-4 sm:mb-6">
          {!isFeatureEnabled('knowledge_base') ? (
            <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
              <SectionHeader icon={BookOpen} title="Knowledge Base" subtitle="Teach your AI about your business" />
              <div className="p-4">
                <UpgradePrompt feature="knowledge_base" primaryColor={primaryColor} isDark={theme.isDark} />
              </div>
            </div>
          ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <SectionHeaderLive icon={BookOpen} title="Knowledge Base" subtitle="Teach your AI about your business" />
            <div className="p-3 sm:p-4">
              <div onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center justify-between cursor-pointer group">
                <div className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Updated: {formatDate(kbLastUpdated)}</div>
                <button className="flex items-center gap-1 text-xs sm:text-sm font-medium group-hover:opacity-80 transition" style={{ color: primaryColor }}>
                  {kbExpanded ? 'Hide' : 'Edit'}
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {kbExpanded && (
                <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.text }}>
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primaryColor }} /> Website
                    </label>
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full px-3 py-2 sm:py-2.5 text-sm border rounded-lg focus:outline-none transition" style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }} />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.text }}>
                      <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primaryColor }} /> Services & Pricing
                    </label>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <div key={service.id} className="p-2 sm:p-3 rounded-lg space-y-1.5 sm:space-y-2" style={{ backgroundColor: theme.bg }}>
                          <div className="flex gap-1.5 sm:gap-2">
                            <input type="text" value={service.name} onChange={(e) => updateService(service.id, 'name', e.target.value)} placeholder="Service name" className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none min-w-0" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }} />
                            <input type="text" value={service.price} onChange={(e) => updateService(service.id, 'price', e.target.value)} placeholder="$100" className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }} />
                            <button onClick={() => removeService(service.id)} disabled={services.length === 1} className="p-1.5 sm:p-2 hover:text-red-500 disabled:opacity-30 transition" style={{ color: theme.textMuted4 }}><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                          </div>
                          <textarea value={service.description} onChange={(e) => updateService(service.id, 'description', e.target.value)} placeholder="Brief description..." rows={2} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none resize-none" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addService} className="mt-2 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition hover:opacity-80" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.05) }}>
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Service
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.text }}>
                      <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primaryColor }} /> FAQs
                    </label>
                    <div className="space-y-2">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="p-2 sm:p-3 rounded-lg space-y-1.5 sm:space-y-2" style={{ backgroundColor: theme.bg }}>
                          <div className="flex gap-1.5 sm:gap-2">
                            <input type="text" value={faq.question} onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)} placeholder="Question..." className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none min-w-0" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }} />
                            <button onClick={() => removeFAQ(faq.id)} disabled={faqs.length === 1} className="p-1.5 sm:p-2 hover:text-red-500 disabled:opacity-30 transition" style={{ color: theme.textMuted4 }}><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                          </div>
                          <textarea value={faq.answer} onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)} placeholder="Answer..." rows={2} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none resize-none" style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addFAQ} className="mt-2 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition hover:opacity-80" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.05) }}>
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add FAQ
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: theme.text }}>
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primaryColor }} /> Additional Info
                    </label>
                    <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Policies, service areas, payment methods, etc." rows={3} className="w-full px-3 py-2 sm:py-2.5 text-sm border rounded-lg focus:outline-none resize-none transition" style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }} />
                  </div>

                  <button onClick={handleSaveKnowledgeBase} disabled={savingKB} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition disabled:opacity-50" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                    {savingKB ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : <><Sparkles className="w-4 h-4" />Update AI Knowledge</>}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </section>

        {/* Pro Tip */}
        <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.05), border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}>
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-base sm:text-xl flex-shrink-0">💡</div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1" style={{ color: primaryColor }}>Pro Tip</h4>
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                After changes, tap "Test Your AI" to hear them in action!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}