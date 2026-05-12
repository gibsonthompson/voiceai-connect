'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircleQuestion, X, Search, ChevronLeft, ChevronRight,
  Send, Loader2, Bot, User, ArrowUpRight, Sparkles, MessageSquare,
  HelpCircle, Phone, CreditCard, Users, FlaskConical, BookOpen,
  Target, Wrench, Palette, UserPlus, PhoneCall, Receipt, Check,
  Calendar,
} from 'lucide-react';
import { KB_CATEGORIES, KB_ARTICLES, searchKB, getKBContextText, type KBArticle } from '@/lib/support-kb';

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket: Sparkles, CreditCard, Receipt, Users, FlaskConical, BookOpen,
  Phone, Palette, Target, UserPlus, PhoneCall, Wrench, HelpCircle, Calendar,
};

type WidgetView = 'home' | 'category' | 'article' | 'chat' | 'escalation';
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

interface SupportWidgetProps {
  theme: any;
  userType?: 'agency' | 'client';
}

export default function SupportWidget({ theme, userType = 'agency' }: SupportWidgetProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Escalation state
  const [escalationMessage, setEscalationMessage] = useState('');
  const [escalationSending, setEscalationSending] = useState(false);
  const [escalationSent, setEscalationSent] = useState(false);
  const [escalationError, setEscalationError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Focus search on open
  useEffect(() => {
    if (open && view === 'home') {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [open, view]);

  // Search handler
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      setSearchResults(searchKB(q, userType));
    } else {
      setSearchResults([]);
    }
  }, []);

  // Navigate
  const goHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openCategory = (catId: string) => {
    setSelectedCategory(catId);
    setView('category');
  };

  const openArticle = (article: KBArticle) => {
    setSelectedArticle(article);
    setView('article');
  };

  const openChat = () => {
    setView('chat');
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: "Hi! I'm the VoiceAI Connect assistant. Ask me anything about the platform — plans, features, setup, troubleshooting — and I'll find the answer for you.",
      }]);
    }
    setTimeout(() => chatInputRef.current?.focus(), 200);
  };

  const openEscalation = () => {
    setView('escalation');
    setEscalationSent(false);
    setEscalationError(null);
  };

  // Chat submit
  const handleChatSubmit = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${backendUrl}/api/help/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          message: msg,
          history: chatMessages.filter(m => m.role !== 'assistant' || chatMessages.indexOf(m) > 0).slice(-10),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || "I'm sorry, I couldn't process that. Try rephrasing or contact support." }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. You can send a message directly to our team using the 'Contact Support' option.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Escalation submit
  const handleEscalationSubmit = async () => {
    const msg = escalationMessage.trim();
    if (!msg || escalationSending) return;

    setEscalationSending(true);
    setEscalationError(null);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${backendUrl}/api/help/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setEscalationSent(true);
      setEscalationMessage('');
    } catch (err) {
      setEscalationError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setEscalationSending(false);
    }
  };

  // Get category articles
  const categoryArticles = selectedCategory
    ? KB_ARTICLES.filter(a => a.category === selectedCategory && (a.userType === userType || a.userType === 'both'))
    : [];
  const categoryLabel = selectedCategory
    ? KB_CATEGORIES.find(c => c.id === selectedCategory)?.label || ''
    : '';

  // Styles
  const panelBg = theme.isDark ? '#0a0a0a' : '#ffffff';
  const inputBg = theme.isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb';
  const inputBorder = theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: theme.primary,
          color: theme.primaryText,
          boxShadow: `0 4px 20px ${theme.primary}40`,
        }}
        aria-label="Help"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-[380px] max-w-[calc(100vw-2rem)] flex flex-col"
      style={{
        height: 'min(580px, calc(100vh - 6rem))',
        borderRadius: '20px',
        backgroundColor: panelBg,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDark
          ? '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button onClick={goHome} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
              {view === 'home' && 'Help Center'}
              {view === 'category' && categoryLabel}
              {view === 'article' && 'Help Article'}
              {view === 'chat' && 'AI Assistant'}
              {view === 'escalation' && 'Contact Support'}
            </h3>
            {view === 'home' && (
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Search or browse help topics</p>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search help articles..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
                style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: theme.text }}
              />
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 ? (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
                {searchResults.length === 0 ? (
                  <div className="text-center py-6">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: theme.textMuted }}>No articles found</p>
                    <button onClick={openChat} className="mt-3 text-xs font-medium" style={{ color: theme.primary }}>
                      Ask the AI assistant →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.map(article => (
                      <button key={article.id} onClick={() => openArticle(article)}
                        className="w-full text-left rounded-xl p-3 transition-colors"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <p className="text-sm font-medium" style={{ color: theme.text }}>{article.question}</p>
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: theme.textMuted }}>
                          {article.answer.substring(0, 100)}...
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <button onClick={openChat}
                    className="flex-1 flex items-center gap-2 rounded-xl p-3 transition-colors text-left"
                    style={{ backgroundColor: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}08`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                      <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: theme.primary }}>Ask AI</p>
                      <p className="text-[9px]" style={{ color: theme.textMuted }}>Get instant answers</p>
                    </div>
                  </button>
                  <button onClick={openEscalation}
                    className="flex-1 flex items-center gap-2 rounded-xl p-3 transition-colors text-left"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = inputBg}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.hover }}>
                      <MessageSquare className="h-4 w-4" style={{ color: theme.textMuted }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: theme.text }}>Contact Us</p>
                      <p className="text-[9px]" style={{ color: theme.textMuted }}>Message the team</p>
                    </div>
                  </button>
                </div>

                {/* Categories */}
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
                  Browse topics
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {KB_CATEGORIES.map(cat => {
                    const Icon = ICON_MAP[cat.icon] || HelpCircle;
                    const count = KB_ARTICLES.filter(a => a.category === cat.id && (a.userType === userType || a.userType === 'both')).length;
                    if (count === 0) return null;
                    return (
                      <button key={cat.id} onClick={() => openCategory(cat.id)}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors text-left"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${theme.primary}10` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate" style={{ color: theme.text }}>{cat.label}</p>
                          <p className="text-[9px]" style={{ color: theme.textMuted }}>{count} article{count !== 1 ? 's' : ''}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* CATEGORY VIEW */}
        {view === 'category' && (
          <div className="p-4 space-y-1.5">
            {categoryArticles.map(article => (
              <button key={article.id} onClick={() => openArticle(article)}
                className="w-full text-left rounded-xl p-3 transition-colors flex items-center justify-between gap-2"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <p className="text-sm" style={{ color: theme.text }}>{article.question}</p>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted }} />
              </button>
            ))}
            {categoryArticles.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No articles in this category</p>
            )}
          </div>
        )}

        {/* ARTICLE VIEW */}
        {view === 'article' && selectedArticle && (
          <div className="p-5">
            <h4 className="text-base font-semibold mb-3" style={{ color: theme.text }}>{selectedArticle.question}</h4>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: theme.isDark ? 'rgba(250,250,249,0.8)' : '#374151' }}>
              {selectedArticle.answer}
            </div>
            <div className="mt-6 pt-4 space-y-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <p className="text-[10px] font-medium" style={{ color: theme.textMuted }}>Still need help?</p>
              <div className="flex gap-2">
                <button onClick={openChat}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={{ backgroundColor: `${theme.primary}10`, color: theme.primary, border: `1px solid ${theme.primary}20` }}>
                  <Sparkles className="h-3 w-3" /> Ask AI
                </button>
                <button onClick={openEscalation}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${inputBorder}` }}>
                  <MessageSquare className="h-3 w-3" /> Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div className="flex flex-col" style={{ height: 'calc(100% - 0px)' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${theme.primary}15` }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                    </div>
                  )}
                  <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                    style={{
                      backgroundColor: msg.role === 'user' ? theme.primary : theme.hover,
                      color: msg.role === 'user' ? theme.primaryText : theme.text,
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : undefined,
                    }}>
                    <span style={{ whiteSpace: 'pre-line' }}>{msg.content}</span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                      <User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primary}15` }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat footer with escalation hint */}
            <div className="px-4 pt-2 pb-1">
              <button onClick={openEscalation}
                className="w-full text-center text-[10px] py-1 transition-colors"
                style={{ color: theme.textMuted }}>
                Need a human? <span style={{ color: theme.primary }}>Contact support →</span>
              </button>
            </div>
          </div>
        )}

        {/* ESCALATION VIEW */}
        {view === 'escalation' && (
          <div className="p-5">
            {escalationSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.primary}15` }}>
                  <Check className="h-7 w-7" style={{ color: theme.primary }} />
                </div>
                <h4 className="text-base font-semibold mb-2" style={{ color: theme.text }}>Message sent!</h4>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  We typically respond within a few hours. You'll receive a text message with our reply.
                </p>
                <button onClick={goHome} className="mt-4 text-xs font-medium" style={{ color: theme.primary }}>
                  ← Back to Help Center
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
                  Send a message to our team. We'll respond via text message, typically within a few hours.
                </p>
                {escalationError && (
                  <div className="mb-3 rounded-lg p-3 text-xs" style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}>
                    {escalationError}
                  </div>
                )}
                <textarea
                  value={escalationMessage}
                  onChange={(e) => setEscalationMessage(e.target.value)}
                  placeholder="Describe your question or issue..."
                  rows={5}
                  maxLength={1000}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: theme.text }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>{escalationMessage.length}/1000</span>
                  <button onClick={handleEscalationSubmit}
                    disabled={escalationSending || !escalationMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                    {escalationSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Chat Input (only in chat view) ─────────────────────── */}
      {view === 'chat' && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex items-end gap-2 rounded-xl p-1.5"
            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}>
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              placeholder="Ask a question..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none px-2 py-1.5 max-h-20"
              style={{ color: theme.text }}
            />
            <button onClick={handleChatSubmit}
              disabled={chatLoading || !chatInput.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-30"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}