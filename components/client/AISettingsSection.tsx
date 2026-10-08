'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Bot, AlertTriangle, Calendar } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

interface AISettingsProps {
  clientId: string;
  theme: any;
  compact?: boolean;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', desc: 'Clear and to-the-point. The standard for most businesses.' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable. Callers feel welcome immediately.' },
  { value: 'casual', label: 'Casual', desc: 'Natural and easygoing. Like talking to someone who works there.' },
  { value: 'clinical', label: 'Clinical', desc: 'Precise and measured. Best for medical, legal, and financial.' },
];

const BOOKING_OPTIONS = [
  { value: 'auto_book', label: 'Auto-book', desc: 'Books appointments directly to your calendar in real time' },
  { value: 'collect_request', label: 'Collect request', desc: "Collects the caller's preferred time, your team confirms" },
  { value: 'disabled', label: 'Disabled', desc: 'No scheduling. AI focuses on messages and answering questions.' },
];

// Minimum notice before the AI will offer a slot. null = inherit agency default.
const NOTICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Use agency default' },
  { value: 0, label: 'No minimum (same-day OK)' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 1440, label: '24 hours' },
  { value: 2880, label: '48 hours' },
];

// How far ahead the AI will take bookings. null = inherit agency default.
const HORIZON_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Use agency default' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
];

function formatNoticeLabel(mins: number | null | undefined): string {
  const m = mins == null ? 30 : mins;
  if (m <= 0) return 'no minimum';
  if (m < 60) return `${m} minutes`;
  if (m < 1440) { const h = m / 60; return `${h} hour${h !== 1 ? 's' : ''}`; }
  const d = m / 1440; return `${d} day${d !== 1 ? 's' : ''}`;
}

