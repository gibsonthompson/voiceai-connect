'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Loader2, Mail, MessageSquare, Copy, Check, 
  ChevronDown, Info, Hash, Clipboard, ExternalLink, Linkedin, UserPlus
} from 'lucide-react';
import { useAgency } from '@/app/agency/context';
import { getDemoTemplates, composeDemoMessage, logDemoOutreach } from '@/app/agency/demoData';

// Safe wrapper — allows ComposerModal to work outside AgencyProvider (admin mode)
function useSafeAgency(adminMode: boolean) {
  if (adminMode) {
    return { agency: null, branding: null, demoMode: false };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAgency();
}

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  linkedin_url?: string | null;
}

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  description?: string;
  sequence_order?: number;
  is_follow_up?: boolean;
  sequence_name?: string;
}

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  lead: Lead;
  type: 'email' | 'sms' | 'linkedin';
  onSent?: () => void;
  adminMode?: boolean;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getOutreachLabel(type: 'email' | 'sms' | 'linkedin', number: number): string {
  if (type === 'linkedin') {
    if (number === 1) return 'Initial Connect';
    if (number === 2) return 'First Message';
    if (number === 3) return 'Follow-up';
    return `Follow-up #${number - 2}`;
  }
  if (number === 1) {
    return type === 'email' ? 'Initial Email' : 'Initial SMS';
  } else if (number === 2) {
    return type === 'email' ? 'Follow-up Email' : 'Follow-up SMS';
  } else {
    return type === 'email' ? `Follow-up Email #${number - 1}` : `Follow-up SMS #${number - 1}`;
  }
}

function getTypeAccent(type: 'email' | 'sms' | 'linkedin') {
  switch (type) {
    case 'email': return { color: '#a855f7', bg: 'rgba(147, 51, 234, 0.1)', border: 'rgba(147, 51, 234, 0.2)' };
    case 'sms': return { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.2)' };
    case 'linkedin': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
  }
}

function getTypeIcon(type: 'email' | 'sms' | 'linkedin') {
  switch (type) {
    case 'email': return Mail;
    case 'sms': return MessageSquare;
    case 'linkedin': return Linkedin;
  }
}

function formatLinkedinSlug(url: string): string {
  try {
    return url.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '').replace(/\/$/, '');
  } catch {
    return url;
  }
}

