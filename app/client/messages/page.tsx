'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Search, Send, ArrowLeft, Loader2, Phone, Archive, Check, CheckCheck, Plus
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

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) hex = '#3b82f6';
  const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return phone;
}

function formatTime(dateStr: string): string {
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
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const ANIM = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}`;

export default function MessagesPage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const primaryColor = theme?.primary || '#3b82f6';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!client) return;
    try {
      const r = await fetch(`${getBackendUrl()}/api/sms/conversations/${client.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setConversations(d.conversations || []);
      }
    } catch {} finally { setConvsLoading(false); }
  }, [client]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    if (!client) return;
    setMsgsLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/sms/conversations/${client.id}/${convId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
        // Mark as read
        await fetch(`${getBackendUrl()}/api/sms/conversations/${convId}/read`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
        // Update local unread count
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
      }
    } catch {} finally { setMsgsLoading(false); }
  }, [client]);

  useEffect(() => { if (client) fetchConversations(); }, [client, fetchConversations]);

  // Poll for new messages when a conversation is open
  useEffect(() => {
    if (activeConv && activeConv.id) {
      fetchMessages(activeConv.id);
      pollRef.current = setInterval(() => {
        fetchMessages(activeConv.id);
        fetchConversations();
      }, 8000);
    } else {
      setMessages([]);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || !client || sending) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');
    const isNew = !activeConv.id; // virtual conversation (new outbound)

    const optimistic: Message = { id: `temp-${Date.now()}`, conversation_id: activeConv.id || 'new', direction: 'outbound', content: msgText, sender_phone: client.vapi_phone_number || '', recipient_phone: activeConv.caller_phone, status: 'sending', sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);

    try {
      const payload: any = { client_id: client.id, to: activeConv.caller_phone, message: msgText };
      if (activeConv.id) payload.conversation_id = activeConv.id; // backend findOrCreate handles new ones
      const r = await fetch(`${getBackendUrl()}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.success) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: d.message?.id || m.id, status: 'sent' } : m));
        // Promote a virtual conversation to the real one the backend just created.
        if (isNew && d.conversation_id) {
          setActiveConv(prev => (prev ? { ...prev, id: d.conversation_id } : prev));
        }
        fetchConversations();
      } else {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const digits = (p: string) => (p || '').replace(/\D/g, '');

  // Open a thread to text someone. If a conversation already exists for that
  // number, open it; otherwise open a virtual thread (no id yet) that becomes
  // real on first send. Works for existing contacts and brand-new numbers.
  const openCompose = (to: string, name: string) => {
    if (!to) return;
    const target = digits(to).slice(-10);
    const existing = conversations.find(c => digits(c.caller_phone).slice(-10) === target);
    if (existing) { setActiveConv(existing); return; }
    setActiveConv({ id: '', client_id: client?.id || '', caller_phone: to, caller_name: name || null, last_message_at: '', last_message_preview: null, last_direction: '', unread_count: 0, is_archived: false, created_at: '' });
    setMessages([]);
  };

  // Deep-link: /client/messages?to=<phone>&name=<name> (from the Contacts page).
  useEffect(() => {
    if (composeHandled || !client || convsLoading) return;
    const params = new URLSearchParams(window.location.search);
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

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  // Mobile: if conversation is active, show thread; else show list
  const showThread = !!activeConv;

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Conversation List */}
      <div className={`${showThread ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 lg:border-r`} style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        {/* List Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: theme.text }}>Messages</h1>
            <p className="text-[11px]" style={{ color: theme.textMuted4 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Search + New message */}
        <div className="px-4 py-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: theme.textMuted4 }} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
          </div>
          <button onClick={() => { setComposePhone(''); setComposeName(''); setShowCompose(true); }} className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: '#fff' }} title="New message">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-12 px-6">
              <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: theme.textMuted4 }} />
              <p className="text-sm font-medium" style={{ color: theme.textMuted }}>No conversations yet</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>Text a caller from any call detail page to start</p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-50"
                style={{
                  backgroundColor: activeConv?.id === conv.id ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : 'transparent',
                  borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.12 : 0.08), color: primaryColor }}>
                  {(conv.caller_name || conv.caller_phone || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: theme.text }}>
                      {conv.caller_name || formatPhone(conv.caller_phone)}
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs truncate" style={{ color: conv.unread_count > 0 ? theme.text : theme.textMuted4 }}>
                      {conv.last_direction === 'outbound' ? 'You: ' : ''}{conv.last_message_preview || 'No messages'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Thread */}
      <div className={`${showThread ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: theme.textMuted4 }} />
              <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Select a conversation</p>
              <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>Or text a caller from any call detail page</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <button onClick={() => setActiveConv(null)} className="lg:hidden p-1" style={{ color: theme.textMuted }}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.12 : 0.08), color: primaryColor }}>
                {(activeConv.caller_name || activeConv.caller_phone || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                  {activeConv.caller_name || formatPhone(activeConv.caller_phone)}
                </p>
                <p className="text-[11px]" style={{ color: theme.textMuted4 }}>
                  {formatPhone(activeConv.caller_phone)}
                </p>
              </div>
              <a href={`tel:${activeConv.caller_phone}`} className="p-2 rounded-xl transition hover:opacity-80"
                style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06), color: primaryColor }}>
                <Phone className="h-4 w-4" />
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {msgsLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs" style={{ color: theme.textMuted4 }}>No messages yet. Send the first text below.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%] sm:max-w-[65%]">
                        <div className="rounded-2xl px-3.5 py-2.5" style={{
                          backgroundColor: isOutbound ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                          color: isOutbound ? theme.primaryText : theme.text,
                          borderBottomRightRadius: isOutbound ? 4 : 16,
                          borderBottomLeftRadius: isOutbound ? 16 : 4,
                        }}>
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

            {/* Input */}
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none focus:outline-none max-h-24"
                  style={{ ...glass, color: theme.text }}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0"
                  style={{ backgroundColor: primaryColor, color: theme.primaryText }}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] mt-1 text-center" style={{ color: theme.textMuted4 }}>
                SMS sent from your AI phone number · Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
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