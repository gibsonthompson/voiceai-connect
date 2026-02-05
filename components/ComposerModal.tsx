'use client';

import { useState, useEffect } from 'react';
import { 
  X, Loader2, Mail, MessageSquare, Copy, Check, 
  ChevronDown, Info, Hash
} from 'lucide-react';
import { useAgency } from '@/app/agency/context';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  description?: string;
}

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  lead: Lead;
  type: 'email' | 'sms';
  onSent?: () => void;
}

// Helper to determine if a color is light
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Add alpha to hex color
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getOutreachLabel(type: 'email' | 'sms', number: number): string {
  if (number === 1) {
    return type === 'email' ? 'Initial Email' : 'Initial SMS';
  } else if (number === 2) {
    return type === 'email' ? 'Follow-up Email' : 'Follow-up SMS';
  } else {
    return type === 'email' ? `Follow-up Email #${number - 1}` : `Follow-up SMS #${number - 1}`;
  }
}

export default function ComposerModal({ 
  isOpen, 
  onClose, 
  agencyId, 
  lead, 
  type,
  onSent 
}: ComposerModalProps) {
  const { agency, branding } = useAgency();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  
  // Outreach counts for sequence tracking
  const [outreachCounts, setOutreachCounts] = useState({ email: 0, sms: 0 });

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  
  // Agency primary color
  const primaryColor = branding?.primaryColor || '#10b981';
  const primaryLight = isLightColor(primaryColor);

  // Theme-based colors
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

  // Current sequence number
  const currentNumber = type === 'email' ? outreachCounts.email + 1 : outreachCounts.sms + 1;
  const sequenceLabel = getOutreachLabel(type, currentNumber);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchOutreachCounts();
      setSubject('');
      setBody('');
      setSelectedTemplate('');
      setCopied(false);
      setLoggedSuccess(false);
    }
  }, [isOpen, agencyId, type, lead.id]);

  const fetchOutreachCounts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agencyId}/leads/${lead.id}/outreach`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setOutreachCounts({
          email: data.outreach?.email_count || 0,
          sms: data.outreach?.sms_count || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch outreach counts:', error);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agencyId}/templates?type=${type}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
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
    setComposing(true);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agencyId}/outreach/compose`,
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
      }
    } catch (error) {
      console.error('Failed to compose message:', error);
    } finally {
      setComposing(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = type === 'email' 
      ? `Subject: ${subject}\n\n${body}`
      : body;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogAsSent = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      await fetch(`${backendUrl}/api/agency/${agencyId}/outreach/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          templateId: selectedTemplate || null,
          type,
          toAddress: type === 'email' ? lead.email : lead.phone,
          toPhone: type === 'sms' ? lead.phone : null,
          subject: type === 'email' ? subject : null,
          body,
          userId: user.id,
        }),
      });

      setLoggedSuccess(true);
      onSent?.();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to log outreach:', error);
    }
  };

  const handleCopyAndLog = async () => {
    await handleCopy();
    await handleLogAsSent();
  };

  if (!isOpen) return null;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      
      {/* Modal - slides up from bottom on mobile */}
      <div 
        className="relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        style={{ 
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Drag handle - mobile only */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div 
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: theme.border }}
          />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ borderBottom: `1px solid ${theme.borderLight}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {type === 'email' ? (
              <div 
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#a855f7' }} />
              </div>
            ) : (
              <div 
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#06b6d4' }} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
                Compose {type === 'email' ? 'Email' : 'SMS'}
                <span 
                  className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                  style={{ 
                    backgroundColor: type === 'email' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                    color: type === 'email' ? '#a855f7' : '#06b6d4',
                  }}
                >
                  <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {sequenceLabel}
                </span>
              </h2>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>
                To: {lead.contact_name || lead.business_name} 
                {type === 'email' && lead.email && ` (${lead.email})`}
                {type === 'sms' && lead.phone && ` (${lead.phone})`}
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

        {/* Content - scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Sequence Info Banner */}
          <div 
            className="flex items-center gap-3 rounded-lg p-3"
            style={{ 
              backgroundColor: type === 'email' 
                ? (isDark ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.05)')
                : (isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.05)'),
              border: `1px solid ${type === 'email' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
            }}
          >
            <Hash className="h-4 w-4" style={{ color: type === 'email' ? '#a855f7' : '#06b6d4' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: type === 'email' ? '#a855f7' : '#06b6d4' }}>
                This will be {sequenceLabel}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {type === 'email' ? 'Emails' : 'SMS'} sent to this lead: {type === 'email' ? outreachCounts.email : outreachCounts.sms}
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
                    <p className="font-medium text-sm" style={{ color: theme.text }}>{template.name}</p>
                    {template.description && (
                      <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{template.description}</p>
                    )}
                  </button>
                ))}
              </div>
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
              <label className="block text-sm mb-1.5" style={{ color: theme.textMuted }}>
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full rounded-xl px-4 py-3 transition-colors focus:outline-none"
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
          <div>
            <label className="block text-sm mb-1.5" style={{ color: theme.textMuted }}>
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={type === 'email' ? 'Write your email...' : 'Write your message...'}
              rows={type === 'email' ? 10 : 4}
              className="w-full rounded-xl px-4 py-3 resize-none transition-colors focus:outline-none"
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
              Copy this message and paste it into your email client or phone. 
              Click "Copy & Log as Sent" to record this outreach in the activity log.
            </p>
          </div>
        </div>

        {/* Footer - Mobile optimized */}
        <div 
          className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 safe-area-bottom"
          style={{ 
            borderTop: `1px solid ${theme.borderLight}`,
            backgroundColor: theme.bg,
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          {/* Mobile: all 3 buttons in a single row, equal sizing */}
          <div className="flex items-center gap-2">
            {/* Cancel */}
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

            {/* Copy only */}
            <button
              onClick={handleCopy}
              disabled={!body}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                color: theme.textMuted,
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" />
                  <span>Copy Only</span>
                </>
              )}
            </button>
            
            {/* Copy & Log - Primary */}
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
                <>
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Logged</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Copy & Log</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}