function formatHorizonLabel(days: number | null | undefined): string {
  const d = days == null ? 60 : days;
  if (d % 365 === 0) { const y = d / 365; return `${y} year${y !== 1 ? 's' : ''}`; }
  if (d % 30 === 0) { const mo = d / 30; return `${mo} month${mo !== 1 ? 's' : ''}`; }
  if (d % 7 === 0) { const w = d / 7; return `${w} week${w !== 1 ? 's' : ''}`; }
  return `${d} days`;
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

export default function AISettingsSection({ clientId, theme, compact = false }: AISettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [aiTone, setAiTone] = useState('professional');
  const [bookingMode, setBookingMode] = useState('auto_book');

  const [minNotice, setMinNotice] = useState<number | null>(null);
  const [maxDays, setMaxDays] = useState<number | null>(null);

  const [origTone, setOrigTone] = useState('professional');
  const [origBooking, setOrigBooking] = useState('auto_book');
  const [origMinNotice, setOrigMinNotice] = useState<number | null>(null);
  const [origMaxDays, setOrigMaxDays] = useState<number | null>(null);

  // Agency defaults, shown in the "Use agency default (X)" option so the client
  // knows what inheriting means. Null falls back to the platform default.
  const [agencyNotice, setAgencyNotice] = useState<number | null>(null);
  const [agencyMaxDays, setAgencyMaxDays] = useState<number | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`${backendUrl}/api/client/${clientId}/ai-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const d = await r.json();
          const s = d.settings;
          setAiTone(s.ai_tone || 'professional');
          setBookingMode(s.booking_mode || 'auto_book');
          setOrigTone(s.ai_tone || 'professional');
          setOrigBooking(s.booking_mode || 'auto_book');
          const mn = s.min_booking_notice_minutes ?? null;
          const md = s.max_booking_days_ahead ?? null;
          setMinNotice(mn); setOrigMinNotice(mn);
          setMaxDays(md); setOrigMaxDays(md);
          setAgencyNotice(s.agency_default_min_booking_notice_minutes ?? null);
          setAgencyMaxDays(s.agency_default_max_booking_days_ahead ?? null);
        }
      } catch (err) {
        console.error('Failed to fetch AI settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [clientId, backendUrl]);

  const hasChanges =
    aiTone !== origTone ||
    bookingMode !== origBooking ||
    minNotice !== origMinNotice ||
    maxDays !== origMaxDays;

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${backendUrl}/api/client/${clientId}/ai-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ai_tone: aiTone,
          booking_mode: bookingMode,
          min_booking_notice_minutes: minNotice,
          max_booking_days_ahead: maxDays,
        }),
      });
      if (r.ok) {
        setOrigTone(aiTone);
        setOrigBooking(bookingMode);
        setOrigMinNotice(minNotice);
        setOrigMaxDays(maxDays);
        setMessage('Settings saved! Changes take effect on the next call.');
        setTimeout(() => setMessage(''), 4000);
      } else {
        const d = await r.json();
        setMessage(d.error || 'Failed to save');
      }
    } catch {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const getMessageStyle = (msg: string) => {
    const isSuccess = msg.includes('saved') || msg.includes('success');
    return isSuccess
      ? { backgroundColor: theme.successBg || hexToRgba('#22c55e', 0.1), color: theme.successText || '#22c55e', border: `1px solid ${theme.successBorder || hexToRgba('#22c55e', 0.2)}` }
      : { backgroundColor: theme.errorBg || hexToRgba('#ef4444', 0.1), color: theme.errorText || '#ef4444', border: `1px solid ${theme.errorBorder || hexToRgba('#ef4444', 0.2)}` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted || theme.textMuted4 }} />
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: theme.input || (theme.isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb'),
    border: `1px solid ${theme.inputBorder || theme.border}`,
    color: theme.text,
  };

  // Themed dropdown styling for CustomSelect (matches the rest of the app).
  const dropdownUi = {
    inputStyle,
    text: theme.text,
    muted: theme.textMuted || theme.textMuted4,
    panelBg: theme.isDark ? '#232321' : '#ffffff',
    panelBorder: theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    hover: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    accent: theme.primary,
    isDark: !!theme.isDark,
  };

  const noticeSelectOptions = NOTICE_OPTIONS.map(o => ({
    value: o.value === null ? '' : String(o.value),
    label: o.value === null ? `Use agency default (${formatNoticeLabel(agencyNotice)})` : o.label,
  }));
  const horizonSelectOptions = HORIZON_OPTIONS.map(o => ({
    value: o.value === null ? '' : String(o.value),
    label: o.value === null ? `Use agency default (${formatHorizonLabel(agencyMaxDays)})` : o.label,
  }));

  return (
    <section className={compact ? '' : 'mb-4 sm:mb-6'}>
      {!compact && (
        <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
          <Bot className="w-4 h-4" style={{ color: theme.primary }} />
          AI Personality & Behavior
        </h2>
      )}
      <div className={compact ? 'space-y-4' : 'rounded-xl border p-3 sm:p-4 shadow-sm space-y-4'} style={compact ? {} : { borderColor: theme.border, backgroundColor: theme.card }}>
        {message && (
          <div className="p-2.5 rounded-lg text-xs sm:text-sm font-medium" style={getMessageStyle(message)}>
            {message}
          </div>
        )}

        {/* Tone */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
            AI Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map(t => {
              const selected = aiTone === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setAiTone(t.value)}
                  className="text-left p-2.5 sm:p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.04) : theme.card || 'transparent',
                  }}
                >
                  <span className="font-semibold text-xs" style={{ color: selected ? theme.primary : theme.text }}>
                    {t.label}
                  </span>
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Booking Mode */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
            <Calendar className="w-3 h-3 inline mr-1" style={{ color: theme.primary }} />
            Appointment Booking
          </label>
          <div className="space-y-2">
            {BOOKING_OPTIONS.map(b => {
              const selected = bookingMode === b.value;
              return (
                <button
                  key={b.value}
                  onClick={() => setBookingMode(b.value)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.04) : theme.card || 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: selected ? theme.primary : theme.border }}
                    >
                      {selected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />}
                    </div>
                    <div>
                      <span className="font-semibold text-xs" style={{ color: selected ? theme.primary : theme.text }}>
                        {b.label}
                      </span>
                      <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Booking window, only relevant when the AI actually books */}
        {bookingMode === 'auto_book' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
                Minimum booking notice
              </label>
              <CustomSelect
                size="sm"
                value={minNotice === null ? '' : String(minNotice)}
                onChange={(v) => setMinNotice(v === '' ? null : Number(v))}
                options={noticeSelectOptions}
                ui={dropdownUi}
              />
              <p className="text-[10px] mt-1" style={{ color: theme.textMuted || theme.textMuted4 }}>
                How soon from now the AI can book. It never blocks a day, it just moves the earliest offered time forward.
              </p>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
                How far ahead
              </label>
              <CustomSelect
                size="sm"
                value={maxDays === null ? '' : String(maxDays)}
                onChange={(v) => setMaxDays(v === '' ? null : Number(v))}
                options={horizonSelectOptions}
                ui={dropdownUi}
              />
              <p className="text-[10px] mt-1" style={{ color: theme.textMuted || theme.textMuted4 }}>
                The furthest out a caller can book an appointment.
              </p>
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: hasChanges ? theme.primary : (theme.bg || theme.hover),
            color: hasChanges ? theme.primaryText : (theme.textMuted || theme.textMuted4),
            border: hasChanges ? 'none' : `1px solid ${theme.border}`,
          }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : hasChanges ? (
            'Save AI Settings'
          ) : (
            'No Changes'
          )}
        </button>
      </div>
    </section>
  );
}