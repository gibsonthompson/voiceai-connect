'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, RotateCcw, Play, Pause, AlertCircle,
  Check, Info, ChevronDown,
  BookOpen, Globe, Briefcase, HelpCircle, FileText, Plus, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import VoicePicker from '@/components/agency/VoicePicker';
import { CustomSelect } from '@/components/ui/custom-select';

interface Voice {
  id: string; name: string; description: string; gender: string;
  accent?: string; style?: string; previewUrl?: string; recommended?: boolean;
}

interface TemplateData {
  id: string | null; isCustom: boolean; isActive: boolean;
  system_prompt: string; first_message: string; voice_id: string; voice_speed: number; voice: Voice | null;
  model: string; temperature: number; tts_model?: string; transcriber_model?: string; knowledge_base_data: KBData | null; updated_at: string | null;
}

interface KBData {
  services?: string; faqs?: string; businessHours?: string; additionalInfo?: string; websiteUrl?: string;
}

interface IndustryInfo {
  frontendKey: string; backendKey: string; label: string; description: string; icon: string; kb_status?: string; documents?: { id: string; name: string; uploaded_at: string }[];
}

interface Defaults {
  system_prompt: string; first_message: string; voice_id: string; model: string; temperature: number; voice_speed: number; tts_model?: string; transcriber_model?: string;
}

interface ServiceRow { id: string; name: string; price: string; description: string; }
interface FaqRow { id: string; question: string; answer: string; }

const MODEL_OPTIONS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fastest response time, lowest cost — best for real-time voice', tag: 'Default' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', desc: 'Latest model, better instruction following — same speed tier', tag: 'Latest' },
  { id: 'gpt-4o', name: 'GPT-4o', desc: 'Strongest reasoning but slower — use for complex industries', tag: 'Premium' },
];

const TTS_MODEL_OPTIONS: { id: string; name: string; desc: string; tag: string; comingSoon?: boolean }[] = [
  { id: 'eleven_flash_v2_5', name: 'Flash v2.5', desc: 'Fastest and most responsive on live calls (~75ms). The real-time standard, recommended for phone receptionists.', tag: 'Recommended' },
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2', desc: 'Very natural across 29 languages, but noticeably higher latency. Best when voice quality matters more than call speed.', tag: 'Most natural' },
  { id: 'eleven_v3', name: 'Eleven v3', desc: 'Most expressive and human, but built for pre-rendered audio, so it can feel laggy on fast back-and-forth calls.', tag: 'Most expressive' },
  // Eleven v3 Conversational is v3's expressiveness at real-time latency (~280ms,
  // GA Aug 2026). Not selectable yet because our voice provider (Vapi) lists
  // eleven_v3 but not eleven_v3_conversational. When Vapi adds it, drop `comingSoon`
  // here and add 'eleven_v3_conversational' to the backend validTtsModels list.
  { id: 'eleven_v3_conversational', name: 'Eleven v3 Conversational', desc: "v3's expressiveness at real-time speed (~280ms). Available as soon as our voice provider adds support.", tag: 'Coming soon', comingSoon: true },
];

const TRANSCRIBER_OPTIONS = [
  { id: 'nova-3', name: 'Nova-3', desc: 'Best accuracy, recommended for phone calls, accents, and multiple languages', tag: 'Recommended' },
  { id: 'flux-general-multi', name: 'Flux', desc: 'Newest model, best at sensing when the caller is done talking (fewer interruptions and awkward pauses). Experimental, worth testing.', tag: 'New' },
  { id: 'nova-2', name: 'Nova-2', desc: 'Standard accuracy', tag: 'Standard' },
];

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

