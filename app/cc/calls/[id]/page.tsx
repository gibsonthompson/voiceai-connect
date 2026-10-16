'use client';

// ============================================================================
// /cc/calls/[id] - one call's full detail for the call center.
//
// The call-center view of a single call: who called, which business, the AI
// summary, who handled it (AI only, or the listen/take-over timeline), the
// recording and full transcript. Recording + transcript are hidden when the
// business runs in HIPAA mode, exactly like the client-facing detail view.
//
// Agency-themed (useTheme) so it white-labels; scoped server-side so an agent
// can only open a call for a business assigned to them.
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Phone, Clock, User, MapPin, MessageSquare, Loader2, Settings,
  PhoneForwarded, ShieldX, Globe, Shield, Building2, AlertCircle, CalendarCheck, UserCheck, Bot,
} from 'lucide-react';
import CallPlayback from '@/components/client/CallPlayback';
import { useAgency } from '../../../agency/context';
import { useTheme } from '../../../../hooks/useTheme';

interface Call {
  id: string;
  created_at: string;
  client_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  caller_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  service_requested: string | null;
  urgency_level: string | null;
  ai_summary: string | null;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  call_status: string | null;
  transfer_status: string | null;
  ended_reason: string | null;
  is_spam: boolean | null;
  spam_reason: string | null;
  call_language: string | null;
  appointment_booked: boolean | null;
  appointment_time: string | null;
  sentiment: string | null;
  call_metadata: { supervisor_events?: { name: string | null; action: string; at: string }[] } | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  ja: 'Japanese', ko: 'Korean', zh: 'Chinese', it: 'Italian', nl: 'Dutch',
};
const SUP_ACTION: Record<string, string> = {
  listening: 'started listening in',
  jumped_in: 'took over the call',
  handed_back: 'handed the call back to the AI',
  left: 'stopped monitoring',
  ended_call: 'ended the call',
};
const fmtEventTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
};
const isPlaceholder = (n?: string | null) => {
  const t = (n || '').trim().toLowerCase();
  return !t || t === 'unknown' || t === 'unknown caller';
};
const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

