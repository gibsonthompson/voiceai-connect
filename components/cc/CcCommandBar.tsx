'use client';

// ============================================================================
// components/cc/CcCommandBar.tsx
//
// A command palette / omni-search for the call-center MANAGER console. Type what
// you want to do and get grouped, ranked results:
//   - Quick navigation + actions ("create a new business", "add an agent")
//   - Businesses by name/number ("change the phone number for Atlanta Roofing")
//   - Agents by NAME ("change Gibson's working hours")
//   - Specific calls ("the call yesterday with Sarah Johnson" -> that call)
//   - Contacts (callers) by name
//
// Businesses + the agent roster load once on first open and filter instantly;
// calls + contacts are searched server-side (debounced). Cmd/Ctrl+K or "/"
// focuses it, arrow keys move, Enter opens, Esc closes. Managers only.
//
// Theme-aware (useTheme). Mounted in the /cc shell for non-agents.
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Headphones, ClipboardList, Inbox, MessageSquare,
  Contact as ContactIcon, Building2, Headset, BarChart3, Settings, Plus, UserPlus,
  PhoneCall, User, CornerDownLeft, Loader2,
} from 'lucide-react';
import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const tok = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };

interface Biz { id: string; name: string; phone: string | null }
interface Ag { id: string; name: string }
type Group = 'Actions' | 'Businesses' | 'Agents' | 'Calls' | 'Contacts';
interface Result { key: string; group: Group; icon: any; label: string; sub?: string | null; href: string }

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtWhen(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

// Words we drop when working out the "salient" part of a query (the name/thing
// the manager is actually after), so natural phrasing still matches.
const STOP = new Set([
  'i', 'need', 'to', 'the', 'a', 'an', 'please', 'can', 'you', 'me', 'show', 'go', 'open', 'find',
  'view', 'see', 'get', 'pull', 'up', 'take', 'lets', 'let', 'is', 'on', 'in', 'of', 'for', 'and', 'with',
  'from', 'want', 'wanna', 'my', 'our',
  'create', 'new', 'add', 'make', 'onboard', 'change', 'edit', 'update', 'set', 'modify', 'adjust', 'fix',
  'phone', 'number', 'hours', 'working', 'schedule', 'availability', 'greeting',
  'call', 'calls', 'recording', 'transcript', 'business', 'businesses', 'client', 'clients',
  'agent', 'agents', 'rep', 'reps', 'staff', 'member', 'yesterday', 'today', 'week', 'this', 'last',
]);

function parse(raw: string) {
  const lower = raw.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);
  const wantsCreate = /\b(create|new|add|make|onboard|set up)\b/.test(lower);
  const wantsEdit = /\b(change|edit|update|set|modify|adjust|fix)\b/.test(lower);
  const attr: 'phone' | 'hours' | 'greeting' | null =
    /\b(phone|number)\b/.test(lower) ? 'phone'
    : /\b(hours|working|schedule|availability)\b/.test(lower) ? 'hours'
    : /\bgreeting\b/.test(lower) ? 'greeting' : null;
  const wantsCall = /\b(call|calls|recording|transcript)\b/.test(lower);
  const dateHint: 'yesterday' | 'today' | 'week' | null =
    /\byesterday\b/.test(lower) ? 'yesterday'
    : /\btoday\b/.test(lower) ? 'today'
    : /\b(this week|last week|week)\b/.test(lower) ? 'week' : null;
  const salient = words.filter((w) => !STOP.has(w)).join(' ').trim();
  return { raw, lower, words, wantsCreate, wantsEdit, attr, wantsCall, dateHint, salient };
}

const attrLabel = (a: string | null) => (a === 'phone' ? 'phone number' : a === 'hours' ? 'working hours' : a === 'greeting' ? 'greeting' : '');

