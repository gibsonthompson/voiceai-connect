'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Loader2, Phone, PhoneOff, PhoneCall, Mic, MicOff, Volume2,
  Bot, User, AlertCircle, Clock, Terminal, Code2, FlaskConical,
  Settings2, ChevronDown, ChevronUp, Check, Copy, ArrowRight,
  Building, MapPin, Hash, Timer, Cpu, RefreshCw, Shield, Search,
  CircleDot, Radio, Wifi, WifiOff, AlertTriangle, Info, Pencil,
  Undo2
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';

// ============================================================================
// TYPES
// ============================================================================
interface ClientItem {
  id: string;
  business_name: string;
  industry: string;
  owner_name: string;
  owner_phone: string;
  email: string;
  vapi_assistant_id: string | null;
  vapi_phone_number: string | null;
  vapi_phone_id: string | null;
  knowledge_base_id: string | null;
  subscription_status: string;
  status: string;
  plan_type: string;
  business_city: string;
  business_state: string;
}

interface AssistantDetails {
  id: string;
  name: string;
  model: string;
  voice: string;
  voiceProvider: string;
  firstMessage: string | null;
  systemPromptLength: number;
  tools: string[];
  serverUrl: string | null;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  isFinal: boolean;
  timestamp: number;
}

interface EventLogEntry {
  id: string;
  type: string;
  timestamp: number;
  data?: any;
  level: 'info' | 'warn' | 'error' | 'success';
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

// ============================================================================
// HELPERS
// ============================================================================
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AILabPage() {
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  // Client selection
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [assistantDetails, setAssistantDetails] = useState<AssistantDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [showEventLog, setShowEventLog] = useState(false);

  // SMS phone swap
  const [notifPhone, setNotifPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [phoneSwapping, setPhoneSwapping] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneSwapped, setPhoneSwapped] = useState(false);

  // VAPI ref
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const eventLogEndRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // INIT VAPI SDK
  // ========================================================================
  useEffect(() => {
    if (!vapiPublicKey) return;

    let mounted = true;

    import('@vapi-ai/web').then(({ default: Vapi }) => {
      if (!mounted) return;
      const vapi = new Vapi(vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        if (!mounted) return;
        setCallState('connected');
        addEvent('call-start', 'Call connected', 'success');
      });

      vapi.on('call-end', () => {
        if (!mounted) return;
        setCallState('ended');
        stopTimer();
        addEvent('call-end', 'Call ended', 'info');
      });

      vapi.on('speech-start', () => {
        if (!mounted) return;
        addEvent('speech-start', 'Assistant speaking', 'info');
      });

      vapi.on('speech-end', () => {
        if (!mounted) return;
        addEvent('speech-end', 'Assistant stopped', 'info');
      });

      vapi.on('message', (msg: any) => {
        if (!mounted) return;

        if (msg.type === 'transcript') {
          const entry: TranscriptEntry = {
            id: generateId(),
            role: msg.role || 'assistant',
            text: msg.transcript || '',
            isFinal: msg.transcriptType === 'final',
            timestamp: Date.now(),
          };

          setTranscript(prev => {
            // Replace last partial from same role with final
            if (entry.isFinal) {
              const lastPartialIdx = [...prev].reverse().findIndex(
                t => t.role === entry.role && !t.isFinal
              );
              if (lastPartialIdx !== -1) {
                const idx = prev.length - 1 - lastPartialIdx;
                const updated = [...prev];
                updated[idx] = entry;
                return updated;
              }
            } else {
              // Replace existing partial from same role
              const lastPartialIdx = [...prev].reverse().findIndex(
                t => t.role === entry.role && !t.isFinal
              );
              if (lastPartialIdx !== -1) {
                const idx = prev.length - 1 - lastPartialIdx;
                const updated = [...prev];
                updated[idx] = entry;
                return updated;
              }
            }
            return [...prev, entry];
          });
        }

        if (msg.type === 'function-call') {
          addEvent('function-call', `Tool: ${msg.functionCall?.name || 'unknown'}`, 'info', msg);
        }

        if (msg.type === 'hang') {
          addEvent('hang', 'Assistant ended call', 'warn');
        }
      });

      vapi.on('error', (err: any) => {
        if (!mounted) return;
        console.error('VAPI error:', err);
        addEvent('error', err?.message || err?.errorMessage || 'Unknown error', 'error', err);
        setCallState('idle');
        stopTimer();
      });
    }).catch(err => {
      console.error('Failed to load VAPI SDK:', err);
    });

    return () => {
      mounted = false;
      vapiRef.current?.stop();
      stopTimer();
    };
  }, [vapiPublicKey]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    eventLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLog]);

  // ========================================================================
  // EVENT LOG HELPER
  // ========================================================================
  const addEvent = useCallback((type: string, message: string, level: EventLogEntry['level'], data?: any) => {
    setEventLog(prev => [...prev, {
      id: generateId(),
      type,
      timestamp: Date.now(),
      data: data ? { message, ...data } : { message },
      level,
    }]);
  }, []);

  // ========================================================================
  // TIMER
  // ========================================================================
  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ========================================================================
  // FETCH CLIENTS
  // ========================================================================
  useEffect(() => {
    if (!agency) return;
    fetchClients();
  }, [agency]);

  const fetchClients = async () => {
    if (!agency) return;
    setClientsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-playground/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    } finally {
      setClientsLoading(false);
    }
  };

  // ========================================================================
  // SELECT CLIENT → FETCH AI DETAILS
  // ========================================================================
  const handleSelectClient = async (client: ClientItem) => {
    setSelectedClient(client);
    setAssistantDetails(null);
    setTranscript([]);
    setEventLog([]);
    setCallState('idle');
    setNotifPhone(client.owner_phone || '');
    setOriginalPhone(client.owner_phone || '');
    setPhoneSwapped(false);
    setPhoneEditing(false);

    if (!client.vapi_assistant_id) {
      addEvent('warn', 'No VAPI assistant configured for this client', 'warn');
      return;
    }

    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency!.id}/ai-playground/clients/${client.id}/ai-details`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssistantDetails(data.assistant);
        addEvent('init', `Loaded AI config for ${client.business_name}`, 'success');
      }
    } catch (e) {
      addEvent('error', 'Failed to load AI details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  // ========================================================================
  // CALL CONTROLS
  // ========================================================================
  const handleStartCall = async () => {
    if (!vapiRef.current || !selectedClient?.vapi_assistant_id) return;

    setCallState('connecting');
    setTranscript([]);
    setCallDuration(0);
    addEvent('call-init', `Calling ${selectedClient.business_name} AI...`, 'info');

    try {
      await vapiRef.current.start(selectedClient.vapi_assistant_id);
      startTimer();
    } catch (err: any) {
      console.error('Failed to start call:', err);
      addEvent('error', err?.message || 'Failed to start call', 'error');
      setCallState('idle');
    }
  };

  const handleEndCall = () => {
    vapiRef.current?.stop();
    stopTimer();
    setCallState('ended');
  };

  const handleToggleMute = () => {
    if (!vapiRef.current) return;
    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
    addEvent(newMuted ? 'muted' : 'unmuted', newMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
  };

  const handleReset = () => {
    setCallState('idle');
    setTranscript([]);
    setCallDuration(0);
    setIsMuted(false);
    stopTimer();
  };

  // ========================================================================
  // SMS PHONE SWAP
  // ========================================================================
  const handlePhoneSwap = async () => {
    if (!agency || !selectedClient || !notifPhone.trim()) return;
    setPhoneSwapping(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-playground/clients/${selectedClient.id}/notification-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone: notifPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneSwapped(notifPhone !== originalPhone);
        setPhoneEditing(false);
        addEvent('phone-swap', `SMS notifications → ${data.new_phone_display}`, 'success');
      }
    } catch (e) {
      addEvent('error', 'Failed to swap phone', 'error');
    } finally {
      setPhoneSwapping(false);
    }
  };

  const handlePhoneRevert = async () => {
    setNotifPhone(originalPhone);
    setPhoneSwapping(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${backendUrl}/api/agency/${agency!.id}/ai-playground/clients/${selectedClient!.id}/notification-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone: originalPhone }),
      });
      setPhoneSwapped(false);
      setPhoneEditing(false);
      addEvent('phone-revert', `SMS notifications reverted to owner`, 'success');
    } catch (e) {
      addEvent('error', 'Failed to revert phone', 'error');
    } finally {
      setPhoneSwapping(false);
    }
  };

  // ========================================================================
  // FILTERED CLIENTS
  // ========================================================================
  const filteredClients = clientSearch.trim()
    ? clients.filter(c =>
        c.business_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.owner_name.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  // ========================================================================
  // RENDER
  // ========================================================================
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  // No VAPI public key
  const missingKey = !vapiPublicKey;

  const isCallActive = callState === 'connecting' || callState === 'connected';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
            <FlaskConical className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>AI Lab</h1>
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Test and monitor your AI receptionists</p>
          </div>
        </div>
        {selectedClient && (
          <button onClick={() => { setSelectedClient(null); setAssistantDetails(null); setTranscript([]); setEventLog([]); }}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: theme.textMuted, backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
            Change Client
          </button>
        )}
      </div>

      {/* Missing VAPI Key Warning */}
      {missingKey && (
        <div className="mb-6 rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: theme.text }}>VAPI Public Key Required</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Add <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: theme.hover }}>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> to your Vercel environment variables to enable live calling. 
              Get your key from <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener" className="underline" style={{ color: theme.primary }}>dashboard.vapi.ai</a>.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CLIENT SELECTOR (shown when no client selected)                  */}
      {/* ================================================================ */}
      {!selectedClient && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
            <input
              type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            />
          </div>

          {clientsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <Building className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {clients.length === 0 ? 'No clients yet. Add a client to test their AI.' : 'No clients match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="text-left rounded-xl p-4 transition-all group"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.primary + '60')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary15 }}>
                      <Building className="h-5 w-5" style={{ color: theme.primary }} />
                    </div>
                    {client.vapi_assistant_id ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>
                        <CircleDot className="h-2.5 w-2.5" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                        No AI
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate" style={{ color: theme.text }}>{client.business_name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>
                    {client.industry} · {client.business_city}, {client.business_state}
                  </p>
                  {client.vapi_phone_number && (
                    <p className="text-xs font-mono mt-2" style={{ color: theme.textMuted }}>{formatPhone(client.vapi_phone_number)}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SELECTED CLIENT — CALL INTERFACE                                 */}
      {/* ================================================================ */}
      {selectedClient && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column — Call + Transcript */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Client Info Card */}
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                    <Building className="h-5 w-5" style={{ color: theme.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{selectedClient.business_name}</p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                      {selectedClient.industry} · {selectedClient.business_city}, {selectedClient.business_state}
                    </p>
                  </div>
                </div>
                {/* AI Phone */}
                {selectedClient.vapi_phone_number && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>AI Phone</p>
                    <p className="text-sm font-mono font-medium" style={{ color: theme.primary }}>{formatPhone(selectedClient.vapi_phone_number)}</p>
                  </div>
                )}
              </div>

              {/* Assistant Details Row */}
              {detailsLoading ? (
                <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: theme.border }}>
                  <Loader2 className="h-3 w-3 animate-spin" style={{ color: theme.textMuted }} />
                  <span className="text-xs" style={{ color: theme.textMuted }}>Loading AI config...</span>
                </div>
              ) : assistantDetails && (
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1" style={{ borderColor: theme.border }}>
                  {[
                    { label: 'Model', value: assistantDetails.model },
                    { label: 'Voice', value: assistantDetails.voice?.substring(0, 12) },
                    { label: 'Prompt', value: `${assistantDetails.systemPromptLength.toLocaleString()} chars` },
                    { label: 'Tools', value: assistantDetails.tools.length > 0 ? assistantDetails.tools.join(', ') : 'None' },
                  ].map(d => (
                    <div key={d.label}>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{d.label}: </span>
                      <span className="text-xs font-mono" style={{ color: theme.text }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call Button + Controls */}
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              {callState === 'idle' || callState === 'ended' ? (
                <>
                  <button
                    onClick={handleStartCall}
                    disabled={!selectedClient?.vapi_assistant_id || missingKey}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText, boxShadow: `0 0 30px ${theme.primary}25` }}
                  >
                    <PhoneCall className="h-5 w-5" />
                    {callState === 'ended' ? 'Call Again' : 'Start Test Call'}
                  </button>
                  {callState === 'ended' && callDuration > 0 && (
                    <p className="text-xs mt-2" style={{ color: theme.textMuted }}>Last call: {formatDuration(callDuration)}</p>
                  )}
                  {!selectedClient?.vapi_assistant_id && (
                    <p className="text-xs mt-3" style={{ color: '#f59e0b' }}>This client has no AI assistant configured.</p>
                  )}
                </>
              ) : callState === 'connecting' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}>
                      <Phone className="h-7 w-7 animate-pulse" style={{ color: theme.primary }} />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: theme.primary }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Connecting...</p>
                  <button onClick={handleEndCall}
                    className="text-xs px-4 py-1.5 rounded-full transition-colors"
                    style={{ color: '#ef4444', backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {/* Live indicator + timer */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>
                      <Radio className="h-3 w-3 animate-pulse" /> LIVE
                    </span>
                    <span className="text-lg font-mono font-bold" style={{ color: theme.text }}>{formatDuration(callDuration)}</span>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button onClick={handleToggleMute}
                      className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                      style={{
                        backgroundColor: isMuted ? (theme.isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : theme.hover,
                        border: `1px solid ${isMuted ? (theme.isDark ? 'rgba(239,68,68,0.3)' : '#fecaca') : theme.border}`,
                        color: isMuted ? '#ef4444' : theme.text,
                      }}>
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <button onClick={handleEndCall}
                      className="flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>
                      <PhoneOff className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-xl flex flex-col" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, minHeight: '250px', maxHeight: '400px' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <MessageIcon className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Live Transcript</span>
                </div>
                {transcript.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                    {transcript.filter(t => t.isFinal).length} messages
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Bot className="h-7 w-7 mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {isCallActive ? 'Waiting for speech...' : 'Start a call to see the transcript'}
                    </p>
                  </div>
                )}
                {transcript.map((entry) => (
                  <div key={entry.id} className={`flex gap-2.5 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {entry.role !== 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}>
                        <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                      </div>
                    )}
                    <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                      style={{
                        backgroundColor: entry.role === 'user' ? theme.primary : theme.hover,
                        color: entry.role === 'user' ? theme.primaryText : theme.text,
                        opacity: entry.isFinal ? 1 : 0.6,
                        borderBottomRightRadius: entry.role === 'user' ? '4px' : undefined,
                        borderBottomLeftRadius: entry.role !== 'user' ? '4px' : undefined,
                      }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{entry.text}</span>
                    </div>
                    {entry.role === 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                        <User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* SMS Notification Phone Swap */}
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>SMS Notifications Go To</span>
                </div>
                {phoneSwapped && (
                  <button onClick={handlePhoneRevert} disabled={phoneSwapping}
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.1)' : '#fffbeb', color: '#f59e0b', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
                    <Undo2 className="h-3 w-3" /> Revert to Owner
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    value={phoneEditing ? notifPhone : formatPhone(notifPhone)}
                    onChange={(e) => setNotifPhone(e.target.value)}
                    onFocus={() => setPhoneEditing(true)}
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                    style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                  />
                </div>
                <button onClick={handlePhoneSwap} disabled={phoneSwapping || !notifPhone.trim()}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {phoneSwapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Save
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: theme.textMuted }}>
                {phoneSwapped 
                  ? `Swapped from owner (${formatPhone(originalPhone)}). Remember to revert after testing.`
                  : "Change this to your number to receive test call SMS summaries, then revert when done."
                }
              </p>
            </div>
          </div>

          {/* Right Column — Event Log */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* Mobile toggle */}
            <button onClick={() => setShowEventLog(!showEventLog)}
              className="lg:hidden w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
                <span className="text-sm font-medium">Event Log</span>
                {eventLog.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                    {eventLog.length}
                  </span>
                )}
              </div>
              {showEventLog ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <div className={`rounded-xl overflow-hidden ${showEventLog ? '' : 'hidden lg:block'}`}
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, height: 'calc(100vh - 280px)', minHeight: '400px' }}>
              {/* Log Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>VAPI Events</span>
                </div>
                {eventLog.length > 0 && (
                  <button onClick={() => setEventLog([])} className="text-[10px] px-2 py-0.5 rounded transition-colors"
                    style={{ color: theme.textMuted, backgroundColor: theme.hover }}>
                    Clear
                  </button>
                )}
              </div>

              {/* Log Entries */}
              <div className="overflow-y-auto p-3 space-y-1.5" style={{ height: 'calc(100% - 48px)' }}>
                {eventLog.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Code2 className="h-6 w-6 mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                    <p className="text-[10px]" style={{ color: theme.textMuted }}>Events will appear here during calls</p>
                  </div>
                )}
                {eventLog.map((entry) => {
                  const colors = {
                    info: theme.textMuted,
                    warn: '#f59e0b',
                    error: '#ef4444',
                    success: '#22c55e',
                  };
                  return (
                    <div key={entry.id} className="rounded-md px-2.5 py-1.5 text-[11px] font-mono"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', border: `1px solid ${theme.border}` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate" style={{ color: colors[entry.level] }}>{entry.type}</span>
                        <span className="flex-shrink-0 text-[9px]" style={{ color: theme.textMuted }}>
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {entry.data?.message && (
                        <p className="mt-0.5 text-[10px] truncate" style={{ color: theme.textMuted }}>{entry.data.message}</p>
                      )}
                    </div>
                  );
                })}
                <div ref={eventLogEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG icon (lucide doesn't have a chat-bubble-left icon)
function MessageIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}