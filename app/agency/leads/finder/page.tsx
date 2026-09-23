"use client";

/**
 * Lead Finder Page v3 — VoiceAI Connect Agency Dashboard
 * Path: app/agency/leads/finder/page.tsx
 * 
 * Two source tabs:
 * - Indeed: Search by job title → finds businesses actively hiring
 * - Google Maps: Search by industry → finds businesses in target verticals
 * 
 * Both flow into the same enrichment → scoring → CRM save pipeline.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/hooks/useTheme";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useAgency } from "../../context";
import Link from "next/link";
import {
  ArrowLeft, Search, Download, Phone, Mail, Globe, MapPin,
  Star, ExternalLink, ChevronDown, ChevronUp, Loader2, Target,
  Save, Check, X, Filter, AlertTriangle, CheckSquare, Square,
  Map, Briefcase, Info
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type SourceTab = "indeed" | "google_maps";

// ── Indeed Logo SVG ─────────────────────────────────────────────────────
function IndeedLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#003A9B" xmlns="http://www.w3.org/2000/svg" aria-label="Indeed">
      <path d="M11.566 21.5633v-8.762c.2553.0231.5009.0346.758.0346 1.2225 0 2.3739-.3206 3.3506-.8928v9.6182c0 .8219-.1957 1.4287-.5757 1.8338-.378.4033-.8808.6049-1.491.6049-.6007 0-1.0766-.2016-1.468-.6183-.3781-.4032-.5739-1.01-.5739-1.8184zM11.589.5659c2.5447-.8929 5.4424-.8449 7.6186.987.405.3687.8673.8334 1.0515 1.3806.2207.6913-.7695-.073-.9057-.167-.71-.4532-1.4182-.8334-2.2127-1.0946C12.8614.3873 8.8122 2.709 6.2945 6.315c-1.0516 1.5939-1.7367 3.2721-2.299 5.1174-.0614.2017-.1094.4647-.2207.6413-.1113.2036-.048-.5453-.048-.5702.0845-.7623.2438-1.4997.4414-2.237C5.3292 5.3375 7.897 2.0655 11.5891.5658zm4.9281 7.0587c0 1.6686-1.353 3.0224-3.0205 3.0224-1.6677 0-3.0186-1.3538-3.0186-3.0224 0-1.6687 1.351-3.0224 3.0186-3.0224 1.6676 0 3.0205 1.3518 3.0205 3.0224Z" />
    </svg>
  );
}

// ── Google Maps Logo SVG ────────────────────────────────────────────────
function GoogleMapsLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google Maps">
      <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" fill="#EA4335"/>
      <circle cx="12" cy="9" r="2.6" fill="#fff"/>
    </svg>
  );
}

// ── Source Badge ─────────────────────────────────────────────────────────
function SourceBadge({ source, theme }: { source: string; theme: any }) {
  if (source === "google_maps") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{ background: "#ea433515", color: "#ea4335", border: "1px solid #ea433525" }}>
        <GoogleMapsLogo size={10} /> Maps
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ background: "#003a9b15", color: "#003a9b", border: "1px solid #003a9b25" }}>
      <IndeedLogo size={10} /> Indeed
    </span>
  );
}

// ── Industry Tag ────────────────────────────────────────────────────────
function IndustryTag({ industry }: { industry: string }) {
  const colors: Record<string, string> = {
    Healthcare: "#06b6d4", Dental: "#8b5cf6", Veterinary: "#f97316",
    Legal: "#64748b", "Beauty & Wellness": "#ec4899", "Home Services": "#eab308",
    "Real Estate": "#22c55e", Insurance: "#3b82f6", Automotive: "#ef4444",
    Restaurant: "#f97316", Retail: "#a855f7", Hospitality: "#14b8a6",
    Accounting: "#6366f1", Fitness: "#f43f5e", Storage: "#78716c",
    Other: "#6b7280",
  };
  const color = colors[industry] || "#6b7280";
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {industry}
    </span>
  );
}

// ── Progress Bar ────────────────────────────────────────────────────────
function ProgressBar({ progress, theme }: { progress: any; theme: any }) {
  if (!progress) return null;
  const pct = Math.max(0, Math.min(100, Math.round(progress.percent || 0)));
  const found = typeof progress.found === "number" ? progress.found : null;
  const sub = found !== null
    ? `${found} ${found === 1 ? "business" : "businesses"} found so far`
    : progress.current && progress.total
      ? `${progress.current} of ${progress.total}`
      : "Keep this tab open while it runs";
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-full shrink-0" style={{ background: `${theme.primary}18` }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: theme.primary }}>{progress.message || "Working..."}</div>
          <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{sub}</div>
        </div>
        <div className="text-lg font-bold tabular-nums shrink-0" style={{ color: theme.primary }}>{pct}%</div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.border }}>
        <div className="h-full rounded-full animate-pulse"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}aa)`, transition: "width 500ms ease" }} />
      </div>
    </div>
  );
}

// ── Stats Row ───────────────────────────────────────────────────────────
function StatsRow({ stats, theme }: { stats: any; theme: any }) {
  if (!stats) return null;
  const items = [
    { label: "Found", value: stats.uniqueCompanies || stats.businessesFound || 0 },
    { label: "Enriched", value: stats.enriched },
    { label: "With Phone", value: stats.withPhone },
    { label: "With Email", value: stats.withEmail },
    { label: "With Website", value: stats.withWebsite },
    { label: "Time", value: (() => { const t = Number(stats.durationSeconds) || 0; return t < 60 ? `${t}s` : `${Math.floor(t / 60)}m ${t % 60}s`; })() },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 py-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl p-3 text-center"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="text-lg font-bold" style={{ color: theme.text }}>{item.value}</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Lead Card ───────────────────────────────────────────────────────────
function LeadCard({ lead, expanded, onToggle, theme, onSave, saving, saved, selected, onSelect }: any) {
  return (
    <div className="rounded-xl p-4 sm:px-5 mb-2 transition-all"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}40`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}>

      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex-shrink-0 cursor-pointer" style={{ color: selected ? theme.primary : theme.textMuted }}>
          {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </button>

        {/* Main content — clickable */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold truncate" style={{ color: theme.text }}>{lead.companyName}</span>
                <SourceBadge source={lead.leadSource} theme={theme} />
              </div>
              <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: theme.textMuted }}>
                {lead.jobTitle && <span>Hiring: {lead.jobTitle}</span>}
                {lead.jobTitle && lead.jobLocation && <span style={{ color: theme.border }}>•</span>}
                {lead.jobLocation && <span>{lead.jobLocation}</span>}
                {!lead.jobTitle && lead.address && <span>{lead.address}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <IndustryTag industry={lead.industry} />
              {lead.phone && (
                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium no-underline"
                  style={{ background: `${theme.primary}15`, color: theme.primary, border: `1px solid ${theme.primary}25` }}>
                  <Phone className="h-3 w-3" /> {lead.phone}
                </a>
              )}
              {expanded ? <ChevronUp className="h-4 w-4" style={{ color: theme.textMuted }} />
                : <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {lead.warnings?.length > 0 && (
        <div className="mt-2 ml-7 flex items-start gap-1.5 text-xs" style={{ color: "#f59e0b" }}>
          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>{lead.warnings.join(" • ")}</span>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="mt-4 pt-4 ml-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm"
          style={{ borderTop: `1px solid ${theme.border}` }}>

          {/* Contact */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Contact</div>
            {lead.phone && (
              <div className="mb-1 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`tel:${lead.phone}`} className="no-underline" style={{ color: theme.primary }}>{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="mb-1 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`mailto:${lead.email}`} className="no-underline truncate" style={{ color: theme.primary }}>{lead.email}</a>
              </div>
            )}
            {lead.website && (
              <div className="mb-1 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={lead.website} target="_blank" rel="noopener" className="no-underline truncate" style={{ color: theme.primary }}>
                  {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
            {lead.address && (
              <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {lead.address}
              </div>
            )}
            {lead.googleMapsUrl && (
              <a href={lead.googleMapsUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                className="text-[11px] underline mt-1 inline-flex items-center gap-1" style={{ color: theme.textMuted }}>
                Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Business Intel */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Business</div>
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
              <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>Tech: {lead.techStack.join(", ")}</div>
            )}
            {lead.jobSalary && <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>Salary: {lead.jobSalary}</div>}
            {lead.jobSnippet && (
              <div className="text-xs mt-2 leading-relaxed italic" style={{ color: theme.textMuted }}>
                &ldquo;{lead.jobSnippet}&rdquo;
              </div>
            )}
          </div>

          {/* Social + Save */}
          <div>
            {Object.entries(lead.socialLinks || {}).filter(([, u]) => u).length > 0 && (() => {
              const SOCIAL_META: Record<string, { slug: string; color: string; label: string }> = {
                facebook: { slug: "facebook", color: "0866FF", label: "Facebook" },
                instagram: { slug: "instagram", color: "E4405F", label: "Instagram" },
                linkedin: { slug: "linkedin", color: "0A66C2", label: "LinkedIn" },
                twitter: { slug: "x", color: "000000", label: "X" },
                x: { slug: "x", color: "000000", label: "X" },
                yelp: { slug: "yelp", color: "FF1A1A", label: "Yelp" },
                tiktok: { slug: "tiktok", color: "000000", label: "TikTok" },
                youtube: { slug: "youtube", color: "FF0000", label: "YouTube" },
                pinterest: { slug: "pinterest", color: "BD081C", label: "Pinterest" },
              };
              const entries = Object.entries(lead.socialLinks || {}).filter(([, u]) => u);
              return (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Social</div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {entries.map(([platform, url]) => {
                      const meta = SOCIAL_META[String(platform).toLowerCase()];
                      return (
                        <a key={platform} href={url as string} target="_blank" rel="noopener"
                          onClick={(e) => e.stopPropagation()} title={meta ? meta.label : platform}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full transition-transform hover:scale-110"
                          style={{ background: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                          {meta
                            ? <img src={`https://cdn.simpleicons.org/${meta.slug}/${meta.color}`} alt={meta.label} className="h-4 w-4" />
                            : <Globe className="h-4 w-4" style={{ color: theme.textMuted }} />}
                        </a>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            <button onClick={(e) => { e.stopPropagation(); onSave(lead); }}
              disabled={saving || saved}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: saved ? `${theme.primary}15` : theme.primary,
                color: saved ? theme.primary : theme.primaryText,
                border: saved ? `1px solid ${theme.primary}30` : "none",
                opacity: saving ? 0.6 : 1,
                cursor: saving || saved ? "default" : "pointer",
              }}>
              {saved ? <><Check className="h-3.5 w-3.5" /> Saved to CRM</>
                : saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                : <><Save className="h-3.5 w-3.5" /> Save to CRM</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Google Maps Industry Presets ─────────────────────────────────────────
const MAPS_INDUSTRIES = [
  { value: "dental", label: "Dental" },
  { value: "medical", label: "Medical / Clinics" },
  { value: "veterinary", label: "Veterinary" },
  { value: "legal", label: "Legal / Law Firms" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "pest_control", label: "Pest Control" },
  { value: "real_estate", label: "Real Estate" },
  { value: "insurance", label: "Insurance" },
  { value: "accounting", label: "Accounting / CPA" },
  { value: "beauty_salon", label: "Salons / Spas" },
  { value: "automotive", label: "Automotive" },
  { value: "chiropractic", label: "Chiropractic" },
  { value: "therapy", label: "Therapy / Counseling" },
  { value: "optometry", label: "Optometry" },
  { value: "plastic_surgery", label: "Plastic Surgery" },
  { value: "property_management", label: "Property Management" },
  { value: "cleaning", label: "Cleaning Services" },
  { value: "towing", label: "Towing" },
];

// ── Indeed Presets ───────────────────────────────────────────────────────
const INDEED_PRESETS = [
  { keywords: "receptionist", label: "Receptionist" },
  { keywords: "front desk", label: "Front Desk" },
  { keywords: "office manager", label: "Office Manager" },
  { keywords: "dental receptionist", label: "Dental" },
  { keywords: "medical receptionist", label: "Medical" },
  { keywords: "legal receptionist", label: "Legal" },
  { keywords: "veterinary receptionist", label: "Vet" },
  { keywords: "customer service representative", label: "Customer Service" },
];


// ── Main Page ───────────────────────────────────────────────────────────
// Maps a US phone number's area code to a representative "City, ST", used to
// prefill the Lead Finder location from the agency's number on file. City-level
// is intentional (it is a search default the user can edit). Unknown or non-US
// numbers return null, so the caller just leaves the field empty.

const AREA_CODE_CITY: Record<string, string> = {
  // Georgia
  "229": "Albany, GA", "404": "Atlanta, GA", "470": "Atlanta, GA", "478": "Macon, GA",
  "678": "Atlanta, GA", "706": "Columbus, GA", "762": "Columbus, GA", "770": "Atlanta, GA",
  "912": "Savannah, GA",
  // Alabama
  "205": "Birmingham, AL", "251": "Mobile, AL", "256": "Huntsville, AL", "334": "Montgomery, AL",
  "938": "Huntsville, AL",
  // Florida
  "239": "Fort Myers, FL", "305": "Miami, FL", "321": "Orlando, FL", "352": "Gainesville, FL",
  "386": "Daytona Beach, FL", "407": "Orlando, FL", "561": "West Palm Beach, FL",
  "689": "Orlando, FL", "727": "St. Petersburg, FL", "754": "Fort Lauderdale, FL",
  "772": "Port St. Lucie, FL", "786": "Miami, FL", "813": "Tampa, FL", "850": "Tallahassee, FL",
  "863": "Lakeland, FL", "904": "Jacksonville, FL", "941": "Sarasota, FL", "954": "Fort Lauderdale, FL",
  // South Carolina
  "803": "Columbia, SC", "839": "Columbia, SC", "843": "Charleston, SC", "854": "Charleston, SC",
  "864": "Greenville, SC",
  // North Carolina
  "252": "Greenville, NC", "336": "Greensboro, NC", "704": "Charlotte, NC", "743": "Greensboro, NC",
  "828": "Asheville, NC", "910": "Fayetteville, NC", "919": "Raleigh, NC", "980": "Charlotte, NC",
  "984": "Raleigh, NC",
  // Tennessee
  "423": "Chattanooga, TN", "615": "Nashville, TN", "629": "Nashville, TN", "731": "Jackson, TN",
  "865": "Knoxville, TN", "901": "Memphis, TN", "931": "Clarksville, TN",
  // Virginia / DC / Maryland
  "202": "Washington, DC", "276": "Bristol, VA", "434": "Lynchburg, VA", "540": "Roanoke, VA",
  "571": "Arlington, VA", "703": "Arlington, VA", "757": "Virginia Beach, VA", "804": "Richmond, VA",
  "240": "Rockville, MD", "301": "Rockville, MD", "410": "Baltimore, MD", "443": "Baltimore, MD",
  "667": "Baltimore, MD",
  // Kentucky / West Virginia
  "270": "Bowling Green, KY", "364": "Bowling Green, KY", "502": "Louisville, KY", "606": "Ashland, KY",
  "859": "Lexington, KY", "304": "Charleston, WV", "681": "Charleston, WV",
  // Louisiana / Mississippi / Arkansas
  "225": "Baton Rouge, LA", "318": "Shreveport, LA", "337": "Lafayette, LA", "504": "New Orleans, LA",
  "985": "Houma, LA", "228": "Gulfport, MS", "601": "Jackson, MS", "662": "Tupelo, MS",
  "769": "Jackson, MS", "479": "Fort Smith, AR", "501": "Little Rock, AR", "870": "Jonesboro, AR",
  // Texas
  "210": "San Antonio, TX", "214": "Dallas, TX", "254": "Waco, TX", "281": "Houston, TX",
  "325": "Abilene, TX", "346": "Houston, TX", "361": "Corpus Christi, TX", "409": "Beaumont, TX",
  "430": "Tyler, TX", "432": "Midland, TX", "469": "Dallas, TX", "512": "Austin, TX",
  "682": "Fort Worth, TX", "713": "Houston, TX", "726": "San Antonio, TX", "737": "Austin, TX",
  "806": "Lubbock, TX", "817": "Fort Worth, TX", "830": "New Braunfels, TX", "832": "Houston, TX",
  "903": "Tyler, TX", "915": "El Paso, TX", "936": "Conroe, TX", "940": "Denton, TX",
  "956": "Laredo, TX", "972": "Dallas, TX", "979": "College Station, TX",
  // Oklahoma
  "405": "Oklahoma City, OK", "539": "Tulsa, OK", "580": "Lawton, OK", "918": "Tulsa, OK",
  // Ohio
  "216": "Cleveland, OH", "234": "Akron, OH", "330": "Akron, OH", "419": "Toledo, OH",
  "440": "Cleveland, OH", "513": "Cincinnati, OH", "567": "Toledo, OH", "614": "Columbus, OH",
  "740": "Athens, OH", "937": "Dayton, OH",
  // Michigan
  "231": "Muskegon, MI", "248": "Troy, MI", "269": "Kalamazoo, MI", "313": "Detroit, MI",
  "517": "Lansing, MI", "586": "Warren, MI", "616": "Grand Rapids, MI", "734": "Ann Arbor, MI",
  "810": "Flint, MI", "906": "Marquette, MI", "947": "Troy, MI", "989": "Saginaw, MI",
  // Indiana
  "219": "Gary, IN", "260": "Fort Wayne, IN", "317": "Indianapolis, IN", "463": "Indianapolis, IN",
  "574": "South Bend, IN", "765": "Muncie, IN", "812": "Evansville, IN", "930": "Evansville, IN",
  // Illinois
  "217": "Springfield, IL", "224": "Elgin, IL", "309": "Peoria, IL", "312": "Chicago, IL",
  "331": "Aurora, IL", "618": "Belleville, IL", "630": "Naperville, IL", "708": "Cicero, IL",
  "773": "Chicago, IL", "779": "Rockford, IL", "815": "Rockford, IL", "847": "Elgin, IL",
  "872": "Chicago, IL",
  // Wisconsin
  "262": "Kenosha, WI", "414": "Milwaukee, WI", "608": "Madison, WI", "715": "Eau Claire, WI",
  "920": "Green Bay, WI",
  // Minnesota
  "218": "Duluth, MN", "320": "St. Cloud, MN", "507": "Rochester, MN", "612": "Minneapolis, MN",
  "651": "St. Paul, MN", "763": "Minneapolis, MN", "952": "Bloomington, MN",
  // Missouri / Kansas
  "314": "St. Louis, MO", "417": "Springfield, MO", "573": "Columbia, MO", "636": "St. Charles, MO",
  "660": "Sedalia, MO", "816": "Kansas City, MO", "975": "Kansas City, MO", "316": "Wichita, KS",
  "620": "Dodge City, KS", "785": "Topeka, KS", "913": "Kansas City, KS",
  // Iowa / Nebraska
  "319": "Cedar Rapids, IA", "515": "Des Moines, IA", "563": "Davenport, IA", "641": "Mason City, IA",
  "712": "Sioux City, IA", "308": "Grand Island, NE", "402": "Omaha, NE", "531": "Omaha, NE",
  // Colorado / Utah / Nevada / New Mexico / Arizona
  "303": "Denver, CO", "719": "Colorado Springs, CO", "720": "Denver, CO", "970": "Fort Collins, CO",
  "385": "Salt Lake City, UT", "435": "St. George, UT", "801": "Salt Lake City, UT",
  "702": "Las Vegas, NV", "725": "Las Vegas, NV", "775": "Reno, NV", "505": "Albuquerque, NM",
  "575": "Las Cruces, NM", "480": "Mesa, AZ", "520": "Tucson, AZ", "602": "Phoenix, AZ",
  "623": "Phoenix, AZ", "928": "Yuma, AZ",
  // Idaho / Montana / Wyoming
  "208": "Boise, ID", "986": "Boise, ID", "406": "Billings, MT", "307": "Cheyenne, WY",
  // California
  "209": "Stockton, CA", "213": "Los Angeles, CA", "279": "Sacramento, CA", "310": "Los Angeles, CA",
  "323": "Los Angeles, CA", "408": "San Jose, CA", "415": "San Francisco, CA", "424": "Los Angeles, CA",
  "442": "Oceanside, CA", "510": "Oakland, CA", "530": "Redding, CA", "559": "Fresno, CA",
  "562": "Long Beach, CA", "619": "San Diego, CA", "626": "Pasadena, CA", "650": "San Mateo, CA",
  "657": "Anaheim, CA", "661": "Bakersfield, CA", "669": "San Jose, CA", "707": "Santa Rosa, CA",
  "714": "Anaheim, CA", "747": "Los Angeles, CA", "760": "Palm Springs, CA", "805": "Oxnard, CA",
  "818": "Los Angeles, CA", "831": "Salinas, CA", "858": "San Diego, CA", "909": "San Bernardino, CA",
  "916": "Sacramento, CA", "925": "Concord, CA", "949": "Irvine, CA", "951": "Riverside, CA",
  // Washington / Oregon
  "206": "Seattle, WA", "253": "Tacoma, WA", "360": "Olympia, WA", "425": "Bellevue, WA",
  "509": "Spokane, WA", "564": "Seattle, WA", "458": "Eugene, OR", "503": "Portland, OR",
  "541": "Eugene, OR", "971": "Portland, OR",
  // Alaska / Hawaii
  "907": "Anchorage, AK", "808": "Honolulu, HI",
  // Northeast: NY / NJ / CT / MA / PA / RI / NH / VT / ME / DE
  "201": "Jersey City, NJ", "551": "Jersey City, NJ", "609": "Trenton, NJ", "640": "Trenton, NJ",
  "732": "Toms River, NJ", "848": "Toms River, NJ", "856": "Camden, NJ", "862": "Newark, NJ",
  "908": "Elizabeth, NJ", "973": "Newark, NJ",
  "212": "New York, NY", "315": "Syracuse, NY", "332": "New York, NY", "347": "New York, NY",
  "516": "Hempstead, NY", "518": "Albany, NY", "585": "Rochester, NY", "607": "Binghamton, NY",
  "631": "Brentwood, NY", "646": "New York, NY", "680": "Syracuse, NY", "716": "Buffalo, NY",
  "718": "New York, NY", "838": "Albany, NY", "845": "Poughkeepsie, NY", "914": "Yonkers, NY",
  "917": "New York, NY",
  "203": "New Haven, CT", "475": "New Haven, CT", "860": "Hartford, CT", "959": "Hartford, CT",
  "339": "Boston, MA", "351": "Lowell, MA", "413": "Springfield, MA", "508": "Worcester, MA",
  "617": "Boston, MA", "774": "Worcester, MA", "781": "Boston, MA", "857": "Boston, MA",
  "978": "Lowell, MA",
  "215": "Philadelphia, PA", "223": "Harrisburg, PA", "267": "Philadelphia, PA", "412": "Pittsburgh, PA",
  "445": "Philadelphia, PA", "484": "Allentown, PA", "570": "Scranton, PA", "610": "Allentown, PA",
  "717": "Harrisburg, PA", "724": "New Castle, PA", "814": "Erie, PA", "878": "Pittsburgh, PA",
  "401": "Providence, RI", "603": "Manchester, NH", "802": "Burlington, VT", "207": "Portland, ME",
  "302": "Wilmington, DE",
};

function areaCodeToCity(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  let areaCode = "";
  if (digits.length === 11 && digits.startsWith("1")) areaCode = digits.slice(1, 4);
  else if (digits.length === 10) areaCode = digits.slice(0, 3);
  else if (digits.length >= 3) areaCode = digits.slice(0, 3);
  return AREA_CODE_CITY[areaCode] || null;
}

type DropOption = { value: string; label: string };

function Dropdown({ value, options, onChange, theme, buttonClassName, buttonStyle }:
  { value: string; options: DropOption[]; onChange: (v: string) => void; theme: any; buttonClassName: string; buttonStyle: any }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  return (
    <>
      <button ref={btnRef} type="button" onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex items-center justify-between gap-2 ${buttonClassName}`} style={buttonStyle}>
        <span className="truncate">{selected ? selected.label : ""}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && coords && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} className="fixed z-[100] max-h-64 overflow-auto rounded-lg py-1 shadow-xl"
          style={{ top: coords.top, left: coords.left, minWidth: coords.width, background: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-xs cursor-pointer whitespace-nowrap transition-colors"
              style={{ background: o.value === value ? `${theme.primary}15` : "transparent", color: o.value === value ? theme.primary : theme.text }}>
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default function LeadFinderPage() {
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();

  if (canUseLeadFinder === false) {
    if (typeof window !== "undefined") window.location.href = "/agency/leads";
    return null;
  }

  const { agency } = useAgency();

  // Shared state
  const [activeTab, setActiveTab] = useState<SourceTab>("google_maps");
  const [location, setLocation] = useState("");
  const [maxLeads, setMaxLeads] = useState(25);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [savingLeads, setSavingLeads] = useState<Set<string>>(new Set());
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [confirmSearch, setConfirmSearch] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Prefill location from the agency's number on file (area code -> city).
  // Defaults on load; user can clear it (X) or tap the chip to refill.
  const homeCity = areaCodeToCity(agency?.phone);
  useEffect(() => {
    if (homeCity) setLocation((prev) => (prev ? prev : homeCity));
  }, [homeCity]);

  // Indeed state
  const [keywords, setKeywords] = useState("receptionist");

  // Google Maps state
  const [mapsIndustry, setMapsIndustry] = useState("dental");
  const [mapsQuery, setMapsQuery] = useState("");
  const [findAll, setFindAll] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const getAgencyId = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("agency");
      if (stored) { const p = JSON.parse(stored); return p.id || p.agency_id || null; }
    } catch {}
    return agency?.id || null;
  };

  // ── Search ──────────────────────────────────────────────────────────────
  const connectToJob = (jobId: string) => {
    try { localStorage.setItem("lead_finder_job", jobId); } catch {}
    const evtSource = new EventSource(`${API_BASE}/api/leads/search/stream/${jobId}`);
    eventSourceRef.current = evtSource;
    evtSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setProgress(update.progress);
        if (update.status === "complete") {
          setLeads(update.leads || []); setStats(update.stats); setLoading(false);
          try { localStorage.removeItem("lead_finder_job"); } catch {}
          evtSource.close();
        } else if (update.status === "error") {
          setError(update.error || "Pipeline failed"); setLoading(false);
          try { localStorage.removeItem("lead_finder_job"); } catch {}
          evtSource.close();
        }
      } catch {}
    };
    evtSource.onerror = () => { evtSource.close(); pollForResults(jobId); };
  };

  const doSearch = useCallback(async () => {
    if (!location.trim()) { setError("Enter a location"); return; }
    if (activeTab === "indeed" && !keywords.trim()) { setError("Enter search keywords"); return; }
    if (activeTab === "google_maps" && !mapsIndustry && !mapsQuery.trim()) { setError("Select an industry or enter a search query"); return; }

    setLoading(true);
    setError(null);
    setLeads([]);
    setStats(null);
    setSavedLeads(new Set());
    setSelectedLeads(new Set());
    setLimitInfo(null);
    setProgress({ stage: "starting", message: "Initializing...", percent: 0 });

    const body: any = {
      source: activeTab,
      location: location.trim(),
      maxLeads,
      agencyId: getAgencyId(),
    };

    if (activeTab === "indeed") {
      body.keywords = keywords.trim();
    } else {
      if (mapsQuery.trim()) {
        body.query = mapsQuery.trim();
      } else {
        body.industry = mapsIndustry;
      }
      body.findAll = findAll;
    }

    try {
      const res = await fetch(`${API_BASE}/api/leads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.status === 429) { setError(data.error); setLoading(false); return; }
      if (data.limitReached) { setLimitInfo(data); setLoading(false); return; }
      if (!data.jobId) throw new Error(data.error || "Failed to start search");
      connectToJob(data.jobId);
    } catch (err: any) { setError(err.message); setLoading(false); }
  }, [activeTab, keywords, location, maxLeads, mapsIndustry, mapsQuery, findAll]);

  const hasUnsaved = leads.length > 0 && leads.some((l: any) => !savedLeads.has(l.companyName));

  const handleSearch = useCallback(() => {
    if (!location.trim()) { setError("Enter a location"); return; }
    if (activeTab === "indeed" && !keywords.trim()) { setError("Enter search keywords"); return; }
    if (activeTab === "google_maps" && !mapsIndustry && !mapsQuery.trim()) { setError("Select an industry or enter a search query"); return; }
    if (hasUnsaved) { setConfirmSearch(true); return; }
    doSearch();
  }, [location, activeTab, keywords, mapsIndustry, mapsQuery, hasUnsaved, doSearch]);

  const pollForResults = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leads/search/status/${jobId}`);
        if (res.status === 404) { clearInterval(interval); setLoading(false); try { localStorage.removeItem("lead_finder_job"); } catch {} return; }
        const data = await res.json();
        setProgress(data.progress);
        if (data.status === "complete") { setLeads(data.leads || []); setStats(data.stats); setLoading(false); clearInterval(interval); try { localStorage.removeItem("lead_finder_job"); } catch {} }
        else if (data.status === "error") { setError(data.error); setLoading(false); clearInterval(interval); try { localStorage.removeItem("lead_finder_job"); } catch {} }
      } catch { clearInterval(interval); setError("Lost connection"); setLoading(false); }
    }, 1000);
  };

  useEffect(() => { return () => { eventSourceRef.current?.close(); }; }, []);

  // Resume an in-progress search after a page refresh.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("lead_finder_job"); } catch {}
    if (saved) {
      setLoading(true);
      setProgress({ stage: "resuming", message: "Reconnecting to your search...", percent: 5 });
      connectToJob(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSaveLead = async (lead: any) => {
    const agencyId = getAgencyId();
    if (!agencyId) { setError("Agency ID not found — please log in again."); return; }
    const key = lead.companyName;
    setSavingLeads((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [lead], agencyId }),
      });
      const data = await res.json();
      if (data.saved > 0 || data.skipped > 0) setSavedLeads((prev) => new Set(prev).add(key));
      if (data.skipped > 0) setError(`${lead.companyName} already exists in your CRM`);
    } catch (err: any) { setError("Failed to save: " + err.message); }
    finally { setSavingLeads((prev) => { const n = new Set(prev); n.delete(key); return n; }); }
  };

  const saveAllLeads = async () => {
    const agencyId = getAgencyId();
    const toSave = leads.filter((l: any) => !savedLeads.has(l.companyName));
    if (!agencyId || toSave.length === 0) return;
    try {
      await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toSave, agencyId }),
      });
      setSavedLeads(new Set(leads.map((l: any) => l.companyName)));
    } catch {}
  };

  const handleSaveSelected = async () => {
    const agencyId = getAgencyId();
    if (!agencyId) { setError("Agency ID not found."); return; }
    const toSave = filteredLeads.filter((_, idx) => selectedLeads.has(idx)).filter((l) => !savedLeads.has(l.companyName));
    if (toSave.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toSave, agencyId }),
      });
      const data = await res.json();
      const newSaved = new Set(savedLeads);
      toSave.forEach((l) => newSaved.add(l.companyName));
      setSavedLeads(newSaved);
      setSelectedLeads(new Set());
      if (data.saved > 0) {
        setError(`✓ ${data.saved} leads saved to CRM${data.skipped ? `, ${data.skipped} duplicates skipped` : ""}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) { setError("Bulk save failed: " + err.message); }
    finally { setBulkSaving(false); }
  };

  const handleSaveAll = async () => {
    const allIndices = new Set(filteredLeads.map((_, idx) => idx));
    setSelectedLeads(allIndices);
    // Use a small delay so state updates before save
    setTimeout(() => handleSaveSelected(), 50);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const toExport = selectedLeads.size > 0
        ? filteredLeads.filter((_, idx) => selectedLeads.has(idx))
        : filteredLeads;
      const res = await fetch(`${API_BASE}/api/leads/export`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toExport }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `leads-${activeTab}-${location.replace(/\s+/g, "-")}.csv`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch (err: any) { setError("Export failed: " + err.message); }
  };

  // ── Select All Toggle ─────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((_, idx) => idx)));
    }
  };

  // ── Filter / Sort ─────────────────────────────────────────────────────
  const industries = [...new Set(leads.map((l) => l.industry))].sort();
  const filteredLeads = leads
    .filter((l) => filterIndustry === "all" || l.industry === filterIndustry)
    .sort((a, b) => {
      if (sortBy === "company") return a.companyName.localeCompare(b.companyName);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "reviews") return (b.reviewCount || 0) - (a.reviewCount || 0);
      return 0;
    });

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inputStyle = { background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto" style={{ color: theme.text, zoom: 1.1 }}>
      {/* Header */}
      <div className="mb-6">
        <Link href="/agency/leads" className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 no-underline transition-colors" style={{ color: theme.textMuted }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}20` }}>
            <Target className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Lead Finder</h1>
        </div>
        <p className="text-sm pl-12" style={{ color: theme.textMuted }}>
          Find local businesses in a vertical and enrich each with phone, email, website, and hours.
        </p>
      </div>

      {/* What it does */}
      <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
        <div className="text-sm" style={{ color: theme.textMuted }}>
          <p className="font-medium mb-1" style={{ color: theme.text }}>What the Lead Finder does</p>
          <p>Pick an industry (or type a custom search) and a location. It pulls matching local businesses from Google Maps and enriches each one with phone, email, website and hours. Google returns up to 60 businesses per search. Add the ones you want straight to your leads, then work them from the Leads page.</p>
        </div>
      </div>

      {/* Search Card */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>

        {/* Source Tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => setActiveTab("google_maps")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all"
            style={{
              color: activeTab === "google_maps" ? theme.primary : theme.textMuted,
              borderBottom: activeTab === "google_maps" ? `2px solid ${theme.primary}` : "2px solid transparent",
              background: activeTab === "google_maps" ? `${theme.primary}08` : "transparent",
            }}>
            <GoogleMapsLogo size={18} />
            Google Maps
          </button>
          <button
            disabled
            title="Indeed sourcing is coming soon"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium cursor-not-allowed"
            style={{ color: theme.textMuted, opacity: 0.55, borderBottom: "2px solid transparent", background: "transparent" }}>
            <span style={{ filter: "grayscale(1)", display: "inline-flex" }}><IndeedLogo size={18} /></span>
            Indeed
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide" style={{ background: `${theme.textMuted}22`, color: theme.textMuted }}>Coming soon</span>
          </button>
        </div>

        <div className="p-5">
          {/* Source description */}
          <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
            {activeTab === "google_maps"
              ? "Search by industry to find local businesses in verticals that need AI receptionists."
              : "Search by job title to find businesses actively hiring for roles an AI receptionist can fill."}
          </p>

          {/* Google Maps inputs */}
          {activeTab === "google_maps" && (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {MAPS_INDUSTRIES.map((ind) => (
                  <button key={ind.value} onClick={() => { setMapsIndustry(ind.value); setMapsQuery(""); }}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{
                      border: mapsIndustry === ind.value && !mapsQuery ? `1px solid ${theme.primary}` : `1px solid ${theme.inputBorder}`,
                      background: mapsIndustry === ind.value && !mapsQuery ? `${theme.primary}15` : "transparent",
                      color: mapsIndustry === ind.value && !mapsQuery ? theme.primary : theme.textMuted,
                    }}>
                    {ind.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button type="button" role="switch" aria-checked={findAll} onClick={() => setFindAll((v) => !v)}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                  style={{ background: findAll ? theme.primary : theme.border }}>
                  <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                    style={{ transform: findAll ? "translateX(18px)" : "translateX(2px)" }} />
                </button>
                <span className="text-xs font-medium" style={{ color: findAll ? theme.primary : theme.textMuted }}>Find every business in this area</span>
                <span className="text-xs hidden sm:inline" style={{ color: theme.textMuted }}>sweeps the whole market, not just the top 60</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Custom search (optional)</label>
                  <input type="text" value={mapsQuery} onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="e.g. med spa, franchise, urgent care..." className={inputClass} style={inputStyle}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Location</label>
                  <div className="relative">
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder='"Atlanta, GA"' className={inputClass} style={{ ...inputStyle, paddingRight: "2rem" }}
                      onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                    {location && (
                      <button type="button" onClick={() => setLocation("")} aria-label="Clear location"
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: theme.textMuted }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {homeCity && location !== homeCity && (
                    <button type="button" onClick={() => setLocation(homeCity)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium cursor-pointer" style={{ color: theme.primary }}>
                      <MapPin className="h-3 w-3" /> Use {homeCity}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Max</label>
                  {findAll ? (
                    <div className={inputClass} style={{ ...inputStyle, opacity: 0.55, textAlign: "center" }}>All</div>
                  ) : (
                    <Dropdown value={String(maxLeads)} onChange={(v) => setMaxLeads(Number(v))} theme={theme}
                      buttonClassName={`${inputClass} cursor-pointer`} buttonStyle={inputStyle}
                      options={[{ value: "10", label: "10" }, { value: "25", label: "25" }, { value: "50", label: "50" }, { value: "60", label: "60" }]} />
                  )}
                </div>
                <button onClick={handleSearch} disabled={loading}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
                  style={{ background: loading ? theme.border : theme.primary, color: loading ? theme.textMuted : theme.primaryText, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
                    : <span className="inline-flex items-center gap-2"><Map className="h-4 w-4" /> {findAll ? "Find All" : "Search Maps"}</span>}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Progress */}
      {loading && <ProgressBar progress={progress} theme={theme} />}

      {/* Confirm before a new search when there are unsaved leads */}
      {confirmSearch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setConfirmSearch(false)}>
          <div className="w-full max-w-sm rounded-xl p-5" style={{ background: theme.card || theme.input, border: `1px solid ${theme.inputBorder}` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Save your current leads first?</div>
            <div className="text-xs mb-4" style={{ color: theme.textMuted }}>
              You have {leads.filter((l: any) => !savedLeads.has(l.companyName)).length} unsaved lead{leads.filter((l: any) => !savedLeads.has(l.companyName)).length === 1 ? "" : "s"}. Starting a new search clears the current results.
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={async () => { setConfirmSearch(false); await saveAllLeads(); doSearch(); }}
                className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer" style={{ background: theme.primary, color: theme.primaryText }}>
                Save to CRM, then search
              </button>
              <button type="button" onClick={() => { setConfirmSearch(false); doSearch(); }}
                className="rounded-lg px-3 py-2 text-xs font-medium cursor-pointer" style={{ border: `1px solid ${theme.inputBorder}`, color: theme.text, background: "transparent" }}>
                Discard and search
              </button>
              <button type="button" onClick={() => setConfirmSearch(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium cursor-pointer" style={{ color: theme.textMuted, background: "transparent" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{
            background: error.startsWith("✓") ? `${theme.primary}10` : "#ef444415",
            border: `1px solid ${error.startsWith("✓") ? `${theme.primary}30` : "#ef444430"}`,
            color: error.startsWith("✓") ? theme.primary : "#fca5a5",
          }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 cursor-pointer" style={{ color: "inherit" }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Monthly limit reached (no search ran) */}
      {limitInfo && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}30`, color: theme.primary }}>
          <span>{limitInfo.message || `Monthly lead limit reached (${limitInfo.used}/${limitInfo.cap}).`}</span>
          <button onClick={() => setLimitInfo(null)} className="ml-2 cursor-pointer" style={{ color: "inherit" }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Partial results notice (hit cap or area too large) */}
      {stats && stats.findAll && ((stats.usage && stats.usage.limitReached) || stats.partialArea) && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: "#f59e0b15", border: "1px solid #f59e0b30", color: "#fbbf24" }}>
          {stats.partialArea
            ? `This area is very large, so this shows the first ${stats.uniqueCompanies} businesses found. Search a smaller area to go deeper.`
            : `You've reached your monthly lead limit, so this shows ${stats.uniqueCompanies} of the matches found. Upgrade to Scale for unlimited leads.`}
        </div>
      )}

      {/* Stats */}
      {stats && <StatsRow stats={stats} theme={theme} />}

      {stats && stats.findAll && typeof stats.tilesSearched === "number" && (
        <div className="text-xs mt-2 mb-1" style={{ color: theme.textMuted }}>
          Swept {stats.tilesSearched} zone{stats.tilesSearched === 1 ? "" : "s"}{stats.areaLabel ? ` across ${stats.areaLabel}` : ""}, found {stats.businessesFound} matching {stats.businessesFound === 1 ? "business" : "businesses"}.
        </div>
      )}

      {/* Results */}
      {leads.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-3 my-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={toggleSelectAll} className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                style={{ color: theme.textMuted }}>
                {selectedLeads.size === filteredLeads.length
                  ? <CheckSquare className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                  : <Square className="h-3.5 w-3.5" />}
                {selectedLeads.size > 0 ? `${selectedLeads.size} selected` : "Select all"}
              </button>

              <Dropdown value={filterIndustry} onChange={setFilterIndustry} theme={theme}
                buttonClassName="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer min-w-[128px]" buttonStyle={inputStyle}
                options={[{ value: "all", label: "All Industries" }, ...industries.map((ind) => ({ value: ind, label: ind }))]} />

              <Dropdown value={sortBy} onChange={setSortBy} theme={theme}
                buttonClassName="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer min-w-[150px]" buttonStyle={inputStyle}
                options={[{ value: "relevance", label: "Sort: Relevance" }, { value: "company", label: "Sort: Company A-Z" }, { value: "rating", label: "Sort: Rating" }, { value: "reviews", label: "Sort: Reviews" }]} />

              <span className="text-xs" style={{ color: theme.textMuted }}>
                {filteredLeads.length} of {leads.length} leads
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedLeads.size > 0 && (
                <button onClick={handleSaveSelected} disabled={bulkSaving}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{ background: theme.primary, color: theme.primaryText, opacity: bulkSaving ? 0.6 : 1 }}>
                  {bulkSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                    : <><Save className="h-3.5 w-3.5" /> Save {selectedLeads.size} to CRM</>}
                </button>
              )}
              {selectedLeads.size === 0 && (
                <button onClick={handleSaveAll} disabled={bulkSaving}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{ background: theme.primary, color: theme.primaryText, opacity: bulkSaving ? 0.6 : 1 }}>
                  <Save className="h-3.5 w-3.5" /> Save All
                </button>
              )}
              <button onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                style={{ border: `1px solid ${theme.inputBorder}`, color: theme.text, background: "transparent" }}>
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Lead Cards */}
          <div>
            {filteredLeads.map((lead, idx) => (
              <LeadCard key={`${lead.companyName}-${idx}`} lead={lead} theme={theme}
                expanded={expandedId === idx} onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
                onSave={handleSaveLead} saving={savingLeads.has(lead.companyName)} saved={savedLeads.has(lead.companyName)}
                selected={selectedLeads.has(idx)}
                onSelect={() => {
                  setSelectedLeads((prev) => {
                    const n = new Set(prev);
                    if (n.has(idx)) n.delete(idx); else n.add(idx);
                    return n;
                  });
                }} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && !error && (
        <div className="text-center py-20" style={{ color: theme.textMuted }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
            style={{ background: `${theme.primary}15` }}>
            <Target className="h-8 w-8" style={{ color: theme.primary, opacity: 0.7 }} />
          </div>
          <div className="text-base font-medium mb-2" style={{ color: theme.text, opacity: 0.7 }}>Find Your Next Clients</div>
          <div className="text-sm max-w-md mx-auto leading-relaxed">
            Pick an industry and a location above to find local businesses that need an AI receptionist.
          </div>
        </div>
      )}
    </div>
  );
}