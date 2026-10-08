'use client';

// ============================================================================
// AGENCY LEGAL EDITOR
// ----------------------------------------------------------------------------
// Lets an agency edit the Terms of Service and Privacy Policy shown on their
// hosted marketing site. It loads the effective content for each page (the
// agency's saved override if present, otherwise the platform default so they
// always start from real text), edits markdown with a live preview that uses
// the SAME renderer as the hosted page, and saves or resets the override via
// /api/agency/:id/legal. Placeholders like {{AGENCY_NAME}} and {{SUPPORT_EMAIL}}
// are kept as-is and resolved when the page renders.
// ============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Eye, Pencil, Loader2, Check, RotateCcw, AlertCircle, ExternalLink } from 'lucide-react';
import { markdownToHtml, replacePlaceholders, type LegalAgencyFields } from '@/lib/legal-markdown';

type DocType = 'terms' | 'privacy';

interface LegalDoc {
  content: string;
  original: string;
  isOverride: boolean;
  title: string;
  defaultMissing?: boolean;
}

interface LegalEditorProps {
  agencyId: string;
  backendUrl: string;
  theme: any;
  agency: LegalAgencyFields & { slug?: string | null; marketing_domain?: string | null; domain_verified?: boolean | null };
}

const PLACEHOLDERS: { token: string; label: string }[] = [
  { token: '{{AGENCY_NAME}}', label: 'Agency name' },
  { token: '{{SUPPORT_EMAIL}}', label: 'Support email' },
  { token: '{{SUPPORT_PHONE}}', label: 'Support phone' },
  { token: '{{CURRENCY_SYMBOL}}', label: 'Currency symbol' },
  { token: '{{LOWEST_PRICE}}', label: 'Lowest plan price' },
  { token: '{{EFFECTIVE_DATE}}', label: "Today's date" },
];

