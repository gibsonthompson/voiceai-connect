'use client';

// ============================================================================
// AILabSearchBar — the clean, ChatGPT/Claude-style landing for AI Lab.
// ----------------------------------------------------------------------------
// One centered headline + one input. Type the business ("an AI receptionist for
// a nail salon in Atlanta"); the matcher (POST /api/agency/:id/ai-lab/match)
// picks the template (or custom) and pulls out the business name / city /
// website. On confirm, /ai-lab/build creates a receptionist skeleton (assistant
// + optional website scrape + a number) as a client, then opens it. First build
// with no test client yet becomes the test client; after that, a regular client.
// ============================================================================

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Loader2, Sparkles, ArrowRight, Phone, Package } from 'lucide-react';

type Mode = 'matched' | 'disambiguate' | 'custom' | 'clarify';
interface IndustryRef { value: string; label: string; description: string }
interface MatchResult {
  mode: Mode;
  industry: IndustryRef | null;
  confidence: 'high' | 'medium' | 'low';
  sub_vertical: string | null;
  business_name: string | null;
  city: string | null;
  website_url: string | null;
  clarifying_question: string | null;
  suggested_custom: { label: string; description: string } | null;
  query: string;
}

const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

export default function AILabSearchBar({ agencyId, api, theme, logoUrl }: { agencyId: string; api: string; theme: any; logoUrl?: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const [building, setBuilding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  async function runMatch(q: string) {
    const text = (q || '').trim();
    if (!text) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/match`, { method: 'POST', headers: headers(), body: JSON.stringify({ query: text }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not analyze that. Try rephrasing.');
      setResult(json as MatchResult);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function build(industry: string, r: MatchResult) {
    setBuilding(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/build`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ industry, business_name: r.business_name, city: r.city, website_url: r.website_url, sub_vertical: r.sub_vertical }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403 && json.upgrade_required) { setError(`${json.title || 'Paid feature'}. ${json.message || ''}`); setBuilding(false); return; }
      if (!res.ok || !json.client_id) throw new Error(json.error || 'Could not build it.');
      router.push(`/agency/clients/${json.client_id}`);
    } catch (e: any) {
      setError(e?.message || 'Build failed.'); setBuilding(false);
    }
  }

  async function generateCustomThenBuild(r: MatchResult) {
    const payload = r.suggested_custom || { label: r.sub_vertical || r.query, description: `AI receptionist for: ${r.query}` };
    setBuilding(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/custom-industries`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403 && json.upgrade_required) { setError(`${json.title || 'Custom industries are a Scale feature'}. Start your free trial in Billing to generate it.`); setBuilding(false); return; }
      if (!res.ok) throw new Error(json.error || 'Could not generate that industry.');
      const key = json.key || (json.industry && json.industry.key);
      if (!key) throw new Error('Custom industry was not created.');
      await build(key, r);
    } catch (e: any) {
      setError(e?.message || 'Generation failed.'); setBuilding(false);
    }
  }

  const label = result?.sub_vertical ? `"${result.sub_vertical}"` : (result?.business_name ? `"${result.business_name}"` : 'that business');
  const hasText = !!query.trim();

  if (building) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="h-7 w-7 animate-spin mb-4" style={{ color: theme.iconColor }} />
        <p className="text-[15px] font-medium" style={{ color: theme.text }}>Building your receptionist</p>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Setting up the AI, pulling in your details, and assigning a number.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[88vh] flex flex-col items-center px-6 pt-[26vh]">
      <div className="w-full" style={{ maxWidth: 640 }}>
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img src={logoUrl} alt="" className="object-contain" style={{ maxHeight: 40, maxWidth: 200 }} />
          </div>
        )}
        <h1 className="text-center font-semibold tracking-tight mb-7" style={{ color: theme.text, fontSize: 'clamp(24px, 4.5vw, 34px)', lineHeight: 1.15 }}>
          Let’s build your receptionist
        </h1>

        {/* Input — soft, rounded, inline send (ChatGPT/Claude style) */}
        <form onSubmit={(e) => { e.preventDefault(); runMatch(query); }} className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(''); }}
            placeholder="Describe the business, or paste its website"
            autoComplete="off"
            autoFocus
            className="w-full rounded-[26px] pl-5 pr-14 py-4 text-[15px] transition-colors focus:outline-none"
            style={{
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              boxShadow: theme.isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary + '66')}
            onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
          />
          <button
            type="submit"
            aria-label="Build"
            disabled={loading || !hasText}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center transition-all disabled:cursor-default"
            style={{ backgroundColor: hasText ? theme.primary : theme.hover, color: hasText ? theme.primaryText : theme.textMuted, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </form>

        {/* Hint — paste a link and we read the site */}
        {!result && !loading && (
          <p className="text-center text-[12px] mt-3" style={{ color: theme.textMuted }}>
            Paste a website and we’ll read it to fill in the details.
          </p>
        )}

        {/* Suggestions — clean, centered pills */}
        {!result && !loading && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setQuery(ex); runMatch(ex); }}
                className="rounded-full px-3.5 py-1.5 text-[13px] transition-colors"
                style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary + '66'; e.currentTarget.style.color = theme.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-5 text-sm rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-5 rounded-2xl p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            {result.mode === 'clarify' && (
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>{result.clarifying_question}</p>
                <p className="text-sm mb-3" style={{ color: theme.textMuted }}>Add a word or two about the business and try again.</p>
                <button onClick={() => inputRef.current?.focus()} className="text-sm font-semibold" style={{ color: theme.primary }}>Edit my description</button>
              </div>
            )}

            {result.mode === 'matched' && result.industry && (
              <div>
                <p className="text-sm mb-3" style={{ color: theme.textMuted }}>We’ll build a <span style={{ color: theme.text, fontWeight: 600 }}>{result.industry.label}</span> receptionist{result.business_name ? ` for ${result.business_name}` : ''} and assign it a number.</p>
                <button onClick={() => build(result.industry!.value, result)} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  <Phone className="h-4 w-4" /> Build this receptionist
                </button>
              </div>
            )}

            {result.mode === 'disambiguate' && result.industry && (
              <div>
                <p className="text-sm mb-3" style={{ color: theme.textMuted }}>Closest match for {label}:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => build(result.industry!.value, result)} className="flex-1 text-left rounded-xl p-4 transition-all" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary}40` }}>
                    <p className="font-semibold text-sm" style={{ color: theme.text }}>{result.industry.label}</p>
                    <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{result.industry.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: theme.primary }}>Build with this <ArrowRight className="h-3.5 w-3.5" /></span>
                  </button>
                  <button onClick={() => generateCustomThenBuild(result)} className="flex-1 text-left rounded-xl p-4 transition-all" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                    <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: theme.text }}><Sparkles className="h-3.5 w-3.5" style={{ color: theme.iconColor }} /> Build a custom one</p>
                    <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Generate a receptionist tailored to {label}.</p>
                  </button>
                </div>
              </div>
            )}

            {result.mode === 'custom' && (
              <div>
                <p className="text-sm mb-1" style={{ color: theme.text }}>No built-in template fits {label} exactly.</p>
                <p className="text-sm mb-3" style={{ color: theme.textMuted }}>We’ll generate a custom knowledge base for it, then build the receptionist.</p>
                <button onClick={() => generateCustomThenBuild(result)} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  <Sparkles className="h-4 w-4" /> Generate &amp; build it
                </button>
              </div>
            )}

            {(result.business_name || result.city || result.website_url) && (
              <p className="text-[12px] mt-3" style={{ color: theme.textMuted }}>
                Picked up:{result.business_name ? ` ${result.business_name}` : ''}{result.city ? ` · ${result.city}` : ''}{result.website_url ? ` · ${result.website_url}` : ''}
              </p>
            )}
            <button onClick={() => { setResult(null); setQuery(''); inputRef.current?.focus(); }} className="text-[12px] mt-2" style={{ color: theme.textMuted }}>Start over</button>
          </div>
        )}

        {!result && (
          <div className="text-center mt-9">
            <button onClick={() => router.push('/agency/templates')} className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
              <Package className="h-3.5 w-3.5" /> Browse all industry templates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
