'use client';

import { useState, useEffect } from 'react';
import { 
  PhoneCall, Search, Loader2, PhoneForwarded, ShieldX, SlidersHorizontal
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  if (phone.startsWith('+')) return phone;
  return phone;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - callDay.getTime()) / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

const ANIM_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}
`;

export default function ClientCallsPage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (client) fetchCalls(); }, [client]);

  const fetchCalls = async () => {
    if (!client) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/calls`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls || []);
      }
    } catch (e) { console.error('Failed to fetch calls:', e); }
    finally { setCallsLoading(false); }
  };

  const filteredCalls = calls.filter(call => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      call.customer_name?.toLowerCase().includes(q) ||
      call.customer_phone?.includes(q) ||
      call.caller_phone?.includes(q) ||
      call.service_requested?.toLowerCase().includes(q)
    );
  });

  const getCallIcon = (call: any) => {
    if (call.call_status === 'spam' || call.is_spam) return { Icon: ShieldX, bg: theme.errorBg, color: theme.error };
    if (call.call_status === 'transferred' || call.transfer_status === 'transferred') return { Icon: PhoneForwarded, bg: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.primary };
    return { Icon: PhoneCall, bg: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.primary };
  };

  const getBadgeStyle = (call: any) => {
    const level = call.urgency_level;
    if (call.call_status === 'spam' || call.is_spam) return { backgroundColor: theme.errorBg, color: theme.error, label: 'spam' };
    if (call.call_status === 'transferred' || call.transfer_status === 'transferred') return { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.08), color: theme.primary, label: 'transferred' };
    if (call.transfer_status === 'transfer_failed') return { backgroundColor: theme.warningBg, color: theme.warning, label: 'failed' };
    if (level === 'high' || level === 'emergency') return { backgroundColor: theme.errorBg, color: theme.error, label: level };
    if (level === 'medium') return { backgroundColor: theme.warningBg, color: theme.warning, label: level };
    return { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.textMuted, label: level || 'normal' };
  };

  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS + `
        .call-row{transition:background .15s ease}
        .call-row:hover{background:${theme.hover} !important}
      `}} />

      {/* Header */}
      <div className="mb-5 sm:mb-7 fu fu1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Call History</h1>
            <p className="mt-0.5 text-[13px]" style={{ color: theme.textMuted }}>{calls.length} total call{calls.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all"
              style={{ ...glass, color: theme.text }}
            />
          </div>
        </div>
      </div>

      {/* Calls */}
      {callsLoading ? (
        <div className="rounded-2xl py-20 flex items-center justify-center fu fu2" style={glass}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} />
          <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading calls...</span>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="rounded-2xl py-20 text-center px-6 fu fu2" style={glass}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.05) }}>
            <PhoneCall className="h-7 w-7" style={{ color: theme.textMuted4 }} />
          </div>
          <p className="font-medium text-sm" style={{ color: theme.textMuted }}>
            {searchQuery ? 'No matching calls' : 'No calls yet'}
          </p>
          <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>
            {searchQuery ? 'Try a different search term' : 'Your call history will appear here'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden fu fu2" style={glass}>
          {filteredCalls.map((call, idx) => {
            const { Icon, bg: iconBg, color: iconColor } = getCallIcon(call);
            const badge = getBadgeStyle(call);
            const date = formatRelativeDate(call.created_at);

            return (
              <a key={call.id} href={`/client/calls/${call.id}`}
                className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4 call-row"
                style={{ borderBottom: idx < filteredCalls.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ backgroundColor: iconBg }}>
                  <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>
                    {call.customer_name || 'Unknown Caller'}
                  </p>
                  <p className="text-[11px] sm:text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>
                    {formatPhoneNumber(call.customer_phone || call.caller_phone)}
                    <span className="hidden sm:inline"> · {date}</span>
                  </p>
                  <p className="text-[10px] sm:hidden mt-0.5" style={{ color: theme.textMuted4 }}>{date}</p>
                </div>

                <span className="rounded-full px-2.5 py-[3px] text-[10px] sm:text-[11px] font-semibold capitalize flex-shrink-0"
                  style={{ backgroundColor: badge.backgroundColor, color: badge.color }}>
                  {badge.label}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}