function parseServices(text: string): ServiceRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  const parsed: ServiceRow[] = [];
  lines.forEach((line, i) => {
    const clean = line.trim().replace(/^-\s*/, '');
    if (!clean) return;
    const parts = clean.split(/\s+-\s+/);
    let name = '', price = '', desc: string[] = [];
    parts.forEach((p, j) => {
      const t = p.trim();
      if (j === 0) name = t;
      else if (t.startsWith('$')) price = t;
      else if (t) desc.push(t);
    });
    if (name) parsed.push({ id: `${i + 1}`, name, price, description: desc.join(' - ') });
  });
  return parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }];
}

function parseFaqs(text: string): FaqRow[] {
  const parsed: FaqRow[] = [];
  const lines = text.split('\n');
  let q = '', a = '';
  lines.forEach(line => {
    if (line.trim().startsWith('Q:')) {
      if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
      q = line.replace(/^Q:\s*/i, '').trim(); a = '';
    } else if (line.trim().startsWith('A:')) {
      a = line.replace(/^A:\s*/i, '').trim();
    }
  });
  if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
  return parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }];
}

function formatServicesText(services: ServiceRow[]): string {
  return services.filter(s => s.name.trim()).map(s => {
    const p = [`- ${s.name}`]; if (s.price) p.push(s.price); if (s.description) p.push(s.description); return p.join(' - ');
  }).join('\n');
}

