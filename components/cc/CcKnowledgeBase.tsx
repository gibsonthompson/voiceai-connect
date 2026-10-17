'use client';

// Knowledge base editor for the call-center business config. Parity with the
// end-client "My Business" editor: a website field + "Learn from my website"
// (scrapes the site into the KB), an editable FAQ list, and a free-text
// "anything else" box, plus a read-only view of what the AI actually knows.
//
// It talks to the agency-scoped KB endpoint, which now accepts the SAME typed
// fields the client editor sends (faqs/additionalInfo/websiteUrl/scrapeWebsite)
// and keeps the structured copy server-side, so the assembled document is built
// the same way and FAQs survive a re-scrape:
//   GET  /api/agency/:agencyId/clients/:clientId/knowledge-base
//        -> { content, data: { faqs, additionalInfo, ... }, websiteUrl }
//   PUT  /api/agency/:agencyId/clients/:clientId/knowledge-base
//        <- { websiteUrl, faqs, additionalInfo, scrapeWebsite? }
// FAQs round-trip as "Q: ...\nA: ..." blocks, matching the client editor.

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Loader2, Save, Check, Sparkles, HelpCircle, Plus, Trash2, Globe, ChevronDown } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface FAQ { id: string; question: string; answer: string; }

// Cosmetic steps cycled while a website scrape runs, so the multi-second wait
// shows what is happening instead of a bare spinner.
const SCAN_STEPS = ['Finding your pages', 'Reading your services and prices', 'Learning your hours and areas', 'Picking up common questions', 'Teaching your AI'];

// FAQs are stored as "Q: ...\nA: ..." blocks in the structured copy. Parse them
// back into editable rows, and format rows back to that shape on save.
function parseFAQs(t: string): FAQ[] {
  const parsed: FAQ[] = [];
  let q = '', a = '';
  t.split('\n').forEach((l) => {
    if (l.trim().startsWith('Q:')) { if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); q = l.replace(/^Q:\s*/i, '').trim(); a = ''; }
    else if (l.trim().startsWith('A:')) { a = l.replace(/^A:\s*/i, '').trim(); }
  });
  if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
  return parsed;
}
const formatFAQs = (faqs: FAQ[]): string => faqs.filter((f) => f.question.trim() && f.answer.trim()).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

