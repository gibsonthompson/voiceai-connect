'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Loader2, Phone, PhoneOff, PhoneCall, Mic, MicOff, Volume2,
  Bot, User, AlertCircle, Terminal, Code2, FlaskConical, Save,
  ChevronDown, ChevronUp, Check, RotateCcw, Building, Search,
  CircleDot, Radio, AlertTriangle, Info, Undo2, Pencil, Sparkles,
  ChevronRight, Cpu, Building2, Wrench, Stethoscope, Scale, Home,
  Calculator, Briefcase, UtensilsCrossed, Dumbbell, ShoppingBag, Car
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import LockedFeature from '@/components/LockedFeature';

// ============================================================================
// CONSTANTS
// ============================================================================
const ICON_MAP: Record<string, React.ElementType> = {
  Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
};

const MODEL_OPTIONS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

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
  subscription_status: string;
  status: string;
  plan_type: string;
  business_city: string;
  business_state: string;
  call_mode: string;
}

interface AssistantConfig {
  id: string;
  model: string;
  voice: string;
  voiceProvider: string;
  firstMessage: string;
  systemPrompt: string;
  temperature: number;
  tools: string[];
  toolIds: string[];
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: string;
  recommended?: boolean;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
  timestamp: number;
}

interface EventLogEntry {
  id: string;
  type: string;
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

interface Industry {
  frontendKey: string;
  label: string;
  description: string;
  icon: string;
  hasCustomTemplate: boolean;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

// ============================================================================
// HELPERS
// ============================================================================
function uid(): string { return Math.random().toString(36).substring(2, 10) + Date.now().toString(36); }

function fmtPhone(phone: string | null): string {
  if (!phone) return '—';
  const d = phone.replace(/\D/g, '');
  const t = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (t.length === 10) return `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}`;
  return phone;
}

function fmtDuration(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

// ============================================================================
// SECTION HEADER
// ============================================================================
function SectionHeader({ icon: Icon, label, theme, children }: {
  icon: React.ElementType; label: string; theme: any; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: theme.primary }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AILabPage() {
  const { agency, loading: ctxLoading, effectivePlan } = useAgency();
  const theme = useTheme();
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  // --- Clients ---
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // --- AI Config (from VAPI) ---
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState('');

  // --- Editable fields ---
  const [editPrompt, setEditPrompt] = useState('');
  const [editGreeting, setEditGreeting] = useState('');
  const [editVoice, setEditVoice] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTemp, setEditTemp] = useState(0.7);
  const [editCallMode, setEditCallMode] = useState<'primary' | 'secondary'>('primary');

  // --- Voices (fetched once from /api/voices) ---
  const [allVoices, setAllVoices] = useState<VoiceOption[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // --- Call ---
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [showEvents, setShowEvents] = useState(false);

  // --- SMS Swap ---
  const [notifPhone, setNotifPhone] = useState('');
  const [origPhone, setOrigPhone] = useState('');
  const [phoneSwapping, setPhoneSwapping] = useState(false);
  const [phoneSwapped, setPhoneSwapped] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);

  // --- Templates ---
  const [industries, setIndustries] = useState<Industry[]>([]);

  // --- Refs ---
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const eventLogEndRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem('auth_token') || '';
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  // ========================================================================
  // EVENT HELPER
  // ========================================================================
  const addEvent = useCallback((type: string, message: string, level: EventLogEntry['level']) => {
    setEventLog(prev => [...prev, { id: uid(), type, timestamp: Date.now(), message, level }]);
  }, []);

  // ========================================================================
  // INIT VAPI WEB SDK
  // ========================================================================
  useEffect(() => {
    if (!vapiKey) return;
    let mounted = true;
    import('@vapi-ai/web').then(({ default: Vapi }) => {
      if (!mounted) return;
      const v = new Vapi(vapiKey);
      vapiRef.current = v;

      v.on('call-start', () => {
        if (!mounted) return;
        setCallState('connected');
        addEvent('call-start', 'Call connected', 'success');
      });
      v.on('call-end', () => {
        if (!mounted) return;
        setCallState('ended');
        stopTimer();
        addEvent('call-end', 'Call ended', 'info');
      });
      v.on('speech-start', () => { if (mounted) addEvent('speech-start', 'Assistant speaking', 'info'); });
      v.on('speech-end', () => { if (mounted) addEvent('speech-end', 'Assistant stopped', 'info'); });
      v.on('message', (msg: any) => {
        if (!mounted) return;
        if (msg.type === 'transcript') {
          const entry: TranscriptEntry = {
            id: uid(),
            role: msg.role || 'assistant',
            text: msg.transcript || '',
            isFinal: msg.transcriptType === 'final',
            timestamp: Date.now(),
          };
          setTranscript(prev => {
            const lastIdx = [...prev].reverse().findIndex(t => t.role === entry.role && !t.isFinal);
            if (lastIdx !== -1) {
              const idx = prev.length - 1 - lastIdx;
              const updated = [...prev];
              updated[idx] = entry;
              return updated;
            }
            return [...prev, entry];
          });
        }
        if (msg.type === 'function-call') addEvent('tool-call', `Tool: ${msg.functionCall?.name || 'unknown'}`, 'info');
        if (msg.type === 'hang') addEvent('hang', 'Assistant ended call', 'warn');
      });
      v.on('error', (err: any) => {
        if (!mounted) return;
        addEvent('error', err?.message || err?.errorMessage || 'Unknown error', 'error');
        setCallState('idle');
        stopTimer();
      });
    }).catch(() => {});
    return () => { mounted = false; vapiRef.current?.stop(); stopTimer(); };
  }, [vapiKey, addEvent]);

  // Auto-scroll
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);
  useEffect(() => { eventLogEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [eventLog]);

  // Timer
  const startTimer = () => { setCallDuration(0); timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000); };
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  // ========================================================================
  // FETCH VOICES (once on mount)
  // ========================================================================
  useEffect(() => {
    fetch(`${api}/api/voices`)
      .then(r => r.json())
      .then(d => { setAllVoices(d.voices || []); setVoicesLoaded(true); })
      .catch(() => {});
  }, [api]);

  // ========================================================================
  // FETCH CLIENTS
  // ========================================================================
  useEffect(() => {
    if (!agency) return;
    setClientsLoading(true);
    fetch(`${api}/api/agency/${agency.id}/ai-playground/clients`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, [agency, api]);

  // ========================================================================
  // FETCH TEMPLATES (enterprise)
  // ========================================================================
  useEffect(() => {
    if (!agency || effectivePlan !== 'enterprise') return;
    fetch(`${api}/api/agency/${agency.id}/ai-templates/industries`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIndustries(d.industries || []); })
      .catch(() => {});
  }, [agency, effectivePlan, api]);

  // ========================================================================
  // SELECT CLIENT → LOAD AI DETAILS FROM VAPI
  // ========================================================================
  const selectClient = async (client: ClientItem) => {
    setSelectedClient(client);
    setConfig(null);
    setTranscript([]);
    setEventLog([]);
    setCallState('idle');
    setConfigSaved(false);
    setConfigError('');
    setNotifPhone(client.owner_phone || '');
    setOrigPhone(client.owner_phone || '');
    setPhoneSwapped(false);
    setPhoneEditing(false);
    setEditCallMode((client.call_mode as 'primary' | 'secondary') || 'primary');

    if (!client.vapi_assistant_id) {
      addEvent('warn', 'No AI assistant configured for this client', 'warn');
      return;
    }

    setConfigLoading(true);
    try {
      const r = await fetch(
        `${api}/api/agency/${agency!.id}/ai-playground/clients/${client.id}/ai-details`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (r.ok) {
        const d = await r.json();
        // call_mode comes from client object, not VAPI assistant
        setEditCallMode((d.client?.call_mode as 'primary' | 'secondary') || 'primary');

        if (d.assistant) {
          const c: AssistantConfig = {
            id: d.assistant.id,
            model: d.assistant.model || 'gpt-4o-mini',
            voice: d.assistant.voice || '',
            voiceProvider: d.assistant.voiceProvider || '11labs',
            firstMessage: d.assistant.firstMessage || '',
            systemPrompt: d.assistant.systemPrompt || '',
            temperature: d.assistant.temperature ?? 0.7,
            tools: d.assistant.tools || [],
            toolIds: d.assistant.toolIds || [],
          };
          setConfig(c);
          setEditPrompt(c.systemPrompt);
          setEditGreeting(c.firstMessage);
          setEditVoice(c.voice);
          setEditModel(c.model);
          setEditTemp(c.temperature);
          addEvent('loaded', `AI config loaded for ${client.business_name}`, 'success');
        }
      }
    } catch {
      addEvent('error', 'Failed to load AI config', 'error');
    } finally {
      setConfigLoading(false);
    }
  };

  // ========================================================================
  // SAVE AI CONFIG → PUT /api/agency/:id/clients/:cid/prompt
  // Sends all fields. Backend only patches fields that changed on VAPI.
  // ========================================================================
  const saveConfig = async () => {
    if (!agency || !selectedClient) return;
    setConfigSaving(true);
    setConfigSaved(false);
    setConfigError('');

    try {
      const body: Record<string, any> = {};

      // Always send all editable fields — backend handles diffing
      if (config) {
        body.system_prompt = editPrompt;
        body.first_message = editGreeting;
        body.voice_id = editVoice;
        body.model = editModel;
        body.temperature = editTemp;
      }
      body.call_mode = editCallMode;

      const r = await fetch(
        `${api}/api/agency/${agency.id}/clients/${selectedClient.id}/prompt`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(body),
        }
      );

      if (r.ok) {
        setConfigSaved(true);
        addEvent('saved', 'AI config saved', 'success');
        setTimeout(() => setConfigSaved(false), 3000);
        // Update local state to reflect saved values
        if (config) {
          setConfig({
            ...config,
            systemPrompt: editPrompt,
            firstMessage: editGreeting,
            voice: editVoice,
            model: editModel,
            temperature: editTemp,
          });
        }
      } else {
        const d = await r.json();
        setConfigError(d.error || 'Save failed');
        addEvent('error', d.error || 'Save failed', 'error');
      }
    } catch {
      setConfigError('Network error');
      addEvent('error', 'Network error saving config', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  const hasChanges = config
    ? (editPrompt !== config.systemPrompt || editGreeting !== config.firstMessage ||
       editVoice !== config.voice || editModel !== config.model || editTemp !== config.temperature ||
       editCallMode !== ((selectedClient?.call_mode as 'primary' | 'secondary') || 'primary'))
    : editCallMode !== ((selectedClient?.call_mode as 'primary' | 'secondary') || 'primary');

  // ========================================================================
  // CALL CONTROLS
  // ========================================================================
  const startCall = async () => {
    if (!vapiRef.current || !selectedClient?.vapi_assistant_id) return;
    setCallState('connecting');
    setTranscript([]);
    setCallDuration(0);
    addEvent('dialing', `Calling ${selectedClient.business_name} AI...`, 'info');
    try {
      await vapiRef.current.start(selectedClient.vapi_assistant_id);
      startTimer();
    } catch (e: any) {
      addEvent('error', e?.message || 'Call failed', 'error');
      setCallState('idle');
    }
  };

  const endCall = () => { vapiRef.current?.stop(); stopTimer(); setCallState('ended'); };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    vapiRef.current.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  // ========================================================================
  // SMS PHONE SWAP
  // ========================================================================
  const swapPhone = async () => {
    if (!agency || !selectedClient || !notifPhone.trim()) return;
    setPhoneSwapping(true);
    try {
      const r = await fetch(
        `${api}/api/agency/${agency.id}/ai-playground/clients/${selectedClient.id}/notification-phone`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ phone: notifPhone }),
        }
      );
      if (r.ok) {
        setPhoneSwapped(notifPhone !== origPhone);
        setPhoneEditing(false);
        addEvent('phone', `SMS → ${fmtPhone(notifPhone)}`, 'success');
      }
    } catch {
      addEvent('error', 'Phone swap failed', 'error');
    } finally {
      setPhoneSwapping(false);
    }
  };

  const revertPhone = async () => {
    setNotifPhone(origPhone);
    setPhoneSwapping(true);
    try {
      await fetch(
        `${api}/api/agency/${agency!.id}/ai-playground/clients/${selectedClient!.id}/notification-phone`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ phone: origPhone }),
        }
      );
      setPhoneSwapped(false);
      setPhoneEditing(false);
      addEvent('phone', 'Reverted to owner', 'success');
    } catch {
      addEvent('error', 'Revert failed', 'error');
    } finally {
      setPhoneSwapping(false);
    }
  };