export default function ComposerModal({ 
  isOpen, 
  onClose, 
  agencyId, 
  lead, 
  type,
  onSent,
  adminMode = false,
}: ComposerModalProps) {
  const { agency, branding, demoMode } = useSafeAgency(adminMode);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [copied, setCopied] = useState<'none' | 'subject' | 'body' | 'all' | 'recipient' | 'note'>('none');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  
  // Outreach counts for sequence tracking
  const [outreachCounts, setOutreachCounts] = useState({ email: 0, sms: 0, linkedin: 0 });

  // Connection note for LinkedIn Stage 1
  const [connectionNote, setConnectionNote] = useState('');

  // Refs to coordinate auto-select after both counts + templates load
  const countsRef = useRef({ email: 0, sms: 0, linkedin: 0 });
  const autoSelectDone = useRef(false);

  const isDark = adminMode ? true : (agency?.website_theme !== 'light');
  const primaryColor = adminMode ? '#3b82f6' : (branding?.primaryColor || '#10b981');
  const primaryLight = isLightColor(primaryColor);

  const accent = getTypeAccent(type);
  const TypeIcon = getTypeIcon(type);

  const getToken = () => localStorage.getItem(adminMode ? 'admin_token' : 'auth_token');
  const getApiBase = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    return adminMode ? `${backendUrl}/api/admin` : `${backendUrl}/api/agency/${agencyId}`;
  };

  const theme = {
    bg: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#fafaf9' : '#1f2937',
    textMuted: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280',
    textMuted2: isDark ? 'rgba(250,250,249,0.4)' : '#9ca3af',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    borderLight: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
    dropdownBg: isDark ? '#0f0f0f' : '#ffffff',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
  };

  const linkedinUrl = lead.linkedin_url 
    ? (lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`)
    : null;

  // ── LinkedIn two-stage logic ─────────────────────────────────────
  // Stage 1: Never connected (count = 0) → connection note + "Connect & Log"
  // Stage 2: Already connected (count >= 1) → full message composer
  const isConnectStage = type === 'linkedin' && outreachCounts.linkedin === 0;

  const currentNumber = type === 'email' 
    ? outreachCounts.email + 1 
    : type === 'sms' 
      ? outreachCounts.sms + 1 
      : outreachCounts.linkedin + 1;
  const sequenceLabel = getOutreachLabel(type, currentNumber);

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setBody('');
      setConnectionNote('');
      setSelectedTemplate('');
      setCopied('none');
      setLoggedSuccess(false);
      autoSelectDone.current = false;
      countsRef.current = { email: 0, sms: 0, linkedin: 0 };

      fetchOutreachCounts();
      fetchTemplates();
    }
  }, [isOpen, agencyId, type, lead.id]);

  // ── Auto-Template Selection ──────────────────────────────────────
  const autoSelectTemplate = (templateList: Template[], counts: { email: number; sms: number; linkedin: number }) => {
    if (templateList.length === 0 || autoSelectDone.current) return;
    autoSelectDone.current = true;

    const targetSequenceOrder = type === 'email' 
      ? counts.email + 1 
      : type === 'sms'
        ? counts.sms + 1
        : counts.linkedin + 1;

    const sequenceMatch = templateList.find(
      (t) => t.sequence_order === targetSequenceOrder
    );
    if (sequenceMatch) {
      handleTemplateSelect(sequenceMatch.id);
      return;
    }

    if (targetSequenceOrder === 1) {
      const initial = templateList.find((t) => !t.is_follow_up);
      if (initial) {
        handleTemplateSelect(initial.id);
        return;
      }
    }

    const maxOrder = templateList.reduce(
      (max, t) => Math.max(max, t.sequence_order || 0), 0
    );
    if (targetSequenceOrder > maxOrder && maxOrder > 0) {
      const lastInSequence = templateList.find(
        (t) => t.sequence_order === maxOrder
      );
      if (lastInSequence) {
        handleTemplateSelect(lastInSequence.id);
      }
    }
  };

  const fetchOutreachCounts = async () => {
    if (demoMode) {
      const counts = { email: 0, sms: 0, linkedin: 0 };
      countsRef.current = counts;
      setOutreachCounts(counts);
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
        const counts = {
          email: data.outreach?.email_count || 0,
          sms: data.outreach?.sms_count || 0,
          linkedin: data.outreach?.linkedin_count || 0,
        };
        countsRef.current = counts;
        setOutreachCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch outreach counts:', error);
    }
  };

  const fetchTemplates = async () => {
    if (demoMode) {
      setLoading(true);
      const demoType = type === 'linkedin' ? 'email' : type;
      const demoTemplates = (type === 'linkedin' ? [] : getDemoTemplates(demoType)) as Template[];
      setTemplates(demoTemplates);
      setTimeout(() => autoSelectTemplate(demoTemplates, countsRef.current), 50);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${getApiBase()}/templates?type=${type}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedTemplates: Template[] = data.templates || [];
        setTemplates(loadedTemplates);
        setTimeout(() => autoSelectTemplate(loadedTemplates, countsRef.current), 50);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplateDropdown(false);

    if (demoMode) {
      const agencyName = agency?.name || branding?.name || 'Our Team';
      const result = composeDemoMessage(templateId, lead, agencyName);
      setSubject(result.subject);
      setBody(result.body);
      // For connect stage, populate the connection note instead
      if (type === 'linkedin' && countsRef.current.linkedin === 0) {
        setConnectionNote(result.body);
      }
      return;
    }

    setComposing(true);

    try {
      const token = getToken();
      const response = await fetch(
        `${getApiBase()}/outreach/compose`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId,
            leadId: lead.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubject(data.subject || '');
        setBody(data.body || '');
        // For connect stage, populate the connection note from template body
        if (type === 'linkedin' && countsRef.current.linkedin === 0) {
          setConnectionNote(data.body || '');
        }
      }
    } catch (error) {
      console.error('Failed to compose message:', error);
    } finally {
      setComposing(false);
    }
  };

  const handleCopyAll = async () => {
    const textToCopy = type === 'email' 
      ? `Subject: ${subject}\n\n${body}`
      : body;

    await navigator.clipboard.writeText(textToCopy);
    setCopied('all');
    setTimeout(() => setCopied('none'), 2000);
  };

  const handleCopySubject = async () => {
    await navigator.clipboard.writeText(subject);
    setCopied('subject');
    setTimeout(() => setCopied('none'), 2000);
  };

  const handleCopyBody = async () => {
    await navigator.clipboard.writeText(body);
    setCopied('body');
    setTimeout(() => setCopied('none'), 2000);
  };

  const handleLogAsSent = async () => {
    if (demoMode) {
      logDemoOutreach({
        leadId: lead.id,
        type: type as 'email' | 'sms',
        subject: type === 'email' ? subject : null,
        body: isConnectStage ? connectionNote : body,
      });
      setLoggedSuccess(true);
      onSent?.();
      setTimeout(() => { onClose(); }, 1500);
      return;
    }

    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      await fetch(`${getApiBase()}/outreach/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          templateId: selectedTemplate || null,
          type,
          toAddress: type === 'email' ? lead.email : (type === 'linkedin' ? lead.linkedin_url : lead.phone),
          toPhone: type === 'sms' ? lead.phone : null,
          subject: type === 'email' ? subject : null,
          body: isConnectStage ? connectionNote : body,
          userId: user.id,
        }),
      });

      setLoggedSuccess(true);
      onSent?.();
      setTimeout(() => { onClose(); }, 1500);
    } catch (error) {
      console.error('Failed to log outreach:', error);
    }
  };

  const handleCopyAndLog = async () => {
    await handleCopyAll();
    await handleLogAsSent();
  };

  /** LinkedIn Stage 1: Copy connection note, open profile, and log */
  const handleConnectAndLog = async () => {
    if (connectionNote) {
      await navigator.clipboard.writeText(connectionNote);
      setCopied('note');
    }
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    }
    await handleLogAsSent();
  };

  /** LinkedIn Stage 2: Copy message, open profile, and log */
  const handleCopyOpenAndLog = async () => {
    await navigator.clipboard.writeText(body);
    setCopied('all');
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    }
    await handleLogAsSent();
  };

  if (!isOpen) return null;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      
      {/* Modal — smaller for connect stage */}
      <div 
        className={`relative w-full ${
          isConnectStage ? 'sm:max-w-lg' : type === 'email' ? 'sm:max-w-4xl' : 'sm:max-w-2xl'
        } rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
        style={{ 
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Drag handle - mobile only */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ borderBottom: `1px solid ${theme.borderLight}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: accent.bg }}
            >
              {isConnectStage 
                ? <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: accent.color }} />
                : <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: accent.color }} />
              }
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
                {isConnectStage ? 'LinkedIn Connect' : type === 'linkedin' ? 'LinkedIn Message' : `Compose ${type === 'email' ? 'Email' : 'SMS'}`}
                <span 
                  className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                  style={{ backgroundColor: accent.bg, color: accent.color }}
                >
                  <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {sequenceLabel}
                </span>
              </h2>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>
                To: {lead.contact_name || lead.business_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors shrink-0"
            style={{ color: theme.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.hoverBg;
              e.currentTarget.style.color = theme.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.textMuted;
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LinkedIn Profile Link — shown for both stages */}
        {type === 'linkedin' && linkedinUrl && (
          <div className="px-4 sm:px-6 pt-3 pb-1">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors group"
              style={{ 
                backgroundColor: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                <Linkedin className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors truncate">
                  {formatLinkedinSlug(lead.linkedin_url!)}
                </p>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>Click to open profile in new tab</p>
              </div>
              <ExternalLink className="h-4 w-4 text-blue-400/50 group-hover:text-blue-400 transition-colors shrink-0" />
            </a>
          </div>
        )}

        {/* LinkedIn — no profile URL warning */}
        {type === 'linkedin' && !linkedinUrl && (
          <div className="px-4 sm:px-6 pt-3 pb-1">
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3"
              style={{ 
                backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <Info className="h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
              <p className="text-xs" style={{ color: '#f59e0b' }}>
                No LinkedIn URL on file — add one via the lead edit form to enable direct linking.
              </p>
            </div>
          </div>
        )}

        {/* Recipient email/phone - for email and sms only */}
        {type !== 'linkedin' && ((type === 'email' && lead.email) || (type === 'sms' && lead.phone)) && (
          <div className="px-4 sm:px-6 pb-2">
            <div 
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.border}` }}
            >
              <span className="text-xs font-medium shrink-0 uppercase tracking-wide" style={{ color: theme.textMuted }}>
                {type === 'email' ? 'To' : 'Phone'}
              </span>
              <input
                type="text"
                readOnly
                value={type === 'email' ? lead.email : lead.phone}
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none cursor-text select-all"
                style={{ color: theme.text }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  const val = type === 'email' ? lead.email : lead.phone;
                  navigator.clipboard.writeText(val);
                  setCopied('recipient');
                  setTimeout(() => setCopied(prev => prev === 'recipient' ? 'none' : prev), 2000);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0"
                style={{
                  backgroundColor: copied === 'recipient' ? 'rgba(16,185,129,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color: copied === 'recipient' ? '#10b981' : theme.textMuted,
                  border: `1px solid ${copied === 'recipient' ? 'rgba(16,185,129,0.3)' : theme.border}`,
                }}
              >
                {copied === 'recipient' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* LINKEDIN STAGE 1: CONNECT                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        {isConnectStage && (
          <>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Connect info banner */}
              <div 
                className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: accent.bg, border: `1px solid ${accent.border}` }}
              >
                <UserPlus className="h-4 w-4" style={{ color: accent.color }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: accent.color }}>
                    Send Connection Request
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Add an optional note below, then connect on LinkedIn. Once logged, messaging becomes available.
                  </p>
                </div>
              </div>

              {/* Template Selector (for connection note templates) */}
              {templates.length > 0 && (
                <div className="relative">
                  <label className="block text-sm mb-1.5" style={{ color: theme.textMuted }}>
                    Template
                  </label>
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    disabled={loading}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors disabled:opacity-50"
                    style={{ 
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      color: selectedTemplateData ? theme.text : theme.textMuted2,
                    }}
                  >
                    <span>
                      {loading ? 'Loading templates...' : selectedTemplateData?.name || 'Select a template...'}
                    </span>
                    <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted2 }} />
                  </button>
                  
                  {showTemplateDropdown && (
                    <div 
                      className="absolute z-10 mt-2 w-full rounded-xl shadow-xl max-h-64 overflow-y-auto"
                      style={{ 
                        backgroundColor: theme.dropdownBg,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="w-full px-4 py-3 text-left transition-colors"
                          style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <p className="font-medium text-sm" style={{ color: theme.text }}>{template.name}</p>
                          {template.description && (
                            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{template.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Composing indicator */}
              {composing && (
                <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: primaryColor }} />
                  Preparing note...
                </div>
              )}

              {/* Connection Note */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm" style={{ color: theme.textMuted }}>
                    Connection Note <span className="text-xs" style={{ color: theme.textMuted2 }}>(optional)</span>
                  </label>
                  {connectionNote && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(connectionNote);
                        setCopied('note');
                        setTimeout(() => setCopied('none'), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ 
                        color: copied === 'note' ? primaryColor : theme.textMuted2,
                        backgroundColor: copied === 'note' ? hexToRgba(primaryColor, 0.1) : 'transparent',
                      }}
                    >
                      {copied === 'note' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === 'note' ? 'Copied!' : 'Copy Note'}
                    </button>
                  )}
                </div>
                <textarea
                  value={connectionNote}
                  onChange={(e) => setConnectionNote(e.target.value)}
                  placeholder={`Hi ${lead.contact_name?.split(' ')[0] || 'there'}, I noticed ${lead.business_name || 'your company'}...`}
                  rows={4}
                  maxLength={300}
                  className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none text-sm"
                  style={{ 
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    lineHeight: '1.5',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.2)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px]" style={{ color: theme.textMuted2 }}>
                    LinkedIn connection requests allow ~300 characters
                  </p>
                  <p className="text-[10px] tabular-nums" style={{ color: connectionNote.length > 280 ? '#f59e0b' : theme.textMuted2 }}>
                    {connectionNote.length}/300
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div 
                className="flex items-start gap-3 rounded-lg p-3"
                style={{ 
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: isDark ? '#93c5fd' : '#2563eb' }} />
                <p className="text-xs" style={{ color: isDark ? 'rgba(147, 197, 253, 0.8)' : '#1d4ed8' }}>
                  Write your connection note, then hit "Connect &amp; Log" — it copies the note to your clipboard, 
                  opens their profile, and logs the outreach. Next time you open this lead, the full message composer will be available.
                </p>
              </div>
            </div>

            {/* Footer — Connect Stage */}
            <div 
              className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 safe-area-bottom"
              style={{ 
                borderTop: `1px solid ${theme.borderLight}`,
                backgroundColor: theme.bg,
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors text-center"
                  style={{ 
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textMuted,
                  }}
                >
                  Cancel
                </button>

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors"
                    style={{ 
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      color: theme.textMuted,
                    }}
                  >
                    <Linkedin className="h-4 w-4 shrink-0" />
                    <span>Open Profile</span>
                  </a>
                )}

                <button
                  onClick={handleConnectAndLog}
                  disabled={loggedSuccess}
                  className="flex-[1.3] sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                >
                  {loggedSuccess ? (
                    <><Check className="h-4 w-4 shrink-0" /><span>Connected!</span></>
                  ) : (
                    <><UserPlus className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">Connect &amp; Log</span></>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STAGE 2: FULL COMPOSER (email, sms, linkedin post-connect) */}
        {/* ════════════════════════════════════════════════════════════ */}
        {!isConnectStage && (
          <>
            {/* Content - scrollable */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Sequence Info Banner */}
              <div 
                className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: accent.bg, border: `1px solid ${accent.border}` }}
              >
                <Hash className="h-4 w-4" style={{ color: accent.color }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: accent.color }}>
                    This will be {sequenceLabel}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {type === 'linkedin' ? 'LinkedIn messages' : type === 'email' ? 'Emails' : 'SMS'} sent to this lead: {
                      type === 'email' ? outreachCounts.email : type === 'sms' ? outreachCounts.sms : outreachCounts.linkedin
                    }
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div className="relative">
                <label className="block text-sm mb-1.5" style={{ color: theme.textMuted }}>
                  Template
                </label>
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  disabled={loading}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    color: selectedTemplateData ? theme.text : theme.textMuted2,
                  }}
                >
                  <span>
                    {loading ? 'Loading templates...' : selectedTemplateData?.name || 'Select a template...'}
                  </span>
                  <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted2 }} />
                </button>
                
                {showTemplateDropdown && templates.length > 0 && (
                  <div 
                    className="absolute z-10 mt-2 w-full rounded-xl shadow-xl max-h-64 overflow-y-auto"
                    style={{ 
                      backgroundColor: theme.dropdownBg,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className="w-full px-4 py-3 text-left transition-colors"
                        style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm" style={{ color: theme.text }}>{template.name}</p>
                            {template.description && (
                              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{template.description}</p>
                            )}
                          </div>
                          {template.sequence_order != null && (
                            <span 
                              className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2"
                              style={{ 
                                backgroundColor: template.sequence_order === currentNumber 
                                  ? accent.bg : theme.cardBg,
                                color: template.sequence_order === currentNumber 
                                  ? accent.color : theme.textMuted2,
                                border: template.sequence_order === currentNumber 
                                  ? `1px solid ${accent.border}` : `1px solid ${theme.border}`,
                              }}
                            >
                              Step {template.sequence_order}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loading && templates.length === 0 && type === 'linkedin' && (
                  <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
                    No LinkedIn templates yet. Create one in Outreach → New Template → LinkedIn.
                  </p>
                )}
              </div>

              {/* Composing indicator */}
              {composing && (
                <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: primaryColor }} />
                  Preparing message...
                </div>
              )}

              {/* Subject (email only) */}
              {type === 'email' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm" style={{ color: theme.textMuted }}>Subject</label>
                    {subject && (
                      <button
                        onClick={handleCopySubject}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                        style={{ 
                          color: copied === 'subject' ? primaryColor : theme.textMuted2,
                          backgroundColor: copied === 'subject' ? hexToRgba(primaryColor, 0.1) : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (copied !== 'subject') e.currentTarget.style.backgroundColor = theme.hoverBg; }}
                        onMouseLeave={(e) => { if (copied !== 'subject') e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {copied === 'subject' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === 'subject' ? 'Copied!' : 'Copy Subject'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="w-full rounded-xl px-4 py-3 text-sm sm:text-base transition-colors focus:outline-none"
                    style={{ 
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.2)}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}

              {/* Body */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm" style={{ color: theme.textMuted }}>
                    {type === 'email' ? 'Email Body' : type === 'linkedin' ? 'LinkedIn Message' : 'Message'}
                  </label>
                  {body && (
                    <button
                      onClick={handleCopyBody}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ 
                        color: copied === 'body' ? primaryColor : theme.textMuted2,
                        backgroundColor: copied === 'body' ? hexToRgba(primaryColor, 0.1) : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (copied !== 'body') e.currentTarget.style.backgroundColor = theme.hoverBg; }}
                      onMouseLeave={(e) => { if (copied !== 'body') e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {copied === 'body' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === 'body' ? 'Copied!' : 'Copy Message'}
                    </button>
                  )}
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    type === 'email' ? 'Write your email...' 
                    : type === 'linkedin' ? 'Write your LinkedIn message...'
                    : 'Write your message...'
                  }
                  rows={type === 'email' ? 18 : type === 'linkedin' ? 8 : 5}
                  className="w-full rounded-xl px-4 sm:px-5 py-3 sm:py-4 transition-colors focus:outline-none"
                  style={{ 
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontSize: type === 'email' ? '15px' : '14px',
                    lineHeight: type === 'email' ? '1.75' : '1.5',
                    minHeight: type === 'email' ? '380px' : type === 'linkedin' ? '180px' : '120px',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.2)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {type === 'linkedin' && (
                  <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: theme.textMuted2 }}>
                    {body.length} characters · LinkedIn messages allow up to ~8,000
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div 
                className="flex items-start gap-3 rounded-lg p-3"
                style={{ 
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: isDark ? '#93c5fd' : '#2563eb' }} />
                <p className="text-xs" style={{ color: isDark ? 'rgba(147, 197, 253, 0.8)' : '#1d4ed8' }}>
                  {type === 'linkedin' ? (
                    <>Copy the message, then open their LinkedIn profile to paste it as a direct message. Use "Copy, Open &amp; Log" to do it all in one click.</>
                  ) : (
                    <>Copy the subject and body into your email client. Use the copy buttons above each field, or "Copy All &amp; Log" below to copy everything at once and record it as sent.</>
                  )}
                </p>
              </div>
            </div>

            {/* Footer — Stage 2 */}
            <div 
              className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 safe-area-bottom"
              style={{ 
                borderTop: `1px solid ${theme.borderLight}`,
                backgroundColor: theme.bg,
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors text-center"
                  style={{ 
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textMuted,
                  }}
                >
                  Cancel
                </button>

                {type === 'linkedin' ? (
                  <>
                    {/* LinkedIn Stage 2: Copy, Open & Log */}
                    <button
                      onClick={handleCopyOpenAndLog}
                      disabled={!body || loggedSuccess}
                      className="flex-[1.3] sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                    >
                      {loggedSuccess ? (
                        <><Check className="h-4 w-4 shrink-0" /><span>Logged!</span></>
                      ) : (
                        <><Copy className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">Copy, Open &amp; Log</span></>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCopyAll}
                      disabled={!body}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.border}`,
                        color: theme.textMuted,
                      }}
                    >
                      {copied === 'all' ? (
                        <><Check className="h-4 w-4 shrink-0" style={{ color: primaryColor }} /><span>Copied!</span></>
                      ) : (
                        <><Clipboard className="h-4 w-4 shrink-0" /><span>Copy All</span></>
                      )}
                    </button>
                    
                    <button
                      onClick={handleCopyAndLog}
                      disabled={!body || loggedSuccess}
                      className="flex-[1.3] sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: primaryColor,
                        color: primaryLight ? '#050505' : '#ffffff',
                      }}
                    >
                      {loggedSuccess ? (
                        <><Check className="h-4 w-4 shrink-0" /><span>Logged!</span></>
                      ) : (
                        <><Copy className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">Copy All &amp; Log</span></>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}