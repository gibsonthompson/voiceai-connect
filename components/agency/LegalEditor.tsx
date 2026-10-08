'use client';

// ============================================================================
// AGENCY LEGAL EDITOR (field-based)
// ----------------------------------------------------------------------------
// An agency customizes only a small set of fields (contact email, business
// name, payment processor, free-trial wording, refund policy). The rest of the
// Terms and Privacy pages are fixed protective clauses that are always
// published and cannot be edited or removed here. The page is composed from the
// canonical template in lib/legal-template.ts, so protections are structurally
// guaranteed. A live preview renders exactly what the hosted page will show.
// ============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Shield, Eye, Pencil, Loader2, Check, RotateCcw, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { markdownToHtml } from '@/lib/legal-markdown';
import {
  composeLegalDoc, effectiveFieldValue, LEGAL_FIELD_SCHEMA, REFUND_PRESETS,
  type LegalType, type LegalFields, type LegalAgencyFields,
} from '@/lib/legal-template';

interface LegalEditorProps {
  agencyId: string;
  backendUrl: string;
  theme: any;
  agency: LegalAgencyFields & { slug?: string | null; marketing_domain?: string | null; domain_verified?: boolean | null };
}

const DOC_TITLES: Record<LegalType, string> = { terms: 'Terms of Service', privacy: 'Privacy Policy' };

