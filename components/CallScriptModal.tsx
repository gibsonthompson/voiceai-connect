'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Loader2, Phone, PhoneCall, PhoneOff, ChevronDown, ChevronUp,
  Copy, Check, Lightbulb, Building2, User, Mail, Globe, Tag,
  DollarSign, Calendar, FileText, Clock, ExternalLink, MessageSquare,
  Target, ThumbsUp, PhoneForwarded, ThumbsDown, Voicemail, Ban,
  Smile, HelpCircle, Timer, Handshake, CalendarCheck, Headphones,
  ArrowUp, Volume2
} from 'lucide-react';
import { useAgency } from '@/app/agency/context';
import { useTheme, type Theme } from '@/hooks/useTheme';

// ============================================================================
// HELPERS
// ============================================================================

function formatPhoneNumber(phone: string): string {
  // Strip to digits only
  const digits = phone.replace(/\D/g, '');
  // Handle +1XXXXXXXXXX or 1XXXXXXXXXX (11 digits)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Handle XXXXXXXXXX (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // Fallback: return as-is
  return phone;
}

// Friendly labels for stored lead source values. Both the Lead-Finder maps
// value and the manual google_maps value read as "Google Maps" so the UI never
// shows a raw slug like "lead_finder_maps".
const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  lead_finder_maps: 'Google Maps',
  google_search: 'Google Search',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  yelp: 'Yelp',
  referral: 'Referral',
  in_person: 'In Person',
  event: 'Event / Trade Show',
  csv_import: 'CSV Import',
  other: 'Other',
};

function sourceLabel(src?: string): string {
  if (!src) return '';
  return SOURCE_LABELS[src] || src.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website?: string;
  industry?: string;
  source?: string;
  status?: string;
  estimated_value?: number;
  next_follow_up?: string | null;
  notes?: string;
  created_at?: string;
}

interface CallScript {
  id: string;
  name: string;
  description?: string;
  type: string;
  body: string;
  sequence_order?: number;
  is_follow_up?: boolean;
  is_default?: boolean;
}

type CallOutcome =
  | 'answered_interested'
  | 'answered_not_interested'
  | 'answered_callback'
  | 'answered_booked'
  | 'voicemail'
  | 'no_answer';

interface CallOutcomeOption {
  value: CallOutcome;
  label: string;
  icon: React.ReactNode;
  color: string;
  colorBg: string;
  colorBorder: string;
  updatesStatus?: string; // lead status to update to
}

interface CallScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  lead: Lead;
  onSent?: () => void;
}

// ============================================================================
// CALL OUTCOME OPTIONS
// ============================================================================

const CALL_OUTCOMES: CallOutcomeOption[] = [
  {
    value: 'answered_booked',
    label: 'Booked Demo',
    icon: <Target className="h-4 w-4" />,
    color: '#34d399',
    colorBg: 'rgba(52,211,153,0.1)',
    colorBorder: 'rgba(52,211,153,0.3)',
    updatesStatus: 'qualified',
  },
  {
    value: 'answered_interested',
    label: 'Interested',
    icon: <ThumbsUp className="h-4 w-4" />,
    color: '#60a5fa',
    colorBg: 'rgba(96,165,250,0.1)',
    colorBorder: 'rgba(96,165,250,0.3)',
    updatesStatus: 'contacted',
  },
  {
    value: 'answered_callback',
    label: 'Callback',
    icon: <PhoneForwarded className="h-4 w-4" />,
    color: '#fbbf24',
    colorBg: 'rgba(251,191,36,0.1)',
    colorBorder: 'rgba(251,191,36,0.3)',
    updatesStatus: 'contacted',
  },
  {
    value: 'answered_not_interested',
    label: 'Not Interested',
    icon: <ThumbsDown className="h-4 w-4" />,
    color: '#f87171',
    colorBg: 'rgba(248,113,113,0.1)',
    colorBorder: 'rgba(248,113,113,0.3)',
    updatesStatus: 'lost',
  },
  {
    value: 'voicemail',
    label: 'Voicemail',
    icon: <Voicemail className="h-4 w-4" />,
    color: '#a78bfa',
    colorBg: 'rgba(167,139,250,0.1)',
    colorBorder: 'rgba(167,139,250,0.3)',
    updatesStatus: 'contacted',
  },
  {
    value: 'no_answer',
    label: 'No Answer',
    icon: <Ban className="h-4 w-4" />,
    color: '#94a3b8',
    colorBg: 'rgba(148,163,184,0.1)',
    colorBorder: 'rgba(148,163,184,0.3)',
  },
];

