'use client';

// Full knowledge base editor for the call-center business config. Matches the
// client My Business KB: an editable business website, "Learn from website"
// (a live scrape folded into the KB), a structured FAQ list, and free-form extra
// info. Reads GET /api/client/:id/knowledge-base (structured data + websiteUrl)
// and saves through POST /api/knowledge-base/update, which smart-merges these
// into the document the AI reads at call time, so services and hours edited in
// their own sections are preserved. Uses the agency/manager token (agency_owner
// passes the my_business gate), so no new endpoint is needed.

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Loader2, Save, Check, Sparkles, Plus, Trash2, Globe } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface FAQ { id: string; question: string; answer: string; }

// The KB stores FAQs as "Q: ...\nA: ..." blocks separated by blank lines. Parse
// that text back into editable pairs; formatFAQs is the inverse used on save.
function parseFAQs(text: string): FAQ[] {
  if (!text || !text.trim()) return [];
  const out: FAQ[] = [];
  text.split(/\n\n+/).forEach((block, i) => {
    const qm = block.match(/Q:\s*([\s\S]*?)(?:\nA:|$)/i);
    const am = block.match(/A:\s*([\s\S]*)$/i);
    const q = qm ? qm[1].trim() : '';
    const a = am ? am[1].trim() : '';
    if (q || a) out.push({ id: `${Date.now()}-${i}`, question: q, answer: a });
  });
  return out;
}
function formatFAQs(faqs: FAQ[]): string {
  return faqs.filter((f) => f.question.trim() && f.answer.trim()).map((f) => `Q: ${f.question.trim()}\nA: ${f.answer.trim()}`).join('\n\n');
}

export default function CcKnowledgeBase({ clientId, theme }: { clientId: string; agencyId?: string; theme: any }) {
  const [website, setWebsite] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [learning, setLearning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/knowledge-base`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) {
          setWebsite(d.websiteUrl || '');
          setFaqs(parseFAQs((d.data && d.data.faqs) || ''));
          setAdditionalInfo((d.data && d.data.additionalInfo) || '');
        }
      }
    } catch { /* keep current */ } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const addFaq = () => setFaqs((f) => [...f, { id: `${Date.now()}`, question: '', answer: '' }]);
  const updateFaq = (id: string, field: 'question' | 'answer', val: string) => setFaqs((f) => f.map((x) => (x.id === id ? { ...x, [field]: val } : x)));
  const removeFaq = (id: string) => setFaqs((f) => f.filter((x) => x.id !== id));

  // One save path. scrape=false is a fast save of the edited fields; scrape=true
  // is "Learn from website" (reads the site now and folds it in). Both go through
  // /api/knowledge-base/update, which merges and preserves services/hours.
  const doSave = async (scrape: boolean) => {
    if (scrape) setLearning(true); else setSaving(true);
    setErr(null); setSaved(false); setMsg(null);
    try {
      const body: any = { clientId, websiteUrl: website.trim(), faqs: formatFAQs(faqs), additionalInfo };
      if (scrape) body.scrapeWebsite = true;
      const r = await fetch(`${API()}/api/knowledge-base/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) {
        if (scrape) { setMsg('Learned from the website and saved.'); setTimeout(() => setMsg(null), 4000); await load(); }
        else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      } else {
        setErr(d.error || (scrape ? 'Could not read that website.' : 'Could not save.'));
      }
    } catch { setErr(scrape ? 'Could not read that website.' : 'Could not save.'); }
    finally { setLearning(false); setSaving(false); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><BookOpen className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Knowledge base</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>What the AI knows about this business. Pull from the website, add FAQs, and anything else a caller might ask.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-6 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <div className="space-y-5">
          {/* Website + learn-from-website */}
          <div>
            <label className="text-[12px] font-medium" style={{ color: theme.textMuted }}>Business website</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://theirbusiness.com"
                  className="w-full rounded-xl pl-9 pr-3 py-2.5 text-[13px] outline-none" style={field} />
              </div>
              <button onClick={() => doSave(true)} disabled={learning || saving} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold flex-shrink-0 disabled:opacity-60" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                {learning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {learning ? 'Reading the website...' : 'Learn from website'}
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Reads the site and folds services, hours, and common questions into the AI&apos;s knowledge.</p>
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium" style={{ color: theme.textMuted }}>FAQs</label>
              <button onClick={addFaq} className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: theme.primary }}><Plus className="h-3.5 w-3.5" /> Add FAQ</button>
            </div>
            {faqs.length === 0 ? (
              <p className="text-[12px] py-1" style={{ color: theme.textSubtle }}>No FAQs yet. Add the questions callers ask most.</p>
            ) : (
              <div className="space-y-2.5">
                {faqs.map((f) => (
                  <div key={f.id} className="rounded-xl p-3" style={{ border: `1px solid ${theme.border}` }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2 min-w-0">
                        <input value={f.question} onChange={(e) => updateFaq(f.id, 'question', e.target.value)} placeholder="Question (e.g. Do you offer free estimates?)" className="w-full rounded-lg px-3 py-2 text-[13px] outline-none" style={field} />
                        <textarea value={f.answer} onChange={(e) => updateFaq(f.id, 'answer', e.target.value)} placeholder="Answer" rows={2} className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-y" style={field} />
                      </div>
                      <button onClick={() => removeFaq(f.id)} className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ color: theme.textMuted }} title="Remove FAQ"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anything else */}
          <div>
            <label className="text-[12px] font-medium" style={{ color: theme.textMuted }}>Anything else the AI should know</label>
            <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} rows={6} maxLength={20000}
              placeholder="Policies, directions, what to say in specific situations, anything a caller might ask."
              className="w-full rounded-xl px-3 py-2.5 text-[13px] leading-relaxed outline-none resize-y mt-1.5" style={field} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px]" style={{ color: err ? theme.error : theme.success }}>
              {err ? err : msg ? <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> {msg}</span> : saved ? <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Saved</span> : ''}
            </span>
            <button onClick={() => doSave(false)} disabled={saving || learning} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save knowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
