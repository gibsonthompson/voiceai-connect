'use client';

import { useState, useEffect } from 'react';
import { 
  PhoneCall, Search, Filter, Loader2
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
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
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
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}, ${timeStr}`;
  }
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthDay}, ${timeStr}`;
}

export default function ClientCallsPage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (client) fetchCalls();
  }, [client]);

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
    } catch (e) {
      console.error('Failed to fetch calls:', e);
    } finally {
      setCallsLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      call.customer_name?.toLowerCase().includes(query) ||
      call.customer_phone?.includes(query) ||
      call.caller_phone?.includes(query) ||
      call.service_requested?.toLowerCase().includes(query)
    );
  });

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .call-link-hover { transition: background-color 0.15s ease; }
        .call-link-hover:hover { background-color: ${theme.hover} !important; }
      `}} />

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Call History</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>{calls.length} total calls</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-64 rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
              />
            </div>
            
            <button 
              className="inline-flex items-center gap-2 rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.textMuted }}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calls List */}
      {callsLoading ? (
        <div 
          className="rounded-xl border shadow-sm py-12 sm:py-20 flex items-center justify-center"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" style={{ color: theme.textMuted4 }} />
          <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading calls...</span>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div 
          className="rounded-xl border shadow-sm py-12 sm:py-20 text-center px-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <div 
            className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
          >
            <PhoneCall className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted4 }} />
          </div>
          <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.textMuted }}>
            {searchQuery ? 'No matching calls found' : 'No calls yet'}
          </p>
          <p className="text-xs sm:text-sm" style={{ color: theme.textMuted4 }}>
            {searchQuery ? 'Try a different search term' : 'Your call history will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredCalls.map((call) => {
            const urgencyStyle = 
              call.urgency_level === 'high' || call.urgency_level === 'emergency'
                ? { backgroundColor: theme.errorBg, color: theme.error }
                : call.urgency_level === 'medium'
                ? { backgroundColor: theme.warningBg, color: theme.warning }
                : { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1), color: theme.textMuted };

            const relativeDate = formatRelativeDate(call.created_at);

            return (
              <a
                key={call.id}
                href={`/client/calls/${call.id}`}
                className="block rounded-lg border p-3 sm:p-4 call-link-hover"
                style={{ borderColor: theme.border, backgroundColor: 'transparent' }}
              >
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                      style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
                    >
                      <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                          {call.customer_name || 'Unknown Caller'}
                        </p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0" style={urgencyStyle}>
                          {call.urgency_level || 'normal'}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        {formatPhoneNumber(call.customer_phone || call.caller_phone)}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: theme.textMuted4 }}>
                        {relativeDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
                    >
                      <PhoneCall className="h-5 w-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>
                        {call.customer_name || 'Unknown Caller'}
                      </p>
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        {formatPhoneNumber(call.customer_phone || call.caller_phone)} · {relativeDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full px-3 py-1 text-xs font-medium" style={urgencyStyle}>
                      {call.urgency_level || 'normal'}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}