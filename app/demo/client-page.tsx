'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, Video, Calendar, Loader2, Check, User, Mail, Phone, Building2, MessageSquare, ChevronLeft } from 'lucide-react';
import MarketingFooter from '@/components/marketing-footer';

interface TimeSlot {
  start: string;
  end: string;
  display: string;
}

interface BookingResult {
  date: string;
  time: string;
  meetLink: string | null;
}

// ============================================================================
// DATE HELPERS
// ============================================================================
function getNextBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) {
      days.push(new Date(cursor));
    }
  }
  return days;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(d: Date): { weekday: string; month: string; day: number } {
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
  };
}

// ============================================================================
// BOOKING WIDGET
// ============================================================================
function BookingWidget() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const businessDays = getNextBusinessDays(14);

  const [step, setStep] = useState<'date' | 'form' | 'confirmed'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateKey = formatDateKey(selectedDate);

    setSlotsLoading(true);
    setSlotsError('');
    setSlots([]);
    setSelectedSlot(null);

    fetch(`${backendUrl}/api/booking/availability?date=${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setSlotsError(data.error); return; }
        setSlots(data.slots || []);
      })
      .catch(() => setSlotsError('Failed to load availability'))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBack = () => {
    if (step === 'form') { setStep('date'); setSelectedSlot(null); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${backendUrl}/api/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          message: form.message.trim() || undefined,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create booking');

      setBooking(data.booking);
      setStep('confirmed');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Date & time selection ──
  if (step === 'date') {
    const dateLabel = selectedDate ? formatDayLabel(selectedDate) : null;

    return (
      <div className="w-full">
        {/* Date picker */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/40 mb-4">Select a date</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {businessDays.map((d) => {
              const label = formatDayLabel(d);
              const key = formatDateKey(d);
              const isSelected = selectedDate && formatDateKey(selectedDate) === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(d)}
                  className="flex flex-col items-center min-w-[60px] px-3 py-3 rounded-xl border transition-all flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                    borderColor: isSelected ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: isSelected ? '#10b981' : 'rgba(255,255,255,0.4)' }}>{label.weekday}</span>
                  <span className="text-lg font-semibold mt-0.5" style={{ color: isSelected ? '#fafaf9' : 'rgba(255,255,255,0.7)' }}>{label.day}</span>
                  <span className="text-[10px]" style={{ color: isSelected ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{label.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/40 mb-4">
              {dateLabel?.weekday}, {dateLabel?.month} {dateLabel?.day} — Available times (ET)
            </p>

            {slotsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                <span className="ml-2 text-sm text-white/40">Checking availability...</span>
              </div>
            )}

            {slotsError && (
              <div className="rounded-xl p-4 text-sm text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {slotsError}
              </div>
            )}

            {!slotsLoading && !slotsError && slots.length === 0 && (
              <div className="py-12 text-center">
                <Calendar className="h-8 w-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No available times on this date.</p>
                <p className="text-xs text-white/25 mt-1">Try another day.</p>
              </div>
            )}

            {!slotsLoading && slots.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => handleSelectSlot(slot)}
                    className="rounded-xl border px-3 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#fafaf9',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/40">Select a date to see available times.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Booking form ──
  if (step === 'form') {
    const dateLabel = selectedDate ? formatDayLabel(selectedDate) : null;

    return (
      <div className="w-full">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />Back to times
        </button>

        {/* Selected time summary */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{dateLabel?.weekday}, {dateLabel?.month} {dateLabel?.day} at {selectedSlot?.display}</p>
            <p className="text-xs text-white/40">30 minutes · Google Meet · Eastern Time</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your agency"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Anything specific you want to discuss?</label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-white/25" />
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Pricing, integrations, white-labeling, etc."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none" />
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl p-3 text-sm text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {submitError}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.email.trim()}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#4aeabc', color: '#050505' }}>
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Booking...</>) : (<>Confirm Booking<ArrowRight className="h-4 w-4" /></>)}
        </button>
      </div>
    );
  }

  // ── Confirmation ──
  if (step === 'confirmed' && booking) {
    return (
      <div className="w-full text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">You&apos;re booked!</h3>
        <p className="text-white/50 mb-6">A calendar invite has been sent to your email.</p>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-left max-w-sm mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-white">{booking.date} at {booking.time} ET</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-white/40 flex-shrink-0" />
            <span className="text-sm text-white/60">30 minutes</span>
          </div>
          {booking.meetLink && (
            <div className="flex items-center gap-3">
              <Video className="h-4 w-4 text-white/40 flex-shrink-0" />
              <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-2 truncate">
                Join Google Meet
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {booking.meetLink && (
            <a href={booking.meetLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:brightness-110"
              style={{ background: '#4aeabc', color: '#050505' }}>
              <Video className="h-4 w-4" />Open Meet Link
            </a>
          )}
          <div>
            <Link href="/" className="text-sm text-white/40 hover:text-white/60 transition-colors">← Back to homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// PAGE
// ============================================================================
export default function DemoPage() {
  return (
    <main className="min-h-screen bg-ink">
      <nav className="relative z-10 border-b border-white/[0.05] bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/icon-512x512.png" alt="VoiceAI Connect" className="w-8 h-8 rounded-md" />
            <span className="font-display font-medium text-[15px] text-white tracking-tight">VoiceAI Connect</span>
          </Link>
          <Link href="/interactive-demo" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-white/55 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">Back to interactive demo</span><span className="sm:hidden">Back</span>
          </Link>
        </div>
      </nav>

      <section className="canvas-dot relative pt-16 lg:pt-24 pb-10 lg:pb-14 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="t-eyebrow text-em mb-6">Schedule a call</p>
            <h1 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(2rem, 4.2vw, 3.5rem)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Have questions? Let&apos;s talk.
            </h1>
            <p className="t-body mt-6 max-w-xl mx-auto">
              Bring your questions about pricing, white-labeling, integrations, or the agency model. We&apos;ll bring honest answers — and walk through the platform live if it&apos;s useful.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.22)' }}>
                <Clock className="w-3.5 h-3.5 text-em" /><span className="font-mono text-[11px] tracking-[0.06em] text-em">30 Minutes</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Video className="w-3.5 h-3.5 text-white/70" /><span className="font-mono text-[11px] tracking-[0.06em] text-white/70">Google Meet</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink pb-16 lg:pb-24">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-white/[0.08] p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            style={{ background: 'linear-gradient(180deg, rgba(20,20,20,0.5), rgba(8,8,8,0.7))' }}>
            <BookingWidget />
          </div>
          <p className="mt-8 text-center font-mono text-[11.5px] text-white/35">
            Can&apos;t find a time?{' '}
            <a href="mailto:support@myvoiceaiconnect.com" className="text-em underline-offset-4 hover:underline">Email us directly</a>
            {' '}— a person reads it.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}