export default function CcCommandBar() {
  const { agency, isAgent, hasPermission, canManageTeam } = useAgency();
  const theme = useTheme();
  const router = useRouter();

  const enabled = !!(agency?.is_call_center && !isAgent);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [biz, setBiz] = useState<Biz[]>([]);
  const [agents, setAgents] = useState<Ag[]>([]);
  const [loadedRoster, setLoadedRoster] = useState(false);
  const [callRows, setCallRows] = useState<any[]>([]);
  const [contactRows, setContactRows] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef(0);

  const can = useCallback((perm?: string, manageTeam?: boolean) => {
    if (manageTeam) return canManageTeam;
    if (perm) return hasPermission(perm);
    return true;
  }, [canManageTeam, hasPermission]);

  // Load the business list + agent roster once, the first time the bar opens.
  const loadRoster = useCallback(async () => {
    if (loadedRoster || !agency?.id) return;
    setLoadedRoster(true);
    const headers = { Authorization: `Bearer ${tok()}` };
    try {
      if (hasPermission('clients')) {
        const r = await fetch(`${API}/api/agency/${agency.id}/clients`, { headers });
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.clients)) setBiz(d.clients.map((c: any) => ({ id: c.id, name: c.business_name || 'Business', phone: c.vapi_phone_number || null })));
      }
    } catch { /* best effort */ }
    try {
      if (canManageTeam || hasPermission('settings')) {
        const r = await fetch(`${API}/api/agency/${agency.id}/team`, { headers });
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.members)) {
          setAgents(d.members
            .filter((m: any) => m.is_manager !== true)
            .map((m: any) => ({ id: m.id, name: m.display_name || m.email || 'Agent' })));
        }
      }
    } catch { /* best effort */ }
  }, [loadedRoster, agency?.id, hasPermission, canManageTeam]);

  // Debounced server search for calls + contacts on the salient terms.
  useEffect(() => {
    if (!open || !agency?.id) return;
    const p = parse(q);
    if (p.salient.length < 2) { setCallRows([]); setContactRows([]); setSearching(false); return; }
    const myReq = ++reqRef.current;
    setSearching(true);
    const h = setTimeout(async () => {
      const headers = { Authorization: `Bearer ${tok()}` };
      const range = p.dateHint === 'yesterday' || p.dateHint === 'today' ? '7d' : p.dateHint === 'week' ? '30d' : '90d';
      const qs = encodeURIComponent(p.salient);
      try {
        const [cR, kR] = await Promise.all([
          hasPermission('dashboard') ? fetch(`${API}/api/agency/${agency.id}/cc/calls?q=${qs}&range=${range}&limit=6`, { headers }).then((r) => r.json()).catch(() => ({})) : Promise.resolve({}),
          hasPermission('dashboard') ? fetch(`${API}/api/agency/${agency.id}/cc/contacts?q=${qs}&limit=6`, { headers }).then((r) => r.json()).catch(() => ({})) : Promise.resolve({}),
        ]);
        if (myReq !== reqRef.current) return;
        setCallRows(Array.isArray(cR.rows) ? cR.rows : []);
        setContactRows(Array.isArray(kR.rows) ? kR.rows : []);
      } catch { if (myReq === reqRef.current) { setCallRows([]); setContactRows([]); } }
      finally { if (myReq === reqRef.current) setSearching(false); }
    }, 250);
    return () => clearTimeout(h);
  }, [q, open, agency?.id, hasPermission]);

  // Build the ranked result list.
  const results = useMemo<Result[]>(() => {
    const p = parse(q);
    // Match only on the MEANINGFUL part of the query. Filler and intent words
    // ("i", "need", "to", "the", "change", "phone"...) are already stripped into
    // p.salient, and we drop single characters so a stray letter never matches
    // everything. With no meaningful token, entity lists stay empty instead of
    // dumping the whole catalog.
    const hasQuery = p.lower.trim().length > 0;
    const qTokens = p.salient.split(/\s+/).filter((t) => t.length >= 2);
    const matches = (hay: string) => { if (!qTokens.length) return false; const h = hay.toLowerCase(); return qTokens.every((t) => h.includes(t)); };

    // --- Actions (nav + create), filtered by permission + query ---
    const NAV: { label: string; href: string; icon: any; kw: string; perm?: string; manageTeam?: boolean }[] = [
      { label: 'Go to Dashboard', href: '/cc/dashboard', icon: LayoutDashboard, kw: 'dashboard home overview', perm: 'dashboard' },
      { label: 'Go to Live Calls', href: '/cc/live-calls', icon: Headphones, kw: 'live calls monitor wall board now' },
      { label: 'Go to Calls', href: '/cc/calls', icon: ClipboardList, kw: 'calls history records log', perm: 'dashboard' },
      { label: 'Go to Callbacks', href: '/cc/messages', icon: Inbox, kw: 'callbacks messages missed voicemail follow up' },
      { label: 'Go to Texts', href: '/cc/sms', icon: MessageSquare, kw: 'texts sms messages inbox' },
      { label: 'Go to Contacts', href: '/cc/contacts', icon: ContactIcon, kw: 'contacts callers people crm' },
      { label: 'Go to Businesses', href: '/cc/businesses', icon: Building2, kw: 'businesses clients accounts', perm: 'clients' },
      { label: 'Go to Agents', href: '/cc/agents', icon: Headset, kw: 'agents team reps staff', manageTeam: true },
      { label: 'Go to Analytics', href: '/cc/analytics', icon: BarChart3, kw: 'analytics stats reports metrics', perm: 'analytics' },
      { label: 'Go to Settings', href: '/cc/settings', icon: Settings, kw: 'settings configuration account', perm: 'settings' },
    ];
    const CREATE: { label: string; href: string; icon: any; kw: string; perm?: string; manageTeam?: boolean }[] = [
      { label: 'Create a new business', href: '/cc/businesses/new', icon: Plus, kw: 'create new add business client onboard', perm: 'clients' },
      { label: 'Add an agent', href: '/cc/agents', icon: UserPlus, kw: 'add new agent team member staff rep hire', manageTeam: true },
    ];
    // Nav/create actions match ONLY on meaningful tokens, never filler. Empty
    // query shows the default palette; a query that is all filler/intent words
    // (e.g. "i need to change the ...") shows no nav until a real term is typed.
    const cmdMatch = (c: { label: string; kw: string }) => {
      if (!hasQuery) return true;
      if (!qTokens.length) return false;
      const hay = c.kw + ' ' + c.label.toLowerCase();
      return qTokens.some((t) => hay.includes(t));
    };
    const actions: Result[] = [];
    // Create/add: show on explicit create intent, or a direct keyword match.
    for (const c of CREATE) if (can(c.perm, c.manageTeam) && (p.wantsCreate || cmdMatch(c))) actions.push({ key: 'c:' + c.href + c.label, group: 'Actions', icon: c.icon, label: c.label, href: c.href });
    for (const c of NAV) if (can(c.perm, c.manageTeam) && cmdMatch(c)) actions.push({ key: 'n:' + c.href, group: 'Actions', icon: c.icon, label: c.label, href: c.href });

    // --- Businesses ---
    const bizRes: Result[] = can('clients')
      ? biz.filter((b) => matches(b.name) || (/\d/.test(p.salient) && (b.phone || '').replace(/\D/g, '').includes(p.salient.replace(/\D/g, '')))).slice(0, 6).map((b) => ({
          key: 'b:' + b.id,
          group: 'Businesses' as Group,
          icon: Building2,
          label: p.wantsEdit && p.attr ? `Change ${attrLabel(p.attr)} for ${b.name}` : b.name,
          sub: [fmtPhone(b.phone), p.wantsEdit && p.attr ? 'Opens business settings' : 'Business settings'].filter(Boolean).join(' · '),
          href: `/cc/businesses/${b.id}`,
        }))
      : [];

    // --- Agents (by name) ---
    const agRes: Result[] = (canManageTeam || hasPermission('settings'))
      ? agents.filter((a) => matches(a.name)).slice(0, 6).map((a) => ({
          key: 'a:' + a.id,
          group: 'Agents' as Group,
          icon: Headset,
          label: p.attr === 'hours' ? `${a.name}'s working hours` : `Manage ${a.name}`,
          sub: p.attr === 'hours' ? 'Edit their hours' : 'Hours, businesses, delivery',
          href: `/cc/agents?agent=${a.id}`,
        }))
      : [];

    // --- Calls ---
    const callRes: Result[] = (callRows || []).map((c: any) => ({
      key: 'call:' + c.id,
      group: 'Calls' as Group,
      icon: PhoneCall,
      label: `Call with ${c.caller || 'caller'}`,
      sub: [c.businessName, fmtWhen(c.at), c.outcome].filter(Boolean).join(' · '),
      href: `/cc/calls/${c.id}`,
    }));

    // --- Contacts ---
    const contactRes: Result[] = (contactRows || []).map((c: any) => ({
      key: 'ct:' + c.id,
      group: 'Contacts' as Group,
      icon: User,
      label: c.name || fmtPhone(c.phone) || 'Contact',
      sub: [c.businessName, fmtPhone(c.phone), c.totalCalls ? `${c.totalCalls} call${c.totalCalls === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '),
      href: `/cc/contacts?contact=${c.id}`,
    }));

    const byGroup: Record<Group, Result[]> = { Actions: actions, Businesses: bizRes, Agents: agRes, Calls: callRes, Contacts: contactRes };

    // Order groups by what the query is clearly about.
    let order: Group[] = ['Actions', 'Businesses', 'Agents', 'Calls', 'Contacts'];
    if (p.wantsCall || p.dateHint) order = ['Calls', 'Contacts', 'Actions', 'Businesses', 'Agents'];
    else if (p.wantsEdit && p.attr === 'hours') order = ['Agents', 'Businesses', 'Actions', 'Calls', 'Contacts'];
    else if (p.wantsEdit && p.attr) order = ['Businesses', 'Agents', 'Actions', 'Calls', 'Contacts'];
    else if (p.wantsCreate) order = ['Actions', 'Businesses', 'Agents', 'Calls', 'Contacts'];

    return order.flatMap((g) => byGroup[g]);
  }, [q, biz, agents, callRows, contactRows, can, canManageTeam, hasPermission]);

  // Reset selection when the result set changes.
  useEffect(() => { setSel(0); }, [q]);

  // Global open shortcuts: Cmd/Ctrl+K, and "/" when not typing elsewhere.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); setOpen(true); loadRoster(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); inputRef.current?.focus(); setOpen(true); loadRoster(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, loadRoster]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = useCallback((r: Result | undefined) => {
    if (!r) return;
    setOpen(false); setQ('');
    router.push(r.href);
  }, [router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); (document.activeElement as HTMLElement)?.blur(); }
  };

  if (!enabled) return null;

  const selectStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const showPanel = open;

  // When the intent is clear but no target is typed yet (e.g. "change the phone
  // number for ..."), guide the manager instead of showing a bare "no matches".
  const intentHint = (() => {
    if (!q.trim()) return null;
    const p = parse(q);
    if (p.wantsEdit && p.attr === 'phone') return 'Keep typing a business name to change its phone number.';
    if (p.wantsEdit && p.attr === 'hours') return "Keep typing an agent's name to change their working hours.";
    if (p.wantsEdit && p.attr === 'greeting') return 'Keep typing a business name to change its greeting.';
    if (p.wantsCall || p.dateHint) return 'Add a caller or business name to find the call.';
    return null;
  })();

  // Flat render with group headers inserted.
  let lastGroup: Group | null = null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4" ref={rootRef}>
      <div className="relative max-w-2xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: theme.textSubtle }} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { setOpen(true); loadRoster(); }}
          onKeyDown={onKeyDown}
          placeholder="Search or type a command - a business, an agent, a call..."
          className="w-full rounded-xl pl-10 pr-16 py-2.5 text-sm outline-none transition"
          style={{ ...selectStyle, boxShadow: showPanel ? `0 0 0 2px ${theme.primary15}` : 'none' }}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums pointer-events-none"
          style={{ backgroundColor: theme.hover, color: theme.textSubtle, border: `1px solid ${theme.borderSubtle}` }}>⌘K</kbd>

        {showPanel && (
          <div className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-[70] max-h-[60vh] overflow-y-auto"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.28)' }}>
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px]" style={{ color: theme.textMuted }}>
                {searching ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
                  : intentHint ? intentHint
                  : q.trim() ? 'No matches. Try a name, a business, or "create a new business".'
                  : 'Type to search calls, businesses, and agents - or jump to any page.'}
              </div>
            ) : (
              <div className="py-1.5">
                {results.map((r, i) => {
                  const header = r.group !== lastGroup ? r.group : null;
                  lastGroup = r.group;
                  const active = i === sel;
                  const Icon = r.icon;
                  return (
                    <div key={r.key}>
                      {header && (
                        <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textSubtle }}>
                          {header === 'Actions' ? 'Actions' : header}
                        </div>
                      )}
                      <button
                        onMouseEnter={() => setSel(i)}
                        onClick={() => choose(r)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition"
                        style={{ backgroundColor: active ? theme.active : 'transparent' }}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium truncate" style={{ color: theme.text }}>{r.label}</span>
                          {r.sub && <span className="block text-[11.5px] truncate" style={{ color: theme.textMuted }}>{r.sub}</span>}
                        </span>
                        {active && <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textSubtle }} />}
                      </button>
                    </div>
                  );
                })}
                {searching && (
                  <div className="px-4 py-2 text-[11.5px] inline-flex items-center gap-2" style={{ color: theme.textSubtle }}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching calls and contacts...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}