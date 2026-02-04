'use client';

import { useState, useEffect } from 'react';
import { 
  PhoneCall, Search, Filter, ChevronRight, Loader2
} from 'lucide-react';
import { useClient } from '../context';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ClientCallsPage() {
  const { client, branding, loading } = useClient();
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme based on agency setting
  const isDark = branding.websiteTheme === 'dark';
  
  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.7)',
    textMuted4: 'rgba(250, 250, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111111',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
    inputBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    hoverBg: '#f3f4f6',
    inputBg: '#ffffff',
  };

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
                style={{ 
                  borderColor: theme.border, 
                  backgroundColor: theme.inputBg, 
                  color: theme.text,
                }}
              />
            </div>
            
            <button 
              className="inline-flex items-center gap-2 rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              style={{ 
                borderColor: theme.border, 
                backgroundColor: theme.cardBg, 
                color: theme.textMuted,
              }}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
        {callsLoading ? (
          <div className="py-12 sm:py-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" style={{ color: theme.textMuted4 }} />
            <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading calls...</span>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1) }}
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
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filteredCalls.map((call) => (
              <a
                key={call.id}
                href={`/client/calls/${call.id}`}
                className="block transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Mobile Layout */}
                <div className="p-3 sm:hidden">
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: 
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                            : call.urgency_level === 'medium'
                            ? isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'
                            : hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1)
                      }}
                    >
                      <PhoneCall 
                        className="h-5 w-5"
                        style={{
                          color: 
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? '#ef4444'
                              : call.urgency_level === 'medium'
                              ? '#f59e0b'
                              : branding.primaryColor
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                          {call.customer_name || 'Unknown Caller'}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0"
                          style={
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                              : call.urgency_level === 'medium'
                              ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                              : { backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                          }
                        >
                          {call.urgency_level || 'normal'}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                        {call.customer_phone || call.caller_phone}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>
                          {call.service_requested || 'General inquiry'}
                        </p>
                        <p className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 self-center" style={{ color: theme.textMuted4 }} />
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div 
                      className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                            : call.urgency_level === 'medium'
                            ? isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'
                            : hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1)
                      }}
                    >
                      <PhoneCall 
                        className="h-5 w-5 lg:h-6 lg:w-6"
                        style={{
                          color: 
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? '#ef4444'
                              : call.urgency_level === 'medium'
                              ? '#f59e0b'
                              : branding.primaryColor
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm lg:text-base" style={{ color: theme.text }}>
                        {call.customer_name || 'Unknown Caller'}
                      </p>
                      <p className="text-xs lg:text-sm" style={{ color: theme.textMuted }}>
                        {call.customer_phone || call.caller_phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        {call.service_requested || 'General inquiry'}
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted4 }}>
                        {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
                      </p>
                    </div>
                    
                    <div className="text-right min-w-[80px] lg:min-w-[100px]">
                      <span
                        className="rounded-full px-2 lg:px-3 py-0.5 lg:py-1 text-[10px] lg:text-xs font-medium"
                        style={
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                            : call.urgency_level === 'medium'
                            ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                            : { backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                        }
                      >
                        {call.urgency_level || 'normal'}
                      </span>
                      <p className="mt-1 text-[10px] lg:text-xs" style={{ color: theme.textMuted4 }}>
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: theme.textMuted4 }} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}