export default function LegalEditor({ agencyId, backendUrl, theme, agency }: LegalEditorProps) {
  const [stored, setStored] = useState<Record<LegalType, LegalFields>>({ terms: {}, privacy: {} });
  const [form, setForm] = useState<Record<LegalType, LegalFields>>({ terms: {}, privacy: {} });
  const [activeDoc, setActiveDoc] = useState<LegalType>('terms');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const authFetch = useCallback((url: string, init?: RequestInit) => {
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    return fetch(url, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  }, []);

  // Seed a form from stored overrides: every field prefilled with its effective
  // value (stored value, else the template default) so the agency sees real text.
  const seedForm = useCallback((s: Record<LegalType, LegalFields>): Record<LegalType, LegalFields> => {
    const build = (type: LegalType): LegalFields => {
      const out: LegalFields = {};
      for (const field of LEGAL_FIELD_SCHEMA[type]) {
        out[field.key] = effectiveFieldValue(field.key, s[type], agency);
      }
      return out;
    };
    return { terms: build('terms'), privacy: build('privacy') };
  }, [agency]);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const r = await authFetch(`${backendUrl}/api/agency/${agencyId}/legal`);
      if (!r.ok) { setLoadError('Could not load your legal pages. Please try again.'); return; }
      const d = await r.json();
      // Ignore any legacy string-shaped override; only field objects are used now.
      const norm = (v: any): LegalFields => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      const s: Record<LegalType, LegalFields> = { terms: norm(d.legal?.terms), privacy: norm(d.legal?.privacy) };
      setStored(s);
      setForm(seedForm(s));
    } catch { setLoadError('Could not load your legal pages. Please try again.'); }
    finally { setLoading(false); }
  }, [agencyId, backendUrl, authFetch, seedForm]);

  useEffect(() => { load(); }, [load]);

  const setField = (key: keyof LegalFields, val: string) => {
    setSavedMsg(null); setSaveError(null);
    setForm(prev => ({ ...prev, [activeDoc]: { ...prev[activeDoc], [key]: val } }));
  };
  const resetField = (key: keyof LegalFields) => {
    setField(key, effectiveFieldValue(key, {}, agency)); // {} => template default
  };

  // Only send fields that differ from the template default, so storage stays
  // lean and an untouched field keeps following the default over time.
  const buildPayload = (type: LegalType): LegalFields => {
    const out: LegalFields = {};
    for (const field of LEGAL_FIELD_SCHEMA[type]) {
      const val = (form[type][field.key] || '').trim();
      const def = effectiveFieldValue(field.key, {}, agency).trim();
      if (val && val !== def) out[field.key] = val;
    }
    return out;
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null); setSavedMsg(null);
    try {
      const fields = buildPayload(activeDoc);
      const r = await authFetch(`${backendUrl}/api/agency/${agencyId}/legal`, {
        method: 'PUT', body: JSON.stringify({ type: activeDoc, fields }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setSaveError(d.error || 'Could not save. Please try again.'); return; }
      setStored(prev => ({ ...prev, [activeDoc]: fields }));
      setSavedMsg('Saved. Your live page is updated.');
      setTimeout(() => setSavedMsg(null), 4000);
    } catch { setSaveError('Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const previewHtml = useMemo(
    () => markdownToHtml(composeLegalDoc(activeDoc, form[activeDoc], agency)),
    [activeDoc, form, agency]
  );

  const livePath = activeDoc === 'terms' ? '/terms' : '/privacy';
  const liveUrl = (agency.marketing_domain && agency.domain_verified)
    ? `https://${agency.marketing_domain}${livePath}`
    : (agency.slug ? `https://${agency.slug}.myvoiceaiconnect.com${livePath}` : null);

  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as const;
  const card = theme.card || theme.input;

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>;
  }
  if (loadError) {
    return (
      <div className="rounded-xl p-4 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder || theme.border}` }}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
        <p className="text-sm" style={{ color: theme.errorText }}>{loadError}</p>
        <button onClick={load} className="ml-auto text-sm font-medium underline" style={{ color: theme.primary }}>Retry</button>
      </div>
    );
  }

  const schema = LEGAL_FIELD_SCHEMA[activeDoc];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Legal Pages</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
          Customize the parts of your Terms and Privacy pages that are yours to set. Everything else is standard protective language that is always published. Changes go live when you save.
        </p>
      </div>

      {/* Doc switcher: two equal buttons, never a lone item on the row. */}
      <div className="grid grid-cols-2 gap-2">
        {(['terms', 'privacy'] as LegalType[]).map((t) => {
          const active = activeDoc === t;
          return (
            <button key={t} onClick={() => { setActiveDoc(t); setSavedMsg(null); setSaveError(null); setShowPreview(false); }}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={active ? { backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary30 || theme.primary}` } : { backgroundColor: theme.input, color: theme.textMuted, border: `1px solid ${theme.inputBorder}` }}>
              <FileText className="h-4 w-4 flex-shrink-0" />{DOC_TITLES[t]}
            </button>
          );
        })}
      </div>

      {/* Edit / Preview toggle + live link */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
          <button onClick={() => setShowPreview(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors" style={!showPreview ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.input, color: theme.textMuted }}><Pencil className="h-3.5 w-3.5" /> Edit</button>
          <button onClick={() => setShowPreview(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors" style={showPreview ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.input, color: theme.textMuted }}><Eye className="h-3.5 w-3.5" /> Preview</button>
        </div>
        {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium" style={{ color: theme.primary }}><ExternalLink className="h-3.5 w-3.5" /> View live page</a>}
      </div>

      {!showPreview ? (
        <div className="space-y-4">
          {schema.map((field) => {
            const val = form[activeDoc][field.key] || '';
            const isDefault = val.trim() === effectiveFieldValue(field.key, {}, agency).trim();
            return (
              <div key={field.key} className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: card, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-sm font-medium" style={{ color: theme.text }}>{field.label}</label>
                  {!isDefault && (field.kind === 'longtext' || field.kind === 'refund' || field.kind === 'text') && (
                    <button onClick={() => resetField(field.key)} className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.textMuted }}><RotateCcw className="h-3 w-3" /> Reset to default</button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>{field.help}</p>

                {field.kind === 'refund' && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {REFUND_PRESETS.map((p) => (
                      <button key={p.key} onClick={() => setField(field.key, p.text)} className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{p.label}</button>
                    ))}
                  </div>
                )}

                {field.kind === 'email' ? (
                  <input type="email" value={val} onChange={(e) => setField(field.key, e.target.value)} placeholder="name@example.com" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                ) : field.kind === 'text' ? (
                  <input type="text" value={val} onChange={(e) => setField(field.key, e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                ) : (
                  <textarea value={val} onChange={(e) => setField(field.key, e.target.value)} rows={field.kind === 'refund' ? 4 : 7} className="w-full rounded-lg px-3 py-2 text-sm leading-relaxed" style={{ ...inputStyle, resize: 'vertical' }} />
                )}
              </div>
            );
          })}

          {/* Protected-sections notice: makes clear the rest is fixed. */}
          <div className="rounded-xl p-3 sm:p-4 flex items-start gap-2.5" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.border}` }}>
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: theme.text }}>The rest of this page is protected</p>
              <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                {activeDoc === 'terms'
                  ? 'Sections like liability, indemnification, acceptable use, intellectual property, termination, and dispute resolution are standard legal protections. They are always included and can’t be removed here. Use Preview to see the full page.'
                  : 'Your data-handling, recording-consent, retention, security, and user-rights sections are always included and can’t be removed here. Use Preview to see the full page.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 sm:p-6 legal-preview" style={{ backgroundColor: card, border: `1px solid ${theme.border}`, maxHeight: '60vh', overflowY: 'auto' }}>
          <style>{`
            .legal-preview h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem; color: ${theme.text}; }
            .legal-preview h2 { font-size: 1.2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; padding-bottom: 0.35rem; border-bottom: 1px solid ${theme.border}; color: ${theme.text}; }
            .legal-preview h3 { font-size: 1.02rem; font-weight: 600; margin: 1rem 0 0.4rem; color: ${theme.text}; }
            .legal-preview p, .legal-preview li { font-size: 0.9rem; line-height: 1.7; color: ${theme.textMuted}; }
            .legal-preview ul, .legal-preview ol { margin: 0 0 1rem 1.4rem; }
            .legal-preview li { margin-bottom: 0.3rem; }
            .legal-preview strong { color: ${theme.text}; font-weight: 600; }
            .legal-preview hr { border: none; border-top: 1px solid ${theme.border}; margin: 1.5rem 0; }
            .legal-preview .legal-table-wrapper { overflow-x: auto; margin: 1rem 0; border: 1px solid ${theme.border}; border-radius: 8px; }
            .legal-preview table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .legal-preview th { background: ${theme.input}; padding: 0.6rem 0.8rem; text-align: left; color: ${theme.text}; border-bottom: 2px solid ${theme.border}; }
            .legal-preview td { padding: 0.5rem 0.8rem; border-bottom: 1px solid ${theme.border}; color: ${theme.textMuted}; }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {saveError && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder || theme.border}` }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>{saveError}</p>
        </div>
      )}
      {savedMsg && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder || theme.border}` }}>
          <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.successText || theme.success }} /><p className="text-xs sm:text-sm" style={{ color: theme.successText || theme.success }}>{savedMsg}</p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save {DOC_TITLES[activeDoc]}</>}
        </button>
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: theme.textMuted }}><Lock className="h-3 w-3" /> Protected sections are always included</span>
      </div>
    </div>
  );
}