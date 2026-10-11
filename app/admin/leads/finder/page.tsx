'use client';

// ============================================================================
// ADMIN LEAD FINDER — call centers
//
// Reuses the agency Google Maps lead scraper at the platform level to find call
// centers as the platform owner's own leads. It calls the SAME scraper endpoints
// (/api/leads/search + the SSE stream) with no agencyId, so there is no metering
// or plan gate, then saves the picked results through /api/admin/leads/save-scraped,
// which writes them with agency_id = NULL into the admin CRM.
//
// Deliberately lean: one target (call centers), a location, a count. Not the
// full agency finder (industry presets, find-all tiling, CSV export).
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Loader2, Phone, Globe, MapPin, Star, Check, Square, CheckSquare, Save, Building2,
} from 'lucide-react';

const SEARCH_QUERY = 'call center';

interface ScrapedLead {
  companyName?: string;
  phone?: string;
  website?: string;
  email?: string;
  industry?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  businessStatus?: string;
}

const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => { try { return localStorage.getItem('admin_token') || ''; } catch { return ''; } };

export default function AdminLeadFinderPage() {
  const [location, setLocation] = useState('');
  const [maxLeads, setMaxLeads] = useState(25);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ stage?: string; message?: string; percent?: number } | null>(null);
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved: number; skipped: number; errors: number } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const finishWith = useCallback((found: ScrapedLead[]) => {
    setLeads(found);
    setSelected(new Set(found.map((_, i) => i))); // select all by default
    setLoading(false);
  }, []);

  const pollForResults = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/leads/search/status/${jobId}`);
        if (res.status === 404) { clearInterval(interval); setLoading(false); return; }
        const data = await res.json();
        setProgress(data.progress);
        if (data.status === 'complete') { clearInterval(interval); finishWith(data.leads || []); }
        else if (data.status === 'error') { clearInterval(interval); setError(data.error || 'Search failed'); setLoading(false); }
      } catch { /* keep polling */ }
    }, 1000);
  }, [finishWith]);

  const connectToJob = useCallback((jobId: string) => {
    jobIdRef.current = jobId;
    const evt = new EventSource(`${getBackendUrl()}/api/leads/search/stream/${jobId}`);
    eventSourceRef.current = evt;
    evt.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data);
        setProgress(update.progress);
        if (update.status === 'complete') { finishWith(update.leads || []); evt.close(); }
        else if (update.status === 'error') { setError(update.error || 'Search failed'); setLoading(false); evt.close(); }
        else if (update.status === 'cancelled') { setLoading(false); evt.close(); }
      } catch { /* ignore */ }
    };
    evt.onerror = () => { evt.close(); pollForResults(jobId); };
  }, [finishWith, pollForResults]);

  const doSearch = useCallback(async () => {
    if (!location.trim()) { setError('Enter a location'); return; }
    eventSourceRef.current?.close();
    setError(null);
    setLeads([]);
    setSelected(new Set());
    setSaveResult(null);
    setLoading(true);
    setProgress({ stage: 'starting', message: 'Initializing...', percent: 0 });

    try {
      const res = await fetch(`${getBackendUrl()}/api/leads/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No agencyId: platform-level search, so no metering or plan gate.
        body: JSON.stringify({ source: 'google_maps', query: SEARCH_QUERY, location: location.trim(), maxLeads }),
      });
      const data = await res.json();
      if (!data.jobId) throw new Error(data.error || 'Failed to start search');
      connectToJob(data.jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to start search');
      setLoading(false);
    }
  }, [location, maxLeads, connectToJob]);

  const toggle = (i: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const allSelected = leads.length > 0 && selected.size === leads.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(leads.map((_, i) => i)));

  const saveSelected = useCallback(async () => {
    const picked = leads.filter((_, i) => selected.has(i));
    if (picked.length === 0) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/leads/save-scraped`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ leads: picked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaveResult({ saved: data.saved || 0, skipped: data.skipped || 0, errors: data.errors || 0 });
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [leads, selected]);

  const fmtPhone = (p?: string) => {
    if (!p) return '';
    const d = p.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return p;
  };

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1000px]">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-[var(--a-dim)] hover:text-[var(--a-ink)] transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Sales Pipeline
      </Link>

      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Find call centers</h1>
        <p className="mt-1 text-sm text-[var(--a-dim)]">Pull call centers from Google Maps into your own leads. Enter a location and search.</p>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border border-[var(--a-line)] bg-white p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--a-dim)] mb-1.5">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) doSearch(); }}
                placeholder="City, State or ZIP (e.g. Austin, TX)"
                className="w-full rounded-xl border border-[var(--a-line-2)] bg-white pl-9 pr-3 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-deep)]"
              />
            </div>
          </div>
          <div className="sm:w-32">
            <label className="block text-xs font-medium text-[var(--a-dim)] mb-1.5">Max results</label>
            <select value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--a-line-2)] bg-white px-3 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-deep)]">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={60}>60</option>
            </select>
          </div>
          <button onClick={() => (loading ? null : doSearch())} disabled={loading} className="a-btn disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Searching' : 'Search'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--a-dim)]">Searching Google Maps for <span className="font-medium text-[var(--a-ink)]">&ldquo;call center&rdquo;</span> in your location.</p>
      </div>

      {/* Progress */}
      {loading && progress && (
        <div className="rounded-xl border border-[var(--a-line)] bg-white p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--a-ink)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--a-em-deep)]" />
            {progress.message || 'Working...'}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--a-line)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(5, progress.percent || 0)}%`, backgroundColor: 'var(--a-em-deep)' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[var(--a-red-soft)] bg-[var(--a-red-soft)] px-4 py-3 mb-6 text-sm" style={{ color: 'var(--a-red)' }}>{error}</div>
      )}

      {saveResult && (
        <div className="rounded-xl border px-4 py-3 mb-6 text-sm flex items-center gap-2" style={{ borderColor: 'var(--a-em-soft)', backgroundColor: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>
          <Check className="h-4 w-4" />
          Saved {saveResult.saved} to your leads{saveResult.skipped ? `, ${saveResult.skipped} already there` : ''}{saveResult.errors ? `, ${saveResult.errors} failed` : ''}.
          <Link href="/admin/leads" className="ml-auto font-semibold underline">View pipeline</Link>
        </div>
      )}

      {/* Results */}
      {leads.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button onClick={toggleAll} className="inline-flex items-center gap-2 text-sm text-[var(--a-ink)]">
              {allSelected ? <CheckSquare className="h-4 w-4 text-[var(--a-em-deep)]" /> : <Square className="h-4 w-4 text-[var(--a-dim)]" />}
              {selected.size} of {leads.length} selected
            </button>
            <button onClick={saveSelected} disabled={saving || selected.size === 0} className="a-btn disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving' : `Save ${selected.size} to leads`}
            </button>
          </div>

          <div className="space-y-2">
            {leads.map((lead, i) => {
              const isSel = selected.has(i);
              return (
                <button key={`${lead.companyName}-${i}`} onClick={() => toggle(i)}
                  className="w-full text-left rounded-xl border bg-white p-3 flex items-start gap-3 transition-colors"
                  style={{ borderColor: isSel ? 'var(--a-em-deep)' : 'var(--a-line)' }}>
                  <span className="mt-0.5 flex-shrink-0">
                    {isSel ? <CheckSquare className="h-5 w-5 text-[var(--a-em-deep)]" /> : <Square className="h-5 w-5 text-[var(--a-dim)]" />}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--a-em-soft)' }}>
                    <Building2 className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--a-ink)] truncate">{lead.companyName || 'Unnamed'}</p>
                      {typeof lead.rating === 'number' && lead.rating > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-[var(--a-dim)]"><Star className="h-3 w-3" style={{ color: '#F59E0B' }} />{lead.rating} ({lead.reviewCount || 0})</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 text-xs text-[var(--a-muted)]">
                      {lead.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{fmtPhone(lead.phone)}</span>}
                      {lead.website && <span className="inline-flex items-center gap-1.5 truncate"><Globe className="h-3 w-3 flex-shrink-0" />{lead.website.replace(/^https?:\/\//, '')}</span>}
                      {lead.address && <span className="inline-flex items-center gap-1.5 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{lead.address}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state after a completed search */}
      {!loading && !error && leads.length === 0 && progress?.stage === 'done' && (
        <div className="rounded-xl border border-[var(--a-line)] bg-white py-12 text-center">
          <p className="text-sm text-[var(--a-dim)]">No call centers found for that location. Try a larger city or nearby metro.</p>
        </div>
      )}
    </div>
  );
}