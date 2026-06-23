'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Clock, BookOpen, Globe, HelpCircle, FileText, MapPin,
  Loader2, ChevronDown, Plus, Trash2, Check, Edit3, X, Sparkles
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import StaffMembersSection from '@/components/client/StaffMembersSection';
import ClientServicesSection from '@/components/client/ClientServicesSection';

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}
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

function formatIndustry(raw: string | null | undefined): string {
  if (!raw) return 'Not set';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Parses the structured "BUSINESS DETAILS (Extracted from Website)" summary out
// of the assembled KB document the AI uses. Returns null when the document has
// no website-extracted summary (e.g. an industry-default KB). The scraper
// writes this block in a fixed format (formatStructuredSection), so we parse by
// its headers: top-level **Label:** facts, then "## Section" groups of "- item".
interface AiKnowledge { facts: { label: string; value: string }[]; sections: { title: string; items: string[] }[]; }
function parseAiKnowledge(content: string | null): AiKnowledge | null {
  if (!content) return null;
  const marker = '# BUSINESS DETAILS (Extracted from Website)';
  const start = content.indexOf(marker);
  if (start === -1) return null;

  const rest = content.slice(start + marker.length);
  const nextTop = rest.search(/\n#\s+/); // the "# {business} — Website Content" header
  const block = nextTop === -1 ? rest : rest.slice(0, nextTop);

  const facts: { label: string; value: string }[] = [];
  const sections: { title: string; items: string[] }[] = [];
  let current: { title: string; items: string[] } | null = null;

  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim(), items: [] };
      sections.push(current);
    } else if (line.startsWith('- ')) {
      if (current) current.items.push(line.slice(2).trim());
    } else {
      const m = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (m && !current) facts.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }

  const filled = sections.filter(s => s.items.length > 0);
  if (facts.length === 0 && filled.length === 0) return null;
  return { facts, sections: filled };
}

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}.fu4{animation-delay:160ms}.fu5{animation-delay:200ms}`;

export default function MyBusinessPage() {
  const { client, branding, loading, hasPermission } = useClient();
  const theme = useClientTheme();
  const primaryColor = theme.primary;

  const [message, setMessage] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

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
  const [faqs, setFaqs] = useState<FAQ[]>([{ id: '1', question: '', answer: '' }]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [existingServicesText, setExistingServicesText] = useState('');

  // Service areas — stored on the client AI-settings record, moved here from
  // the AI Agent tab. Feeds the assistant system prompt at call time.
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [origServiceAreas, setOrigServiceAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState('');
  const [savingAreas, setSavingAreas] = useState(false);

  // Read-only "What Your AI Knows" view — the assembled KB document the AI
  // actually uses on calls (from the website scrape), fetched separately from
  // the editable jsonb fields above.
  const [aiKnowsContent, setAiKnowsContent] = useState<string | null>(null);
  const [aiKnowsLoading, setAiKnowsLoading] = useState(false);
  const [aiKnowsUpdated, setAiKnowsUpdated] = useState<string | null>(null);
  const [aiKnowsOpen, setAiKnowsOpen] = useState(false);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (client) {
      setNameValue(client.business_name || '');
      fetchKnowledgeBase();
      fetchServiceAreas();
      fetchAiKnowledge();
    }
  }, [client]);

  const fetchAiKnowledge = async () => {
    if (!client) return;
    setAiKnowsLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/kb-document`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) { setAiKnowsContent(d.content || null); setAiKnowsUpdated(d.updated_at || null); }
      }
    } catch {} finally { setAiKnowsLoading(false); }
  };

  const fetchKnowledgeBase = async () => {
    if (!client) return;
    setKbLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/knowledge-base`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.data) {
          setWebsite(d.websiteUrl || '');
          if (d.data.faqs) parseFAQs(d.data.faqs);
          if (d.data.businessHours) parseBusinessHours(d.data.businessHours);
          setAdditionalInfo(d.data.additionalInfo || '');
          setExistingServicesText(d.data.services || '');
          setKbLastUpdated(d.updated_at || null);
        }
      }
    } catch {} finally { setKbLoading(false); }
  };

  const fetchServiceAreas = async () => {
    if (!client) return;
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/ai-settings`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) {
        const d = await r.json();
        const s = d.settings || {};
        setServiceAreas(s.service_areas || []);
        setOrigServiceAreas(s.service_areas || []);
      }
    } catch {}
  };

  const parseFAQs = (t: string) => {
    const parsed: FAQ[] = [];
    const lines = t.split('\n');
    let q = '', a = '';
    lines.forEach(l => {
      if (l.trim().startsWith('Q:')) { if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); q = l.replace(/^Q:\s*/i, '').trim(); a = ''; }
      else if (l.trim().startsWith('A:')) { a = l.replace(/^A:\s*/i, '').trim(); }
    });
    if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
    setFaqs(parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }]);
  };

  const parseBusinessHours = (t: string) => {
    const lines = t.split('\n');
    const nh = { ...businessHours };
    lines.forEach(l => {
      const lo = l.toLowerCase();
      Object.keys(nh).forEach(day => {
        if (lo.includes(day)) {
          if (lo.includes('closed')) { nh[day as keyof BusinessHours].closed = true; }
          else { const m = l.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i); if (m) { nh[day as keyof BusinessHours].open = m[1]; nh[day as keyof BusinessHours].close = m[2]; nh[day as keyof BusinessHours].closed = false; } }
        }
      });
    });
    setBusinessHours(nh);
  };

  const formatFAQs = (): string => faqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  const formatBusinessHoursForSave = (): string => ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => { const day = businessHours[d as keyof BusinessHours]; return day.closed ? `${d.charAt(0).toUpperCase() + d.slice(1)}: Closed` : `${d.charAt(0).toUpperCase() + d.slice(1)}: ${day.open} - ${day.close}`; }).join('\n');

  const showMsg = (text: string, isError = false) => { setMessage(isError ? `❌ ${text}` : `✅ ${text}`); setTimeout(() => setMessage(''), 3000); };

  const handleSaveBusinessName = async () => {
    if (!client || !nameValue.trim() || nameValue.trim() === client.business_name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ business_name: nameValue.trim() }) });
      const d = await r.json();
      if (d.success) {
        try { const cached = localStorage.getItem('client'); if (cached) { const p = JSON.parse(cached); p.business_name = nameValue.trim(); localStorage.setItem('client', JSON.stringify(p)); } } catch {}
        showMsg('Business name updated!');
      } else { showMsg(d.error || 'Failed', true); }
    } catch { showMsg('Error', true); }
    finally { setSavingName(false); setEditingName(false); }
  };

  const handleSaveBusinessHours = async () => {
    if (!client) return;
    setSavingHours(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/knowledge-base/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ clientId: client.id, businessHours: formatBusinessHoursForSave() }) });
      const d = await r.json();
      if (d.success) { showMsg('Hours updated!'); await fetchKnowledgeBase(); } else showMsg(d.error || 'Failed', true);
    } catch { showMsg('Error', true); }
    finally { setSavingHours(false); }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!client) return;
    setSavingKB(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/knowledge-base/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ clientId: client.id, websiteUrl: website, businessHours: formatBusinessHoursForSave(), services: existingServicesText, faqs: formatFAQs(), additionalInfo }) });
      const d = await r.json();
      if (d.success) { setKbLastUpdated(new Date().toISOString()); showMsg('Knowledge base updated!'); await fetchKnowledgeBase(); } else showMsg(d.error || 'Failed', true);
    } catch { showMsg('Error', true); }
    finally { setSavingKB(false); }
  };

  const addArea = () => {
    const t = newArea.trim();
    if (t && !serviceAreas.includes(t)) { setServiceAreas([...serviceAreas, t]); setNewArea(''); }
  };
  const removeArea = (a: string) => setServiceAreas(serviceAreas.filter(x => x !== a));
  const hasAreaChanges = JSON.stringify(serviceAreas) !== JSON.stringify(origServiceAreas);

  const handleSaveServiceAreas = async () => {
    if (!client) return;
    setSavingAreas(true);
    try {
      // Partial update to the same AI-settings endpoint the AI Agent tab uses.
      // The backend only writes fields present in the body, so ai_tone and
      // booking_mode are untouched. service_areas feeds the assistant prompt.
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/ai-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ service_areas: serviceAreas }) });
      if (r.ok) { setOrigServiceAreas([...serviceAreas]); showMsg('Service areas updated!'); }
      else { let e = 'Failed'; try { e = (await r.json()).error || e; } catch {} showMsg(e, true); }
    } catch { showMsg('Error', true); }
    finally { setSavingAreas(false); }
  };

  const updateBusinessHoursField = (day: keyof BusinessHours, field: 'open' | 'close' | 'closed', value: string | boolean) => { setBusinessHours(p => ({ ...p, [day]: { ...p[day], [field]: value } })); };
  const addFAQ = () => setFaqs(p => [...p, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFAQ = (id: string) => { if (faqs.length > 1) setFaqs(p => p.filter(f => f.id !== id)); };
  const updateFAQ = (id: string, f: keyof FAQ, v: string) => setFaqs(p => p.map(fq => fq.id === id ? { ...fq, [f]: v } : fq));

  const getHoursSummary = () => {
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const wd = days.slice(0,5);
    const same = wd.every(d => { const day = businessHours[d as keyof BusinessHours]; const m = businessHours.monday; return day.closed === m.closed && day.open === m.open && day.close === m.close; });
    if (same && !businessHours.monday.closed) return [`M-F: ${businessHours.monday.open.replace(' ','')}-${businessHours.monday.close.replace(' ','')}`, businessHours.saturday.closed ? 'Sat: Closed' : `Sat: ${businessHours.saturday.open.replace(' ','')}-${businessHours.saturday.close.replace(' ','')}`, businessHours.sunday.closed ? 'Sun: Closed' : `Sun: ${businessHours.sunday.open.replace(' ','')}-${businessHours.sunday.close.replace(' ','')}`];
    return days.map(d => { const day = businessHours[d as keyof BusinessHours]; const n = d.charAt(0).toUpperCase() + d.slice(1,3); return day.closed ? `${n}: Closed` : `${n}: ${day.open.replace(' ','')}-${day.close.replace(' ','')}`; });
  };

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)' };
  const inputStyle = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  const aiKnowledge = parseAiKnowledge(aiKnowsContent);

  const SectionCard = ({ icon: Icon, title, subtitle, children, className = '' }: { icon: any; title: string; subtitle: string; children: React.ReactNode; className?: string }) => (
    <section className={`mb-4 sm:mb-5 ${className}`}>
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06) }}>
              <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm tracking-tight" style={{ color: theme.text }}>{title}</h3>
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
          <Building2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>My Business</h2>
        <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: theme.textMuted }}>Your business info, services, staff, and knowledge base</p>
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Business Details */}
        <div className="fu fu1">
          <SectionCard icon={Building2} title="Business Details" subtitle="Your business information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] sm:text-xs block mb-1" style={{ color: theme.textMuted4 }}>Business Name</label>
                {editingName ? (
                  <div className="flex items-center gap-1.5">
                    <input type="text" value={nameValue} onChange={e => setNameValue(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveBusinessName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(client.business_name || ''); } }}
                      className="font-medium text-xs sm:text-sm rounded-lg px-2 py-1 focus:outline-none min-w-0 flex-1" style={inputStyle} />
                    <button onClick={handleSaveBusinessName} disabled={savingName} className="p-1" style={{ color: theme.success }}>
                      {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameValue(client.business_name || ''); }} className="p-1" style={{ color: theme.textMuted4 }}><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <span className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.text }}>{client.business_name}</span>
                    <button onClick={() => { setNameValue(client.business_name || ''); setEditingName(true); }} className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.textMuted4 }}><Edit3 className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-1" style={{ color: theme.textMuted4 }}>Industry</label>
                <span className="font-medium text-xs sm:text-sm" style={{ color: theme.text }}>{formatIndustry(client.industry)}</span>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-1" style={{ color: theme.textMuted4 }}>Location</label>
                <span className="font-medium text-xs sm:text-sm" style={{ color: theme.text }}>{client.business_city && client.business_state ? `${client.business_city}, ${client.business_state}` : 'Not set'}</span>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs block mb-1" style={{ color: theme.textMuted4 }}>Member Since</label>
                <span className="font-medium text-xs sm:text-sm" style={{ color: theme.text }}>{new Date(client.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* What Your AI Knows — read-only view of the live KB the AI uses */}
        <div className="fu fu2">
          <SectionCard icon={Sparkles} title="What Your AI Knows" subtitle="Pulled from your website, this is what your receptionist already knows about you">
            {aiKnowsLoading ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
            ) : aiKnowledge ? (
              <div className="space-y-4">
                {aiKnowledge.facts.length > 0 && (
                  <div className="space-y-1">
                    {aiKnowledge.facts.map((f, i) => (
                      <div key={i} className="flex gap-2 text-[13px]">
                        <span style={{ color: theme.textMuted4 }}>{f.label}:</span>
                        <span className="font-medium" style={{ color: theme.text }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {aiKnowledge.sections.map((s, i) => {
                  const chips = /service|insurance|payment/i.test(s.title);
                  return (
                    <div key={i}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted4 }}>{s.title}</p>
                      {chips ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.items.map((it, j) => (
                            <span key={j} className="px-2 py-1 rounded-lg text-[12px] font-medium" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06), color: primaryColor }}>{it}</span>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-0.5">
                          {s.items.map((it, j) => (
                            <li key={j} className="text-[13px] flex gap-2" style={{ color: theme.textMuted }}>
                              <span style={{ color: primaryColor }}>•</span><span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

                <div>
                  <button onClick={() => setAiKnowsOpen(v => !v)} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: primaryColor }}>
                    {aiKnowsOpen ? 'Hide' : 'View'} the full document your AI reads
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aiKnowsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {aiKnowsOpen && aiKnowsContent && (
                    <pre className="mt-2 max-h-80 overflow-auto rounded-xl p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', color: theme.textMuted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{aiKnowsContent}</pre>
                  )}
                </div>

                {aiKnowsUpdated && (
                  <p className="text-[11px]" style={{ color: theme.textMuted4 }}>Last refreshed from your website on {new Date(aiKnowsUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                )}
              </div>
            ) : aiKnowsContent ? (
              <div className="space-y-3">
                <p className="text-[13px]" style={{ color: theme.textMuted }}>Your AI is set up with a starter knowledge base for your industry. Add your website in the Knowledge Base section below and save to personalize what it knows about your business.</p>
                <button onClick={() => setAiKnowsOpen(v => !v)} className="flex items-center gap-1 text-[12px] font-medium" style={{ color: primaryColor }}>
                  {aiKnowsOpen ? 'Hide' : 'View'} the full document your AI reads
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aiKnowsOpen ? 'rotate-180' : ''}`} />
                </button>
                {aiKnowsOpen && (
                  <pre className="mt-2 max-h-80 overflow-auto rounded-xl p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', color: theme.textMuted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{aiKnowsContent}</pre>
                )}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: theme.textMuted }}>Your AI does not have a website-based knowledge base yet. Add your website in the Knowledge Base section below and save, and it will learn your hours, services, and more.</p>
            )}
          </SectionCard>
        </div>

        {/* Business Hours */}
        <div className="fu fu2">
          <SectionCard icon={Clock} title="Business Hours" subtitle="When your business is open">
            <div onClick={() => setHoursExpanded(!hoursExpanded)} className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {getHoursSummary().slice(0, 3).map((h, i) => <span key={i} className="px-2 py-1 rounded-lg text-[11px]" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', color: theme.textMuted }}>{h}</span>)}
              </div>
              <button className="flex items-center gap-1 text-[13px] font-medium ml-2 flex-shrink-0" style={{ color: primaryColor }}>
                {hoursExpanded ? 'Hide' : 'Edit'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {hoursExpanded && (
              <div className="mt-4 space-y-2">
                {(Object.keys(businessHours) as Array<keyof BusinessHours>).map(day => (
                  <div key={day} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                    <span className="w-10 sm:w-14 text-[11px] font-medium capitalize" style={{ color: theme.textMuted }}>{day.slice(0, 3)}</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={businessHours[day].closed} onChange={e => updateBusinessHoursField(day, 'closed', e.target.checked)} className="w-3.5 h-3.5 rounded" /><span className="text-[11px]" style={{ color: theme.textMuted }}>Closed</span></label>
                    {!businessHours[day].closed && (
                      <div className="flex items-center gap-1 ml-auto">
                        <select value={businessHours[day].open} onChange={e => updateBusinessHoursField(day, 'open', e.target.value)} className="px-2 py-1 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                        <span className="text-[10px]" style={{ color: theme.textMuted4 }}>–</span>
                        <select value={businessHours[day].close} onChange={e => updateBusinessHoursField(day, 'close', e.target.value)} className="px-2 py-1 text-[11px] rounded-lg focus:outline-none" style={inputStyle}>{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      </div>
                    )}
                  </div>
                ))}
                <SaveButton onClick={handleSaveBusinessHours} disabled={savingHours} loading={savingHours} label="Save Hours" />
              </div>
            )}
          </SectionCard>
        </div>

        {/* Service Areas */}
        <div className="fu fu2">
          <SectionCard icon={MapPin} title="Service Areas" subtitle="Cities or regions your AI tells callers you cover">
            <p className="text-[11px] mb-2" style={{ color: theme.textMuted4 }}>Your AI lets callers know if their location is within your coverage area.</p>
            {serviceAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {serviceAreas.map(area => (
                  <span key={area} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06), color: primaryColor }}>
                    {area}
                    <button onClick={() => removeArea(area)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newArea} onChange={e => setNewArea(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }} placeholder="e.g. Atlanta, Marietta, Decatur" className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              <button onClick={addArea} disabled={!newArea.trim()} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}><Plus className="w-4 h-4" /> Add</button>
            </div>
            {hasAreaChanges && <SaveButton onClick={handleSaveServiceAreas} disabled={savingAreas} loading={savingAreas} label="Save Service Areas" />}
          </SectionCard>
        </div>

        {/* Services */}
        <div className="mb-4 sm:mb-5">
          <ClientServicesSection clientId={client.id} theme={theme} industry={client.industry} />
        </div>

        {/* Staff Directory — people the AI knows about for routing and scheduling */}
        <div className="mb-4 sm:mb-5">
          <StaffMembersSection clientId={client.id} theme={theme} industry={client.industry} />
        </div>

        {/* Knowledge Base */}
        <div className="fu fu4">
          <SectionCard icon={BookOpen} title="Knowledge Base" subtitle="Additional info your AI references on calls">
            <div onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center justify-between cursor-pointer group">
              <div className="text-[13px]" style={{ color: theme.textMuted }}>
                {kbLoading ? 'Loading...' : `${faqs.filter(f => f.question.trim()).length} FAQs · ${additionalInfo ? 'Has additional info' : 'No additional info'}`}
              </div>
              <button className="flex items-center gap-1 text-[13px] font-medium" style={{ color: primaryColor }}>
                {kbExpanded ? 'Hide' : 'Edit'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {kbExpanded && (
              <div className="mt-4 space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><Globe className="w-4 h-4" style={{ color: primaryColor }} /> Website</label>
                  <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><HelpCircle className="w-4 h-4" style={{ color: primaryColor }} /> FAQs</label>
                  <div className="space-y-2">
                    {faqs.map(f => (
                      <div key={f.id} className="p-3 rounded-xl space-y-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                        <div className="flex gap-2">
                          <input type="text" value={f.question} onChange={e => updateFAQ(f.id, 'question', e.target.value)} placeholder="Question..." className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none min-w-0" style={inputStyle} />
                          <button onClick={() => removeFAQ(f.id)} disabled={faqs.length === 1} className="p-2 disabled:opacity-30" style={{ color: theme.textMuted4 }}><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <textarea value={f.answer} onChange={e => updateFAQ(f.id, 'answer', e.target.value)} placeholder="Answer..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none resize-none" style={inputStyle} />
                      </div>
                    ))}
                  </div>
                  <button onClick={addFAQ} className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl transition" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) }}><Plus className="w-4 h-4" /> Add FAQ</button>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><FileText className="w-4 h-4" style={{ color: primaryColor }} /> Additional Info</label>
                  <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Policies, payment methods, parking info..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} />
                </div>
                <SaveButton onClick={handleSaveKnowledgeBase} disabled={savingKB} loading={savingKB} label="Update Knowledge Base" />
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}