'use client';

// ============================================================================
// ADMIN BROADCAST, platform-wide agency announcements.
// Compose a message that shows as a dismissible, timed banner on every agency
// dashboard and/or goes out as a mass SMS to every agency owner.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Send, Loader2, Trash2, Clock, Monitor, MessageSquare, Check } from 'lucide-react';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

interface Broadcast {
  id: string;
  title: string | null;
  body: string | null;
  link_url: string | null;
  link_label: string | null;
  show_on_dashboard: boolean;
  expires_at: string | null;
  sms_sent: boolean;
  sms_recipients: number | null;
  created_at: string;
}

const DURATIONS = [
  { value: 0, label: 'No expiry (until dismissed or removed)' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '72 hours' },
  { value: 168, label: '7 days' },
];

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [durationHours, setDurationHours] = useState(24);
  const [sendSms, setSendSms] = useState(false);
  const [smsBody, setSmsBody] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${backendUrl()}/api/admin/broadcasts`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) { const d = await r.json(); setHistory(d.broadcasts || []); }
    } catch {} finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // SMS text defaults to the composed title/body/link when the admin hasn't typed one.
  const effectiveSms = smsBody.trim() || [title.trim(), body.trim(), linkUrl.trim()].filter(Boolean).join('\n');
  const smsLen = effectiveSms.length;
  const smsSegments = smsLen === 0 ? 0 : Math.ceil(smsLen / 153);

  const canSend = (showOnDashboard && (title.trim() || body.trim())) || (sendSms && effectiveSms.trim());

  const send = async () => {
    if (!canSend || sending) return;
    setSending(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${backendUrl()}/api/admin/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          title, body, link_url: linkUrl, link_label: linkLabel,
          show_on_dashboard: showOnDashboard,
          duration_hours: durationHours,
          send_sms: sendSms,
          sms_body: smsBody.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) { setError(d.error || 'Failed to send.'); return; }
      const bits: string[] = [];
      if (showOnDashboard) bits.push('live on agency dashboards');
      if (sendSms && d.sms) bits.push(`texted to ${d.sms.sent} agenc${d.sms.sent === 1 ? 'y' : 'ies'}${d.sms.skipped ? ` (${d.sms.skipped} had no phone)` : ''}`);
      setResult(bits.length ? `Broadcast ${bits.join(' and ')}.` : 'Broadcast saved.');
      setTitle(''); setBody(''); setLinkUrl(''); setLinkLabel(''); setSmsBody(''); setSendSms(false);
      loadHistory();
    } catch { setError('Something went wrong.'); }
    finally { setSending(false); }
  };

  const remove = async (id: string) => {
    setHistory(prev => prev.filter(b => b.id !== id));
    try { await fetch(`${backendUrl()}/api/admin/broadcasts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }); } catch {}
  };

  const field = 'w-full rounded-xl px-3 py-2.5 text-sm bg-[var(--a-bg)] border border-[var(--a-line-2)] text-[var(--a-ink)] focus:outline-none';
  const label = 'block text-[11px] font-semibold uppercase tracking-wider text-[var(--a-dim)] mb-1.5';

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} aria-pressed={on} className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors" style={{ backgroundColor: on ? 'var(--a-em-deep)' : 'var(--a-line-2)' }}>
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? '18px' : '2px' }} />
    </button>
  );

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-2.5">
        <Megaphone className="h-5 w-5 text-[var(--a-em-deep)]" />
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Broadcast</h1>
      </div>
      <p className="mt-1 text-sm text-[var(--a-dim)]">Send an announcement to every agency: a dismissible banner on their dashboard, a mass text, or both.</p>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Composer */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--a-line-2)] bg-[var(--a-card)] p-5">
          <div className="space-y-4">
            <div>
              <label className={label}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New marketing kits are here" className={field} maxLength={140} />
            </div>
            <div>
              <label className={label}>Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Fresh templates for your outreach. Grab them from the marketing kit." className={`${field} resize-none`} maxLength={1000} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Link URL</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/agency/marketing-kit" className={field} maxLength={500} />
              </div>
              <div>
                <label className={label}>Button label</label>
                <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="View kits" className={field} maxLength={60} />
              </div>
            </div>

            {/* Dashboard banner channel */}
            <div className="rounded-xl border border-[var(--a-line-2)] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Monitor className="h-4 w-4 text-[var(--a-dim)] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--a-ink)]">Show on agency dashboards</p>
                    <p className="text-[11px] text-[var(--a-dim)]">A banner each agency can dismiss. The timer controls how long it stays.</p>
                  </div>
                </div>
                <Toggle on={showOnDashboard} onClick={() => setShowOnDashboard(v => !v)} />
              </div>
              {showOnDashboard && (
                <div className="mt-3">
                  <label className={label}>Show for</label>
                  <select value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} className={field}>
                    {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* SMS channel */}
            <div className="rounded-xl border border-[var(--a-line-2)] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="h-4 w-4 text-[var(--a-dim)] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--a-ink)]">Also text every agency</p>
                    <p className="text-[11px] text-[var(--a-dim)]">Sends from the platform number to each agency owner.</p>
                  </div>
                </div>
                <Toggle on={sendSms} onClick={() => setSendSms(v => !v)} />
              </div>
              {sendSms && (
                <div className="mt-3">
                  <label className={label}>Text message</label>
                  <textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} rows={3} placeholder={effectiveSms || 'The text agencies will receive...'} className={`${field} resize-none`} maxLength={1000} />
                  <p className="text-[11px] mt-1 text-[var(--a-dim)]">{smsLen} characters, about {smsSegments} text{smsSegments === 1 ? '' : 's'} each. Leave blank to use the title, message, and link above.</p>
                </div>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--a-red)' }}>{error}</p>}
            {result && <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--a-em-deep)' }}><Check className="h-4 w-4" /> {result}</p>}

            <button onClick={send} disabled={!canSend || sending}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--a-em-deep)' }}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : (sendSms ? 'Send broadcast + SMS' : 'Send broadcast')}
            </button>
            {sendSms && <p className="text-[11px] text-center text-[var(--a-dim)]">This texts every agency with a phone number on file. There is no undo on SMS.</p>}
          </div>
        </div>

        {/* Preview + history */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className={label}>Dashboard preview</p>
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: 'var(--a-em-wash)', border: '1px solid var(--a-em-line)' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--a-em-soft)' }}>
                <Megaphone className="h-4 w-4 text-[var(--a-em-deep)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--a-ink)]">{title || 'Your title'}</p>
                {body && <p className="text-[13px] mt-0.5 text-[var(--a-dim)]">{body}</p>}
                <div className="flex items-center gap-3 mt-2.5">
                  {(linkUrl || linkLabel) && <span className="rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--a-em-deep)' }}>{linkLabel || 'Open'}</span>}
                  {showOnDashboard && durationHours > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-[var(--a-dim)]"><Clock className="h-3 w-3" /> Available for {durationHours >= 24 ? `${Math.round(durationHours / 24)}d` : `${durationHours}h`}</span>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className={label}>Recent broadcasts</p>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-dim)]" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-[var(--a-dim)] py-4">No broadcasts yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(b => {
                  const expired = b.expires_at && new Date(b.expires_at).getTime() <= Date.now();
                  return (
                    <div key={b.id} className="rounded-xl border border-[var(--a-line-2)] bg-[var(--a-card)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--a-ink)] min-w-0 truncate">{b.title || b.body || '(no title)'}</p>
                        <button onClick={() => remove(b.id)} title="Remove" className="flex-shrink-0 p-1 rounded-lg transition hover:opacity-70 text-[var(--a-dim)]"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {b.show_on_dashboard && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: expired ? 'var(--a-line)' : 'var(--a-em-soft)', color: expired ? 'var(--a-dim)' : 'var(--a-em-deep)' }}>{expired ? 'Banner expired' : 'On dashboards'}</span>}
                        {b.sms_sent && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--a-cyan-soft)', color: 'var(--a-cyan)' }}>SMS to {b.sms_recipients ?? 0}</span>}
                      </div>
                      <p className="text-[10px] mt-1.5 text-[var(--a-dim)]">{fmtDate(b.created_at)}{b.expires_at ? ` · ${expired ? 'expired' : 'expires'} ${fmtDate(b.expires_at)}` : ''}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}