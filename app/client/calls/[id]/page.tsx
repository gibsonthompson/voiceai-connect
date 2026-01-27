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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;
  
  const { client, branding, loading } = useClient();
  const [call, setCall] = useState<Call | null>(null);
  const [callLoading, setCallLoading] = useState(true);

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
    if (client && callId) {
      fetchCallDetail();
    }
  }, [client, callId]);

  const fetchCallDetail = async () => {
    if (!client || !callId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

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
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (callLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2" style={{ color: theme.textMuted }}>Loading call details...</span>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-8 text-center" style={{ backgroundColor: theme.bg, minHeight: '100vh' }}>
        <p style={{ color: theme.textMuted }}>Call not found</p>
        <Link href="/client/calls" className="text-sm mt-2 inline-block" style={{ color: branding.primaryColor }}>
          ← Back to Calls
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Back button */}
      <Link 
        href="/client/calls"
        className="inline-flex items-center gap-2 text-sm transition-colors mb-6 hover:opacity-80"
        style={{ color: theme.textMuted }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Calls
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
            Call with {call.customer_name || 'Unknown Caller'}
          </h1>
          <p className="mt-1" style={{ color: theme.textMuted }}>
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
          className="rounded-full px-4 py-2 text-sm font-medium border"
          style={
            call.urgency_level === 'high' || call.urgency_level === 'emergency'
              ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
              : call.urgency_level === 'medium'
              ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }
              : { backgroundColor: hexToRgba(branding.primaryColor, 0.1), color: theme.textMuted, borderColor: theme.border }
          }
        >
          {call.urgency_level ? `${call.urgency_level.charAt(0).toUpperCase()}${call.urgency_level.slice(1)}` : 'Normal'} Priority
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {call.ai_summary && (
            <div 
              className="rounded-xl border p-6 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
                >
                  <MessageSquare className="h-5 w-5" style={{ color: branding.primaryColor }} />
                </div>
                <h2 className="font-semibold" style={{ color: theme.text }}>AI Summary</h2>
              </div>
              <p className="leading-relaxed" style={{ color: theme.textMuted }}>
                {call.ai_summary}
              </p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div 
              className="rounded-xl border p-6 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <h2 className="font-semibold mb-4" style={{ color: theme.text }}>Recording</h2>
              <CallPlayback 
                recordingUrl={call.recording_url}
                callDuration={call.duration_seconds || undefined}
                brandColor={branding.primaryColor}
              />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div 
              className="rounded-xl border p-6 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <h2 className="font-semibold mb-4" style={{ color: theme.text }}>Full Transcript</h2>
              <div 
                className="rounded-lg border p-4 max-h-96 overflow-y-auto"
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: theme.textMuted }}>
                  {call.transcript}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div 
            className="rounded-xl border p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <h2 className="font-semibold mb-4" style={{ color: theme.text }}>Contact Details</h2>
            <div className="space-y-4">
              {call.customer_name && (
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <User className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Name</p>
                    <p className="text-sm" style={{ color: theme.text }}>{call.customer_name}</p>
                  </div>
                </div>
              )}
              
              {(call.customer_phone || call.caller_phone) && (
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Phone className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Phone</p>
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
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <MessageSquare className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Email</p>
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
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Address</p>
                    <p className="text-sm" style={{ color: theme.text }}>{call.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div 
            className="rounded-xl border p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <h2 className="font-semibold mb-4" style={{ color: theme.text }}>Call Details</h2>
            <div className="space-y-4">
              {call.service_requested && (
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Settings className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Service Requested</p>
                    <p className="text-sm" style={{ color: theme.text }}>{call.service_requested}</p>
                  </div>
                </div>
              )}
              
              {call.urgency_level && (
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <AlertCircle className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Urgency</p>
                    <p className="text-sm capitalize" style={{ color: theme.text }}>{call.urgency_level}</p>
                  </div>
                </div>
              )}
              
              {call.duration_seconds && (
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>Duration</p>
                    <p className="text-sm" style={{ color: theme.text }}>{formatDuration(call.duration_seconds)}</p>
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
                className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-3 text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: branding.primaryColor, color: '#ffffff' }}
              >
                <Phone className="h-4 w-4" />
                Call Back
              </a>
            )}
            <button 
              className="flex items-center justify-center gap-2 w-full rounded-full border px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: theme.border, color: theme.textMuted }}
            >
              Mark as Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}