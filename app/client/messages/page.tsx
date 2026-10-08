'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Search, Send, ArrowLeft, Loader2, Phone, Check, CheckCheck, Plus
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

interface Conversation {
  id: string; client_id: string; caller_phone: string; caller_name: string | null;
  last_message_at: string; last_message_preview: string | null; last_direction: string;
  unread_count: number; is_archived: boolean; created_at: string;
}

interface Message {
  id: string; conversation_id: string; direction: 'inbound' | 'outbound';
  content: string; sender_phone: string; recipient_phone: string;
  status: string; sent_at: string;
}

interface ProviderMessage { id: string; sender: 'agency' | 'client'; body: string; at: string; kind: 'sms' | 'thread'; }

// A single list row, customer SMS conversation or the pinned provider thread.
type Active = { kind: 'customer'; conv: Conversation } | { kind: 'provider' } | null;

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) hex = '#3b82f6';
  const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return phone;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 0) return time;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function MessagesPage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const primaryColor = theme?.primary || '#3b82f6';

  // ── Customer SMS conversations ──────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // ── Provider (SmartCall) conversation ──────────────────────────────────
  const [providerMsgs, setProviderMsgs] = useState<ProviderMessage[]>([]);
  const [providerUnread, setProviderUnread] = useState(0);
  const [providerLastAt, setProviderLastAt] = useState<string>('');
  const [providerLoading, setProviderLoading] = useState(false);
  const agencyName = client?.agency?.name || 'Your provider';
  const agencyLogo = (client?.agency as any)?.logo_url || null;

  // ── Shared ──────────────────────────────────────────────────────────────
  const [active, setActive] = useState<Active>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composePhone, setComposePhone] = useState('');
  const [composeName, setComposeName] = useState('');
  const [composeHandled, setComposeHandled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const getToken = () => localStorage.getItem('auth_token');

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!client) return;
    try {
      const r = await fetch(`${getBackendUrl()}/api/sms/conversations/${client.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) { const d = await r.json(); setConversations(d.conversations || []); }
    } catch {} finally { setConvsLoading(false); }
  }, [client]);

  const fetchProvider = useCallback(async (markRead = false) => {
    if (!client) return;
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/provider-inbox`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setProviderMsgs(d.messages || []);
        const msgs: ProviderMessage[] = d.messages || [];
        setProviderLastAt(msgs.length ? msgs[msgs.length - 1].at : '');
        // When the thread is open we just read it; otherwise reflect server unread.
        setProviderUnread(markRead ? 0 : (d.unread_total || 0));
      }
    } catch {}
  }, [client]);

  const fetchMessages = useCallback(async (convId: string) => {
    if (!client) return;
    setMsgsLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/sms/conversations/${client.id}/${convId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
        await fetch(`${getBackendUrl()}/api/sms/conversations/${convId}/read`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
      }
    } catch {} finally { setMsgsLoading(false); }
  }, [client]);

  useEffect(() => { if (client) { fetchConversations(); fetchProvider(); } }, [client, fetchConversations, fetchProvider]);

  // Poll the open thread + keep the list fresh.
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (active?.kind === 'customer' && active.conv.id) {
      fetchMessages(active.conv.id);
      pollRef.current = setInterval(() => { fetchMessages(active.conv.id); fetchConversations(); }, 8000);
    } else if (active?.kind === 'provider') {
      fetchProvider(true);
      pollRef.current = setInterval(() => { fetchProvider(true); }, 8000);
    } else {
      setMessages([]);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.kind, active?.kind === 'customer' ? active.conv.id : 'provider']);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, providerMsgs, active]);

  // ── Sending ──────────────────────────────────────────────────────────────
  const handleSendCustomer = async (conv: Conversation) => {
    if (!newMessage.trim() || !client || sending) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');
    const isNew = !conv.id;
    const optimistic: Message = { id: `temp-${Date.now()}`, conversation_id: conv.id || 'new', direction: 'outbound', content: msgText, sender_phone: client.vapi_phone_number || '', recipient_phone: conv.caller_phone, status: 'sending', sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const payload: any = { client_id: client.id, to: conv.caller_phone, message: msgText };
      if (conv.id) payload.conversation_id = conv.id;
      const r = await fetch(`${getBackendUrl()}/api/sms/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.success) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: d.message?.id || m.id, status: 'sent' } : m));
        if (isNew && d.conversation_id) setActive({ kind: 'customer', conv: { ...conv, id: d.conversation_id } });
        fetchConversations();
      } else {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleSendProvider = async () => {
    if (!newMessage.trim() || !client || sending) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');
    const optimistic: ProviderMessage = { id: `temp-${Date.now()}`, sender: 'client', body: msgText, at: new Date().toISOString(), kind: 'thread' };
    setProviderMsgs(prev => [...prev, optimistic]);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/provider-inbox/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ body: msgText }) });
      const d = await r.json();
      if (d.success) { await fetchProvider(true); }
      else { setProviderMsgs(prev => prev.filter(m => m.id !== optimistic.id)); setNewMessage(msgText); }
    } catch {
      setProviderMsgs(prev => prev.filter(m => m.id !== optimistic.id)); setNewMessage(msgText);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleSend = () => {
    if (active?.kind === 'customer') handleSendCustomer(active.conv);
    else if (active?.kind === 'provider') handleSendProvider();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const digits = (p: string) => (p || '').replace(/\D/g, '');

  const openCompose = (to: string, name: string) => {
    if (!to) return;
    const target = digits(to).slice(-10);
    const existing = conversations.find(c => digits(c.caller_phone).slice(-10) === target);
    if (existing) { setActive({ kind: 'customer', conv: existing }); return; }
    setActive({ kind: 'customer', conv: { id: '', client_id: client?.id || '', caller_phone: to, caller_name: name || null, last_message_at: '', last_message_preview: null, last_direction: '', unread_count: 0, is_archived: false, created_at: '' } });
    setMessages([]);
  };

  // Deep-links: ?to=&name= opens a customer thread; ?channel=agency opens provider.
  useEffect(() => {
    if (composeHandled || !client || convsLoading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('channel') === 'agency') { setActive({ kind: 'provider' }); setComposeHandled(true); return; }
    const to = params.get('to');
    if (to) { openCompose(to, params.get('name') || ''); setComposeHandled(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, convsLoading, composeHandled]);

  const filteredConvs = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.caller_name?.toLowerCase().includes(q) || (c.caller_phone || '').includes(q) || c.last_message_preview?.toLowerCase().includes(q));
  });

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)' };
  const hairline = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  const showThread = !!active;
  const providerPreview = providerMsgs.length ? providerMsgs[providerMsgs.length - 1] : null;
  const providerMatchesSearch = !searchQuery || agencyName.toLowerCase().includes(searchQuery.toLowerCase());

  const Avatar = ({ name, logo, size }: { name: string; logo: string | null; size: number }) => (
    logo
      ? <img src={logo} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
      : <div className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold" style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.12 : 0.08), color: primaryColor }}>{(name || '?').charAt(0).toUpperCase()}</div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" style={{ backgroundColor: theme.bg }}>
      <div className="flex flex-1 min-h-0">

        {/* ── Conversation list ─────────────────────────────────────────── */}
        <div className={`${showThread ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 lg:border-r`} style={{ borderColor: hairline }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Messages</h1>
            <button onClick={() => { setComposePhone(''); setComposeName(''); setShowCompose(true); }} className="flex items-center justify-center h-9 w-9 rounded-full transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: '#fff' }} title="New message">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: theme.textMuted4 }} />
              <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Pinned provider conversation */}
            {providerMatchesSearch && (
              <button onClick={() => setActive({ kind: 'provider' })}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                style={{ backgroundColor: active?.kind === 'provider' ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : hexToRgba(primaryColor, theme.isDark ? 0.03 : 0.02), borderBottom: `1px solid ${hairline}` }}>
                <Avatar name={agencyName} logo={agencyLogo} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: theme.text }}>
                      {agencyName}
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}>Provider</span>
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>{formatTime(providerLastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs truncate" style={{ color: providerUnread > 0 ? theme.text : theme.textMuted4 }}>
                      {providerPreview ? `${providerPreview.sender === 'client' ? 'You: ' : ''}${providerPreview.body}` : `Messages from ${agencyName} show up here`}
                    </span>
                    {providerUnread > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>{providerUnread > 9 ? '9+' : providerUnread}</span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* Customer conversations */}
            {convsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-10 px-6">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted4, opacity: 0.4 }} />
                <p className="text-xs" style={{ color: theme.textMuted4 }}>No customer conversations yet. Text a caller from any call detail page to start one.</p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button key={conv.id || conv.caller_phone} onClick={() => setActive({ kind: 'customer', conv })}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{ backgroundColor: active?.kind === 'customer' && active.conv.id === conv.id ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : 'transparent', borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}` }}>
                  <Avatar name={conv.caller_name || conv.caller_phone} logo={null} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{conv.caller_name || formatPhone(conv.caller_phone)}</span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>{formatTime(conv.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs truncate" style={{ color: conv.unread_count > 0 ? theme.text : theme.textMuted4 }}>{conv.last_direction === 'outbound' ? 'You: ' : ''}{conv.last_message_preview || 'No messages'}</span>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>{conv.unread_count > 9 ? '9+' : conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ────────────────────────────────────────────────────── */}
        <div className={`${showThread ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: theme.textMuted4 }} />
                <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Select a conversation</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>Your provider and your customers are all here</p>
              </div>
            </div>
          ) : active.kind === 'provider' ? (
            <>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${hairline}` }}>
                <button onClick={() => setActive(null)} className="lg:hidden p-1" style={{ color: theme.textMuted }}><ArrowLeft className="h-5 w-5" /></button>
                <Avatar name={agencyName} logo={agencyLogo} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{agencyName}</p>
                  <p className="text-[11px]" style={{ color: theme.textMuted4 }}>Your provider</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {providerLoading && providerMsgs.length === 0 ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} /></div>
                ) : providerMsgs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>No messages yet. Say hi to {agencyName} below.</p>
                  </div>
                ) : (
                  providerMsgs.map(m => {
                    const mine = m.sender === 'client';
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%] sm:max-w-[65%]">
                          <div className="rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: mine ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: mine ? theme.primaryText : theme.text, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 px-1 ${mine ? 'justify-end' : ''}`}>
                            <span className="text-[10px]" style={{ color: theme.textMuted4 }}>{formatMessageTime(m.at)}</span>
                            {m.kind === 'sms' && <span className="text-[9px] px-1 rounded" style={{ color: theme.textMuted4, border: `1px solid ${hairline}` }}>Text</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3" style={{ borderTop: `1px solid ${hairline}` }}>
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${agencyName}...`} rows={1} className="flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none focus:outline-none max-h-24" style={{ ...glass, color: theme.text }} />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
                <p className="text-[10px] mt-1 text-center" style={{ color: theme.textMuted4 }}>Replies reach {agencyName} in their dashboard inbox</p>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${hairline}` }}>
                <button onClick={() => setActive(null)} className="lg:hidden p-1" style={{ color: theme.textMuted }}><ArrowLeft className="h-5 w-5" /></button>
                <Avatar name={active.conv.caller_name || active.conv.caller_phone} logo={null} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{active.conv.caller_name || formatPhone(active.conv.caller_phone)}</p>
                  <p className="text-[11px]" style={{ color: theme.textMuted4 }}>{formatPhone(active.conv.caller_phone)}</p>
                </div>
                <a href={`tel:${active.conv.caller_phone}`} className="p-2 rounded-xl transition hover:opacity-80" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06), color: primaryColor }}><Phone className="h-4 w-4" /></a>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {msgsLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12"><p className="text-xs" style={{ color: theme.textMuted4 }}>No messages yet. Send the first text below.</p></div>
                ) : (
                  messages.map(msg => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%] sm:max-w-[65%]">
                          <div className="rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: isOutbound ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: isOutbound ? theme.primaryText : theme.text, borderBottomRightRadius: isOutbound ? 4 : 16, borderBottomLeftRadius: isOutbound ? 16 : 4 }}>
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOutbound ? 'justify-end' : ''}`}>
                            <span className="text-[10px]" style={{ color: theme.textMuted4 }}>{formatMessageTime(msg.sent_at)}</span>
                            {isOutbound && msg.status === 'delivered' && <CheckCheck className="h-3 w-3" style={{ color: primaryColor }} />}
                            {isOutbound && msg.status === 'sent' && <Check className="h-3 w-3" style={{ color: theme.textMuted4 }} />}
                            {isOutbound && msg.status === 'failed' && <span className="text-[10px]" style={{ color: theme.error }}>Failed</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3" style={{ borderTop: `1px solid ${hairline}` }}>
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." rows={1} className="flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none focus:outline-none max-h-24" style={{ ...glass, color: theme.text }} />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
                <p className="text-[10px] mt-1 text-center" style={{ color: theme.textMuted4 }}>Sent from your AI phone number. Enter to send, Shift+Enter for a new line</p>
              </div>
            </>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowCompose(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: theme.isDark ? '#141414' : '#ffffff', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>New message</h3>
              <button onClick={() => setShowCompose(false)} style={{ color: theme.textMuted }}><ArrowLeft className="h-4 w-4" /></button>
            </div>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: theme.textMuted4 }}>Phone number</label>
            <input value={composePhone} onChange={(e) => setComposePhone(e.target.value)} placeholder="+1 555 123 4567" className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
            <label className="text-[10px] uppercase tracking-wide" style={{ color: theme.textMuted4 }}>Name (optional)</label>
            <input value={composeName} onChange={(e) => setComposeName(e.target.value)} placeholder="Contact name" className="w-full mt-1 mb-4 px-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
            <button onClick={() => { if (composePhone.trim()) { openCompose(composePhone.trim(), composeName.trim()); setShowCompose(false); } }} disabled={!composePhone.trim()} className="w-full py-2.5 rounded-xl text-sm font-semibold transition" style={{ backgroundColor: theme.primary, color: '#fff', opacity: composePhone.trim() ? 1 : 0.5 }}>
              Start conversation
            </button>
            <p className="text-[10px] mt-2 text-center" style={{ color: theme.textMuted4 }}>To text an existing contact, open Contacts and tap the message icon.</p>
          </div>
        </div>
      )}
    </div>
  );
}