function formatFaqsText(faqs: FaqRow[]): string {
  return faqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const industry = params.industry as string;
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [industryInfo, setIndustryInfo] = useState<IndustryInfo | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [defaults, setDefaults] = useState<Defaults | null>(null);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [ttsModel, setTtsModel] = useState('eleven_flash_v2_5');
  const [transcriberModel, setTranscriberModel] = useState('nova-3');
  const [temperature, setTemperature] = useState(0.7);
  const [speed, setSpeed] = useState(1);

  const [kbWebsite, setKbWebsite] = useState('');
  const [kbServices, setKbServices] = useState<ServiceRow[]>([{ id: '1', name: '', price: '', description: '' }]);
  const [kbFaqs, setKbFaqs] = useState<FaqRow[]>([{ id: '1', question: '', answer: '' }]);
  const [kbAdditionalInfo, setKbAdditionalInfo] = useState('');
  const [kbExpanded, setKbExpanded] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; name: string; uploaded_at: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const docFileRef = useRef<HTMLInputElement>(null);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [newVoiceId, setNewVoiceId] = useState('');
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceGender, setNewVoiceGender] = useState<'female' | 'male' | ''>('');
  const [addingVoice, setAddingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const getToken = () => localStorage.getItem('auth_token') || '';
  const isScalePlan = ['trialing', 'trial'].includes(agency?.subscription_status || '') || String(agency?.plan_type || '').toLowerCase() === 'scale';
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  useEffect(() => { if (agency && industry) { fetchTemplateData(); fetchVoices(); } }, [agency, industry]);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);
  // While the custom-industry KB is still generating, poll until it's ready so
  // the seeded prompt + knowledge base appear without a manual refresh.
  useEffect(() => {
    if (industryInfo?.kb_status !== 'generating') return;
    const t = setInterval(() => { fetchTemplateData(); }, 4000);
    return () => clearInterval(t);
  }, [industryInfo?.kb_status]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplateData = async () => {
    if (!agency) return;
    try {
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) { if (r.status === 403) { router.push('/agency/templates'); return; } throw new Error('Failed'); }
      const data = await r.json();
      setIndustryInfo(data.industry); setTemplate(data.template); setDefaults(data.defaults);
      setDocuments(Array.isArray((data.industry as any)?.documents) ? (data.industry as any).documents : []);
      setSystemPrompt(data.template.system_prompt); setFirstMessage(data.template.first_message);
      setVoiceId(data.template.voice_id); setModel(data.template.model || 'gpt-4o-mini'); setTemperature(data.template.temperature); setSpeed(data.template.voice_speed ?? 1); setTtsModel(data.template.tts_model || 'eleven_flash_v2_5'); setTranscriberModel(data.template.transcriber_model || 'nova-3');
      const kb = data.template.knowledge_base_data;
      if (kb) {
        setKbWebsite(kb.websiteUrl || '');
        if (kb.services) setKbServices(parseServices(kb.services));
        if (kb.faqs) setKbFaqs(parseFaqs(kb.faqs));
        setKbAdditionalInfo(kb.additionalInfo || '');
      }
    } catch { setError('Failed to load template'); }
    finally { setLoading(false); }
  };

  const fetchVoices = async () => {
    if (!agency) return;
    try { const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/voices`, { headers: { Authorization: `Bearer ${getToken()}` } }); if (r.ok) { const d = await r.json(); setVoices(d.voices || []); } } catch {}
  };

  const playFromUrl = (voiceId: string, url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(url); audioRef.current = a;
    a.onended = () => setPlayingVoiceId(null); a.onerror = () => setPlayingVoiceId(null);
    a.play().catch(() => setPlayingVoiceId(null)); setPlayingVoiceId(voiceId);
  };

  // Synthesize a sample in the selected voice (same path the client editor uses),
  // so every voice previews, presets and custom alike, not just ones with a
  // stock sample URL. Falls back to a stored previewUrl if synthesis fails.
  const playPreview = async (voice: Voice) => {
    if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingVoiceId(null); return; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingVoiceId(voice.id);
    try {
      const r = await fetch(`/api/voice-preview`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voice.id, text: "Hi, thanks for calling! How can I help you today?" }),
      });
      if (!r.ok) throw new Error('preview failed');
      const blob = await r.blob();
      playFromUrl(voice.id, URL.createObjectURL(blob));
    } catch {
      if (voice.previewUrl) playFromUrl(voice.id, voice.previewUrl);
      else setPlayingVoiceId(null);
    }
  };


  const handleSave = async () => {
    if (!agency) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const kbData: KBData = { websiteUrl: kbWebsite, services: formatServicesText(kbServices), faqs: formatFaqsText(kbFaqs), additionalInfo: kbAdditionalInfo };
      const hasKb = kbData.services || kbData.faqs || kbData.additionalInfo || kbData.websiteUrl;
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ system_prompt: systemPrompt, first_message: firstMessage, voice_id: voiceId, model, tts_model: ttsModel, transcriber_model: transcriberModel, temperature, voice_speed: speed, is_active: true, knowledge_base_data: hasKb ? kbData : null }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Failed'); }
      setSaved(true); setTimeout(() => setSaved(false), 3000); await fetchTemplateData();
    } catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!agency || !confirm('Reset to default template? Your custom changes will be lost.')) return;
    setResetting(true); setError(null);
    try {
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('Failed');
      if (defaults) { setSystemPrompt(defaults.system_prompt); setFirstMessage(defaults.first_message); setVoiceId(defaults.voice_id); setTemperature(defaults.temperature); setModel(defaults.model || 'gpt-4o-mini'); setTtsModel(defaults.tts_model || 'eleven_flash_v2_5'); setTranscriberModel(defaults.transcriber_model || 'nova-3'); setSpeed(defaults.voice_speed ?? 1); }
      setKbWebsite(''); setKbServices([{ id: '1', name: '', price: '', description: '' }]);
      setKbFaqs([{ id: '1', question: '', answer: '' }]); setKbAdditionalInfo('');
      await fetchTemplateData();
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setResetting(false); }
  };

  const addService = () => setKbServices(p => [...p, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  const removeService = (id: string) => { if (kbServices.length > 1) setKbServices(p => p.filter(s => s.id !== id)); };
  const updateService = (id: string, field: string, value: string) => setKbServices(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addFaq = () => setKbFaqs(p => [...p, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFaq = (id: string) => { if (kbFaqs.length > 1) setKbFaqs(p => p.filter(f => f.id !== id)); };
  const updateFaq = (id: string, field: string, value: string) => setKbFaqs(p => p.map(f => f.id === id ? { ...f, [field]: value } : f));

  const hasChanges = template && (
    systemPrompt !== template.system_prompt || firstMessage !== template.first_message ||
    voiceId !== template.voice_id || model !== (template.model || 'gpt-4o-mini') || ttsModel !== (template.tts_model || 'eleven_flash_v2_5') || transcriberModel !== (template.transcriber_model || 'nova-3') || temperature !== template.temperature || speed !== (template.voice_speed ?? 1) ||
    kbWebsite !== (template.knowledge_base_data?.websiteUrl || '') || kbAdditionalInfo !== (template.knowledge_base_data?.additionalInfo || '') ||
    formatServicesText(kbServices) !== (template.knowledge_base_data?.services || '') || formatFaqsText(kbFaqs) !== (template.knowledge_base_data?.faqs || '')
  );

  const selectedModelObj = MODEL_OPTIONS.find(m => m.id === model);
  const selectedTtsObj = TTS_MODEL_OPTIONS.find(m => m.id === ttsModel);
  const selectedTranscriberObj = TRANSCRIBER_OPTIONS.find(m => m.id === transcriberModel);

  if (contextLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>;
  }

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || !agency) return;
    if (file.size > 6 * 1024 * 1024) { setDocError('Document is too large (max 6MB).'); return; }
    setDocError(''); setUploadingDoc(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => { const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.onerror = () => reject(new Error('read failed')); r.readAsDataURL(file); });
      const res = await fetch(`${api}/api/agency/${agency.id}/custom-industries/${industry}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: file.name, dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setDocuments(data.documents || []);
      await fetchTemplateData();
    } catch (err: any) { setDocError(err?.message || 'Could not attach the document.'); }
    finally { setUploadingDoc(false); }
  };
  const handleDeleteDoc = async (docId: string) => {
    if (!agency) return;
    setDocError('');
    try {
      const res = await fetch(`${api}/api/agency/${agency.id}/custom-industries/${industry}/documents/${docId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setDocuments(data.documents || []);
      await fetchTemplateData();
    } catch (err: any) { setDocError(err?.message || 'Could not remove the document.'); }
  };

  const handleAddVoice = async () => {
    if (!agency || !newVoiceId.trim()) return;
    setVoiceError(''); setAddingVoice(true);
    try {
      const res = await fetch(`${api}/api/agency/${agency.id}/ai-templates/voices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ voiceId: newVoiceId.trim(), name: newVoiceName.trim(), gender: newVoiceGender || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add that voice.');
      setVoices(data.voices || []);
      if (data.voice?.id) setVoiceId(data.voice.id);
      setNewVoiceId(''); setNewVoiceName(''); setNewVoiceGender(''); setShowAddVoice(false);
    } catch (err: any) { setVoiceError(err?.message || 'Could not add that voice.'); }
    finally { setAddingVoice(false); }
  };
  const handleDeleteCustomVoice = async (id: string) => {
    if (!agency) return;
    setVoiceError('');
    try {
      const res = await fetch(`${api}/api/agency/${agency.id}/ai-templates/voices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove that voice.');
      setVoices(data.voices || []);
      if (voiceId === id && defaults) setVoiceId(defaults.voice_id);
    } catch (err: any) { setVoiceError(err?.message || 'Could not remove that voice.'); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/agency/templates" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors" style={{ color: theme.textMuted }}>
          <ArrowLeft className="h-4 w-4" /> Back to AI Lab
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{industryInfo?.label || 'Edit Template'}</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>{industryInfo?.description}</p>
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>New clients in this industry will inherit this configuration.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {template?.isCustom && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Check className="h-3 w-3" /> Custom
              </span>
            )}
          </div>
        </div>
      </div>

      {industryInfo?.kb_status === 'generating' && (
        <div className="mb-6 rounded-xl p-5 flex items-start gap-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <Loader2 className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" style={{ color: theme.primary }} />
          <div>
            <p className="text-sm font-medium" style={{ color: theme.text }}>Building your {industryInfo.label} receptionist…</p>
            <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>The AI is writing an industry-specific knowledge base and system prompt for this vertical. This page updates on its own when it's ready, usually under a minute. Hold off on editing until it finishes so your changes aren't overwritten.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
        </div>
      )}
      {saved && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <Check className="h-5 w-5" style={{ color: theme.primary }} />
          <p className="text-sm" style={{ color: theme.primary }}>Template saved! New clients will use this configuration.</p>
        </div>
      )}

      <div className="mb-6 rounded-xl p-3 flex items-start gap-3" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.04), border: `1px solid ${hexToRgba(theme.primary, 0.15)}` }}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Use <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: theme.hover }}>{'{businessName}'}</code> in prompts — it&apos;s replaced with the client&apos;s actual business name at signup.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-4 min-w-0">
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Response model</label>
              <CustomSelect value={model} onChange={(v) => setModel(v)} options={[...MODEL_OPTIONS.map(m => ({ value: m.id, label: `${m.name}${m.tag ? ` (${m.tag})` : ''}` })), ...(MODEL_OPTIONS.find(m => m.id === model) ? [] : [{ value: model, label: model }])]} ui={{ inputStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.isDark ? '#232321' : '#ffffff', panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark }} />
              {selectedModelObj && <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{selectedModelObj.desc}</p>}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Voice engine</label>
              <CustomSelect value={ttsModel} onChange={(v) => setTtsModel(v)} options={[...TTS_MODEL_OPTIONS.filter(m => !m.comingSoon).map(m => ({ value: m.id, label: `${m.name}${m.tag ? ` (${m.tag})` : ''}` })), ...(TTS_MODEL_OPTIONS.find(m => m.id === ttsModel) ? [] : [{ value: ttsModel, label: ttsModel }])]} ui={{ inputStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.isDark ? '#232321' : '#ffffff', panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark }} />
              {selectedTtsObj && <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{selectedTtsObj.desc}</p>}
              {TTS_MODEL_OPTIONS.some(m => m.comingSoon) && <p className="text-[11px] mt-1.5" style={{ color: theme.primary }}>Coming soon: {TTS_MODEL_OPTIONS.filter(m => m.comingSoon).map(m => m.name).join(', ')} — we'll add it automatically once our voice provider supports it.</p>}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Speech recognition</label>
              <CustomSelect value={transcriberModel} onChange={(v) => setTranscriberModel(v)} options={[...TRANSCRIBER_OPTIONS.map(m => ({ value: m.id, label: `${m.name}${m.tag ? ` (${m.tag})` : ''}` })), ...(TRANSCRIBER_OPTIONS.find(m => m.id === transcriberModel) ? [] : [{ value: transcriberModel, label: transcriberModel }])]} ui={{ inputStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.isDark ? '#232321' : '#ffffff', panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark }} />
              {selectedTranscriberObj && <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{selectedTranscriberObj.desc}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Temperature: {temperature}</label>
                <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full mt-1" style={{ accentColor: theme.primary }} />
                <div className="flex justify-between text-sm mt-0.5" style={{ color: theme.textMuted }}><span>Precise</span><span>Creative</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Voice Speed: {speed.toFixed(2)}x</label>
                <input type="range" min="0.7" max="1.2" step="0.05" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full mt-1" style={{ accentColor: theme.primary }} />
                <div className="flex justify-between text-sm mt-0.5" style={{ color: theme.textMuted }}><span>Slower</span><span>Faster</span></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textMuted }}>Opening Greeting</label>
              <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={inputStyle} placeholder="Hi, you've reached {businessName}..." />
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <VoicePicker theme={theme} voices={voices} value={voiceId} onChange={setVoiceId} filter={voiceFilter} onFilter={setVoiceFilter} playingVoiceId={playingVoiceId} onPlay={playPreview} onDeleteCustom={isScalePlan ? handleDeleteCustomVoice : undefined} />
            {voiceError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{voiceError}</p>}
            <div className="mt-3">
              {isScalePlan ? (
                !showAddVoice ? (
                  <button onClick={() => { setShowAddVoice(true); setVoiceError(''); }} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.primary }}>
                    <Plus className="h-3.5 w-3.5" /> Add a custom voice
                  </button>
                ) : (
                  <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Paste an ElevenLabs voice ID and we'll add it to your voice options.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={newVoiceId} onChange={e => setNewVoiceId(e.target.value)} placeholder="ElevenLabs voice ID" className="flex-1 rounded-lg px-2.5 py-1.5 text-sm" style={inputStyle} />
                      <input value={newVoiceName} onChange={e => setNewVoiceName(e.target.value)} placeholder="Label (optional)" className="flex-1 rounded-lg px-2.5 py-1.5 text-sm" style={inputStyle} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        {(['', 'female', 'male'] as const).map(g => (
                          <button key={g || 'unset'} onClick={() => setNewVoiceGender(g)} className="px-2.5 py-1 rounded-md text-xs font-medium transition" style={{ backgroundColor: newVoiceGender === g ? theme.primary : theme.hover, color: newVoiceGender === g ? theme.primaryText : theme.textMuted }}>
                            {g === '' ? 'No tag' : g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setShowAddVoice(false); setVoiceError(''); }} className="text-xs font-medium px-2.5 py-1.5" style={{ color: theme.textMuted }}>Cancel</button>
                        <button onClick={handleAddVoice} disabled={addingVoice || !newVoiceId.trim()} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                          {addingVoice ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</> : <><Plus className="h-3.5 w-3.5" /> Add voice</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs" style={{ color: theme.textMuted }}>Want to use your own ElevenLabs voice? Custom voices are available on the Scale plan.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                <span className="text-sm font-medium" style={{ color: theme.textMuted }}>Knowledge Base</span>
              </div>
              <button onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center gap-1 text-xs font-medium transition" style={{ color: theme.primary }}>
                {kbExpanded ? 'Hide' : 'Edit'}
                <ChevronDown className={`h-3 w-3 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {!kbExpanded ? (
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {kbServices.filter(s => s.name.trim()).length} services · {kbFaqs.filter(f => f.question.trim()).length} FAQs{kbAdditionalInfo ? ' · Has additional info' : ''}
                {!kbServices.some(s => s.name.trim()) && !kbFaqs.some(f => f.question.trim()) && !kbAdditionalInfo ? 'No KB data — clients inherit industry default.' : ''}
              </p>
            ) : (
              <div className="space-y-3 mt-2">
                <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.04) }}>
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                  <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>Inherited by new clients. They can customize from their dashboard.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: theme.textMuted }}><Globe className="w-3 h-3" style={{ color: theme.primary }} /> Website</label>
                  <input type="url" value={kbWebsite} onChange={e => setKbWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-lg px-2.5 py-1.5 text-xs" style={inputStyle} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: theme.textMuted }}><Briefcase className="w-3 h-3" style={{ color: theme.primary }} /> Services</label>
                  {kbServices.map(s => (
                    <div key={s.id} className="flex gap-1.5 mb-1.5">
                      <input type="text" value={s.name} onChange={e => updateService(s.id, 'name', e.target.value)} placeholder="Service" className="flex-1 rounded-lg px-2 py-1 text-sm min-w-0" style={inputStyle} />
                      <input type="text" value={s.price} onChange={e => updateService(s.id, 'price', e.target.value)} placeholder="$" className="w-20 rounded-lg px-2.5 py-1.5 text-sm" style={inputStyle} />
                      <button onClick={() => removeService(s.id)} disabled={kbServices.length === 1} className="p-1 disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button onClick={addService} className="flex items-center gap-1 text-sm font-medium mt-1 px-2 py-1 rounded transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-2.5 h-2.5" /> Add</button>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: theme.textMuted }}><HelpCircle className="w-3 h-3" style={{ color: theme.primary }} /> FAQs</label>
                  {kbFaqs.map(f => (
                    <div key={f.id} className="mb-1.5 space-y-1">
                      <div className="flex gap-1.5">
                        <input type="text" value={f.question} onChange={e => updateFaq(f.id, 'question', e.target.value)} placeholder="Q:" className="flex-1 rounded-lg px-2 py-1 text-sm min-w-0" style={inputStyle} />
                        <button onClick={() => removeFaq(f.id)} disabled={kbFaqs.length === 1} className="p-1 disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <textarea value={f.answer} onChange={e => updateFaq(f.id, 'answer', e.target.value)} placeholder="A:" rows={1} className="w-full rounded-lg px-2 py-1 text-sm resize-none" style={inputStyle} />
                    </div>
                  ))}
                  <button onClick={addFaq} className="flex items-center gap-1 text-sm font-medium mt-1 px-2 py-1 rounded transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-2.5 h-2.5" /> Add</button>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: theme.textMuted }}><FileText className="w-3 h-3" style={{ color: theme.primary }} /> Additional Info</label>
                  <textarea value={kbAdditionalInfo} onChange={e => setKbAdditionalInfo(e.target.value)} placeholder="Policies, service areas..." rows={2} className="w-full rounded-lg px-2.5 py-1.5 text-sm resize-none" style={inputStyle} />
                </div>
              </div>
            )}
          </div>

          {industry.startsWith('custom_') && industryInfo?.kb_status !== 'generating' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.text }}><FileText className="w-4 h-4" style={{ color: theme.primary }} /> Documents</label>
                <input ref={docFileRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={handleUploadDoc} className="hidden" />
                <button onClick={() => docFileRef.current?.click()} disabled={uploadingDoc} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: hexToRgba(theme.primary, 0.1), border: `1px solid ${hexToRgba(theme.primary, 0.3)}`, color: theme.primary }}>
                  {uploadingDoc ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading...</> : <><Plus className="h-3.5 w-3.5" /> Attach document</>}
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Upload reference docs (what this business does, policies, service details). The AI reads them as part of this industry's knowledge base. PDF, Word, text, or markdown, up to 6MB each.</p>
              {docError && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{docError}</p>}
              {documents.length === 0 ? (
                <p className="text-xs" style={{ color: theme.textMuted }}>No documents attached yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                      <span className="text-sm truncate flex-1" style={{ color: theme.text }}>{d.name}</span>
                      <button onClick={() => handleDeleteDoc(d.id)} className="p-1" style={{ color: theme.textMuted }} title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button onClick={handleReset} disabled={resetting || !template?.isCustom}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40"
              style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset
            </button>
            <button onClick={handleSave} disabled={saving || !hasChanges || industryInfo?.kb_status === 'generating'}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-medium transition disabled:opacity-40"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Save className="h-3.5 w-3.5" /> Save Template</>}
            </button>
          </div>
        </div>

        <div className="lg:w-[45%] xl:w-[50%] flex-shrink-0">
          <div className="rounded-xl p-4 lg:sticky lg:top-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: theme.textMuted }}>System Prompt</label>
              <span className="text-xs font-mono" style={{ color: theme.textMuted }}>{systemPrompt.length.toLocaleString()} chars</span>
            </div>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed"
              style={{ ...inputStyle, resize: 'vertical', minHeight: '500px', height: '70vh', maxHeight: '80vh' }}
              placeholder="Enter the system prompt..." />
            <p className="text-sm mt-1.5" style={{ color: theme.textMuted }}>
              Use <code className="px-1 py-0.5 rounded text-sm" style={{ backgroundColor: theme.hover }}>{'{businessName}'}</code> — auto-replaced at signup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}