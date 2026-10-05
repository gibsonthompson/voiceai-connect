'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

interface ErrorReport {
  id: string;
  context: string;
  message: string | null;
  stack: string | null;
  metadata: Record<string, any> | null;
  resolved: boolean;
  created_at: string;
}

// Turn a raw context key (e.g. "client_signup_failed") into a readable title.
const prettyContext = (c: string) =>
  String(c || 'Alert').replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export default function AdminAlertsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/error-reports?resolved=${showResolved}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { const d = await res.json(); setReports(d.reports || []); }
    } catch { /* leave list as-is */ }
    finally { setLoading(false); }
  }, [showResolved]);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  const resolve = async (id: string, resolved: boolean) => {
    setBusy(id);
    try {
      await fetch(`${getBackendUrl()}/api/admin/error-reports/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ resolved }),
      });
      await fetchErrors();
    } catch { /* no-op */ } finally { setBusy(null); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-5 w-5" style={{ color: 'var(--a-em-deep)' }} />
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--a-ink)]">Alerts &amp; Errors</h1>
      </div>
      <p className="text-sm text-[var(--a-muted)] mb-6">
        System alerts and backend errors, like failed client signups, provisioning problems, and payment issues. These are the same events the platform texts you about, in one place you can actually open and clear.
      </p>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--a-muted)]">
          {loading ? 'Loading…' : `${reports.length} ${showResolved ? 'resolved' : 'open'} alert${reports.length === 1 ? '' : 's'}`}
        </p>
        <button onClick={() => setShowResolved((v) => !v)} className="text-xs rounded-lg px-3 py-1.5"
          style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)', color: 'var(--a-muted)' }}>
          {showResolved ? 'Show open' : 'Show resolved'}
        </button>
      </div>

      {!loading && reports.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm text-[var(--a-muted)]"
          style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)' }}>
          No {showResolved ? 'resolved' : 'open'} alerts. All clear.
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl p-4" style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--a-ink)] break-words">{prettyContext(r.context)}</p>
                {r.message && <p className="mt-1 text-sm text-[var(--a-muted)] break-words">{r.message}</p>}
              </div>
              <button onClick={() => resolve(r.id, !r.resolved)} disabled={busy === r.id}
                className="flex-shrink-0 text-xs rounded-lg px-3 py-1.5 disabled:opacity-50"
                style={{ background: r.resolved ? 'var(--a-card)' : 'var(--a-em-soft)', border: '1px solid var(--a-em-line)', color: 'var(--a-em-deep)' }}>
                {r.resolved ? 'Reopen' : 'Resolve'}
              </button>
            </div>
            {r.metadata && Object.keys(r.metadata).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(r.metadata).map(([k, v]) => (
                  <span key={k} className="text-[11px] text-[var(--a-muted)] break-all">
                    <span className="font-medium text-[var(--a-ink)]">{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            )}
            {r.stack && (
              <pre className="mt-2 max-h-32 overflow-auto rounded-lg p-2 text-[10px] leading-relaxed text-[var(--a-muted)]"
                style={{ background: 'rgba(127,127,127,0.06)' }}>{r.stack}</pre>
            )}
            <p className="mt-2 text-[10px] text-[var(--a-muted)]">{new Date(r.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
