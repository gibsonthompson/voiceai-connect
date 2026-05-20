'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Bot, MapPin, AlertTriangle, Calendar, Plus, X } from 'lucide-react';

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
  { value: 'collect_request', label: 'Collect request', desc: "Collects the caller's preferred time — your team confirms" },
  { value: 'disabled', label: 'Disabled', desc: 'No scheduling. AI focuses on messages and answering questions.' },
];

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
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState('');

  const [origTone, setOrigTone] = useState('professional');
  const [origBooking, setOrigBooking] = useState('auto_book');
  const [origAreas, setOrigAreas] = useState<string[]>([]);

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
          setServiceAreas(s.service_areas || []);
          setOrigTone(s.ai_tone || 'professional');
          setOrigBooking(s.booking_mode || 'auto_book');
          setOrigAreas(s.service_areas || []);
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
    JSON.stringify(serviceAreas) !== JSON.stringify(origAreas);

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
          service_areas: serviceAreas,
        }),
      });
      if (r.ok) {
        setOrigTone(aiTone);
        setOrigBooking(bookingMode);
        setOrigAreas([...serviceAreas]);
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

  const addArea = () => {
    const trimmed = newArea.trim();
    if (trimmed && !serviceAreas.includes(trimmed)) {
      setServiceAreas([...serviceAreas, trimmed]);
      setNewArea('');
    }
  };

  const removeArea = (area: string) => {
    setServiceAreas(serviceAreas.filter(a => a !== area));
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

        {/* Service Areas */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted || theme.textMuted4 }}>
            <MapPin className="w-3 h-3 inline mr-1" style={{ color: theme.primary }} />
            Service Areas
          </label>
          <p className="text-[10px] mb-2" style={{ color: theme.textMuted || theme.textMuted4 }}>
            Your AI will let callers know if their location is within your coverage area.
          </p>
          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {serviceAreas.map(area => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.primary }}
                >
                  {area}
                  <button onClick={() => removeArea(area)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
              placeholder="e.g. Atlanta, Marietta, Decatur"
              className="flex-1 rounded-lg px-3 py-2 text-xs"
              style={inputStyle}
            />
            <button
              onClick={addArea}
              disabled={!newArea.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40 transition"
              style={{ backgroundColor: hexToRgba(theme.primary, 0.1), color: theme.primary }}
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>

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