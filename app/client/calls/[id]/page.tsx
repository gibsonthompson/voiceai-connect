'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Settings, ArrowLeft, Clock,
  User, MapPin, AlertCircle, MessageSquare, Loader2
} from 'lucide-react';
import CallPlayback from '@/components/client/CallPlayback';
import { useClient } from '../../context';

interface Call {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  caller_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  service_requested: string | null;
  urgency_level: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  call_status: string | null;
}

export default function CallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;
  
  const { client, branding, loading } = useClient();
  const [call, setCall] = useState<Call | null>(null);
  const [callLoading, setCallLoading] = useState(true);

  useEffect(() => {
    if (client && callId) {
      fetchCallDetail();
    }
  }, [client, callId]);

  const fetchCallDetail = async () => {
    if (!client || !callId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/client/${client.id}/calls/${callId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/client/calls');
        return;
      }

      const data = await response.json();
      setCall(data.call);
    } catch (error) {
      console.error('Error loading call detail:', error);
      router.push('/client/calls');
    } finally {
      setCallLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (callLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        <span className="ml-2 text-[#f5f5f0]/50">Loading call details...</span>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#f5f5f0]/70">Call not found</p>
        <Link href="/client/calls" className="text-sm mt-2 inline-block" style={{ color: branding.primaryColor }}>
          ← Back to Calls
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back button */}
      <Link 
        href="/client/calls"
        className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Calls
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">
            Call with {call.customer_name || 'Unknown Caller'}
          </h1>
          <p className="mt-1 text-[#f5f5f0]/50">
            {new Date(call.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            {call.duration_seconds && ` • ${formatDuration(call.duration_seconds)}`}
          </p>
        </div>
        
        <span
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            call.urgency_level === 'high' || call.urgency_level === 'emergency'
              ? 'bg-red-400/10 text-red-400 border border-red-400/20'
              : call.urgency_level === 'medium'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
              : 'bg-white/10 text-[#f5f5f0]/60 border border-white/10'
          }`}
        >
          {call.urgency_level ? `${call.urgency_level.charAt(0).toUpperCase()}${call.urgency_level.slice(1)}` : 'Normal'} Priority
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {call.ai_summary && (
            <div className="rounded-xl border border-white/10 bg-[#111] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${branding.primaryColor}20` }}
                >
                  <MessageSquare className="h-5 w-5" style={{ color: branding.primaryColor }} />
                </div>
                <h2 className="font-medium">AI Summary</h2>
              </div>
              <p className="text-[#f5f5f0]/70 leading-relaxed">
                {call.ai_summary}
              </p>
            </div>
          )}

          {/* Recording - Using CallPlayback Component */}
          {call.recording_url && (
            <div className="rounded-xl border border-white/10 bg-[#111] p-6">
              <h2 className="font-medium mb-4">Recording</h2>
              <CallPlayback 
                recordingUrl={call.recording_url}
                callDuration={call.duration_seconds || undefined}
                brandColor={branding.primaryColor}
              />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-xl border border-white/10 bg-[#111] p-6">
              <h2 className="font-medium mb-4">Full Transcript</h2>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-[#f5f5f0]/70 whitespace-pre-wrap leading-relaxed">
                  {call.transcript}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="rounded-xl border border-white/10 bg-[#111] p-6">
            <h2 className="font-medium mb-4">Contact Details</h2>
            <div className="space-y-4">
              {call.customer_name && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <User className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Name</p>
                    <p className="text-sm">{call.customer_name}</p>
                  </div>
                </div>
              )}
              
              {(call.customer_phone || call.caller_phone) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <Phone className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Phone</p>
                    <a 
                      href={`tel:${call.customer_phone || call.caller_phone}`}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: branding.primaryColor }}
                    >
                      {call.customer_phone || call.caller_phone}
                    </a>
                  </div>
                </div>
              )}

              {call.customer_email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <MessageSquare className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Email</p>
                    <a 
                      href={`mailto:${call.customer_email}`}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: branding.primaryColor }}
                    >
                      {call.customer_email}
                    </a>
                  </div>
                </div>
              )}
              
              {call.customer_address && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <MapPin className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Address</p>
                    <p className="text-sm">{call.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div className="rounded-xl border border-white/10 bg-[#111] p-6">
            <h2 className="font-medium mb-4">Call Details</h2>
            <div className="space-y-4">
              {call.service_requested && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <Settings className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Service Requested</p>
                    <p className="text-sm">{call.service_requested}</p>
                  </div>
                </div>
              )}
              
              {call.urgency_level && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <AlertCircle className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Urgency</p>
                    <p className="text-sm capitalize">{call.urgency_level}</p>
                  </div>
                </div>
              )}
              
              {call.duration_seconds && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <Clock className="h-4 w-4 text-[#f5f5f0]/50" />
                  </div>
                  <div>
                    <p className="text-xs text-[#f5f5f0]/40">Duration</p>
                    <p className="text-sm">{formatDuration(call.duration_seconds)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {(call.customer_phone || call.caller_phone) && (
              <a 
                href={`tel:${call.customer_phone || call.caller_phone}`}
                className="flex items-center justify-center gap-2 w-full rounded-full bg-[#f5f5f0] px-4 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-white transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call Back
              </a>
            )}
            <button className="flex items-center justify-center gap-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
              Mark as Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}