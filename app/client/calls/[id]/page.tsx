'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Phone, Settings, ArrowLeft, Clock, User, MapPin,
  AlertCircle, MessageSquare, Loader2, PhoneForwarded, ShieldX
} from 'lucide-react';
import CallPlayback from '@/components/client/CallPlayback';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

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
  transfer_status: string | null;
  ended_reason: string | null;
  is_spam: boolean | null;
  spam_reason: string | null;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ANIM_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}
`;

export default function CallDetailPage() {
  const params = useParams();
  const callId = params.id as string;
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const [call, setCall] = useState<Call | null>(null);
  const [callLoading, setCallLoading] = useState(true);

  useEffect(() => { if (client && callId) fetchCallDetail(); }, [client, callId]);

  const fetchCallDetail = async () => {
    if (!client || !callId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/calls/${callId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { window.location.href = '/client/calls'; return; }
      const data = await response.json();
      setCall(data.call);
    } catch (error) {
      console.error('Error loading call detail:', error);
      window.location.href = '/client/calls';
    } finally { setCallLoading(false); }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const getUrgencyStyle = (urgency: string | null) => {
    if (urgency === 'high' || urgency === 'emergency') return { backgroundColor: theme.errorBg, color: theme.error };
    if (urgency === 'medium') return { backgroundColor: theme.warningBg, color: theme.warning };
    if (urgency === 'spam') return { backgroundColor: theme.errorBg, color: theme.error };
    return { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.textMuted };
  };

  const getCallStatusLabel = (c: Call) => {
    if (c.is_spam || c.call_status === 'spam') return 'Spam Blocked';
    if (c.call_status === 'transferred' || c.transfer_status === 'transferred') return 'Transferred';
    if (c.transfer_status === 'transfer_failed') return 'Transfer Failed';
    return 'Completed';
  };

  const getCallStatusStyle = (c: Call) => {
    if (c.is_spam || c.call_status === 'spam') return { backgroundColor: theme.errorBg, color: theme.error };
    if (c.call_status === 'transferred' || c.transfer_status === 'transferred') return { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.08), color: theme.primary };
    if (c.transfer_status === 'transfer_failed') return { backgroundColor: theme.warningBg, color: theme.warning };
    return { backgroundColor: theme.successBg, color: theme.success };
  };

  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  if (loading || !client) {
    return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;
  }
  if (callLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /><span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading call details...</span></div>;
  }
  if (!call) {
    return (
      <div className="p-6 text-center min-h-screen" style={{ backgroundColor: theme.bg }}>
        <p style={{ color: theme.textMuted }}>Call not found</p>
        <a href="/client/calls" className="text-sm mt-2 inline-block" style={{ color: theme.primary }}>← Back to Calls</a>
      </div>
    );
  }

  const statusLabel = getCallStatusLabel(call);
  const statusStyle = getCallStatusStyle(call);
  const isSpam = call.is_spam || call.call_status === 'spam';
  const wasTransferred = call.call_status === 'transferred' || call.transfer_status === 'transferred';
  const transferFailed = call.transfer_status === 'transfer_failed';

  // Info row helper
  const InfoRow = ({ icon: Icon, label, value, href, iconColor }: { icon: any; label: string; value: string; href?: string; iconColor?: string }) => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}>
        <Icon className="h-4 w-4" style={{ color: iconColor || theme.textMuted }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: theme.textMuted4 }}>{label}</p>
        {href ? (
          <a href={href} className="text-[13px] sm:text-sm transition hover:underline truncate block" style={{ color: theme.primary }}>{value}</a>
        ) : (
          <p className="text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>{value}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* Back */}
      <a href="/client/calls" className="inline-flex items-center gap-1.5 text-sm transition hover:opacity-80 mb-4 sm:mb-6 fu fu1" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Calls
      </a>

      {/* Header */}
      <div className="mb-5 sm:mb-7 fu fu1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>
              {isSpam ? 'Spam Call' : `Call with ${call.customer_name || 'Unknown Caller'}`}
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
              {new Date(call.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {call.duration_seconds ? ` · ${formatDuration(call.duration_seconds)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5" style={statusStyle}>
              {isSpam && <ShieldX className="h-3.5 w-3.5" />}
              {(wasTransferred || transferFailed) && <PhoneForwarded className="h-3.5 w-3.5" />}
              {statusLabel}
            </span>
            {!isSpam && call.urgency_level && (
              <span className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold capitalize" style={getUrgencyStyle(call.urgency_level)}>
                {call.urgency_level} Priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spam banner */}
      {isSpam && (
        <div className="rounded-2xl p-4 mb-5 sm:mb-7 flex items-start gap-3 fu fu1"
          style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <ShieldX className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.error }} />
          <div>
            <p className="text-sm font-medium" style={{ color: theme.error }}>This call was detected as spam and automatically blocked</p>
            {call.spam_reason && <p className="text-xs mt-1" style={{ color: theme.error }}>Type: {call.spam_reason}</p>}
            <p className="text-xs mt-1" style={{ color: theme.errorText }}>Not counted against your monthly limit.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* AI Summary */}
          {call.ai_summary && (
            <div className="rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06) }}>
                  <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight" style={{ color: theme.text }}>AI Summary</h2>
              </div>
              <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>{call.ai_summary}</p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div className="rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>
              <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-4" style={{ color: theme.text }}>Recording</h2>
              <CallPlayback recordingUrl={call.recording_url} callDuration={call.duration_seconds || undefined} brandColor={theme.primary} />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-2xl p-5 sm:p-6 fu fu3" style={glass}>
              <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-4" style={{ color: theme.text }}>Full Transcript</h2>
              <div className="rounded-xl p-4 max-h-72 sm:max-h-96 overflow-y-auto"
                style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}` }}>
                <p className="text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: theme.textMuted }}>{call.transcript}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5">

          {/* Contact Details */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>
            <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-4" style={{ color: theme.text }}>Contact Details</h2>
            <div className="space-y-3.5">
              {call.customer_name && <InfoRow icon={User} label="Name" value={call.customer_name} />}
              {(call.customer_phone || call.caller_phone) && (
                <InfoRow icon={Phone} label="Phone" value={call.customer_phone || call.caller_phone || ''} href={`tel:${call.customer_phone || call.caller_phone}`} />
              )}
              {call.customer_email && <InfoRow icon={MessageSquare} label="Email" value={call.customer_email} href={`mailto:${call.customer_email}`} />}
              {call.customer_address && <InfoRow icon={MapPin} label="Address" value={call.customer_address} />}
            </div>
          </div>

          {/* Call Details */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu3" style={glass}>
            <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-4" style={{ color: theme.text }}>Call Details</h2>
            <div className="space-y-3.5">
              <InfoRow
                icon={isSpam ? ShieldX : (wasTransferred || transferFailed) ? PhoneForwarded : Phone}
                label="Status"
                value={statusLabel}
                iconColor={statusStyle.color}
              />
              {call.service_requested && <InfoRow icon={Settings} label="Service" value={call.service_requested} />}
              {call.urgency_level && !isSpam && <InfoRow icon={AlertCircle} label="Urgency" value={call.urgency_level.charAt(0).toUpperCase() + call.urgency_level.slice(1)} />}
              {call.duration_seconds && <InfoRow icon={Clock} label="Duration" value={formatDuration(call.duration_seconds)} />}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 fu fu3">
            {!isSpam && (call.customer_phone || call.caller_phone) && (
              <a href={`tel:${call.customer_phone || call.caller_phone}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                <Phone className="h-4 w-4" /> Call Back
              </a>
            )}
            {!isSpam && (
              <button className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition"
                style={{ ...glass, color: theme.textMuted }}>
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}