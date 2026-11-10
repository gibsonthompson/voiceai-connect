'use client';

// ============================================================================
// MessageEditor - one automated message, edited cleanly
// VoiceAI Connect
// ----------------------------------------------------------------------------
// Controlled editor for a single agency message. Collapsed, it shows a readable
// SMS-style preview rendered with the agency's REAL brand name and realistic
// sample values (no raw {tokens}, no placeholder brand). Expanded, it shows the
// editable text, friendly insert-at-cursor detail chips, a live preview, and a
// reset-to-default. The parent owns the value and the save; this is presentational.
// ============================================================================

import { useRef, useState } from 'react';
import { Pencil, RotateCcw, Check } from 'lucide-react';

export interface MsgVar { name: string; desc: string; }
export interface MsgDef { label: string; audience: string; description: string; variables: MsgVar[]; template: string; }

// Message label -> Title Case headline (handles hyphens: "post-demo follow-up"
// -> "Post-Demo Follow-Up").
export function titleCaseLabel(s: string): string {
  return String(s || '').split(' ').map((word) =>
    word.split('-').map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join('-')
  ).join(' ');
}

// Variable name -> friendly, human label for the insert chip.
const VAR_LABELS: Record<string, string> = {
  agency_name: 'Your agency name', brand: 'Your brand name',
  business_name: 'Business name', who: 'Owner name',
  customer_name: 'Caller name', customer_phone: 'Caller phone', caller: 'Caller number',
  summary: 'Call summary', urgency_line: 'Urgency line',
  ai_number: 'AI phone number', login_url: 'Login link', upgrade_url: 'Upgrade link',
  signup_url: 'Signup link', trial_cta: 'Trial offer line', spam_reason: 'Spam reason',
  status_headline: 'Status headline', status_line: 'Status line', phone_line: 'AI number line',
};
function friendlyVar(name: string): string {
  if (VAR_LABELS[name]) return VAR_LABELS[name];
  return name.replace(/_/g, ' ').replace(/\b(ai|url|cta|sms)\b/gi, (m) => m.toUpperCase()).replace(/^./, (c) => c.toUpperCase());
}

// Realistic preview values. Brand/agency_name use the agency's real name so the
// preview reads like the agency's own message, not a generic template.
export function previewSample(agencyName: string): Record<string, string> {
  const brand = agencyName || 'Your Agency';
  return {
    agency_name: brand, brand,
    business_name: 'Oak Street Dental', who: 'Jordan',
    customer_name: 'Sarah Lee', customer_phone: '(555) 123-4567', caller: '(555) 000-1111',
    summary: 'Wants a quote for a cleaning and asked about Saturday hours.',
    ai_number: '(555) 987-6543',
    login_url: 'your-site.com/client/login', upgrade_url: 'your-site.com/client/upgrade',
    signup_url: 'your-site.com/signup', trial_cta: 'Start your 7-day free trial, no credit card needed:',
    spam_reason: 'Robocall / telemarketer',
    for_business: ' for Oak Street Dental', ready_suffix: ' for Oak Street Dental',
    recap_block: "Here's what we showed you:\n✅ booking jobs 24/7\n✅ Instant text summaries after every call\n✅ 24/7 coverage, never miss a call\n\n",
    urgency_line: '',
    status_headline: `${brand} Free Trial Started!`,
    status_line: 'Hi Jordan, your Pro plan free trial is active through June 1, 2026.',
    phone_line: '\n\nYour AI receptionist is answering calls 24/7 at:\n📞 (555) 987-6543',
  };
}
function render(tpl: string, sample: Record<string, string>): string {
  return String(tpl || '').replace(/\{([a-z0-9_]+)\}/gi, (m, n) => (n in sample ? sample[n] : m));
}

interface Props {
  def: MsgDef;
  value: string;
  onChange: (v: string) => void;
  theme: any;
  agencyName: string;
  startExpanded?: boolean;
}

export default function MessageEditor({ def, value, onChange, theme, agencyName, startExpanded }: Props) {
  const [expanded, setExpanded] = useState(!!startExpanded);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const sample = previewSample(agencyName);
  const isCustom = (value || '').trim() !== '' && (value || '').trim() !== (def.template || '').trim();
  const preview = render(value || '', sample);

  const insert = (name: string) => {
    const ta = taRef.current;
    const token = `{${name}}`;
    if (!ta) { onChange((value || '') + token); return; }
    const start = ta.selectionStart ?? (value || '').length;
    const end = ta.selectionEnd ?? start;
    const next = (value || '').slice(0, start) + token + (value || '').slice(end);
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); const pos = start + token.length; try { ta.setSelectionRange(pos, pos); } catch {} });
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>{titleCaseLabel(def.label)}</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.cardTextMuted }}>{def.description}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={isCustom ? { backgroundColor: theme.primary15, color: theme.primary } : { backgroundColor: theme.hover, color: theme.cardTextMuted }}>{isCustom ? 'Custom' : 'Default'}</span>
        </div>

        {/* Readable preview, styled like a text message */}
        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: theme.hover }}>
          <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: theme.text }}>{preview || <span style={{ color: theme.cardTextMuted }}>Empty</span>}</p>
        </div>

        {!expanded ? (
          <button type="button" onClick={() => setExpanded(true)} className="mt-auto self-start inline-flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: theme.primary }}>
            <Pencil className="h-3.5 w-3.5" />Edit text
          </button>
        ) : (
          <>
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={Math.min(14, Math.max(4, (value || '').split('\n').length + 1))}
              spellCheck={false}
              className="w-full rounded-lg px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            />
            <p className="text-[11px] mt-2 mb-1" style={{ color: theme.cardTextMuted }}>Tap a detail to drop it in. It&apos;s filled in automatically when the text sends.</p>
            <div className="flex flex-wrap gap-1.5">
              {def.variables.map((v) => (
                <button key={v.name} type="button" title={v.desc} onClick={() => insert(v.name)} className="text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors" style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}>
                  + {friendlyVar(v.name)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <button type="button" onClick={() => setExpanded(false)} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.primary }}><Check className="h-3.5 w-3.5" />Done</button>
              {isCustom && (
                <button type="button" onClick={() => onChange(def.template)} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.cardTextMuted }}><RotateCcw className="h-3.5 w-3.5" />Reset to default</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
