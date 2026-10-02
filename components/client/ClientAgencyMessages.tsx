'use client';

// ============================================================================
// CLIENT AGENCY MESSAGES — the client side of two-way agency <-> client
// messaging. Rendered inside the client Messages page under the "[Agency]"
// channel toggle (NOT a separate page). Lists the client's conversations with
// their agency, opens one, lets them reply, and lets them start a new one.
//
//   GET  /api/client/:clientId/agency-threads
//   GET  /api/client/:clientId/agency-threads/:id
//   POST /api/client/:clientId/agency-threads/:id/reply
//   POST /api/agency/:agencyId/support-requests/from-client   (start a new one)
//
// onUnreadChange lets the parent reflect the live unread count on the toggle.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, ArrowLeft, Send, MessageSquare, Plus } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

interface ThreadRow {
  id: string;
  message: string;
  status: string;
  created_at: string;
  last_reply_at: string | null;
  last_sender: string | null;
  client_unread: number;
}
interface ThreadMessage {
  id: string;
  sender: 'agency' | 'client';
  body: string;
  created_at: string;
  seed?: boolean;
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

export default function ClientAgencyMessages({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const { client } = useClient();
  const theme = useClientTheme();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const agencyName = client?.agency?.name || 'your provider';

  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeText, setComposeText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    if (!client?.id) return;
    setListLoading(true);
    try {
      const r = await fetch(`${backendUrl}/api/client/${client.id}/agency-threads`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error('load failed');
      const data = await r.json();
      setThreads(data.threads || []);
      onUnreadChange?.(data.unread_total || 0);
    } catch (e) {
      console.error('Agency threads list error:', e);
    } finally {
      setListLoading(false);
    }
  }, [client?.id, backendUrl, onUnreadChange]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (activeId) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeId]);

  const openThread = async (id: string) => {
    if (!client?.id) return;
    setActiveId(id);
    setThreadLoading(true);
    setMessages([]);
    try {
      const r = await fetch(`${backendUrl}/api/client/${client.id}/agency-threads/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error('thread failed');
      const data = await r.json();
      setMessages(data.thread || []);
      // The open marked it read server-side; reflect that locally.
      setThreads(prev => prev.map(t => t.id === id ? { ...t, client_unread: 0 } : t));
      onUnreadChange?.(threads.reduce((n, t) => n + (t.id === id ? 0 : (t.client_unread || 0)), 0));
    } catch (e) {
      console.error('Agency thread load error:', e);
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || sending || !client?.id || !activeId) return;
    setSending(true);
    try {
      const r = await fetch(`${backendUrl}/api/client/${client.id}/agency-threads/${activeId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) throw new Error('send failed');
      const data = await r.json();
      if (data.message) setMessages(prev => [...prev, data.message]);
      setReply('');
    } catch (e) {
      console.error('Agency thread reply error:', e);
    } finally {
      setSending(false);
    }
  };

  const sendNew = async () => {
    const message = composeText.trim();
    if (!message || sending || !client?.id || !client?.agency?.id) return;
    setSending(true);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${client.agency.id}/support-requests/from-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message }),
      });
      if (!r.ok) throw new Error('send failed');
      setComposeText('');
      setComposing(false);
      await loadList();
    } catch (e) {
      console.error('New agency message error:', e);
    } finally {
      setSending(false);
    }
  };

  const panel = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' as const };

  // ---- Thread view ----
  if (activeId) {
    const row = threads.find(t => t.id === activeId);
    return (
      <div style={panel}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
            <ArrowLeft className="h-4 w-4" /> All messages
          </button>
          <span className="text-sm font-medium" style={{ color: theme.text }}>{agencyName}</span>
        </div>

        <div className="px-4 py-4 space-y-3 max-h-[min(60vh,560px)] overflow-y-auto">
          {threadLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
          ) : messages.map(m => {
            const mine = m.sender === 'client';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  <div className="text-[11px] mb-1" style={{ color: theme.textMuted, textAlign: mine ? 'right' : 'left' }}>
                    {mine ? 'You' : agencyName} · {fmt(m.created_at)}
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
                    style={mine
                      ? { backgroundColor: theme.primary, color: theme.primaryText }
                      : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 flex items-end gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReply(); } }}
            rows={2}
            placeholder={`Reply to ${agencyName}...`}
            className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
          />
          <button onClick={sendReply} disabled={!reply.trim() || sending}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
        {row && row.status === 'resolved' && (
          <div className="px-4 pb-3 text-[11px]" style={{ color: theme.textMuted }}>
            This was marked resolved. Replying reopens it.
          </div>
        )}
      </div>
    );
  }

  // ---- Compose a new message ----
  if (composing) {
    return (
      <div style={panel}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => { setComposing(false); setComposeText(''); }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
            <ArrowLeft className="h-4 w-4" /> All messages
          </button>
          <span className="text-sm font-medium" style={{ color: theme.text }}>Message {agencyName}</span>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            rows={5}
            autoFocus
            placeholder={`What do you need help with? ${agencyName} will see this and can reply right here.`}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
          />
          <div className="flex justify-end">
            <button onClick={sendNew} disabled={!composeText.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Thread list ----
  return (
    <div style={panel}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <span className="text-sm font-medium" style={{ color: theme.text }}>Messages with {agencyName}</span>
        <button onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}`, color: theme.primary }}>
          <Plus className="h-3.5 w-3.5" /> New message
        </button>
      </div>

      {listLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
      ) : threads.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
            <MessageSquare className="h-7 w-7" style={{ color: theme.primary }} />
          </div>
          <p className="text-sm" style={{ color: theme.text }}>No messages with {agencyName} yet</p>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Start a conversation and their replies will show up here.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: theme.border }}>
          {threads.map(t => {
            const unread = (t.client_unread || 0) > 0;
            const last = t.last_reply_at || t.created_at;
            return (
              <button key={t.id} onClick={() => openThread(t.id)}
                className="w-full text-left px-4 py-4 flex items-start gap-3 transition-colors"
                style={{ borderColor: theme.border, backgroundColor: unread ? theme.primary15 : 'transparent' }}>
                <span className="mt-1.5 inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: unread ? theme.primary : 'transparent' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm truncate" style={{ color: theme.text, fontWeight: unread ? 600 : 400 }}>{t.message}</span>
                    <span className="text-[11px] shrink-0" style={{ color: theme.textMuted }}>{fmt(last)}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                    {t.last_sender === 'agency' ? `${agencyName} replied` : t.last_sender === 'client' ? 'You replied' : 'Sent'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
