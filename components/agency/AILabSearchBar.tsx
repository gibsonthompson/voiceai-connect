'use client';

// ============================================================================
// AILabSearchBar — the clean, ChatGPT-style landing for AI Lab.
// ----------------------------------------------------------------------------
// One centered prompt bar. The owner types what the business is ("an AI
// receptionist for a nail salon in Atlanta"); the matcher
// (POST /api/agency/:id/ai-lab/match) picks the right template (or custom) and
// extracts the business name / city / website. On confirm, /ai-lab/build
// creates a receptionist SKELETON (assistant + optional website scrape + a
// number) as a client, then opens it. First build with no test client yet
// becomes the test client; after that, a regular client.
// ============================================================================

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Loader2, Wand2, Package, Phone } from 'lucide-react';

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

const EXAMPLES = ['a dental office', 'an HVAC company', 'a nail salon in Atlanta', 'a personal injury law firm', 'a med spa', 'a plumbing company'];

export default function AILabSearchBar({ agencyId, api, theme }: { agencyId: string; api: string; theme: any }) {
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

  // Create the receptionist skeleton for a known industry key, then open it.
  async function build(industry: string, r: MatchResult) {
    setBuilding(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/ai-lab/build`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ industry, business_name: r.business_name, city: r.city, website_url: r.website_url, sub_vertical: r.sub_vertical }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403 && json.upgrade_required) {
        setError(`${json.title || 'Paid feature'}. ${json.message || ''}`); setBuilding(false); return;
      }
      if (!res.ok || !json.client_id) throw new Error(json.error || 'Could not build it.');
      router.push(`/agency/clients/${json.client_id}`); // navigating away; keep building state
    } catch (e: any) {
      setError(e?.message || 'Build failed.'); setBuilding(false);
    }
  }

  // Generate a custom industry first (its KB), then build a receptionist from it.
  async function generateCustomThenBuild(r: MatchResult) {
    const payload = r.suggested_custom || { label: r.sub_vertical || r.query, description: `AI receptionist for: ${r.query}` };
    setBuilding(true); setError('');
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/custom-industries`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403 && json.upgrade_required) {
        setError(`${json.title || 'Custom industries are a Scale feature'}. Start your free trial in Billing to generate it.`); setBuilding(false); return;
      }
      if (!res.ok) throw new Error(json.error || 'Could not generate that industry.');
      const key = json.key || (json.industry && json.industry.key);
      if (!key) throw new Error('Custom industry was not created.');
      await build(key, r);
    } catch (e: any) {
      setError(e?.message || 'Generation failed.'); setBuilding(false);
    }
  }

  const card: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}` };
  const label = result?.sub_vertical ? `"${result.sub_vertical}"` : (result?.business_name ? `"${result.business_name}"` : 'that business');

  // Full-screen building state.
  if (building) {
    return (
      <div className="min-h-[78vh] flex flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: theme.primary }} />
        <p className="text-base font-medium" style={{ color: theme.text }}>Building your receptionist…</p>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Setting up the AI, pulling in your info, and assigning a number.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[78vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full" style={{ backgroundColor: theme.primary15 }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: theme.primary }} />
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>AI Lab</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: theme.text }}>
          What are we building a receptionist for?
        </h1>
        <p className="text-sm sm:text-base mb-7" style={{ color: theme.textMuted }}>
          Describe the business in a sentence. We match it to the right template, or build a custom one.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); runMatch(query); }} className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(''); }}
            placeholder="an AI receptionist for a dental office in Austin…"
            autoComplete="off"
            autoFocus
            className="w-full rounded-2xl pl-5 pr-32 py-4 text-[15px] sm:text-base transition-all focus:outline-none focus:ring-2 shadow-sm"
            style={{ backgroundColor: theme.input || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text, ['--tw-ring-color' as any]: `${theme.primary}30` }}
          />
          <button type="submit" disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? 'Thinking' : 'Build it'}
          </button>
        </form>

        {!result && !loading && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setQuery(ex); runMatch(ex); }} className="rounded-full px-3 py-1.5 text-[13px] transition-colors"
                style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm rounded-xl p-3 text-left" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="mt-5 rounded-2xl p-5 text-left" style={card}>
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
                    <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: theme.text }}><Sparkles className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Build a custom one</p>
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
          <button onClick={() => router.push('/agency/templates')} className="inline-flex items-center gap-1.5 text-sm mt-8 transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
            <Package className="h-3.5 w-3.5" /> Or browse all industry templates
          </button>
        )}
      </div>
    </div>
  );
}