  // ========================================================================
  // FILTERED CLIENTS
  // ========================================================================
  const filtered = clientSearch.trim()
    ? clients.filter(c =>
        c.business_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  // ========================================================================
  // LOADING
  // ========================================================================
  if (ctxLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const isCallActive = callState === 'connecting' || callState === 'connected';

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
            <FlaskConical className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>AI Lab</h1>
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Configure, test, and ship AI receptionists</p>
          </div>
        </div>
        {selectedClient && (
          <button
            onClick={() => { setSelectedClient(null); setConfig(null); setTranscript([]); setEventLog([]); }}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: theme.textMuted, backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}
          >
            Change Client
          </button>
        )}
      </div>

      {/* MISSING VAPI KEY WARNING */}
      {!vapiKey && (
        <div className="mb-6 rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: theme.text }}>Live calling requires VAPI Public Key</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Add <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: theme.hover }}>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> to Vercel env. 
              Get it from <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener" className="underline" style={{ color: theme.primary }}>dashboard.vapi.ai</a> → Account → Public Key.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CLIENT SELECTOR (when no client selected)                        */}
      {/* ================================================================ */}
      {!selectedClient && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
            <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients..." className="w-full rounded-xl pl-10 pr-4 py-3 text-sm" style={inputStyle} />
          </div>

          {clientsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>{clients.length === 0 ? 'No clients yet. Add a client first.' : 'No match.'}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <button key={c.id} onClick={() => selectClient(c)} className="text-left rounded-xl p-4 transition-all"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = theme.primary + '60')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = theme.border)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary15 }}>
                      <Building className="h-5 w-5" style={{ color: theme.primary }} />
                    </div>
                    {c.vapi_assistant_id ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>
                        <CircleDot className="h-2.5 w-2.5" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.hover, color: theme.textMuted }}>No AI</span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate" style={{ color: theme.text }}>{c.business_name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>{c.industry} · {c.business_city}, {c.business_state}</p>
                  {c.vapi_phone_number && <p className="text-xs font-mono mt-2" style={{ color: theme.textMuted }}>{fmtPhone(c.vapi_phone_number)}</p>}
                </button>
              ))}
            </div>
          )}

          {/* Industry Templates (enterprise) */}
          {effectivePlan === 'enterprise' && industries.length > 0 && (
            <div className="mt-10">
              <SectionHeader icon={Cpu} label="Industry Templates" theme={theme}>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Enterprise</span>
              </SectionHeader>
              <p className="text-xs mb-4" style={{ color: theme.textMuted }}>Default AI config applied when new clients sign up.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {industries.map(ind => {
                  const Ic = ICON_MAP[ind.icon] || Building2;
                  return (
                    <Link key={ind.frontendKey} href={`/agency/templates/${ind.frontendKey}`} className="rounded-xl p-4 transition-all"
                      style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.hover)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = theme.card)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: ind.hasCustomTemplate ? theme.primary15 : theme.hover }}>
                          <Ic className="h-5 w-5" style={{ color: ind.hasCustomTemplate ? theme.primary : theme.textMuted }} />
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={ind.hasCustomTemplate ? { backgroundColor: theme.primary15, color: theme.primary } : { backgroundColor: theme.hover, color: theme.textMuted }}>
                          {ind.hasCustomTemplate ? 'Custom' : 'Default'}
                        </span>
                      </div>
                      <p className="font-medium text-sm" style={{ color: theme.text }}>{ind.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{ind.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voice Library */}
          {voicesLoaded && allVoices.length > 0 && (
            <div className="mt-10">
              <SectionHeader icon={Volume2} label="Voice Library" theme={theme} />
              <p className="text-xs mb-4" style={{ color: theme.textMuted }}>ElevenLabs voices available for AI receptionists.</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {allVoices.map(v => (
                  <div key={v.id} className="rounded-lg p-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                      <span className="font-medium text-xs" style={{ color: theme.text }}>{v.name}</span>
                      {v.recommended && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>REC</span>}
                    </div>
                    <p className="text-[10px] capitalize" style={{ color: theme.textMuted }}>{v.gender} · {v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SELECTED CLIENT — FULL AI LAB                                    */}
      {/* ================================================================ */}
      {selectedClient && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT COLUMN */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Client Info Card */}
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                    <Building className="h-5 w-5" style={{ color: theme.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{selectedClient.business_name}</p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>{selectedClient.industry} · {selectedClient.business_city}, {selectedClient.business_state}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>Agency: <span style={{ color: theme.text }}>{agency?.name}</span></p>
                  </div>
                </div>
                {selectedClient.vapi_phone_number && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>AI Phone</p>
                    <p className="text-sm font-mono font-medium" style={{ color: theme.primary }}>{fmtPhone(selectedClient.vapi_phone_number)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI CONFIGURATION EDITOR */}
            {configLoading ? (
              <div className="rounded-xl p-8 flex items-center justify-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
                <span className="ml-3 text-sm" style={{ color: theme.textMuted }}>Loading AI config from VAPI...</span>
              </div>
            ) : config ? (
              <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <SectionHeader icon={Pencil} label="AI Configuration" theme={theme}>
                  <div className="flex items-center gap-2">
                    {configSaved && <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Saved!</span>}
                    {configError && <span className="text-xs font-medium" style={{ color: '#ef4444' }}>{configError}</span>}
                    <button onClick={saveConfig} disabled={configSaving || !hasChanges}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40"
                      style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                      {configSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save Changes
                    </button>
                  </div>
                </SectionHeader>

                <div className="space-y-4">
                  {/* Row 1: Call Mode + Voice + Model + Temp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Call Mode */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Call Mode</label>
                      <select value={editCallMode} onChange={e => setEditCallMode(e.target.value as 'primary' | 'secondary')}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                        <option value="primary">Primary — AI answers all calls</option>
                        <option value="secondary">Secondary — Overflow only</option>
                      </select>
                    </div>
                    {/* Voice */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Voice</label>
                      <select value={editVoice} onChange={e => setEditVoice(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                        {allVoices.length > 0 ? (
                          <>
                            <optgroup label="Female">
                              {allVoices.filter(v => v.gender === 'female').map(v => (
                                <option key={v.id} value={v.id}>{v.name}{v.recommended ? ' ★' : ''}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Male">
                              {allVoices.filter(v => v.gender === 'male').map(v => (
                                <option key={v.id} value={v.id}>{v.name}{v.recommended ? ' ★' : ''}</option>
                              ))}
                            </optgroup>
                          </>
                        ) : (
                          <option value={editVoice}>{editVoice}</option>
                        )}
                      </select>
                    </div>
                    {/* Model */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Model</label>
                      <select value={editModel} onChange={e => setEditModel(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                        {MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        {!MODEL_OPTIONS.find(m => m.id === editModel) && <option value={editModel}>{editModel}</option>}
                      </select>
                    </div>
                    {/* Temperature */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Temperature: {editTemp}</label>
                      <input type="range" min="0" max="1" step="0.1" value={editTemp}
                        onChange={e => setEditTemp(parseFloat(e.target.value))}
                        className="w-full mt-1" style={{ accentColor: theme.primary }} />
                      <div className="flex justify-between text-[9px] mt-0.5" style={{ color: theme.textMuted }}>
                        <span>Precise</span><span>Creative</span>
                      </div>
                    </div>
                  </div>

                  {/* Greeting */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Opening Greeting</label>
                    <input type="text" value={editGreeting} onChange={e => setEditGreeting(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}
                      placeholder="Hi, you've reached..." />
                  </div>

                  {/* System Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>System Prompt</label>
                      <span className="text-[10px] font-mono" style={{ color: theme.textMuted }}>{editPrompt.length.toLocaleString()} chars</span>
                    </div>
                    <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={10}
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono resize-y"
                      style={{ ...inputStyle, minHeight: '160px' }} />
                  </div>

                  {/* Tools (read-only) */}
                  {config.tools.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>Active Tools:</span>
                      {config.tools.map(t => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{ backgroundColor: theme.hover, color: theme.text }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedClient.vapi_assistant_id ? (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <AlertCircle className="h-6 w-6 mx-auto mb-2" style={{ color: '#f59e0b' }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>Could not load AI config from VAPI. The assistant may need re-provisioning.</p>
              </div>
            ) : (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <Bot className="h-6 w-6 mx-auto mb-2" style={{ color: theme.textMuted }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>This client has no AI assistant. Add one from the Clients page.</p>
              </div>
            )}

            {/* TEST CALL */}
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <SectionHeader icon={PhoneCall} label="Test Call" theme={theme} />

              {callState === 'idle' || callState === 'ended' ? (
                <>
                  <button onClick={startCall} disabled={!selectedClient?.vapi_assistant_id || !vapiKey}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText, boxShadow: `0 0 30px ${theme.primary}25` }}>
                    <PhoneCall className="h-5 w-5" />
                    {callState === 'ended' ? 'Call Again' : 'Start Test Call'}
                  </button>
                  {callState === 'ended' && callDuration > 0 && (
                    <p className="text-xs mt-2" style={{ color: theme.textMuted }}>Last call: {fmtDuration(callDuration)}</p>
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
                  <button onClick={endCall} className="text-xs px-4 py-1.5 rounded-full"
                    style={{ color: '#ef4444', backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>Cancel</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>
                      <Radio className="h-3 w-3 animate-pulse" /> LIVE
                    </span>
                    <span className="text-lg font-mono font-bold" style={{ color: theme.text }}>{fmtDuration(callDuration)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                      style={{ backgroundColor: isMuted ? (theme.isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : theme.hover, border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : theme.border}`, color: isMuted ? '#ef4444' : theme.text }}>
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <button onClick={endCall} className="flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                      <PhoneOff className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE TRANSCRIPT */}
            <div className="rounded-xl flex flex-col" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, minHeight: '200px', maxHeight: '350px' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <MsgIcon className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Live Transcript</span>
                </div>
                {transcript.filter(t => t.isFinal).length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                    {transcript.filter(t => t.isFinal).length} msgs
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <Bot className="h-6 w-6 mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                    <p className="text-xs" style={{ color: theme.textMuted }}>{isCallActive ? 'Waiting for speech...' : 'Start a call to see the transcript'}</p>
                  </div>
                )}
                {transcript.map(e => (
                  <div key={e.id} className={`flex gap-2 ${e.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {e.role !== 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}>
                        <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                      </div>
                    )}
                    <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                      style={{
                        backgroundColor: e.role === 'user' ? theme.primary : theme.hover,
                        color: e.role === 'user' ? theme.primaryText : theme.text,
                        opacity: e.isFinal ? 1 : 0.5,
                        borderBottomRightRadius: e.role === 'user' ? '4px' : undefined,
                        borderBottomLeftRadius: e.role !== 'user' ? '4px' : undefined,
                      }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{e.text}</span>
                    </div>
                    {e.role === 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                        <User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* SMS PHONE SWAP */}
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>SMS Notifications Go To</span>
                </div>
                {phoneSwapped && (
                  <button onClick={revertPhone} disabled={phoneSwapping}
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full disabled:opacity-50"
                    style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.1)' : '#fffbeb', color: '#f59e0b', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
                    <Undo2 className="h-3 w-3" /> Revert to Owner
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="tel" value={phoneEditing ? notifPhone : fmtPhone(notifPhone)}
                  onChange={e => setNotifPhone(e.target.value)} onFocus={() => setPhoneEditing(true)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-mono" style={inputStyle} />
                <button onClick={swapPhone} disabled={phoneSwapping || !notifPhone.trim()}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-40"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {phoneSwapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: theme.textMuted }}>
                {phoneSwapped
                  ? `Swapped from owner (${fmtPhone(origPhone)}). Remember to revert after testing.`
                  : 'Change to your number to receive test call SMS summaries.'}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN — EVENT LOG */}
          <div className="w-full lg:w-72 flex-shrink-0">
            {/* Mobile toggle */}
            <button onClick={() => setShowEvents(!showEvents)}
              className="lg:hidden w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
                <span className="text-sm font-medium">Event Log</span>
                {eventLog.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{eventLog.length}</span>
                )}
              </div>
              {showEvents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <div className={`rounded-xl overflow-hidden ${showEvents ? '' : 'hidden lg:block'}`}
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, height: 'calc(100vh - 260px)', minHeight: '400px' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>VAPI Events</span>
                </div>
                {eventLog.length > 0 && (
                  <button onClick={() => setEventLog([])} className="text-[10px] px-2 py-0.5 rounded"
                    style={{ color: theme.textMuted, backgroundColor: theme.hover }}>Clear</button>
                )}
              </div>
              <div className="overflow-y-auto p-3 space-y-1.5" style={{ height: 'calc(100% - 48px)' }}>
                {eventLog.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Code2 className="h-6 w-6 mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                    <p className="text-[10px]" style={{ color: theme.textMuted }}>Events appear during calls</p>
                  </div>
                )}
                {eventLog.map(e => {
                  const c = { info: theme.textMuted, warn: '#f59e0b', error: '#ef4444', success: '#22c55e' }[e.level];
                  return (
                    <div key={e.id} className="rounded-md px-2.5 py-1.5 text-[11px] font-mono"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', border: `1px solid ${theme.border}` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate" style={{ color: c }}>{e.type}</span>
                        <span className="flex-shrink-0 text-[9px]" style={{ color: theme.textMuted }}>
                          {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] truncate" style={{ color: theme.textMuted }}>{e.message}</p>
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

function MsgIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}