export default function CallCenterCallDetail() {
  const params = useParams();
  const callId = params.id as string;
  const { agency, loading: agencyLoading } = useAgency();
  const theme = useTheme();

  const [call, setCall] = useState<Call | null>(null);
  const [businessName, setBusinessName] = useState<string>('Business');
  const [hipaa, setHipaa] = useState(false);
  const [outcome, setOutcome] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!agency?.id || !callId) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const r = await fetch(`${base}/api/agency/${agency.id}/cc/calls/${callId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { setNotFound(true); return; }
        const d = await r.json();
        if (d.success) {
          setCall(d.call);
          setBusinessName(d.businessName || 'Business');
          setHipaa(!!d.hipaa);
          setOutcome(d.outcome || '');
        } else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [agency?.id, callId]);

  const callerName = (c: Call) => (isPlaceholder(c.customer_name) ? 'Unknown caller' : (c.customer_name as string));
  const callerPhone = (c: Call) => c.customer_phone || c.caller_phone || null;

  const outcomeStyle = (o: string): { bg: string; fg: string; Icon: any } => {
    if (o === 'Spam') return { bg: theme.errorBg, fg: theme.error, Icon: ShieldX };
    if (o === 'Transferred') return { bg: theme.primary15, fg: theme.primary, Icon: PhoneForwarded };
    if (o === 'Agent took over') return { bg: 'rgba(245,158,11,0.14)', fg: '#f59e0b', Icon: UserCheck };
    if (o === 'Booked') return { bg: theme.successBg, fg: theme.success, Icon: CalendarCheck };
    return { bg: theme.hover, fg: theme.textMuted, Icon: Bot };
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;

  if (agencyLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} />
        <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading call...</span>
      </div>
    );
  }
  if (notFound || !call) {
    return (
      <div className="p-6 text-center min-h-screen" style={{ backgroundColor: theme.bg }}>
        <p style={{ color: theme.textMuted }}>Call not found, or not one of your businesses.</p>
        <a href="/cc/calls" className="text-sm mt-2 inline-block" style={{ color: theme.primary }}>Back to Calls</a>
      </div>
    );
  }

  const isSpam = call.is_spam || call.call_status === 'spam';
  const os = outcomeStyle(outcome);
  const OIcon = os.Icon;
  const events = call.call_metadata?.supervisor_events || [];
  const tookOver = events.some((e) => e.action === 'jumped_in');
  const handler = (events.find((e) => e.name)?.name) || 'A teammate';
  const phone = callerPhone(call);

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.hover }}>
        <Icon className="h-4 w-4" style={{ color: theme.textMuted }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: theme.textSubtle }}>{label}</p>
        {href ? (
          <a href={href} className="text-[13px] sm:text-sm hover:underline truncate block" style={{ color: theme.primary }}>{value}</a>
        ) : (
          <p className="text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>{value}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <a href="/cc/calls" className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 mb-4 sm:mb-6" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Calls
      </a>

      {/* Header */}
      <div className="mb-5 sm:mb-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>
              {isSpam ? 'Spam call' : `Call with ${callerName(call)}`}
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] flex items-center gap-1.5 flex-wrap" style={{ color: theme.textMuted }}>
              <Building2 className="h-3.5 w-3.5" /> {businessName}
              <span style={{ color: theme.textSubtle }}>·</span>
              {new Date(call.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {call.duration_seconds ? <><span style={{ color: theme.textSubtle }}>·</span> {fmtDuration(call.duration_seconds)}</> : null}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {hipaa && (
              <span className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor: theme.successBg, color: theme.success }}>
                <Shield className="h-3.5 w-3.5" /> HIPAA
              </span>
            )}
            {call.call_language && call.call_language !== 'en' && (
              <span className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Globe className="h-3.5 w-3.5" /> {LANGUAGE_NAMES[call.call_language] || call.call_language.toUpperCase()}
              </span>
            )}
            {outcome && (
              <span className="rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor: os.bg, color: os.fg }}>
                <OIcon className="h-3.5 w-3.5" /> {outcome}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spam banner */}
      {isSpam && (
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <ShieldX className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.error }} />
          <div>
            <p className="text-sm font-medium" style={{ color: theme.error }}>Detected as spam and automatically blocked</p>
            {call.spam_reason && <p className="text-xs mt-1" style={{ color: theme.error }}>Type: {call.spam_reason}</p>}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {(call.ai_summary || call.summary) && (
            <div className="rounded-2xl p-5 sm:p-6" style={card}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
                  <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>AI Summary</h2>
              </div>
              <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>{call.ai_summary || call.summary}</p>
            </div>
          )}

          {/* Who handled this call */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
                <User className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Who handled this call</h2>
            </div>
            {events.length === 0 ? (
              <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                Handled entirely by the AI.
                {call.appointment_booked ? ` An appointment was booked${call.appointment_time ? ` for ${call.appointment_time}` : ''}.` : ''}
              </p>
            ) : (
              <>
                <p className="text-[13px] sm:text-sm mb-3" style={{ color: theme.text }}>
                  {tookOver ? `${handler} took over this call.` : `${handler} listened in on this call.`}
                </p>
                <ol className="space-y-2">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary }} />
                      <span style={{ color: theme.textMuted }}>
                        <span style={{ color: theme.text, fontWeight: 600 }}>{e.name || 'A teammate'}</span>{' '}
                        {SUP_ACTION[e.action] || e.action}
                        {e.at ? <span style={{ color: theme.textSubtle }}> · {fmtEventTime(e.at)}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          {/* Recording */}
          {!hipaa && call.recording_url && (
            <div className="rounded-2xl p-5 sm:p-6" style={card}>
              <h2 className="font-semibold text-sm sm:text-[15px] mb-4" style={{ color: theme.text }}>Recording</h2>
              <CallPlayback recordingUrl={call.recording_url} callDuration={call.duration_seconds || undefined} brandColor={theme.primary} />
            </div>
          )}

          {/* Transcript */}
          {!hipaa && call.transcript && (
            <div className="rounded-2xl p-5 sm:p-6" style={card}>
              <h2 className="font-semibold text-sm sm:text-[15px] mb-4" style={{ color: theme.text }}>Full transcript</h2>
              <div className="rounded-xl p-4 max-h-72 sm:max-h-96 overflow-y-auto" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.borderSubtle}` }}>
                <p className="text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: theme.textMuted }}>{call.transcript}</p>
              </div>
            </div>
          )}

          {hipaa && (
            <div className="rounded-2xl p-5 sm:p-6 flex items-start gap-3" style={card}>
              <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.success }} />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text }}>HIPAA compliance active</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                  Recordings and transcripts are not stored for this business. The AI summary above contains scheduling information only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <h2 className="font-semibold text-sm sm:text-[15px] mb-4" style={{ color: theme.text }}>Contact</h2>
            <div className="space-y-3.5">
              {callerName(call) !== 'Unknown caller' && <InfoRow icon={User} label="Name" value={callerName(call)} />}
              {phone && <InfoRow icon={Phone} label="Phone" value={fmtPhoneLocal(phone)} href={`tel:${phone}`} />}
              {call.customer_email && <InfoRow icon={MessageSquare} label="Email" value={call.customer_email} href={`mailto:${call.customer_email}`} />}
              {call.customer_address && <InfoRow icon={MapPin} label="Address" value={call.customer_address} />}
            </div>
          </div>

          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <h2 className="font-semibold text-sm sm:text-[15px] mb-4" style={{ color: theme.text }}>Call details</h2>
            <div className="space-y-3.5">
              {outcome && <InfoRow icon={OIcon} label="Outcome" value={outcome} />}
              {call.service_requested && <InfoRow icon={Settings} label="Service" value={call.service_requested} />}
              {call.urgency_level && !isSpam && <InfoRow icon={AlertCircle} label="Urgency" value={call.urgency_level.charAt(0).toUpperCase() + call.urgency_level.slice(1)} />}
              {call.sentiment && <InfoRow icon={MessageSquare} label="Sentiment" value={call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)} />}
              {!!call.duration_seconds && <InfoRow icon={Clock} label="Duration" value={fmtDuration(call.duration_seconds)} />}
              {call.call_language && call.call_language !== 'en' && <InfoRow icon={Globe} label="Language" value={LANGUAGE_NAMES[call.call_language] || call.call_language.toUpperCase()} />}
            </div>
          </div>

          {!isSpam && phone && (
            <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              <Phone className="h-4 w-4" /> Call back
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtPhoneLocal(p: string): string {
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
