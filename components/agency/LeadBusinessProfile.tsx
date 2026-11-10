'use client';

// ============================================================================
// LeadBusinessProfile - live Google business-profile context on the lead detail
// page. Pulls a few photos plus outreach-useful signals (rating, hours, website,
// status, and reviews that hint at missed-call pain). Nothing is stored: the
// context is fetched on load, and photos are streamed through an authed proxy
// and shown as ephemeral blob URLs that are revoked on unmount.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Star, Globe, Clock, PhoneOff, Loader2, ExternalLink, ChevronDown, ImageOff, MapPin } from 'lucide-react';

interface Review { author: string; rating: number | null; relative: string; text: string; }
interface PlaceContext {
  available: boolean;
  reason?: string;
  name?: string | null;
  address?: string | null;
  website?: string | null;
  mapsUrl?: string | null;
  businessStatus?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceLevel?: number | null;
  types?: string[];
  openNow?: boolean | null;
  hours?: string[];
  photos?: { ref: string; width: number | null; height: number | null }[];
  missedCallSignals?: Review[];
  topReviews?: Review[];
}

const prettyType = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Authed image: fetches through the proxy with the bearer token, shows the bytes
// as a blob URL, and revokes it on unmount so nothing lingers.
function AuthImage({ src, token, theme }: { src: string; token: string; theme: any }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false; let obj: string | null = null;
    (async () => {
      try {
        const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (!cancelled) setFailed(true); return; }
        const blob = await res.blob();
        if (cancelled) return;
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      } catch { if (!cancelled) setFailed(true); }
    })();
    return () => { cancelled = true; if (obj) URL.revokeObjectURL(obj); };
  }, [src, token]);

  const box: React.CSSProperties = { height: 96, width: 128, flexShrink: 0, borderRadius: 10, border: `1px solid ${theme.border}`, objectFit: 'cover', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6' };
  if (failed) return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff className="h-4 w-4" style={{ color: theme.textMuted, opacity: 0.5 }} /></div>;
  if (!url) return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.textMuted, opacity: 0.6 }} /></div>;
  return <img src={url} alt="Business photo" style={box} loading="lazy" />;
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} style={{ position: 'relative', width: 14, height: 14, display: 'inline-block' }}>
            <Star style={{ position: 'absolute', height: 14, width: 14, color, opacity: 0.25 }} />
            <span style={{ position: 'absolute', overflow: 'hidden', width: `${fill * 100}%`, height: 14 }}>
              <Star style={{ height: 14, width: 14, color, fill: color }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function LeadBusinessProfile({ agencyId, leadId, theme }: { agencyId: string; leadId: string; theme: any }) {
  const [ctx, setCtx] = useState<PlaceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [showAllHours, setShowAllHours] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = (typeof window !== 'undefined' && localStorage.getItem('auth_token')) || '';
    setToken(t);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/leads/${leadId}/place-context`, { headers: { Authorization: `Bearer ${t}` } });
        const data = await res.json();
        if (!cancelled) setCtx(data);
      } catch { if (!cancelled) setCtx({ available: false, reason: 'error' }); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [agencyId, leadId]);

  const card: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}` };
  const muted = theme.cardTextMuted || theme.textMuted;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Loading / unavailable: keep it quiet so the page doesn't look broken when a
  // lead has no Google match (manual imports, etc.).
  if (loading) {
    return (
      <div className="rounded-xl p-4 sm:p-6" style={card}>
        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.iconColor || theme.primary }} /><span className="text-sm" style={{ color: muted }}>Loading business profile...</span></div>
      </div>
    );
  }
  if (!ctx || !ctx.available) return null;

  const closed = ctx.businessStatus && ctx.businessStatus !== 'OPERATIONAL';
  const todayIdx = (new Date().getDay() + 6) % 7; // weekday_text starts Monday
  const todayHours = ctx.hours && ctx.hours[todayIdx] ? ctx.hours[todayIdx] : null;

  return (
    <div className="rounded-xl p-4 sm:p-6" style={card}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2" style={{ color: theme.text }}>
          <MapPin className="h-4 w-4" style={{ color: theme.iconColor || theme.primary }} /> Business Profile
        </h2>
        {ctx.mapsUrl && (
          <a href={ctx.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: theme.primary }}>
            <ExternalLink className="h-3.5 w-3.5" /> Google
          </a>
        )}
      </div>

      {/* Rating + status row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        {typeof ctx.rating === 'number' && (
          <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.text }}>
            <Stars rating={ctx.rating} color="#f5b50a" />
            <span className="font-semibold">{ctx.rating.toFixed(1)}</span>
            {typeof ctx.reviewCount === 'number' && <span style={{ color: muted }}>({ctx.reviewCount.toLocaleString()})</span>}
          </span>
        )}
        {ctx.openNow !== null && ctx.openNow !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: ctx.openNow ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', color: ctx.openNow ? (theme.isDark ? '#4ade80' : '#16a34a') : (theme.isDark ? '#f87171' : '#dc2626') }}>
            <Clock className="h-3 w-3" /> {ctx.openNow ? 'Open now' : 'Closed now'}
          </span>
        )}
        {closed && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: theme.isDark ? '#f87171' : '#dc2626' }}>
            {prettyType(ctx.businessStatus || '')}
          </span>
        )}
        {typeof ctx.priceLevel === 'number' && ctx.priceLevel > 0 && (
          <span className="text-sm" style={{ color: muted }}>{'$'.repeat(ctx.priceLevel)}</span>
        )}
      </div>

      {/* Photos */}
      {ctx.photos && ctx.photos.length > 0 && token && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'thin' }}>
          {ctx.photos.map((p, i) => (
            <AuthImage key={i} src={`${backendUrl}/api/agency/${agencyId}/leads/${leadId}/photo?ref=${encodeURIComponent(p.ref)}&max=400`} token={token} theme={theme} />
          ))}
        </div>
      )}

      {/* Facts */}
      <div className="flex flex-col gap-2 mb-4 text-sm">
        {ctx.website && (
          <a href={ctx.website.startsWith('http') ? ctx.website : `https://${ctx.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2" style={{ color: theme.primary }}>
            <Globe className="h-3.5 w-3.5 flex-shrink-0" /> <span className="truncate">{ctx.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
        {todayHours && (
          <button type="button" onClick={() => setShowAllHours((v) => !v)} className="inline-flex items-center gap-2 text-left" style={{ color: muted }}>
            <Clock className="h-3.5 w-3.5 flex-shrink-0" /> <span>{todayHours}</span>
            {ctx.hours && ctx.hours.length > 1 && <ChevronDown className="h-3.5 w-3.5" style={{ transform: showAllHours ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
          </button>
        )}
        {showAllHours && ctx.hours && (
          <div className="pl-5 flex flex-col gap-0.5" style={{ color: muted }}>
            {ctx.hours.map((h, i) => <span key={i} className="text-xs" style={{ fontWeight: i === todayIdx ? 600 : 400, color: i === todayIdx ? theme.text : muted }}>{h}</span>)}
          </div>
        )}
        {ctx.types && ctx.types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {ctx.types.map((t, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.hover || (theme.isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), color: muted }}>{prettyType(t)}</span>)}
          </div>
        )}
      </div>

      {/* Outreach signals: missed-call review evidence */}
      {ctx.missedCallSignals && ctx.missedCallSignals.length > 0 && (
        <div className="rounded-xl p-3 sm:p-4 mb-3" style={{ backgroundColor: theme.isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.07)', border: `1px solid ${theme.isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.3)'}` }}>
          <div className="flex items-center gap-2 mb-2">
            <PhoneOff className="h-4 w-4" style={{ color: theme.isDark ? '#fbbf24' : '#d97706' }} />
            <span className="text-xs sm:text-sm font-semibold" style={{ color: theme.isDark ? '#fbbf24' : '#b45309' }}>Missed-call signals in their reviews</span>
          </div>
          <p className="text-[11px] mb-2.5" style={{ color: muted }}>Real pain you can name in your outreach.</p>
          <div className="flex flex-col gap-2.5">
            {ctx.missedCallSignals.map((r, i) => (
              <div key={i} className="text-xs" style={{ color: theme.text }}>
                <span style={{ opacity: 0.9 }}>&ldquo;{r.text}&rdquo;</span>
                <span className="block mt-0.5" style={{ color: muted }}>{r.author}{r.relative ? ` - ${r.relative}` : ''}{typeof r.rating === 'number' ? ` - ${r.rating}/5` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      {ctx.topReviews && ctx.topReviews.length > 0 && (
        <div>
          <span className="text-xs font-semibold" style={{ color: muted }}>Recent reviews</span>
          <div className="flex flex-col gap-2.5 mt-2">
            {ctx.topReviews.map((r, i) => (
              <div key={i} className="text-xs" style={{ color: theme.text }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {typeof r.rating === 'number' && <Stars rating={r.rating} color="#f5b50a" />}
                  <span style={{ color: muted }}>{r.author}{r.relative ? ` - ${r.relative}` : ''}</span>
                </div>
                <span style={{ opacity: 0.85 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