export default function CcKnowledgeBase({ agencyId, clientId, theme }: { agencyId: string; clientId: string; theme: any }) {
  const [website, setWebsite] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([{ id: '1', question: '', answer: '' }]);
  const [faqSuggestions, setFaqSuggestions] = useState<{ question: string; answer: string }[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [learning, setLearning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [showAi, setShowAi] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMsg = (text: string, error = false) => {
    setMsg({ text, error });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 3500);
  };

  const load = useCallback(async () => {
    if (!agencyId || !clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) {
          setWebsite(d.websiteUrl || '');
          setAiContent(d.content || '');
          setUpdatedAt(d.updated_at || null);
          const parsed = d.data && d.data.faqs ? parseFAQs(d.data.faqs) : [];
          setFaqs(parsed.length ? parsed : [{ id: '1', question: '', answer: '' }]);
          setAdditionalInfo((d.data && d.data.additionalInfo) || '');
        }
      }
      // Scraped "found on your website" FAQ suggestions. This is the client-scoped
      // endpoint (reachable with the manager's token, same as the services
      // suggestions on this page), so the scraped FAQs surface here to add in one
      // tap, mirroring the services section.
      try {
        const sr = await fetch(`${API()}/api/client/${clientId}/scrape-suggestions`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
        if (sr.ok) { const sd = await sr.json(); setFaqSuggestions(Array.isArray(sd.faqs) ? sd.faqs : []); }
      } catch { /* suggestions are best-effort */ }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [agencyId, clientId]);

  useEffect(() => { load(); }, [load]);

  // Cycle the scan-step label and drive a progress percentage while a scrape
  // runs. The scrape time varies (crawl + LLM extraction), so the percentage is
  // a smoothed estimate that eases toward ~95% and is snapped to 100% by
  // learnFromWebsite the moment it actually finishes.
  useEffect(() => {
    if (!learning) { setScanStep(0); return; }
    setScanPct((p) => (p > 0 && p < 100 ? p : 4));
    const label = setInterval(() => setScanStep((s) => (s + 1) % SCAN_STEPS.length), 1600);
    const prog = setInterval(() => setScanPct((p) => (p >= 95 ? 95 : p + Math.max(1, Math.round((95 - p) * 0.1)))), 350);
    return () => { clearInterval(label); clearInterval(prog); };
  }, [learning]);

  const addFAQ = () => setFaqs((p) => [...p, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFAQ = (id: string) => setFaqs((p) => (p.length > 1 ? p.filter((f) => f.id !== id) : p));
  const updateFAQ = (id: string, k: keyof FAQ, v: string) => setFaqs((p) => p.map((f) => (f.id === id ? { ...f, [k]: v } : f)));

  // Accept a scraped suggestion into the editable FAQ list (dropping the empty
  // starter row), remove it from the suggestions, and tell the backend not to
  // surface it again. The user still presses Save Knowledge Base to persist.
  const addFaqSuggestion = (sg: { question: string; answer: string }) => {
    setFaqs((prev) => {
      const base = prev.length === 1 && !prev[0].question.trim() && !prev[0].answer.trim() ? [] : prev;
      return [...base, { id: Date.now().toString(), question: sg.question, answer: sg.answer }];
    });
    setFaqSuggestions((prev) => prev.filter((s) => s.question !== sg.question));
    try {
      fetch(`${API()}/api/client/${clientId}/scrape-suggestions/dismiss`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ type: 'faq', name: sg.question }),
      });
    } catch { /* best-effort */ }
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ websiteUrl: website, faqs: formatFAQs(faqs), additionalInfo }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); await load(); }
      else showMsg(d.error || 'Could not save.', true);
    } catch { showMsg('Could not save.', true); } finally { setSaving(false); }
  };

  // "Learn from my website": set the website and scrape it into the KB now. Sends
  // the typed fields too so the manually-entered FAQs are preserved.
  const learnFromWebsite = async () => {
    if (!website.trim()) { showMsg('Add the business website address first.', true); return; }
    setLearning(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ websiteUrl: website, faqs: formatFAQs(faqs), additionalInfo, scrapeWebsite: true }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { setScanPct(100); showMsg('Learned from the website. The AI now knows what is on it.'); await load(); }
      else showMsg(d.error || 'Could not read that website.', true);
    } catch { showMsg('Something went wrong reading that website.', true); } finally { setLearning(false); setTimeout(() => setScanPct(0), 600); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const faqCount = faqs.filter((f) => f.question.trim()).length;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><BookOpen className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Knowledge Base</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>What the AI knows about this business: pulled from the website, plus the FAQs and details you add.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <div className="space-y-5">
          {/* Website */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><Globe className="h-4 w-4" style={{ color: theme.primary }} /> Business website</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://thisbusiness.com"
                className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm outline-none" style={field} />
              <button onClick={learnFromWebsite} disabled={learning || !website.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold flex-shrink-0 disabled:opacity-50"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                {learning ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading...</> : <><Sparkles className="h-4 w-4" /> Learn from website</>}
              </button>
            </div>
            {learning ? (
              <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold" style={{ color: theme.text }}>Reading the website</p>
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: theme.primary }}>{scanPct}%</span>
                </div>
                <p key={scanStep} className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{SCAN_STEPS[scanStep]}...</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.border }}>
                  <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ backgroundColor: theme.primary, width: `${scanPct}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>Scanning the site teaches the AI the services, hours, and pages on it. Your FAQs and notes below are kept.</p>
            )}
          </div>

          {/* FAQs */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-medium mb-2" style={{ color: theme.text }}><HelpCircle className="h-4 w-4" style={{ color: theme.primary }} /> FAQs</label>

            {faqSuggestions.length > 0 && (
              <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-1.5 mb-2"><Globe className="h-3.5 w-3.5" style={{ color: theme.primary }} /><span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>Found on your website</span></div>
                <div className="space-y-1.5">
                  {faqSuggestions.map((sg, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: theme.card }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium" style={{ color: theme.text }}>{sg.question}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>{sg.answer}</p>
                      </div>
                      <button onClick={() => addFaqSuggestion(sg)} title="Add this FAQ" className="inline-flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {faqs.map((f) => (
                <div key={f.id} className="rounded-xl p-2.5 space-y-2" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-center gap-2">
                    <input type="text" value={f.question} onChange={(e) => updateFAQ(f.id, 'question', e.target.value)} placeholder="Question a caller might ask..."
                      className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none" style={{ ...field, backgroundColor: theme.card }} />
                    <button onClick={() => removeFAQ(f.id)} disabled={faqs.length === 1} className="p-2 rounded-lg disabled:opacity-30 flex-shrink-0" style={{ color: theme.textMuted }} title="Remove FAQ"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <textarea value={f.answer} onChange={(e) => updateFAQ(f.id, 'answer', e.target.value)} placeholder="How the AI should answer it..." rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y" style={{ ...field, backgroundColor: theme.card }} />
                </div>
              ))}
            </div>
            <button onClick={addFAQ} className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium" style={{ color: theme.primary, backgroundColor: theme.primary15 }}><Plus className="h-4 w-4" /> Add FAQ</button>
          </div>

          {/* Additional info */}
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: theme.text }}>Anything else the AI should know</label>
            <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} rows={5} maxLength={8000}
              placeholder="Policies, parking and directions, what to say for after-hours calls, anything a caller commonly asks that is not covered above."
              className="w-full rounded-xl px-3.5 py-2.5 text-sm leading-relaxed outline-none resize-y" style={field} />
          </div>

          {/* What the AI knows (read-only view of the assembled document) */}
          {aiContent.trim() && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
              <button onClick={() => setShowAi((s) => !s)} className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left" style={{ backgroundColor: theme.input }}>
                <span className="inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: theme.text }}><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /> What the AI knows</span>
                <ChevronDown className="h-4 w-4 transition-transform flex-shrink-0" style={{ color: theme.textMuted, transform: showAi ? 'rotate(180deg)' : 'none' }} />
              </button>
              {showAi && (
                <div className="px-3.5 py-3" style={{ backgroundColor: theme.card }}>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>{aiContent}</p>
                  {updatedAt && <p className="text-[11px] mt-2.5" style={{ color: theme.textMuted }}>Last updated {new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>}
                </div>
              )}
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[12px]" style={{ color: msg?.error ? theme.error : theme.textMuted }}>
              {msg ? msg.text : saved ? <span className="inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-4 w-4" /> Saved</span> : `${faqCount} FAQ${faqCount === 1 ? '' : 's'}`}
            </span>
            <button onClick={save} disabled={saving || learning} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Knowledge Base
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
