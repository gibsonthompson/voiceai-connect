'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, Search, Filter, ChevronRight, Loader2
} from 'lucide-react';
import { useClient } from '../context';

export default function ClientCallsPage() {
  const { client, branding, loading } = useClient();
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (client) {
      fetchCalls();
    }
  }, [client]);

  const fetchCalls = async () => {
    if (!client) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Call History</h1>
          <p className="mt-1 text-[#f5f5f0]/50">{calls.length} total calls</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5f0]/40" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-white/20 focus:outline-none transition-colors"
            />
          </div>
          
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div className="rounded-xl border border-white/10 bg-[#111]">
        {callsLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            <span className="ml-2 text-[#f5f5f0]/50">Loading calls...</span>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <PhoneCall className="h-8 w-8 text-[#f5f5f0]/30" />
            </div>
            <p className="mt-4 font-medium text-[#f5f5f0]/70">
              {searchQuery ? 'No matching calls found' : 'No calls yet'}
            </p>
            <p className="text-sm text-[#f5f5f0]/40">
              {searchQuery ? 'Try a different search term' : 'Your call history will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredCalls.map((call) => (
              <Link
                key={call.id}
                href={`/client/calls/${call.id}`}
                className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      call.urgency_level === 'high' || call.urgency_level === 'emergency'
                        ? 'bg-red-400/10'
                        : call.urgency_level === 'medium'
                        ? 'bg-amber-400/10'
                        : ''
                    }`}
                    style={
                      !call.urgency_level || call.urgency_level === 'routine' || call.urgency_level === 'normal'
                        ? { backgroundColor: `${branding.primaryColor}15` }
                        : {}
                    }
                  >
                    <PhoneCall 
                      className={`h-6 w-6 ${
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? 'text-red-400'
                          : call.urgency_level === 'medium'
                          ? 'text-amber-400'
                          : ''
                      }`}
                      style={
                        !call.urgency_level || call.urgency_level === 'routine' || call.urgency_level === 'normal'
                          ? { color: branding.primaryColor }
                          : {}
                      }
                    />
                  </div>
                  <div>
                    <p className="font-medium">{call.customer_name || 'Unknown Caller'}</p>
                    <p className="text-sm text-[#f5f5f0]/50">
                      {call.customer_phone || call.caller_phone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-[#f5f5f0]/70">{call.service_requested || 'General inquiry'}</p>
                    <p className="text-xs text-[#f5f5f0]/40">
                      {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
                    </p>
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? 'bg-red-400/10 text-red-400'
                          : call.urgency_level === 'medium'
                          ? 'bg-amber-400/10 text-amber-400'
                          : 'bg-white/10 text-[#f5f5f0]/60'
                      }`}
                    >
                      {call.urgency_level || 'normal'}
                    </span>
                    <p className="mt-1 text-xs text-[#f5f5f0]/40">
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-[#f5f5f0]/30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}