'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, Loader2, Bot, Mic, MessageSquare, Clock, BookOpen, 
  Play, Pause, Check, ChevronDown, RotateCcw, Sparkles, AlertCircle,
  Plus, Trash2, Globe, Briefcase, HelpCircle, FileText
} from 'lucide-react';
import { useClient } from '../context';

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
// HELPER FUNCTIONS
// ============================================================================
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
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ClientAIAgentPage() {
  const { client, branding, loading } = useClient();
  const [message, setMessage] = useState('');
  
  // Light mode theme
  const theme = {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
  };
  
  // Voice state
  const [voices, setVoices] = useState<{ female: VoiceOption[]; male: VoiceOption[] }>({ female: [], male: [] });
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [savingVoice, setSavingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Greeting state
  const [greetingMessage, setGreetingMessage] = useState('');
  const [originalGreeting, setOriginalGreeting] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [savingGreeting, setSavingGreeting] = useState(false);

  // Business Hours state
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

  // Knowledge Base state
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

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

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
      console.error('Error fetching voices:', error);
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

  // ============================================================================
  // PARSE FUNCTIONS
  // ============================================================================

  const parseServices = (servicesText: string) => {
    const lines = servicesText.split('\n').filter(l => l.trim());
    const parsed: Service[] = [];
    
    lines.forEach((line, index) => {
      const priceMatch = line.match(/\$[\d,]+/);
      const price = priceMatch ? priceMatch[0] : '';
      const name = line.split('-')[0].trim().replace(/^-\s*/, '');
      const description = line.split('-').slice(1).join('-').trim() || '';
      
      if (name) {
        parsed.push({
          id: `${index + 1}`,
          name,
          price,
          description: description.replace(/\$[\d,]+/, '').trim()
        });
      }
    });
    
    setServices(parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }]);
  };

  const parseFAQs = (faqsText: string) => {
    const parsed: FAQ[] = [];
    const lines = faqsText.split('\n');
    let currentQ = '';
    let currentA = '';
    
    lines.forEach(line => {
      if (line.trim().startsWith('Q:')) {
        if (currentQ && currentA) {
          parsed.push({ id: `${parsed.length + 1}`, question: currentQ, answer: currentA });
        }
        currentQ = line.replace(/^Q:\s*/i, '').trim();
        currentA = '';
      } else if (line.trim().startsWith('A:')) {
        currentA = line.replace(/^A:\s*/i, '').trim();
      }
    });
    
    if (currentQ && currentA) {
      parsed.push({ id: `${parsed.length + 1}`, question: currentQ, answer: currentA });
    }
    
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

  // ============================================================================
  // FORMAT FUNCTIONS
  // ============================================================================

  const formatServices = (): string => {
    return services
      .filter(s => s.name.trim())
      .map(s => {
        const parts = [`- ${s.name}`];
        if (s.price) parts.push(s.price);
        if (s.description) parts.push(s.description);
        return parts.join(' - ');
      })
      .join('\n');
  };

  const formatFAQs = (): string => {
    return faqs
      .filter(f => f.question.trim() && f.answer.trim())
      .map(f => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');
  };

  const formatBusinessHoursForSave = (): string => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const dayData = businessHours[day as keyof BusinessHours];
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      return dayData.closed 
        ? `${dayName}: Closed`
        : `${dayName}: ${dayData.open} - ${dayData.close}`;
    }).join('\n');
  };

  // ============================================================================
  // HANDLER FUNCTIONS
  // ============================================================================

  const handlePlayPreview = (voice: VoiceOption) => {
    if (playingVoiceId === voice.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => {
      setPlayingVoiceId(null);
      showMessage('Failed to play audio preview', true);
    };
    
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ voice_id: selectedVoiceId }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentVoiceId(selectedVoiceId);
        showMessage('Voice updated successfully!');
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ greeting_message: greetingMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalGreeting(greetingMessage);
        showMessage('Greeting updated successfully!');
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
    const defaultGreeting = `Hi, you've reached ${client.business_name}. This call may be recorded for quality and training purposes. How can I help you today?`;
    setGreetingMessage(defaultGreeting);
  };

  const handleSaveBusinessHours = async () => {
    if (!client) return;
    
    setSavingHours(true);

    try {
      const backendUrl = getBackendUrl();
      const token = getAuthToken();
      
      // Save business hours as part of knowledge base
      const response = await fetch(`${backendUrl}/api/knowledge-base/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          businessHours: formatBusinessHoursForSave(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Business hours updated!');
        // Re-fetch to keep form in sync
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        // Re-fetch to keep form in sync with saved data
        await fetchKnowledgeBase();
      } else {
        showMessage(data.error || 'Failed to update knowledge base', true);
      }
    } catch (error) {
      showMessage('Error updating knowledge base', true);
    } finally {
      setSavingKB(false);
    }
  };

  const handleTestCall = () => {
    if (client?.vapi_phone_number) {
      window.location.href = `tel:${client.vapi_phone_number}`;
    }
  };

  const showMessage = (text: string, isError = false) => {
    setMessage(isError ? `❌ ${text}` : `✅ ${text}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // ============================================================================
  // SERVICE & FAQ MANAGEMENT
  // ============================================================================

  const addService = () => {
    setServices(prev => [...prev, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateService = (id: string, field: keyof Service, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addFAQ = () => {
    setFaqs(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const removeFAQ = (id: string) => {
    if (faqs.length > 1) {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const updateBusinessHoursField = (day: keyof BusinessHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const getFilteredVoices = () => {
    if (voiceFilter === 'female') return voices.female || [];
    if (voiceFilter === 'male') return voices.male || [];
    return [...(voices.female || []), ...(voices.male || [])];
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
      const parts = [`Mon-Fri: ${businessHours.monday.open.replace(' ', '')}-${businessHours.monday.close.replace(' ', '')}`];
      parts.push(businessHours.saturday.closed ? 'Sat: Closed' : `Sat: ${businessHours.saturday.open.replace(' ', '')}-${businessHours.saturday.close.replace(' ', '')}`);
      parts.push(businessHours.sunday.closed ? 'Sun: Closed' : `Sun: ${businessHours.sunday.open.replace(' ', '')}-${businessHours.sunday.close.replace(' ', '')}`);
      return parts;
    }
    
    return days.map(d => {
      const day = businessHours[d as keyof BusinessHours];
      const name = d.charAt(0).toUpperCase() + d.slice(1, 3);
      return day.closed ? `${name}: Closed` : `${name}: ${day.open.replace(' ', '')}-${day.close.replace(' ', '')}`;
    });
  };

  const primaryColor = branding.primaryColor;
  const primaryLight = isLightColor(primaryColor);
  const hasVoiceChanges = selectedVoiceId !== currentVoiceId;
  const hasGreetingChanges = greetingMessage !== originalGreeting;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center font-medium text-sm max-w-3xl mx-auto ${
          message.includes('✅')
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Hero */}
      <div className="mb-6 text-center">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
        >
          <Bot className="w-7 h-7" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: theme.text }}>
          Your AI Receptionist
        </h2>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Customize how your AI answers calls
        </p>
      </div>

      {/* Content Container */}
      <div className="max-w-3xl mx-auto">
        {/* Test Your AI Button */}
        <section className="mb-6">
          <button
            onClick={handleTestCall}
            disabled={!client?.vapi_phone_number}
            className="w-full rounded-xl p-4 flex items-center justify-center gap-3 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
          >
            <Phone className="w-5 h-5" />
            <span className="font-semibold">Test Your AI Receptionist</span>
          </button>
          <p className="text-center text-xs mt-2" style={{ color: theme.textMuted4 }}>
            Call your AI number to hear your settings in action
          </p>
        </section>

        {/* Voice Selection */}
        <section className="mb-6">
          <div 
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="p-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                >
                  <Mic className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Voice Selection</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted4 }}>Choose your AI's voice</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {voicesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading voices...</span>
                </div>
              )}

              {voicesError && !voicesLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 text-sm font-medium mb-2">{voicesError}</p>
                  <button onClick={fetchVoices} className="text-red-600 text-sm underline hover:no-underline">
                    Try again
                  </button>
                </div>
              )}

              {!voicesLoading && !voicesError && totalVoices > 0 && (
                <>
                  <div className="flex gap-2 mb-4">
                    {(['all', 'female', 'male'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setVoiceFilter(filter)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        style={{
                          backgroundColor: voiceFilter === filter ? primaryColor : theme.bg,
                          color: voiceFilter === filter ? (primaryLight ? '#111827' : '#ffffff') : theme.textMuted,
                        }}
                      >
                        {filter === 'all' ? `All (${totalVoices})` : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getFilteredVoices().map((voice) => {
                      const isSelected = selectedVoiceId === voice.id;
                      const isCurrent = currentVoiceId === voice.id;
                      const isPlaying = playingVoiceId === voice.id;

                      return (
                        <div
                          key={voice.id}
                          onClick={() => setSelectedVoiceId(voice.id)}
                          className="relative p-3 rounded-xl border-2 cursor-pointer transition-all"
                          style={{
                            borderColor: isSelected ? primaryColor : theme.border,
                            backgroundColor: isSelected ? hexToRgba(primaryColor, 0.05) : theme.cardBg,
                          }}
                        >
                          {isCurrent && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                              CURRENT
                            </span>
                          )}
                          
                          {voice.recommended && !isCurrent && (
                            <span 
                              className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-bold rounded-full"
                              style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
                            >
                              ★
                            </span>
                          )}

                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayPreview(voice);
                              }}
                              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
                              style={{
                                backgroundColor: isPlaying ? primaryColor : theme.bg,
                                color: isPlaying ? (primaryLight ? '#111827' : '#ffffff') : theme.textMuted,
                              }}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm truncate" style={{ color: theme.text }}>{voice.name}</span>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />}
                              </div>
                              <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>{voice.accent} • {voice.style}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasVoiceChanges && (
                    <button
                      onClick={handleSaveVoice}
                      disabled={savingVoice}
                      className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
                    >
                      {savingVoice ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Voice Selection'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Greeting Message */}
        <section className="mb-6">
          <div 
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="p-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Greeting Message</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted4 }}>What your AI says when answering calls</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {greetingLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading...</span>
                </div>
              ) : (
                <>
                  <textarea
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition"
                    style={{ 
                      borderColor: theme.border, 
                      backgroundColor: theme.bg,
                      color: theme.text,
                    }}
                    placeholder="Hi, you've reached [Business Name]. How can I help you today?"
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={handleResetGreeting}
                      className="flex items-center gap-1 text-xs hover:opacity-80 transition"
                      style={{ color: theme.textMuted4 }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to default
                    </button>
                    <span className="text-xs" style={{ color: theme.textMuted4 }}>{greetingMessage.length}/500</span>
                  </div>

                  {hasGreetingChanges && (
                    <button
                      onClick={handleSaveGreeting}
                      disabled={savingGreeting || greetingMessage.length < 10}
                      className="w-full mt-3 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
                    >
                      {savingGreeting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Greeting'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Business Hours */}
        <section className="mb-6">
          <div 
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="p-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                >
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Business Hours</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted4 }}>Your AI knows when to book vs take messages</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div 
                onClick={() => setHoursExpanded(!hoursExpanded)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex flex-wrap gap-2">
                  {getHoursSummary().slice(0, 4).map((h, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: theme.bg, color: theme.textMuted }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <button className="flex items-center gap-1 text-sm font-medium group-hover:opacity-80 ml-2" style={{ color: primaryColor }}>
                  {hoursExpanded ? 'Collapse' : 'Edit'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {hoursExpanded && (
                <div className="mt-4 space-y-2">
                  {(Object.keys(businessHours) as Array<keyof BusinessHours>).map(day => (
                    <div 
                      key={day} 
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <span className="w-16 text-xs font-medium capitalize" style={{ color: theme.textMuted }}>{day.slice(0, 3)}</span>
                      
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={businessHours[day].closed}
                          onChange={(e) => updateBusinessHoursField(day, 'closed', e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span className="text-xs" style={{ color: theme.textMuted }}>Closed</span>
                      </label>

                      {!businessHours[day].closed && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <select
                            value={businessHours[day].open}
                            onChange={(e) => updateBusinessHoursField(day, 'open', e.target.value)}
                            className="px-2 py-1 text-xs border rounded focus:outline-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                          >
                            {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                          <span className="text-xs" style={{ color: theme.textMuted4 }}>-</span>
                          <select
                            value={businessHours[day].close}
                            onChange={(e) => updateBusinessHoursField(day, 'close', e.target.value)}
                            className="px-2 py-1 text-xs border rounded focus:outline-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                          >
                            {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={handleSaveBusinessHours}
                    disabled={savingHours}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
                  >
                    {savingHours ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Sparkles className="w-4 h-4" /> Save Business Hours</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Knowledge Base */}
        <section className="mb-6">
          <div 
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="p-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Knowledge Base</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: theme.textMuted4 }}>Teach your AI about your business</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {/* Collapsed View */}
              <div 
                onClick={() => setKbExpanded(!kbExpanded)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                  <span>Last updated: {formatDate(kbLastUpdated)}</span>
                </div>
                <button 
                  className="flex items-center gap-1 text-sm font-medium group-hover:opacity-80 transition"
                  style={{ color: primaryColor }}
                >
                  {kbExpanded ? 'Collapse' : 'Edit Knowledge'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Expanded Form */}
              {kbExpanded && (
                <div className="mt-4 space-y-5">
                  {/* Website URL */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.text }}>
                      <Globe className="w-4 h-4" style={{ color: primaryColor }} />
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none transition"
                      style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: theme.textMuted4 }}>We'll extract info from your website automatically</p>
                  </div>

                  {/* Services */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.text }}>
                      <Briefcase className="w-4 h-4" style={{ color: primaryColor }} />
                      Services & Pricing
                    </label>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <div key={service.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.bg }}>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => updateService(service.id, 'name', e.target.value)}
                              placeholder="Service name"
                              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                            />
                            <input
                              type="text"
                              value={service.price}
                              onChange={(e) => updateService(service.id, 'price', e.target.value)}
                              placeholder="$100"
                              className="w-20 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                            />
                            <button
                              onClick={() => removeService(service.id)}
                              disabled={services.length === 1}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={service.description}
                            onChange={(e) => updateService(service.id, 'description', e.target.value)}
                            placeholder="Brief description..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none resize-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addService}
                      className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition hover:opacity-80"
                      style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.05) }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Service
                    </button>
                  </div>

                  {/* FAQs */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.text }}>
                      <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
                      FAQs
                    </label>
                    <div className="space-y-2">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.bg }}>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                              placeholder="Question..."
                              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                            />
                            <button
                              onClick={() => removeFAQ(faq.id)}
                              disabled={faqs.length === 1}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                            placeholder="Answer..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none resize-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.text }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addFAQ}
                      className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition hover:opacity-80"
                      style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.05) }}
                    >
                      <Plus className="w-4 h-4" />
                      Add FAQ
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: theme.text }}>
                      <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                      Additional Info
                    </label>
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Policies, service areas, payment methods, team info, etc."
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none resize-none transition"
                      style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                    />
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleSaveKnowledgeBase}
                    disabled={savingKB}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor, color: primaryLight ? '#111827' : '#ffffff' }}
                  >
                    {savingKB ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Update AI Knowledge
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs" style={{ color: theme.textMuted4 }}>Changes apply to all incoming calls</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pro Tip */}
        <div 
          className="rounded-xl p-4"
          style={{ backgroundColor: hexToRgba(primaryColor, 0.05), border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}
        >
          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">💡</div>
            <div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: primaryColor }}>
                Pro Tip
              </h4>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                After changing your voice or greeting, tap "Test Your AI Receptionist" to call and hear the changes in action!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}