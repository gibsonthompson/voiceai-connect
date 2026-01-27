'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, Search, Filter, ChevronRight, Loader2
} from 'lucide-react';
import { useClient } from '../context';

// Helper function
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

  // Light mode theme
  const theme = {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
  };

  useEffect(() => {
    if (client) {
      fetchCalls();
    }
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

  // Filter calls based on search query
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>Call History</h1>
          <p className="mt-1" style={{ color: theme.textMuted }}>{calls.length} total calls</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                borderColor: theme.border, 
                backgroundColor: theme.cardBg,
                color: theme.text,
              }}
            />
          </div>
          
          <button 
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg, color: theme.textMuted }}
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div 
        className="rounded-xl border shadow-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
      >
        {callsLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted4 }} />
            <span className="ml-2" style={{ color: theme.textMuted }}>Loading calls...</span>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-20 text-center">
            <div 
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
            >
              <PhoneCall className="h-8 w-8" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="mt-4 font-medium" style={{ color: theme.textMuted }}>
              {searchQuery ? 'No matching calls found' : 'No calls yet'}
            </p>
            <p className="text-sm" style={{ color: theme.textMuted4 }}>
              {searchQuery ? 'Try a different search term' : 'Your call history will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filteredCalls.map((call) => (
              <Link
                key={call.id}
                href={`/client/calls/${call.id}`}
                className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : call.urgency_level === 'medium'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : hexToRgba(branding.primaryColor, 0.1)
                    }}
                  >
                    <PhoneCall 
                      className="h-6 w-6"
                      style={{
                        color: 
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? '#dc2626'
                            : call.urgency_level === 'medium'
                            ? '#d97706'
                            : branding.primaryColor
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: theme.text }}>
                      {call.customer_name || 'Unknown Caller'}
                    </p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>
                      {call.customer_phone || call.caller_phone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm" style={{ color: theme.textMuted }}>
                      {call.service_requested || 'General inquiry'}
                    </p>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>
                      {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
                    </p>
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }
                          : call.urgency_level === 'medium'
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }
                          : { backgroundColor: hexToRgba(branding.primaryColor, 0.1), color: theme.textMuted }
                      }
                    >
                      {call.urgency_level || 'normal'}
                    </span>
                    <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <ChevronRight className="h-5 w-5" style={{ color: theme.textMuted4 }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}