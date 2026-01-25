'use client';

import { useState, useEffect } from 'react';
import { 
  X, Loader2, Mail, MessageSquare, Copy, Check, 
  ChevronDown, Info, Sparkles
} from 'lucide-react';

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

export default function ComposerModal({ 
  isOpen, 
  onClose, 
  agencyId, 
  lead, 
  type,
  onSent 
}: ComposerModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSubject('');
      setBody('');
      setSelectedTemplate('');
      setCopied(false);
      setLoggedSuccess(false);
    }
  }, [isOpen, agencyId, type]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            {type === 'email' ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Mail className="h-5 w-5 text-purple-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
              </div>
            )}
            <div>
              <h2 className="font-semibold">
                Compose {type === 'email' ? 'Email' : 'SMS'}
              </h2>
              <p className="text-sm text-[#fafaf9]/50">
                To: {lead.contact_name || lead.business_name} 
                {type === 'email' && lead.email && ` (${lead.email})`}
                {type === 'sms' && lead.phone && ` (${lead.phone})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#fafaf9]/50 hover:bg-white/[0.06] hover:text-[#fafaf9] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Template Selector */}
          <div className="relative">
            <label className="block text-sm text-[#fafaf9]/50 mb-1.5">
              Template
            </label>
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              disabled={loading}
              className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left hover:border-white/[0.12] transition-colors disabled:opacity-50"
            >
              <span className={selectedTemplateData ? 'text-[#fafaf9]' : 'text-[#fafaf9]/40'}>
                {loading ? 'Loading templates...' : selectedTemplateData?.name || 'Select a template...'}
              </span>
              <ChevronDown className="h-4 w-4 text-[#fafaf9]/30" />
            </button>
            
            {showTemplateDropdown && templates.length > 0 && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0f0f0f] shadow-xl max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                  >
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-[#fafaf9]/40 mt-0.5">{template.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composing indicator */}
          {composing && (
            <div className="flex items-center gap-2 text-sm text-[#fafaf9]/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing message...
            </div>
          )}

          {/* Subject (email only) */}
          {type === 'email' && (
            <div>
              <label className="block text-sm text-[#fafaf9]/50 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm text-[#fafaf9]/50 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={type === 'email' ? 'Write your email...' : 'Write your message...'}
              rows={type === 'email' ? 10 : 4}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.08] p-3">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300/80">
              Copy this message and paste it into your email client or phone. 
              Click "Copy & Log as Sent" to record this outreach in the activity log.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            {/* Copy only */}
            <button
              onClick={handleCopy}
              disabled={!body}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Only
                </>
              )}
            </button>
            
            {/* Copy & Log */}
            <button
              onClick={handleCopyAndLog}
              disabled={!body || loggedSuccess}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {loggedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Logged
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy & Log as Sent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}