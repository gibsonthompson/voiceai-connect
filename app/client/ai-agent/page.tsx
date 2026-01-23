'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Loader2, Bot, Mic, MessageSquare, Clock, BookOpen, 
  Play, Pause, Check, ChevronDown, RotateCcw, Sparkles, AlertCircle
} from 'lucide-react';

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

interface Branding {
  primaryColor: string;
  accentColor: string;
  agencyName: string;
  logoUrl: string | null;
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

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ClientAIAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [branding, setBranding] = useState<Branding>({
    primaryColor: '#3b82f6',
    accentColor: '#60a5fa',
    agencyName: 'VoiceAI',
    logoUrl: null,
  });
  
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
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [originalKnowledgeBase, setOriginalKnowledgeBase] = useState('');
  const [savingKB, setSavingKB] = useState(false);
  const [kbExpanded, setKbExpanded] = useState(false);

  useEffect(() => {
    fetchClientData();
    fetchVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  const fetchClientData = async () => {
    try {
      const token = getAuthToken();
      const storedClient = localStorage.getItem('client');
      
      if (!token || !storedClient) {
        router.push('/client/login');
        return;
      }

      const clientData = JSON.parse(storedClient);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('client');
        localStorage.removeItem('user');
        router.push('/client/login');
        return;
      }

      const data = await response.json();
      setClient(data.client);
      
      if (data.client.agency) {
        setBranding({
          primaryColor: data.client.agency.primary_color || '#3b82f6',
          accentColor: data.client.agency.accent_color || '#60a5fa',
          agencyName: data.client.agency.name || 'VoiceAI',
          logoUrl: data.client.agency.logo_url,
        });
      }
      
      // Fetch voice, greeting, and other settings
      await Promise.all([
        fetchCurrentVoice(data.client.id, token),
        fetchGreeting(data.client.id, token),
        fetchKnowledgeBase(data.client.id, token),
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching client data:', error);
      router.push('/client/login');
    }
  };

  const fetchVoices = async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
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

  const fetchCurrentVoice = async (clientId: string, token: string | null) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${clientId}/voice`, {
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

  const fetchGreeting = async (clientId: string, token: string | null) => {
    setGreetingLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${clientId}/greeting`, {
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

  const fetchKnowledgeBase = async (clientId: string, token: string | null) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${clientId}/knowledge-base`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setKnowledgeBase(data.content || '');
          setOriginalKnowledgeBase(data.content || '');
        }
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    }
  };

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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = getAuthToken();
      
      const hoursText = formatBusinessHoursForSave();
      
      const response = await fetch(`${backendUrl}/api/client/${client.id}/business-hours`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ business_hours: hoursText }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Business hours updated!');
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
    if (knowledgeBase === originalKnowledgeBase || !client) return;
    
    setSavingKB(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = getAuthToken();
      
      const response = await fetch(`${backendUrl}/api/client/${client.id}/knowledge-base`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: knowledgeBase }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalKnowledgeBase(knowledgeBase);
        showMessage('Knowledge base updated!');
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

  const updateBusinessHours = (day: keyof BusinessHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

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
  const hasKBChanges = knowledgeBase !== originalKnowledgeBase;
  const totalVoices = (voices.female?.length || 0) + (voices.male?.length || 0);

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
                  <Bot className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium">AI Agent</span>
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
            message.includes('✅')
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message}
          </div>
        )}

        {/* Hero */}
        <div className="mb-6 text-center">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Bot className="w-7 h-7" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Your AI Receptionist
          </h2>
          <p className="text-white/50 text-sm">
            Customize how your AI answers calls
          </p>
        </div>

        {/* Test Your AI Button */}
        <section className="mb-6">
          <button
            onClick={handleTestCall}
            disabled={!client?.vapi_phone_number}
            className="w-full rounded-xl p-4 flex items-center justify-center gap-3 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
          >
            <Phone className="w-5 h-5" />
            <span className="font-semibold">Test Your AI Receptionist</span>
          </button>
          <p className="text-center text-white/40 text-xs mt-2">
            Call your AI number to hear your settings in action
          </p>
        </section>

        {/* Voice Selection */}
        <section className="mb-6">
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Mic className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Voice Selection</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">Choose your AI's voice</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {voicesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-white/50 text-sm">Loading voices...</span>
                </div>
              )}

              {voicesError && !voicesLoading && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm font-medium mb-2">{voicesError}</p>
                  <button onClick={fetchVoices} className="text-red-400 text-sm underline hover:no-underline">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          voiceFilter === filter
                            ? 'text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                        style={voiceFilter === filter ? { backgroundColor: primaryColor } : {}}
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
                          className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white/5'
                              : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                          }`}
                          style={isSelected ? { borderColor: primaryColor } : {}}
                        >
                          {isCurrent && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                              CURRENT
                            </span>
                          )}
                          
                          {voice.recommended && !isCurrent && (
                            <span 
                              className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-bold rounded-full"
                              style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
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
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                                isPlaying ? 'text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                              style={isPlaying ? { backgroundColor: primaryColor } : {}}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm text-white truncate">{voice.name}</span>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />}
                              </div>
                              <p className="text-[10px] text-white/40 truncate">{voice.accent} • {voice.style}</p>
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
                      style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
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
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Greeting Message</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">What your AI says when answering calls</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {greetingLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                  <span className="ml-2 text-white/50 text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <textarea
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition text-sm resize-none"
                    placeholder="Hi, you've reached [Business Name]. How can I help you today?"
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={handleResetGreeting}
                      className="flex items-center gap-1 text-white/40 text-xs hover:text-white/60 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to default
                    </button>
                    <span className="text-white/30 text-xs">{greetingMessage.length}/500</span>
                  </div>

                  {hasGreetingChanges && (
                    <button
                      onClick={handleSaveGreeting}
                      disabled={savingGreeting || greetingMessage.length < 10}
                      className="w-full mt-3 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
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
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Business Hours</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">Your AI knows when to book vs take messages</p>
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
                    <span key={i} className="bg-white/5 px-2 py-1 rounded text-xs text-white/60">
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
                    <div key={day} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="w-16 text-xs font-medium text-white/70 capitalize">{day.slice(0, 3)}</span>
                      
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={businessHours[day].closed}
                          onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5"
                        />
                        <span className="text-xs text-white/50">Closed</span>
                      </label>

                      {!businessHours[day].closed && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <select
                            value={businessHours[day].open}
                            onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                            className="px-2 py-1 text-xs border border-white/10 rounded bg-white/5 text-white focus:border-white/20 focus:outline-none"
                          >
                            {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                          <span className="text-white/30 text-xs">-</span>
                          <select
                            value={businessHours[day].close}
                            onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                            className="px-2 py-1 text-xs border border-white/10 rounded bg-white/5 text-white focus:border-white/20 focus:outline-none"
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
                    style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
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
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Knowledge Base</h3>
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Live
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">Teach your AI about your business</p>
                </div>
                <button
                  onClick={() => setKbExpanded(!kbExpanded)}
                  className="flex items-center gap-1 text-sm font-medium" 
                  style={{ color: primaryColor }}
                >
                  {kbExpanded ? 'Collapse' : 'Expand'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            {kbExpanded && (
              <div className="p-4">
                <p className="text-white/50 text-xs mb-3">
                  Add information about your services, pricing, FAQs, and policies. Your AI will use this to answer customer questions.
                </p>
                <textarea
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition text-sm resize-none font-mono"
                  placeholder="Services:
- Plumbing repair: $75-150/hour
- Emergency service available 24/7

FAQs:
Q: Do you offer free estimates?
A: Yes, we provide free estimates for all jobs.

Policies:
- 24 hour cancellation policy
- Payment due upon completion"
                />
                
                {hasKBChanges && (
                  <button
                    onClick={handleSaveKnowledgeBase}
                    disabled={savingKB}
                    className="w-full mt-3 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
                  >
                    {savingKB ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Knowledge Base'}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Pro Tip */}
        <div className="rounded-xl p-4" style={{ backgroundColor: `${primaryColor}10` }}>
          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">💡</div>
            <div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: primaryColor }}>
                Pro Tip
              </h4>
              <p className="text-white/60 text-sm">
                After changing your voice or greeting, tap "Test Your AI Receptionist" to call and hear the changes in action!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}