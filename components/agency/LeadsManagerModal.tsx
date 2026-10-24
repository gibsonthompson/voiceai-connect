'use client';

// ============================================================================
// LEADS MANAGER MODAL — bulk management (delete) for the agency leads list.
// The leads page itself is a one-at-a-time work queue, so cleanup lives here:
// filter the list down (search + industry + status + source + date added),
// select rows (or select-all-filtered), and delete in bulk with a confirm step.
// Single-row delete uses the same confirm path.
//
// Backend: POST /api/agency/:agencyId/leads/bulk-delete { ids } (scoped to the
// agency). Filters are all real lead columns; there is no city/address column,
// so location is intentionally not a facet.
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import type { Lead } from '@/types/lead';
import { X, Trash2, Search, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CustomSelect } from '@/components/ui/custom-select';

export default function LeadsManagerModal({
  agencyId, open, onClose, onChanged,
}: {
  agencyId: string;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const theme = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fIndustry, setFIndustry] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fSource, setFSource] = useState('');
  const [fAdded, setFAdded] = useState('any');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '');

  const selectUi = useMemo(() => ({
    inputStyle: { backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text },
    text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border,
    hover: theme.hover, accent: theme.primary, isDark: theme.isDark,
  }), [theme]);

  // Load the full list each time the modal opens, so it always reflects reality.
  useEffect(() => {
    if (!open || !agencyId) return;
    setLoading(true); setError(''); setSelected(new Set()); setPendingDelete(null);
    setSearch(''); setFIndustry(''); setFStatus(''); setFSource(''); setFAdded('any');
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/leads`, { headers: { Authorization: `Bearer ${token()}` } });
        if (!res.ok) throw new Error('load failed');
        const data = await res.json();
        setLeads(data.leads || []);
      } catch {
        setError('Could not load your leads.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, agencyId, backendUrl]);

  const distinct = (key: keyof Lead) =>
    Array.from(new Set(leads.map((l) => (l[key] as string) || '').filter(Boolean))).sort();
  const industries = useMemo(() => distinct('industry'), [leads]);
  const statuses = useMemo(() => distinct('status'), [leads]);
  const sources = useMemo(() => distinct('source'), [leads]);

  const cap = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q && !(`${l.business_name || ''} ${l.contact_name || ''} ${l.email || ''}`.toLowerCase().includes(q))) return false;
      if (fIndustry && l.industry !== fIndustry) return false;
      if (fStatus && l.status !== fStatus) return false;
      if (fSource && l.source !== fSource) return false;
      if (fAdded !== 'any') {
        const days = Number(fAdded);
        const ageDays = l.created_at ? (now - new Date(l.created_at).getTime()) / 86400000 : 0;
        if (!(ageDays >= days)) return false;
      }
      return true;
    });
  }, [leads, search, fIndustry, fStatus, fSource, fAdded]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((l) => next.delete(l.id));
      else filtered.forEach((l) => next.add(l.id));
      return next;
    });
  };
  const toggleOne = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const runDelete = async () => {
    if (!pendingDelete || !pendingDelete.length) return;
    setDeleting(true);
    const ids = pendingDelete;
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/leads/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('delete failed');
      const idSet = new Set(ids);
      setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
      setSelected((prev) => { const n = new Set(prev); ids.forEach((i) => n.delete(i)); return n; });
      setPendingDelete(null);
      onChanged?.();
    } catch {
      setError('Delete failed. Please try again.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  const fmtDate = (iso?: string) => { if (!iso) return ''; try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const errRed = theme.error || '#ef4444';

  const Box = ({ on }: { on: boolean }) => (
    <span className="h-4 w-4 rounded flex items-center justify-center shrink-0" style={{ background: on ? theme.primary : 'transparent', border: `1px solid ${on ? theme.primary : theme.border}` }}>
      {on && <Check className="h-3 w-3" style={{ color: theme.primaryText }} />}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="relative w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]" style={{ background: theme.card, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: theme.text }}>Manage leads</h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Filter, select, and delete leads in bulk.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><X className="h-5 w-5" /></button>
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-3 space-y-2.5 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, contact, or email"
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <CustomSelect value={fIndustry} onChange={setFIndustry} ui={selectUi}
              options={[{ value: '', label: 'All industries' }, ...industries.map((i) => ({ value: i, label: cap(i) }))]} />
            <CustomSelect value={fStatus} onChange={setFStatus} ui={selectUi}
              options={[{ value: '', label: 'All statuses' }, ...statuses.map((s) => ({ value: s, label: cap(s) }))]} />
            <CustomSelect value={fSource} onChange={setFSource} ui={selectUi}
              options={[{ value: '', label: 'All sources' }, ...sources.map((s) => ({ value: s, label: cap(s) }))]} />
            <CustomSelect value={fAdded} onChange={setFAdded} ui={selectUi}
              options={[
                { value: 'any', label: 'Any time added' },
                { value: '30', label: 'Added 30+ days ago' },
                { value: '60', label: 'Added 60+ days ago' },
                { value: '90', label: 'Added 90+ days ago' },
              ]} />
          </div>
        </div>

        {/* Select-all + bulk action */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={toggleAll} disabled={!filtered.length} className="inline-flex items-center gap-2 text-sm" style={{ color: theme.text, opacity: filtered.length ? 1 : 0.5 }}>
            <Box on={allFilteredSelected} />
            Select all ({filtered.length})
          </button>
          <div className="flex items-center gap-3">
            {selected.size > 0 && <span className="text-xs" style={{ color: theme.textMuted }}>{selected.size} selected</span>}
            <button
              onClick={() => setPendingDelete(Array.from(selected))}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ color: selected.size ? '#fff' : theme.textMuted, background: selected.size ? errRed : 'transparent', border: `1px solid ${selected.size ? errRed : theme.border}`, opacity: selected.size ? 1 : 0.6 }}
            >
              <Trash2 className="h-4 w-4" /> Delete{selected.size ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: errRed }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: theme.textMuted }}>
              {leads.length === 0 ? 'No leads yet.' : 'No leads match these filters.'}
            </div>
          ) : (
            filtered.map((l) => {
              const on = selected.has(l.id);
              return (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${theme.border}`, background: on ? theme.hover : 'transparent' }}>
                  <button onClick={() => toggleOne(l.id)} className="shrink-0"><Box on={on} /></button>
                  <button onClick={() => toggleOne(l.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{l.business_name || 'Untitled lead'}</span>
                      {l.industry && <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: theme.hover, color: theme.textMuted }}>{cap(l.industry)}</span>}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>
                      {[l.contact_name, l.email].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </button>
                  <div className="text-[11px] shrink-0 hidden sm:block text-right" style={{ color: theme.textMuted }}>
                    <div>{cap(l.status || '')}</div>
                    <div>{fmtDate(l.created_at)}</div>
                  </div>
                  <button onClick={() => setPendingDelete([l.id])} className="p-1.5 rounded-lg shrink-0" title="Delete this lead" style={{ color: theme.textMuted }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Confirm overlay */}
        {pendingDelete && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => !deleting && setPendingDelete(null)}>
            <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2.5 mb-2">
                <AlertTriangle className="h-5 w-5" style={{ color: errRed }} />
                <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Delete {pendingDelete.length} lead{pendingDelete.length === 1 ? '' : 's'}?</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: theme.textMuted }}>This permanently removes {pendingDelete.length === 1 ? 'this lead' : 'these leads'} from your pipeline. This can&apos;t be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setPendingDelete(null)} disabled={deleting} className="rounded-lg px-3 py-2 text-sm font-medium" style={{ color: theme.text, border: `1px solid ${theme.border}` }}>Cancel</button>
                <button onClick={runDelete} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: errRed, color: '#fff', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete {pendingDelete.length}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
