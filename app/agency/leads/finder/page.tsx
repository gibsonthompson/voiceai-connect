"use client";

/**
 * Lead Finder Page — VoiceAI Connect Agency Dashboard
 * Path: app/agency/leads/finder/page.tsx
 * 
 * Search Indeed → enrich with phone/email/website → score by AI receptionist fit
 * → export CSV or save directly to agency CRM pipeline
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Save,
  Check,
  X,
  Filter,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ── Fit Score Badge ─────────────────────────────────────────────────────────
function FitBadge({ score, theme }: { score: number; theme: any }) {
  let color: string, label: string;
  if (score >= 70) { color = "#10b981"; label = "Hot Lead"; }
  else if (score >= 50) { color = "#f59e0b"; label = "Warm"; }
  else if (score >= 30) { color = "#6b7280"; label = "Cool"; }
  else { color = "#374151"; label = "Low"; }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score} — {label}
    </span>
  );
}

// ── Industry Tag ────────────────────────────────────────────────────────────
function IndustryTag({ industry, theme }: { industry: string; theme: any }) {
  const colors: Record<string, string> = {
    Healthcare: "#06b6d4", Dental: "#8b5cf6", Veterinary: "#f97316",
    Legal: "#64748b", "Beauty & Wellness": "#ec4899", "Home Services": "#eab308",
    "Real Estate": "#22c55e", Insurance: "#3b82f6", Automotive: "#ef4444",
    Restaurant: "#f97316", Retail: "#a855f7", Hospitality: "#14b8a6",
    Accounting: "#6366f1", Other: "#6b7280",
  };
  const color = colors[industry] || "#6b7280";

  return (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      {industry}
    </span>
  );
}

// ── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ progress, theme }: { progress: any; theme: any }) {
  if (!progress) return null;
  return (
    <div className="py-5">
      <div className="flex justify-between mb-2 text-xs" style={{ color: theme.textMuted }}>
        <span>{progress.message}</span>
        {progress.current && progress.total && (
          <span>{progress.current}/{progress.total}</span>
        )}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: theme.border }}>
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{
            width: `${progress.percent || 0}%`,
            background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}cc)`,
          }}
        />
      </div>
    </div>
  );
}

// ── Stats Row ───────────────────────────────────────────────────────────────
function StatsRow({ stats, theme }: { stats: any; theme: any }) {
  if (!stats) return null;
  const items = [
    { label: "Companies Found", value: stats.uniqueCompanies },
    { label: "Enriched", value: stats.enriched },
    { label: "With Phone", value: stats.withPhone },
    { label: "With Email", value: stats.withEmail },
    { label: "Avg Fit Score", value: stats.avgFitScore },
    { label: "Time", value: `${stats.durationSeconds}s` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl p-3 text-center"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="text-xl font-bold" style={{ color: theme.text }}>{item.value}</div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Lead Card ───────────────────────────────────────────────────────────────
function LeadCard({ lead, expanded, onToggle, theme, onSave, saving, saved }: any) {
  return (
    <div
      className="rounded-xl p-4 sm:px-5 mb-2 cursor-pointer transition-all"
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      onClick={onToggle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}40`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = theme.border;
      }}
    >
      {/* Main Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm font-semibold" style={{ color: theme.text }}>
            {lead.companyName}
          </div>
          <div className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{ color: theme.textMuted }}>
            <span>Hiring: {lead.jobTitle}</span>
            <span style={{ color: theme.border }}>•</span>
            <span>{lead.jobLocation}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <IndustryTag industry={lead.industry} theme={theme} />
          <FitBadge score={lead.fitScore} theme={theme} />

          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium no-underline"
              style={{
                background: `${theme.primary}15`,
                color: theme.primary,
                border: `1px solid ${theme.primary}25`,
              }}
            >
              <Phone className="h-3 w-3" /> {lead.phone}
            </a>
          )}

          {expanded ? (
            <ChevronUp className="h-4 w-4" style={{ color: theme.textMuted }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          className="mt-4 pt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          {/* Contact & Location */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
              Contact & Location
            </div>
            {lead.phone && (
              <div className="mb-1 flex items-center gap-2" style={{ color: theme.text }}>
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`tel:${lead.phone}`} className="no-underline" style={{ color: theme.primary }}>{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="mb-1 flex items-center gap-2" style={{ color: theme.text }}>
                <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`mailto:${lead.email}`} className="no-underline" style={{ color: theme.primary }}>{lead.email}</a>
              </div>
            )}
            {lead.website && (
              <div className="mb-1 flex items-center gap-2" style={{ color: theme.text }}>
                <Globe className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={lead.website} target="_blank" rel="noopener" className="no-underline truncate" style={{ color: theme.primary }}>
                  {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
            {lead.address && (
              <div className="mb-1 flex items-center gap-2" style={{ color: theme.textMuted }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">{lead.address}</span>
              </div>
            )}
            {lead.googleMapsUrl && (
              <a
                href={lead.googleMapsUrl}
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] underline mt-1 inline-flex items-center gap-1"
                style={{ color: theme.textMuted }}
              >
                View on Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Business Intel */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
              Business Intel
            </div>
            {lead.rating && (
              <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: theme.text }}>
                <Star className="h-3.5 w-3.5 flex-shrink-0 fill-yellow-500 text-yellow-500" />
                {lead.rating} ({lead.reviewCount} reviews)
              </div>
            )}
            {lead.businessStatus && (
              <div className="mb-1 text-xs" style={{ color: lead.businessStatus === "OPERATIONAL" ? "#10b981" : "#ef4444" }}>
                {lead.businessStatus === "OPERATIONAL" ? "✓ " : "⚠ "}{lead.businessStatus}
              </div>
            )}
            {lead.techStack?.length > 0 && (
              <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>
                Tech: {lead.techStack.join(", ")}
              </div>
            )}
            {lead.jobSalary && (
              <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>Salary: {lead.jobSalary}</div>
            )}
            {lead.jobSnippet && (
              <div className="text-xs mt-2 leading-relaxed italic" style={{ color: theme.textMuted }}>
                &ldquo;{lead.jobSnippet}&rdquo;
              </div>
            )}
          </div>

          {/* Social + Actions */}
          <div>
            {Object.keys(lead.socialLinks || {}).length > 0 && (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
                  Social Media
                </div>
                {Object.entries(lead.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="block mb-1 text-xs capitalize no-underline hover:underline"
                    style={{ color: theme.textMuted }}
                  >
                    {platform} →
                  </a>
                ))}
              </>
            )}

            {/* Save to CRM button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(lead);
              }}
              disabled={saving || saved}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: saved ? `${theme.primary}15` : theme.primary,
                color: saved ? theme.primary : theme.primaryText,
                border: saved ? `1px solid ${theme.primary}30` : 'none',
                opacity: saving ? 0.6 : 1,
                cursor: saving || saved ? 'default' : 'pointer',
              }}
            >
              {saved ? (
                <><Check className="h-3.5 w-3.5" /> Saved to CRM</>
              ) : saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Save to CRM</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Main Page ───────────────────────────────────────────────────────────────
export default function LeadFinderPage() {
  const theme = useTheme();

  const [keywords, setKeywords] = useState("receptionist");
  const [location, setLocation] = useState("");
  const [maxLeads, setMaxLeads] = useState(25);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("fitScore");
  const [savingLeads, setSavingLeads] = useState<Set<string>>(new Set());
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const presets = [
    { keywords: "receptionist", label: "Receptionist" },
    { keywords: "front desk", label: "Front Desk" },
    { keywords: "office manager", label: "Office Manager" },
    { keywords: "dental receptionist", label: "Dental" },
    { keywords: "medical receptionist", label: "Medical" },
    { keywords: "legal receptionist", label: "Legal" },
    { keywords: "veterinary receptionist", label: "Vet" },
    { keywords: "customer service representative", label: "Customer Service" },
  ];

  // Get agency ID from localStorage (matches existing auth pattern)
  const getAgencyId = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("agency");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.id || parsed.agency_id || null;
      }
    } catch {}
    return null;
  };

  // ── Run Search ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!keywords.trim() || !location.trim()) {
      setError("Enter search keywords and a location");
      return;
    }

    setLoading(true);
    setError(null);
    setLeads([]);
    setStats(null);
    setSavedLeads(new Set());
    setProgress({ stage: "starting", message: "Initiating search...", percent: 0 });

    try {
      const res = await fetch(`${API_BASE}/api/leads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords.trim(),
          location: location.trim(),
          maxPages: 1,
          maxLeads,
          agencyId: getAgencyId(),
        }),
      });

      const data = await res.json();
      if (!data.jobId) throw new Error(data.error || "Failed to start search");

      // SSE stream for progress
      const evtSource = new EventSource(`${API_BASE}/api/leads/search/stream/${data.jobId}`);
      eventSourceRef.current = evtSource;

      evtSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setProgress(update.progress);

          if (update.status === "complete") {
            setLeads(update.leads || []);
            setStats(update.stats);
            setLoading(false);
            evtSource.close();
          } else if (update.status === "error") {
            setError(update.error || "Pipeline failed");
            setLoading(false);
            evtSource.close();
          }
        } catch {}
      };

      evtSource.onerror = () => {
        evtSource.close();
        pollForResults(data.jobId);
      };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [keywords, location, maxLeads]);

  const pollForResults = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leads/search/status/${jobId}`);
        const data = await res.json();
        setProgress(data.progress);

        if (data.status === "complete") {
          setLeads(data.leads || []);
          setStats(data.stats);
          setLoading(false);
          clearInterval(interval);
        } else if (data.status === "error") {
          setError(data.error);
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
        setError("Lost connection to server");
        setLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  // ── Save Single Lead to CRM ────────────────────────────────────────────
  const handleSaveLead = async (lead: any) => {
    const agencyId = getAgencyId();
    if (!agencyId) {
      setError("Agency ID not found. Please log in again.");
      return;
    }

    const key = lead.companyName;
    setSavingLeads((prev) => new Set(prev).add(key));

    try {
      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [lead], agencyId }),
      });
      const data = await res.json();

      if (data.saved > 0) {
        setSavedLeads((prev) => new Set(prev).add(key));
      } else if (data.skipped > 0) {
        setError(`${lead.companyName} already exists in your CRM`);
        setSavedLeads((prev) => new Set(prev).add(key));
      }
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    } finally {
      setSavingLeads((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // ── Save All Leads to CRM ─────────────────────────────────────────────
  const handleSaveAll = async () => {
    const agencyId = getAgencyId();
    if (!agencyId) {
      setError("Agency ID not found. Please log in again.");
      return;
    }

    setBulkSaving(true);
    try {
      const unsavedLeads = filteredLeads.filter((l) => !savedLeads.has(l.companyName));
      if (unsavedLeads.length === 0) return;

      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: unsavedLeads, agencyId }),
      });
      const data = await res.json();

      // Mark all as saved
      const newSaved = new Set(savedLeads);
      unsavedLeads.forEach((l) => newSaved.add(l.companyName));
      setSavedLeads(newSaved);

      setError(null);
      // Brief success message via error state (could make a toast later)
      if (data.saved > 0) {
        setError(`✓ ${data.saved} leads saved to CRM${data.skipped ? `, ${data.skipped} duplicates skipped` : ''}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) {
      setError("Bulk save failed: " + err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: filteredLeads }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${keywords.replace(/\s+/g, "-")}-${location.replace(/\s+/g, "-")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Export failed: " + err.message);
    }
  };

  // ── Filtering & Sorting ────────────────────────────────────────────────
  const industries = [...new Set(leads.map((l) => l.industry))].sort();

  const filteredLeads = leads
    .filter((l) => filterIndustry === "all" || l.industry === filterIndustry)
    .filter((l) => l.fitScore >= filterMinScore)
    .sort((a, b) => {
      if (sortBy === "fitScore") return b.fitScore - a.fitScore;
      if (sortBy === "company") return a.companyName.localeCompare(b.companyName);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  // ── Shared input style ─────────────────────────────────────────────────
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inputStyle = {
    background: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto" style={{ color: theme.text }}>

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/agency/leads"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 no-underline transition-colors"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${theme.primary}20` }}
          >
            <Target className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Lead Finder</h1>
        </div>
        <p className="text-sm pl-12" style={{ color: theme.textMuted }}>
          Search Indeed for businesses hiring roles an AI receptionist can fill — enrich with contact data and score by fit.
        </p>
      </div>

      {/* Search Card */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      >
        {/* Presets */}
        <div className="flex gap-2 flex-wrap mb-4">
          {presets.map((p) => (
            <button
              key={p.keywords}
              onClick={() => setKeywords(p.keywords)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
              style={{
                border: keywords === p.keywords ? `1px solid ${theme.primary}` : `1px solid ${theme.inputBorder}`,
                background: keywords === p.keywords ? `${theme.primary}15` : "transparent",
                color: keywords === p.keywords ? theme.primary : theme.textMuted,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
              Search Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder='e.g. "receptionist", "front desk"'
              className={inputClass}
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='e.g. "Atlanta, GA"'
              className={inputClass}
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
              Max Leads
            </label>
            <select
              value={maxLeads}
              onChange={(e) => setMaxLeads(Number(e.target.value))}
              className={`${inputClass} cursor-pointer`}
              style={inputStyle}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: loading ? theme.border : theme.primary,
              color: loading ? theme.textMuted : theme.primaryText,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" /> Find Leads
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      {loading && <ProgressBar progress={progress} theme={theme} />}

      {/* Error / Success Message */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{
            background: error.startsWith("✓") ? `${theme.primary}10` : "#ef444415",
            border: `1px solid ${error.startsWith("✓") ? `${theme.primary}30` : "#ef444430"}`,
            color: error.startsWith("✓") ? theme.primary : "#fca5a5",
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 cursor-pointer" style={{ color: "inherit" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && <StatsRow stats={stats} theme={theme} />}

      {/* Results */}
      {leads.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-3 my-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
                style={inputStyle}
              >
                <option value="all">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>

              <select
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
                style={inputStyle}
              >
                <option value={0}>All Scores</option>
                <option value={30}>30+ (Cool)</option>
                <option value={50}>50+ (Warm)</option>
                <option value={70}>70+ (Hot)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
                style={inputStyle}
              >
                <option value="fitScore">Sort: Fit Score</option>
                <option value="company">Sort: Company A-Z</option>
                <option value="rating">Sort: Rating</option>
              </select>

              <span className="text-xs" style={{ color: theme.textMuted }}>
                {filteredLeads.length} of {leads.length} leads
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAll}
                disabled={bulkSaving}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: theme.primary,
                  color: theme.primaryText,
                  opacity: bulkSaving ? 0.6 : 1,
                }}
              >
                {bulkSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> Save All to CRM</>
                )}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                style={{ border: `1px solid ${theme.inputBorder}`, color: theme.text, background: 'transparent' }}
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Lead Cards */}
          <div>
            {filteredLeads.map((lead, idx) => (
              <LeadCard
                key={`${lead.companyName}-${idx}`}
                lead={lead}
                theme={theme}
                expanded={expandedId === idx}
                onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
                onSave={handleSaveLead}
                saving={savingLeads.has(lead.companyName)}
                saved={savedLeads.has(lead.companyName)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && !error && (
        <div className="text-center py-20" style={{ color: theme.textMuted }}>
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
            style={{ background: `${theme.primary}15` }}
          >
            <Target className="h-8 w-8" style={{ color: theme.primary, opacity: 0.7 }} />
          </div>
          <div className="text-base font-medium mb-2" style={{ color: theme.text, opacity: 0.7 }}>
            Find Your Next Clients
          </div>
          <div className="text-sm max-w-sm mx-auto leading-relaxed">
            Search for businesses hiring receptionists, front desk staff, or office managers —
            they&apos;re the perfect fit for AI receptionist services.
          </div>
        </div>
      )}
    </div>
  );
}