// ============================================================================
// COLD CALLING TIPS
// ============================================================================

const COLD_CALL_TIPS = [
  { icon: <Smile className="h-3.5 w-3.5" />, tip: 'Smile before dialing — it changes your tone and energy.' },
  { icon: <HelpCircle className="h-3.5 w-3.5" />, tip: 'Ask open-ended questions to keep the conversation going.' },
  { icon: <Volume2 className="h-3.5 w-3.5" />, tip: 'Mirror their language and pace — match their energy.' },
  { icon: <Timer className="h-3.5 w-3.5" />, tip: 'Pause for 2 seconds after your pitch — let them process.' },
  { icon: <Handshake className="h-3.5 w-3.5" />, tip: 'Handle objections with empathy: "I totally understand…"' },
  { icon: <CalendarCheck className="h-3.5 w-3.5" />, tip: 'Always set a next step — never end a call without one.' },
  { icon: <Clock className="h-3.5 w-3.5" />, tip: 'Best call times: 10-11:30am and 1:30-3pm local time.' },
  { icon: <ArrowUp className="h-3.5 w-3.5" />, tip: 'Stand up while calling — it gives your voice more energy.' },
];

// ============================================================================
// DEMO CALL SCRIPTS
// ============================================================================

const DEMO_CALL_SCRIPTS: CallScript[] = [
  {
    id: 'demo-call-1',
    name: 'Intro / Discovery Call',
    description: 'First cold call. Build rapport, find the missed-call pain, then let them hear the AI live.',
    type: 'call_script',
    body: `[OPENING, warm, 10 seconds]

Hey {lead_contact_first_name}, it's {agency_caller_name} with {agency_name}. Caught you at an okay time?

[PAUSE, match their energy]

I'll be quick, I know you're busy running {lead_business_name}.

[REASON FOR CALL]

I work with {lead_industry} businesses around here and set them up so they stop losing calls when nobody can get to the phone. Mind if I ask you a couple quick questions to see if it's even worth your time?

[IF YES, DISCOVERY]

- When you're on a job or closed, what happens to a call that comes in right now?
- Rough guess, how many a week go to voicemail?
- When someone hits your voicemail, do they leave a message, or just call the next shop?

[LISTEN, take notes, reflect it back]

[VALUE, keep it tight]

That's the exact gap we close. I set up an AI receptionist that answers 24/7, sounds like a real person, and books the job straight onto your calendar. The part people don't expect is how normal it sounds.

[THE ASK, let them hear it, don't sell it]

Honestly the fastest way to get it is to hear it. Can I text you our demo line right now? It's {agency_demo_number}, call it whenever and it'll answer like it's picking up for {lead_business_name}. Then you'll know in about 60 seconds whether it's any good.

[IF YES]

Perfect, sending it to {lead_phone} now. Give it a call today and I'll follow up tomorrow to hear what you thought.

[IF NOT NOW]

No problem. Want me to check back in a couple weeks? Things get busy, I just don't want you missing out if the timing gets better.

[IF NOT INTERESTED]

All good, {lead_contact_first_name}. You've got my number if anything changes. Have a good one.`,
    sequence_order: 1,
    is_follow_up: false,
    is_default: true,
  },
  {
    id: 'demo-call-2',
    name: 'Follow-Up Call',
    description: 'Second call after the first touch. Reference it, reconnect with the pain, then let them hear it.',
    type: 'call_script',
    body: `[OPENING, reference the last touch]

Hey {lead_contact_first_name}, it's {agency_caller_name} from {agency_name}. We crossed paths a little while back, I'd reached out about missed calls at {lead_business_name}. Ring a bell?

[IF THEY REMEMBER]

Great. I just wanted to see if the timing's any better now, or if you had questions I can knock out.

[IF THEY DON'T]

No worries, quick refresher: I set up an AI receptionist for {lead_industry} businesses that answers 24/7, books jobs, and sounds like a real person, so calls stop slipping through.

[RECONNECT WITH THE PAIN]

Last time, the thing that stood out was missed calls when you're on a job or after hours. Still happening?

[LISTEN]

[THE ASK, hear it, not book it]

Let me just put it in your hands. I'll text you our demo line right now, {agency_demo_number}, call it whenever and it'll answer like it's picking up for {lead_business_name}. Takes a minute and you'll know if it's for real.

[IF YES]

Sending it to {lead_phone} now. Try it today and I'll check in tomorrow.

[IF NOT YET]

Totally fair. Mind if I check back in a couple weeks? I don't want to pester you, just don't want you missing out when it's the right time.

[IF NO]

No pressure at all. You know where I am if anything changes. Take care, {lead_contact_first_name}.`,
    sequence_order: 2,
    is_follow_up: true,
    is_default: true,
  },
  {
    id: 'demo-call-3',
    name: 'Demo Close Call',
    description: 'After they have heard the AI. Check reaction, handle the common objections, and start the free trial.',
    type: 'call_script',
    body: `[OPENING, reference the demo]

Hey {lead_contact_first_name}! It's {agency_caller_name} from {agency_name}. You got a chance to call the number and hear it, right? What'd you think?

[LISTEN, their answer tells you where they are]

[IF POSITIVE]

Yeah, that's the reaction most people have, it just sounds normal. So here's what I'd do: get {lead_business_name} set up this week. It's live in about a day, and you get a 7-day free trial, so there's no risk in trying it.

[COMMON OBJECTIONS]

- "It's too pricey."
  Fair. Flip it around though, what's one missed job worth to you? If it catches even one a week you'd have lost, it's paid for itself many times over. Starter is {agency_starter_price}.

- "I need to think about it."
  Of course. What's the piece you're weighing? [Listen.] Makes sense, would it help if I [address that specific thing]?

- "Not sure my customers want to talk to a bot."
  That's the number one worry, and the number one thing that flips people. It sounds like a real person, and if a caller ever wants a human it transfers them on the spot.

- "I already have someone answering."
  Great, this doesn't replace them. It catches the overflow, the after-hours, and the weekends so nothing slips when your person is busy or gone.

[CLOSE]

Here's my honest recommendation: start the free trial this week. You'll see real calls handled within days, and if it's not for you, you cancel, no hassle. Fair enough?

[IF YES]

Love it. Sending the signup link to {lead_email} now. I'll personally make sure everything's dialed in for {lead_business_name}.

[IF THEY NEED TIME]

No problem. I'll follow up [specific day]. Anything comes up before then, just text me at {agency_phone}.

[CLOSE, always confirm the next step]

Thanks {lead_contact_first_name}, excited to get this going for you. Talk soon.`,
    sequence_order: 3,
    is_follow_up: false,
    is_default: true,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CallScriptModal({
  isOpen,
  onClose,
  agencyId,
  lead,
  onSent,
}: CallScriptModalProps) {
  const { agency, branding, demoMode } = useAgency();
  const theme = useTheme();

  // State
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [composedBody, setComposedBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [showScriptDropdown, setShowScriptDropdown] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(null);
  const [logging, setLogging] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [callCount, setCallCount] = useState(0);

  // Refs
  const scriptRef = useRef<HTMLDivElement>(null);

  // Tips visibility — collapsed by default so the script has the most room and
  // needs the least scrolling. Only auto-open if the rep explicitly expanded
  // them before (we store 'false' = shown, 'true' = dismissed).
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('voiceai_call_tips_dismissed');
      setShowTips(dismissed === 'false');
    } catch {
      setShowTips(false);
    }
  }, []);

  const toggleTips = () => {
    setShowTips(!showTips);
    try {
      localStorage.setItem('voiceai_call_tips_dismissed', (!showTips ? 'false' : 'true'));
    } catch { /* noop */ }
  };

  // API helpers
  const getToken = () => localStorage.getItem('auth_token');
  const getApiBase = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    return `${backendUrl}/api/agency/${agencyId}`;
  };

  // ── Fetch scripts + call count on open ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      setComposedBody('');
      setSelectedScriptId('');
      setCallNotes('');
      setSelectedOutcome(null);
      setLoggedSuccess(false);
      setShowScriptDropdown(false);
      fetchScripts();
      fetchCallCount();
    }
  }, [isOpen, agencyId, lead.id]);

  const fetchCallCount = async () => {
    if (demoMode) {
      setCallCount(0);
      return;
    }
    try {
      const token = getToken();
      const response = await fetch(
        `${getApiBase()}/leads/${lead.id}/outreach`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setCallCount(data.outreach?.call_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch call count:', error);
    }
  };

  const fetchScripts = async () => {
    if (demoMode) {
      setScripts(DEMO_CALL_SCRIPTS);
      // Auto-select first script
      if (DEMO_CALL_SCRIPTS.length > 0) {
        handleScriptSelect(DEMO_CALL_SCRIPTS[0].id, DEMO_CALL_SCRIPTS);
      }
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${getApiBase()}/templates?type=call_script`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const loadedScripts: CallScript[] = data.templates || [];
        setScripts(loadedScripts);
        // Auto-select: sequence-based or first
        if (loadedScripts.length > 0) {
          // Default to the intro script (sequence 1 / first non-follow-up).
          const match = loadedScripts.find(s => s.sequence_order === 1)
            || loadedScripts.find(s => !s.is_follow_up)
            || loadedScripts[0];
          handleScriptSelect(match.id, loadedScripts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch call scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Select & compose script ─────────────────────────────────────
  const handleScriptSelect = async (scriptId: string, scriptList?: CallScript[]) => {
    const list = scriptList || scripts;
    setSelectedScriptId(scriptId);
    setShowScriptDropdown(false);

    if (demoMode) {
      const script = DEMO_CALL_SCRIPTS.find(s => s.id === scriptId);
      if (script) {
        setComposedBody(demoPrepareScript(script.body));
      }
      return;
    }

    setComposing(true);
    try {
      const token = getToken();
      const response = await fetch(`${getApiBase()}/outreach/compose`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: scriptId, leadId: lead.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setComposedBody(data.body || '');
      }
    } catch (error) {
      console.error('Failed to compose call script:', error);
      // Fallback: show raw template
      const script = list.find(s => s.id === scriptId);
      if (script) setComposedBody(script.body);
    } finally {
      setComposing(false);
    }
  };

  // Demo variable replacement
  const demoPrepareScript = (body: string): string => {
    const agencyName = agency?.name || branding?.name || 'Our Agency';
    const firstName = (lead.contact_name || '').split(' ')[0] || 'there';
    return body
      .replace(/\{lead_contact_first_name\}/g, firstName)
      .replace(/\{lead_contact_name\}/g, lead.contact_name || 'Contact')
      .replace(/\{lead_business_name\}/g, lead.business_name || 'your business')
      .replace(/\{lead_email\}/g, lead.email || '')
      .replace(/\{lead_phone\}/g, lead.phone || '')
      .replace(/\{lead_industry\}/g, (lead as any).industry || 'local')
      .replace(/\{agency_name\}/g, agencyName)
      .replace(/\{agency_caller_name\}/g, 'Your Name')
      .replace(/\{agency_phone\}/g, agency?.phone || '')
      .replace(/\{agency_demo_number\}/g, (agency as any)?.demo_phone_number ? formatPhoneNumber((agency as any).demo_phone_number) : 'your AI demo line')
      .replace(/\{agency_email\}/g, agency?.email || '')
      .replace(/\{agency_starter_price\}/g, '$' + ((agency as any)?.price_starter ? ((agency as any).price_starter / 100) : '49') + '/mo')
      .replace(/\{agency_pro_price\}/g, '$' + ((agency as any)?.price_pro ? ((agency as any).price_pro / 100) : '99') + '/mo')
      .replace(/\{agency_growth_price\}/g, '$' + ((agency as any)?.price_growth ? ((agency as any).price_growth / 100) : '149') + '/mo')
      .replace(/\{current_date\}/g, new Date().toLocaleDateString())
      .replace(/\{current_time\}/g, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // ── Log call ────────────────────────────────────────────────────
  const handleLogCall = async () => {
    setLogging(true);

    if (demoMode) {
      setLoggedSuccess(true);
      onSent?.();
      setTimeout(() => onClose(), 1500);
      setLogging(false);
      return;
    }

    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const outcomeData = selectedOutcome ? CALL_OUTCOMES.find(o => o.value === selectedOutcome) : null;

      const resp = await fetch(`${getApiBase()}/outreach/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          templateId: selectedScriptId || null,
          type: 'call',
          toPhone: lead.phone,
          subject: outcomeData ? `Call: ${outcomeData.label}` : 'Call logged',
          body: callNotes || (outcomeData ? `Call outcome: ${outcomeData.label}` : 'Call logged'),
          userId: user.id,
          call_outcome: selectedOutcome || null,
          call_notes: callNotes,
          ...(outcomeData?.updatesStatus ? { updateLeadStatus: outcomeData.updatesStatus } : {}),
        }),
      });

      if (!resp.ok) throw new Error('Failed to log call');
      setLoggedSuccess(true);
      onSent?.();
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to log call:', error);
    } finally {
      setLogging(false);
    }
  };

  // ── Copy phone ──────────────────────────────────────────────────
  const handleCopyPhone = async () => {
    await navigator.clipboard.writeText(lead.phone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  // ── Don't render if closed ──────────────────────────────────────
  if (!isOpen) return null;

  const selectedScript = scripts.find(s => s.id === selectedScriptId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-6xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[98vh] sm:max-h-[95vh] flex flex-col"
        style={{
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#22c55e' }} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
                Cold Call
                {callCount > 0 && (
                  <span
                    className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                  >
                    Call #{callCount + 1}
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>
                {lead.contact_name || lead.business_name}
                {lead.business_name && lead.contact_name ? ` · ${lead.business_name}` : ''}
              </p>
            </div>
          </div>

          {/* Phone + Dial + Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dial button */}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dial</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors"
              style={{ color: theme.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.hover; e.currentTarget.style.color = theme.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.textMuted; }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            PHONE NUMBER BAR
            ═══════════════════════════════════════════════════════════ */}
        {lead.phone && (
          <div className="px-4 sm:px-6 py-2" style={{ borderBottom: `1px solid ${theme.borderSubtle}` }}>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <Phone className="h-4 w-4 shrink-0" style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium shrink-0 uppercase tracking-wide" style={{ color: theme.textMuted }}>Phone</span>
              <input
                type="text"
                readOnly
                value={formatPhoneNumber(lead.phone)}
                className="flex-1 bg-transparent text-sm sm:text-base font-semibold focus:outline-none cursor-text select-all tracking-wide"
                style={{ color: theme.text }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyPhone}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0"
                style={{
                  backgroundColor: phoneCopied ? 'rgba(16,185,129,0.1)' : theme.hover,
                  color: phoneCopied ? '#10b981' : theme.textMuted,
                  border: `1px solid ${phoneCopied ? 'rgba(16,185,129,0.3)' : theme.border}`,
                }}
              >
                {phoneCopied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0"
                style={{
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <ExternalLink className="h-3 w-3" /> Call
              </a>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MAIN CONTENT — Two columns on desktop, stacked on mobile
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">

          {/* ─── LEFT: Script ──────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 lg:border-r" style={{ borderColor: theme.border }}>

            {/* Tips Banner (collapsible) */}
            <div className="px-4 sm:px-6 pt-3">
              <button
                onClick={toggleTips}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.15)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" style={{ color: '#fbbf24' }} />
                  <span className="text-xs sm:text-sm font-medium" style={{ color: '#fbbf24' }}>
                    Cold Calling Tips
                  </span>
                </div>
                {showTips ? <ChevronUp className="h-4 w-4" style={{ color: '#fbbf24' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#fbbf24' }} />}
              </button>

              {showTips && (
                <div
                  className="mt-2 rounded-lg px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(251,191,36,0.04)' : 'rgba(251,191,36,0.05)',
                    border: '1px solid rgba(251,191,36,0.1)',
                  }}
                >
                  {COLD_CALL_TIPS.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5" style={{ color: theme.textMuted }}>{tip.icon}</span>
                      <span className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>{tip.tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Script Selector */}
            <div className="px-4 sm:px-6 pt-3">
              <div className="relative">
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                  Script
                </label>
                <button
                  onClick={() => setShowScriptDropdown(!showScriptDropdown)}
                  disabled={loading}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-left transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                    color: selectedScript ? theme.text : theme.textSubtle,
                  }}
                >
                  <div className="min-w-0">
                    <span className="text-sm">{loading ? 'Loading scripts...' : selectedScript?.name || 'Select a script...'}</span>
                    {selectedScript?.description && (
                      <p className="text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>{selectedScript.description}</p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 ml-2" style={{ color: theme.textMuted }} />
                </button>

                {showScriptDropdown && scripts.length > 0 && (
                  <div
                    className="absolute z-10 mt-2 w-full rounded-xl shadow-xl max-h-64 overflow-y-auto"
                    style={{ backgroundColor: theme.isDark ? '#0f0f0f' : '#ffffff', border: `1px solid ${theme.border}` }}
                  >
                    {scripts.map((script) => (
                      <button
                        key={script.id}
                        onClick={() => handleScriptSelect(script.id)}
                        className="w-full px-4 py-3 text-left transition-colors"
                        style={{ borderBottom: `1px solid ${theme.borderSubtle}` }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <p className="font-medium text-sm" style={{ color: theme.text }}>{script.name}</p>
                        {script.description && (
                          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{script.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Script Body */}
            <div className="flex-1 px-4 sm:px-6 py-3 overflow-y-auto" ref={scriptRef}>
              {composing && (
                <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: theme.textMuted }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />
                  Preparing script...
                </div>
              )}
              {!composing && composedBody && (
                <div
                  className="whitespace-pre-wrap text-sm sm:text-[15px]"
                  style={{ color: theme.text, lineHeight: '1.6' }}
                >
                  {composedBody.split('\n').map((line, i) => {
                    // Style [BRACKETED] instructions differently
                    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
                      return (
                        <p key={i} className="my-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg" style={{
                          backgroundColor: theme.isDark ? 'rgba(96,165,250,0.08)' : 'rgba(59,130,246,0.08)',
                          color: theme.isDark ? '#93c5fd' : '#2563eb',
                          border: '1px solid rgba(59,130,246,0.15)',
                        }}>
                          {line}
                        </p>
                      );
                    }
                    // Style → response options
                    if (line.trim().startsWith('[IF') || line.trim().startsWith('[GET') || line.trim().startsWith('[LET') || line.trim().startsWith('[PAUSE')) {
                      return (
                        <p key={i} className="my-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg" style={{
                          backgroundColor: theme.isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.08)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251,191,36,0.15)',
                        }}>
                          {line}
                        </p>
                      );
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="my-0.5">{line}</p>;
                  })}
                </div>
              )}
              {!composing && !composedBody && !loading && (
                <div className="flex items-center justify-center py-12" style={{ color: theme.textMuted }}>
                  <p className="text-sm">Select a script above to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Lead Info + Notes + Outcome ────────────────── */}
          <div className="lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col overflow-y-auto" style={{ borderTop: window.innerWidth < 1024 ? `1px solid ${theme.border}` : 'none' }}>

            {/* Lead Info Card */}
            <div className="px-4 sm:px-6 lg:px-5 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
                Lead Info
              </p>
              <div className="space-y-2.5">
                {lead.business_name && (
                  <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Business" value={lead.business_name} theme={theme} />
                )}
                {lead.contact_name && (
                  <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Contact" value={lead.contact_name} theme={theme} />
                )}
                {lead.phone && (
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={formatPhoneNumber(lead.phone)} theme={theme} />
                )}
                {lead.email && (
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email} theme={theme} />
                )}
                {(lead as any).industry && (
                  <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Industry" value={(lead as any).industry} theme={theme} />
                )}
                {(lead as any).source && (
                  <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Source" value={sourceLabel((lead as any).source)} theme={theme} />
                )}
                {lead.estimated_value != null && lead.estimated_value > 0 && (
                  <InfoRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Value" value={`$${lead.estimated_value.toLocaleString()}`} theme={theme} />
                )}
                {lead.status && (
                  <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Status" value={lead.status} theme={theme} capitalize />
                )}
                {lead.next_follow_up && (
                  <InfoRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Follow-up"
                    value={new Date(lead.next_follow_up).toLocaleDateString()}
                    theme={theme}
                  />
                )}
                {callCount > 0 && (
                  <InfoRow icon={<PhoneCall className="h-3.5 w-3.5" />} label="Prev Calls" value={`${callCount}`} theme={theme} />
                )}
              </div>

              {/* Lead Notes */}
              {lead.notes && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Notes</p>
                  <p
                    className="text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
                  >
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 sm:mx-6 lg:mx-5 my-4" style={{ borderTop: `1px solid ${theme.border}` }} />

            {/* Call Notes */}
            <div className="px-4 sm:px-6 lg:px-5">
              <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                Call Notes
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="How did the call go? Any important details..."
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm transition-colors focus:outline-none resize-none"
                style={{
                  backgroundColor: theme.input,
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.inputFocus}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Call Outcome */}
            <div className="px-4 sm:px-6 lg:px-5 pt-3 pb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: theme.textMuted }}>
                Call Outcome
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CALL_OUTCOMES.map((outcome) => {
                  const isSelected = selectedOutcome === outcome.value;
                  return (
                    <button
                      key={outcome.value}
                      onClick={() => setSelectedOutcome(isSelected ? null : outcome.value)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all text-xs sm:text-sm font-medium"
                      style={{
                        backgroundColor: isSelected ? outcome.colorBg : theme.card,
                        border: `1.5px solid ${isSelected ? outcome.colorBorder : theme.border}`,
                        color: isSelected ? outcome.color : theme.textMuted,
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <span style={{ color: isSelected ? outcome.color : theme.textMuted }}>{outcome.icon}</span>
                      <span>{outcome.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════ */}
        <div
          className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 safe-area-bottom"
          style={{
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.bg,
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Cancel */}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors text-center"
              style={{
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.textMuted,
              }}
            >
              Cancel
            </button>

            {/* Spacer on desktop */}
            <div className="hidden sm:block flex-1" />

            {/* Log Call — Primary */}
            <button
              onClick={handleLogCall}
              disabled={logging || loggedSuccess}
              className="flex-[1.5] sm:flex-none flex items-center justify-center gap-2 rounded-xl px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: loggedSuccess ? '#22c55e' : theme.primary,
                color: loggedSuccess ? '#ffffff' : theme.primaryText,
              }}
            >
              {loggedSuccess ? (
                <><Check className="h-4 w-4" /> Call Logged!</>
              ) : logging ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Logging...</>
              ) : (
                <><PhoneOff className="h-4 w-4" /> Log Call</>
              )}
            </button>
          </div>

          {/* Hint text */}
          {!selectedOutcome && !loggedSuccess && (
            <p className="text-center text-xs mt-2" style={{ color: theme.textSubtle }}>
              Optionally select an outcome above before logging
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoRow({ icon, label, value, theme, capitalize }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: Theme;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0" style={{ color: theme.textMuted }}>{icon}</div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-xs shrink-0" style={{ color: theme.textMuted }}>{label}:</span>
        <span
          className="text-xs font-medium truncate"
          style={{ color: theme.text, textTransform: capitalize ? 'capitalize' : undefined }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}