export default function LegalEditor({ agencyId, backendUrl, theme, agency }: LegalEditorProps) {
  const [docs, setDocs] = useState<Record<DocType, LegalDoc> | null>(null);
  const [activeDoc, setActiveDoc] = useState<DocType>('terms');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const authFetch = useCallback((url: string, init?: RequestInit) => {
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    return fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await authFetch(`${backendUrl}/api/agency/${agencyId}/legal`);
      if (!r.ok) { setLoadError('Could not load your legal pages. Please try again.'); return; }
      const d = await r.json();
      const next: Record<DocType, LegalDoc> = {
        terms: {
          content: d.legal?.terms?.content || '',
          original: d.legal?.terms?.content || '',
          isOverride: !!d.legal?.terms?.isOverride,
          title: d.legal?.terms?.title || 'Terms of Service',
          defaultMissing: !!d.legal?.terms?.defaultMissing,
        },
        privacy: {
          content: d.legal?.privacy?.content || '',
          original: d.legal?.privacy?.content || '',
          isOverride: !!d.legal?.privacy?.isOverride,
          title: d.legal?.privacy?.title || 'Privacy Policy',
          defaultMissing: !!d.legal?.privacy?.defaultMissing,
        },
      };
      setDocs(next);
    } catch {
      setLoadError('Could not load your legal pages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [agencyId, backendUrl, authFetch]);

  useEffect(() => { load(); }, [load]);

  const current = docs?.[activeDoc] || null;
  const dirty = !!current && current.content !== current.original;

  const setContent = (val: string) => {
    if (!docs) return;
    setSavedMsg(null); setSaveError(null);
    setDocs({ ...docs, [activeDoc]: { ...docs[activeDoc], content: val } });
  };

  const insertPlaceholder = (token: string) => {
    if (!docs) return;
    setContent((docs[activeDoc].content || '') + token);
  };

  const handleSave = async () => {
    if (!docs || !current) return;
    setSaving(true); setSaveError(null); setSavedMsg(null);
    try {
      const r = await authFetch(`${backendUrl}/api/agency/${agencyId}/legal`, {
        method: 'PUT',
        body: JSON.stringify({ type: activeDoc, content: current.content }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setSaveError(d.error || 'Could not save. Please try again.'); return; }
      setDocs({ ...docs, [activeDoc]: { ...docs[activeDoc], original: current.content, isOverride: true } });
      setSavedMsg('Saved. Your live page is updated.');
      setTimeout(() => setSavedMsg(null), 4000);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!docs || !current) return;
    setResetting(true); setSaveError(null); setSavedMsg(null);
    try {
      const r = await authFetch(`${backendUrl}/api/agency/${agencyId}/legal`, {
        method: 'PUT',
        body: JSON.stringify({ type: activeDoc, content: null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setSaveError(d.error || 'Could not reset. Please try again.'); return; }
      await load();
      setSavedMsg('Reverted to the platform default.');
      setTimeout(() => setSavedMsg(null), 4000);
    } catch {
      setSaveError('Could not reset. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const previewHtml = useMemo(() => {
    if (!current) return '';
    return markdownToHtml(replacePlaceholders(current.content || '', agency));
  }, [current, agency]);

  const livePath = activeDoc === 'terms' ? '/terms' : '/privacy';
  const liveUrl = (agency.marketing_domain && agency.domain_verified)
    ? `https://${agency.marketing_domain}${livePath}`
    : (agency.slug ? `https://${agency.slug}.myvoiceaiconnect.com${livePath}` : null);

  const card = theme.card || theme.input;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (loadError || !docs) {
    return (
      <div className="rounded-xl p-4 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder || theme.border}` }}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
        <p className="text-sm" style={{ color: theme.errorText }}>{loadError || 'Could not load.'}</p>
        <button onClick={load} className="ml-auto text-sm font-medium underline" style={{ color: theme.primary }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Legal Pages</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
          Edit the Terms of Service and Privacy Policy on your hosted website. Changes go live as soon as you save. Leave a page untouched to keep the platform default.
        </p>
      </div>

      {/* Doc switcher: two equal buttons, never a lone item on the row. */}
      <div className="grid grid-cols-2 gap-2">
        {(['terms', 'privacy'] as DocType[]).map((t) => {
          const active = activeDoc === t;
          const d = docs[t];
          return (
            <button
              key={t}
              onClick={() => { setActiveDoc(t); setSavedMsg(null); setSaveError(null); }}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={active
                ? { backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary30 || theme.primary}` }
                : { backgroundColor: theme.input, color: theme.textMuted, border: `1px solid ${theme.inputBorder}` }}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              {d.title}
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={d.isOverride
                  ? { backgroundColor: theme.successBg, color: theme.successText || theme.success }
                  : { backgroundColor: theme.input, color: theme.textMuted }}
              >
                {d.isOverride ? 'Custom' : 'Default'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Edit / Preview toggle + live link */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
          <button
            onClick={() => setShowPreview(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors"
            style={!showPreview ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.input, color: theme.textMuted }}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors"
            style={showPreview ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.input, color: theme.textMuted }}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
        {liveUrl && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium" style={{ color: theme.primary }}>
            <ExternalLink className="h-3.5 w-3.5" /> View live page
          </a>
        )}
      </div>

      {current?.defaultMissing && !current.isOverride && (
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder || theme.border}` }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.warningText || theme.warning }} />
          <p className="text-xs sm:text-sm" style={{ color: theme.warningText || theme.warning }}>
            No platform default was found for this page, so it starts empty. Anything you write here becomes your page.
          </p>
        </div>
      )}

      {/* Editor or Preview */}
      {!showPreview ? (
        <div>
          <textarea
            value={current?.content || ''}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={true}
            rows={22}
            className="w-full rounded-xl px-3 sm:px-4 py-3 text-sm font-mono leading-relaxed transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, resize: 'vertical' }}
            placeholder="Write your page content in Markdown..."
          />
          <div className="mt-2">
            <p className="text-[10px] sm:text-xs mb-1.5" style={{ color: theme.textMuted }}>
              Markdown supported (headings with #, **bold**, lists, tables). Click a tag to insert it; it fills in automatically on your live page:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  title={`Insert ${p.label}`}
                  className="rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-mono transition-colors"
                  style={{ backgroundColor: theme.primary15, color: theme.primary }}
                >
                  {p.token}
                </button>
              ))}
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
            .legal-preview a { color: ${theme.primary}; text-decoration: underline; }
            .legal-preview hr { border: none; border-top: 1px solid ${theme.border}; margin: 1.5rem 0; }
            .legal-preview .legal-table-wrapper { overflow-x: auto; margin: 1rem 0; border: 1px solid ${theme.border}; border-radius: 8px; }
            .legal-preview table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .legal-preview th { background: ${theme.input}; padding: 0.6rem 0.8rem; text-align: left; color: ${theme.text}; border-bottom: 2px solid ${theme.border}; }
            .legal-preview td { padding: 0.5rem 0.8rem; border-bottom: 1px solid ${theme.border}; color: ${theme.textMuted}; }
          `}</style>
          {current?.content?.trim()
            ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            : <p className="text-sm" style={{ color: theme.textMuted }}>Nothing to preview yet.</p>}
        </div>
      )}

      {saveError && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder || theme.border}` }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
          <p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>{saveError}</p>
        </div>
      )}
      {savedMsg && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder || theme.border}` }}>
          <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.successText || theme.success }} />
          <p className="text-xs sm:text-sm" style={{ color: theme.successText || theme.success }}>{savedMsg}</p>
        </div>
      )}

      {/* Actions: two buttons sharing the row. */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving || resetting || !dirty}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save changes</>}
        </button>
        {current?.isOverride && (
          <button
            onClick={handleReset}
            disabled={saving || resetting}
            title="Replace your custom page with the platform default"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: theme.input, color: theme.textMuted, border: `1px solid ${theme.inputBorder}` }}
          >
            {resetting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</> : <><RotateCcw className="h-4 w-4" /> Reset to default</>}
          </button>
        )}
      </div>
    </div>
  );
}