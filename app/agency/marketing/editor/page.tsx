'use client';

// app/agency/marketing/editor/page.tsx
// -----------------------------------------------------------------------------
// Full-page, in-context website editor.
//
// Opens the agency's REAL marketing site full-screen (in an iframe at
// ?preview=1&editor=1) and lets the agency owner scroll their live site and
// click any text to edit it in place. Edits stream back over postMessage, land
// in a working marketing_config, and autosave to the backend. No form, no
// field hunting - you edit the page you ship.
//
// This route lives under /agency/marketing so it inherits the AgencyProvider
// and the "marketing" permission gate from app/agency/layout.tsx, but it paints
// a fixed full-viewport surface over the dashboard chrome so it reads as its
// own tab.
//
// SAFETY: the working config is the stored marketing_config JSONB overlaid with
// COMPLETE copy sections (so editing one item in an array never writes a sparse
// array). It deliberately never contains branding / footer / analytics, because
// client-page.tsx applies those from dedicated agency columns BEFORE the
// marketing_config spread - persisting them here would clobber the agency's
// real colors, support contact, and tracking IDs with template defaults.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Monitor, Tablet, Smartphone, MousePointerClick, ExternalLink, AlertCircle, Layers, X, ChevronUp, ChevronDown, FileText, Undo2, Save } from 'lucide-react';
import { useAgency } from '../../context';
import { defaultMarketingConfig } from '@/types/marketing';
import { setByPath, getByPath, clone } from '@/lib/editable-path';
import { resolveSectionOrder, SECTION_LABELS } from '@/lib/marketing-sections';
import { getIndustryPage, INDUSTRY_PAGE_LIST } from '@/lib/industry-pages';

// When editing an industry landing page, these fields are the ones the page
// overlays; everything else (features, steps, pricing, section order) is shared
// with the homepage and keeps writing the homepage config.
type OverlayKey = 'headline' | 'subheadline' | 'problems' | 'sampleCall' | 'faqs';
function industryOverlayKey(field: string): OverlayKey | null {
  if (field === 'hero.headline') return 'headline';
  if (field === 'hero.description') return 'subheadline';
  const seg = field.split('.')[0];
  if (seg === 'problems') return 'problems';
  if (seg === 'sampleCall') return 'sampleCall';
  if (seg === 'faqs') return 'faqs';
  return null;
}
// Remap a homepage field path to its industryPages[slug] address, or null when
// the field is shared with the homepage.
function remapIndustryField(field: string, slug: string): string | null {
  const key = industryOverlayKey(field);
  if (!key) return null;
  if (key === 'headline') return `industryPages.${slug}.headline`;
  if (key === 'subheadline') return `industryPages.${slug}.subheadline`;
  return `industryPages.${slug}.${field}`; // problems / sampleCall / faqs keep their sub-path
}

// Blank item used when "+ Add" is clicked for a repeatable list. Keyed by the
// config array path the template controls point at.
const NEW_ITEMS: Record<string, () => any> = {
  problems: () => ({ title: 'New problem', description: 'Describe a problem your customers run into.' }),
  steps: () => ({ title: 'New step', description: 'Explain what happens in this step.', time: '1 min' }),
  benefits: () => ({ icon: 'phone', title: 'New benefit', description: 'Describe this benefit.' }),
  features: () => ({ icon: 'calendar', title: 'New feature', description: 'Describe what this feature does.' }),
  industries: () => ({ icon: 'briefcase', title: 'New industry', subtitle: '', description: 'Describe how you help this type of business.', result: '' }),
  faqs: () => ({ question: 'New question?', answer: '<p>Add your answer here.</p>' }),
  testimonials: () => ({ rating: 5, quote: 'Add a customer quote here.', authorName: 'Customer name', authorTitle: '', headline: '', stats: '' }),
};
function newItemFor(path: string): any { const f = NEW_ITEMS[path]; return f ? f() : {}; }

type Device = 'desktop' | 'tablet' | 'mobile';
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const DEVICE_WIDTH: Record<Device, number | null> = { desktop: null, tablet: 834, mobile: 390 };

// Copy sections that legitimately live in marketing_config and are safe to
// materialize + persist. Column-sourced keys (branding, footer, analytics,
// pricing, aiWebCall, customNavLinks) are intentionally excluded - see the
// safety note above.
const COPY_OBJECT_KEYS = ['hero', 'stats', 'solution', 'sampleCall', 'roi', 'finalCta'] as const;
const COPY_ARRAY_KEYS = ['problems', 'steps', 'benefits', 'features', 'industries', 'testimonials', 'faqs'] as const;
const COPY_SCALAR_KEYS = ['stepsHeading', 'stepsSubheading'] as const;

// Human label for the region currently being edited (shown in the toolbar).
function regionLabel(field: string): string {
  if (!field) return '';
  const top = field.split('.')[0];
  const map: Record<string, string> = {
    hero: 'Hero', stats: 'Stats', problems: 'Problem', solution: 'Solution',
    steps: 'How it works', stepsHeading: 'How it works', stepsSubheading: 'How it works',
    benefits: 'Benefit', features: 'Feature', industries: 'Industry',
    testimonials: 'Testimonial', faqs: 'FAQ', finalCta: 'Final CTA',
    sampleCall: 'Sample call', roi: 'ROI calculator',
    headline: 'Headline', subtitle: 'Subtitle', title: 'Title', cta: 'Call to action', button: 'Button',
  };
  return map[top] || top.charAt(0).toUpperCase() + top.slice(1);
}

// Column-backed pages (signup, web call) store their copy in dedicated agency
// columns, not marketing_config. This maps the field a page posts to the column
// it saves to. A page listed here is edited via columns, not the config bridge.
function columnForField(pageId: string, field: string): string | null {
  if (pageId === 'signup') return field === 'headline' ? 'signup_headline' : field === 'subtitle' ? 'signup_subtitle' : null;
  if (pageId === 'webcall') return field === 'title' ? 'webcall_title' : field === 'subtitle' ? 'webcall_subtitle' : field === 'cta' ? 'webcall_cta' : null;
  return null;
}
function isColumnPage(pageId: string): boolean { return pageId === 'signup' || pageId === 'webcall'; }

// Toggleable sections per template, in render order. `flag` is the
// marketing_config key the templates already read. `defaultOn` is what the
// template shows when the flag is unset (opt-in sections default off). Only
// sections the current template actually renders are listed per template.
type SectionDef = { key: string; label: string; hint: string; flag: string; defaultOn: boolean | ((t: string) => boolean); templates: string[] };
const SECTIONS: SectionDef[] = [
  { key: 'proofStrip', label: 'Stats bar', hint: 'The row of headline numbers under the hero', flag: 'showProofStrip', defaultOn: true, templates: ['beside'] },
  { key: 'problemSolution', label: 'Problem & solution', hint: 'The "losing customers" problem cards and solution block', flag: 'showProblemSolution', defaultOn: true, templates: ['classic', 'beside'] },
  { key: 'howItWorks', label: 'How it works', hint: 'The numbered setup steps', flag: 'showHowItWorks', defaultOn: true, templates: ['classic', 'beside', 'editorial'] },
  { key: 'features', label: 'Features', hint: 'What the AI receptionist handles on calls', flag: 'showFeatures', defaultOn: true, templates: ['classic', 'beside', 'editorial'] },
  { key: 'commandCenter', label: 'Command center', hint: 'The phone mockup and benefit list', flag: 'showCommandCenter', defaultOn: true, templates: ['classic', 'beside'] },
  { key: 'industries', label: 'Industries', hint: 'Cards for the business types you serve', flag: 'showIndustries', defaultOn: (t) => t === 'editorial', templates: ['classic', 'beside', 'editorial'] },
  { key: 'comparison', label: 'Comparison table', hint: 'How you stack up vs other options', flag: 'showComparison', defaultOn: false, templates: ['classic', 'beside'] },
  { key: 'testimonials', label: 'Testimonial', hint: 'The large customer quote', flag: 'showTestimonials', defaultOn: true, templates: ['editorial'] },
  { key: 'roiCalculator', label: 'ROI calculator', hint: 'The missed-call cost slider', flag: 'showROICalculator', defaultOn: true, templates: ['classic', 'beside'] },
  { key: 'aiWebCall', label: 'AI web call', hint: 'An in-page button to talk to your AI live', flag: 'showAiWebCall', defaultOn: false, templates: ['classic', 'beside', 'editorial'] },
  { key: 'pricing', label: 'Pricing', hint: 'Your plan cards', flag: 'showPricing', defaultOn: true, templates: ['classic', 'beside', 'editorial'] },
  { key: 'faq', label: 'FAQ', hint: 'The questions accordion', flag: 'showFAQ', defaultOn: true, templates: ['classic', 'beside', 'editorial'] },
  { key: 'finalCta', label: 'Final call to action', hint: 'The closing sign-up push', flag: 'showFinalCTA', defaultOn: true, templates: ['classic', 'beside', 'editorial'] },
];
function sectionDefaultOn(def: SectionDef, template: string): boolean {
  return typeof def.defaultOn === 'function' ? def.defaultOn(template) : def.defaultOn;
}
function sectionIsOn(def: SectionDef, source: any, template: string): boolean {
  const v = source ? source[def.flag] : undefined;
  if (v === true) return true;
  if (v === false) return false;
  return sectionDefaultOn(def, template);
}

export default function WebsiteEditorPage() {
  const router = useRouter();
  const { agency, loading, refreshAgency, demoMode } = useAgency();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const subdomainUrl = agency?.slug ? `https://${agency.slug}.${platformDomain}` : '';
  const editorSrc = subdomainUrl ? `${subdomainUrl}/?preview=1&editor=1` : '';
  const accent = (agency as any)?.primary_color || '#00a19b';
  // URL the preview iframe loads for a given page id.
  const pageUrl = (id: string) => {
    if (!subdomainUrl) return '';
    if (id === 'signup') return `${subdomainUrl}/signup?embed=true&editor=true`;
    if (id === 'webcall') return `${subdomainUrl}/webcall?agency=${encodeURIComponent((agency as any)?.id || '')}&mode=demo&embed=true&editor=true`;
    if (id) return `${subdomainUrl}/${id}?preview=1&editor=1`;
    return `${subdomainUrl}/?preview=1&editor=1`;
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [activeRegion, setActiveRegion] = useState<string>('');
  const [iframeReady, setIframeReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  // Which page is being edited: '' = homepage, otherwise an industry page slug.
  const [currentPage, setCurrentPage] = useState<string>('');
  const currentPageRef = useRef<string>('');
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  // Section on/off state, mirrored in React so the panel re-renders. The source
  // of truth for saving is still configRef; toggles write to both.
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<string[]>([]);
  const template = (agency as any)?.marketing_template || 'classic';
  const templateSections = useMemo(() => SECTIONS.filter((s) => s.templates.includes(template)), [template]);
  const defByKey = useMemo(() => Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<string, SectionDef>, []);

  // The working copy of marketing_config. Mutated by edits, pushed to the
  // iframe, and autosaved. Held in a ref so the message handler (bound once)
  // always sees the latest without re-subscribing on every keystroke.
  const configRef = useRef<any>(null);
  const heroTouchedRef = useRef(false);
  const configDirtyRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pending agency-column edits (signup/webcall), flushed together in one PUT.
  const pendingCols = useRef<Record<string, string>>({});
  // Undo history of whole-config snapshots (show flags + section order live in
  // the config too, so one snapshot captures everything). Text edits to the same
  // field coalesce into one step.
  const undoStack = useRef<any[]>([]);
  const lastEditFieldRef = useRef<string | null>(null);
  const [undoDepth, setUndoDepth] = useState(0);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  // Build the seed once the agency is loaded.
  const seed = useMemo(() => {
    if (!agency) return null;
    const stored = (agency.marketing_config && typeof agency.marketing_config === 'object')
      ? clone(agency.marketing_config as any)
      : {};
    const d: any = defaultMarketingConfig;

    // Copy objects: stored value if present, else a clone of the default.
    for (const k of COPY_OBJECT_KEYS) {
      if (stored[k] === undefined && d[k] !== undefined) stored[k] = clone(d[k]);
    }
    // Copy arrays: same rule, so array items are always complete.
    for (const k of COPY_ARRAY_KEYS) {
      if (!Array.isArray(stored[k]) && Array.isArray(d[k])) stored[k] = clone(d[k]);
    }
    for (const k of COPY_SCALAR_KEYS) {
      if (stored[k] === undefined && d[k] !== undefined) stored[k] = d[k];
    }

    // Hero follows the live site's column precedence so the editor opens on the
    // exact text the public site shows (website_headline / company_tagline win).
    const hero = { ...clone(d.hero), ...(stored.hero || {}) };
    if ((agency as any).website_headline) {
      const h = String((agency as any).website_headline);
      hero.headline = h.split('\n').length > 1 ? h.split('\n') : [h];
    }
    if ((agency as any).company_tagline) hero.badge = String((agency as any).company_tagline);
    stored.hero = hero;

    return stored;
  }, [agency]);

  useEffect(() => {
    if (seed && !configReady) {
      configRef.current = seed;
      const initial: Record<string, boolean> = {};
      for (const def of templateSections) initial[def.flag] = sectionIsOn(def, seed, template);
      setFlags(initial);
      setOrder(resolveSectionOrder((seed as any).sectionOrder, template));
      setConfigReady(true);
    }
  }, [seed, configReady, templateSections, template]);

  // Push the working config into the iframe so it renders the editable baseline.
  const pushConfig = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (win && configRef.current) {
      try { win.postMessage({ type: 'voiceai:preview_content', config: configRef.current }, '*'); } catch { /* ignore */ }
    }
  }, []);

  const hasUnsaved = useCallback(() => configDirtyRef.current || Object.keys(pendingCols.current).length > 0, []);
  const markConfigDirty = useCallback(() => { configDirtyRef.current = true; setSaveState('dirty'); }, []);
  const markColsDirty = useCallback(() => { setSaveState('dirty'); }, []);

  // Record a snapshot before a change so it can be undone. Text edits pass the
  // field being edited so consecutive edits to it collapse into one undo step;
  // structural changes pass nothing and always push a step.
  const pushUndo = useCallback((coalesceField?: string | null) => {
    if (coalesceField !== undefined && coalesceField !== null && coalesceField === lastEditFieldRef.current) return;
    undoStack.current.push(clone(configRef.current));
    if (undoStack.current.length > 60) undoStack.current.shift();
    setUndoDepth(undoStack.current.length);
    lastEditFieldRef.current = coalesceField ?? null;
  }, []);

  // One PUT for marketing_config (+ mirrored hero columns). Throws on failure.
  const putConfig = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const body: any = { marketing_config: configRef.current };
    if (heroTouchedRef.current) {
      const hero = configRef.current?.hero || {};
      const headline = Array.isArray(hero.headline) ? hero.headline.join('\n') : (hero.headline || '');
      body.website_headline = headline.trim() || null;
      body.company_tagline = (hero.badge || '').trim() || null;
    }
    const res = await fetch(`${backendUrl}/api/agency/${agency!.id}/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(String(res.status));
  }, [agency, backendUrl]);

  // One PUT for pending agency-column edits (signup/webcall). Throws on failure.
  const putCols = useCallback(async () => {
    const cols = pendingCols.current;
    const keys = Object.keys(cols);
    if (keys.length === 0) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const body: any = {};
    for (const k of keys) { const v = cols[k]; body[k] = (typeof v === 'string' && v.trim()) ? v : null; }
    const res = await fetch(`${backendUrl}/api/agency/${agency!.id}/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(String(res.status));
    pendingCols.current = {};
  }, [agency, backendUrl]);

  // Manual save (the Save button / exit prompt). Saves whatever is dirty.
  const save = useCallback(async (): Promise<boolean> => {
    if (!hasUnsaved()) return true;
    if (!agency || demoMode) { if (demoMode) setSaveState('idle'); return demoMode; }
    setSaveState('saving');
    try {
      const tasks: Promise<void>[] = [];
      if (configDirtyRef.current) tasks.push(putConfig());
      if (Object.keys(pendingCols.current).length) tasks.push(putCols());
      await Promise.all(tasks);
      configDirtyRef.current = false;
      setSaveState('saved');
      refreshAgency().catch(() => {});
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, [agency, demoMode, hasUnsaved, putConfig, putCols, refreshAgency]);

  // Undo the last change: restore the snapshot and re-derive the panel state
  // (show flags + order live in the config), then re-push to the preview.
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop();
    configRef.current = prev;
    const nf: Record<string, boolean> = {};
    for (const def of templateSections) nf[def.flag] = sectionIsOn(def, prev, template);
    setFlags(nf);
    setOrder(resolveSectionOrder(prev?.sectionOrder, template));
    setUndoDepth(undoStack.current.length);
    lastEditFieldRef.current = null;
    configDirtyRef.current = true;
    setSaveState('dirty');
    pushConfig();
  }, [templateSections, template, pushConfig]);

  // Flip a section on/off: update the panel state, the working config, the live
  // preview, and queue a save. Writes the explicit boolean the templates read.
  const toggleSection = useCallback((flag: string) => {
    if (!configRef.current) return;
    pushUndo();
    const next = !flags[flag];
    setFlags((f) => ({ ...f, [flag]: next }));
    configRef.current = setByPath(configRef.current, flag, next);
    pushConfig();
    markConfigDirty();
  }, [flags, pushConfig, pushUndo, markConfigDirty]);

  // Move a section up (-1) or down (+1) in the render order.
  const moveSection = useCallback((index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= order.length || !configRef.current) return;
    pushUndo();
    const next = order.slice();
    const [moved] = next.splice(index, 1);
    next.splice(j, 0, moved);
    setOrder(next);
    configRef.current = setByPath(configRef.current, 'sectionOrder', next);
    pushConfig();
    markConfigDirty();
  }, [order, pushConfig, pushUndo, markConfigDirty]);

  // Before the first edit to an overlaid industry field, copy that field's
  // current value from the static lib page into industryPages[slug] so arrays
  // are complete (no sparse writes) and the override is self-contained.
  const ensureIndustrySeed = useCallback((slug: string, field: string) => {
    const key = industryOverlayKey(field);
    if (!key || !configRef.current) return;
    const path = `industryPages.${slug}.${key}`;
    if (getByPath(configRef.current, path) !== undefined) return;
    const sp = getIndustryPage(slug);
    if (!sp) return;
    const val = key === 'headline' ? sp.headline : key === 'subheadline' ? sp.subheadline : key === 'problems' ? sp.problems : key === 'sampleCall' ? sp.sampleCall : sp.faqs;
    configRef.current = setByPath(configRef.current, path, clone(val));
  }, []);

  // Switch the editor to a different page (homepage or an industry slug). The
  // iframe remounts via its key and re-pushes the current config on load.
  const switchPage = useCallback((slug: string) => {
    currentPageRef.current = slug;
    setCurrentPage(slug);
    setActiveRegion('');
    setPageMenuOpen(false);
    // Undo history is scoped to the page you are on.
    undoStack.current = [];
    lastEditFieldRef.current = null;
    setUndoDepth(0);
  }, []);

  // Inbound bridge from the iframe (Editable regions on the agency site).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'voiceai:cpreview_ready') {
        setIframeReady(true);
        pushConfig();
      } else if (d.type === 'voiceai:undo') {
        undo();
      } else if (d.type === 'voiceai:edit_select' && typeof d.region === 'string') {
        setActiveRegion(d.region);
      } else if (d.type === 'voiceai:select' && typeof d.region === 'string') {
        // Column-backed pages (signup/webcall) use this select message.
        setActiveRegion(d.region);
      } else if (d.type === 'voiceai:edit_text' && typeof d.field === 'string') {
        // Column-backed page edit: save to the mapped agency column.
        const col = columnForField(currentPageRef.current, d.field);
        if (!col) return;
        pendingCols.current[col] = typeof d.value === 'string' ? d.value : '';
        markColsDirty();
      } else if (d.type === 'voiceai:edit_item' && typeof d.path === 'string') {
        if (!configRef.current) return;
        const slug = currentPageRef.current;
        let arrPath = d.path;
        // problems/faqs are overlaid per industry page; features/steps/etc stay shared.
        if (slug && (d.path === 'problems' || d.path === 'faqs')) {
          ensureIndustrySeed(slug, d.path);
          arrPath = `industryPages.${slug}.${d.path}`;
        }
        const cur = getByPath(configRef.current, arrPath);
        const arr = Array.isArray(cur) ? cur.slice() : [];
        if (d.action === 'add') {
          pushUndo();
          arr.push(newItemFor(d.path));
        } else if (d.action === 'remove' && typeof d.index === 'number' && d.index >= 0 && d.index < arr.length) {
          pushUndo();
          arr.splice(d.index, 1);
        } else {
          return;
        }
        configRef.current = setByPath(configRef.current, arrPath, arr);
        pushConfig();
        markConfigDirty();
      } else if (d.type === 'voiceai:edit_content' && typeof d.field === 'string') {
        if (!configRef.current) return;
        const slug = currentPageRef.current;
        let field = d.field;
        if (slug) {
          const remapped = remapIndustryField(field, slug);
          if (remapped) { ensureIndustrySeed(slug, field); field = remapped; }
        }
        pushUndo(field); // snapshot before the first edit to this field (coalesced)
        configRef.current = setByPath(configRef.current, field, typeof d.value === 'string' ? d.value : '');
        // Only homepage hero edits mirror into the website_headline/tagline columns.
        if (field.split('.')[0] === 'hero') heroTouchedRef.current = true;
        markConfigDirty();
        // Re-push (debounced) so regions that share state with the edited one
        // keep the new value when their section re-renders (FAQ accordion,
        // pricing toggle, etc.). The region being typed in is the iframe
        // document's activeElement, which Editable's effect skips, so the
        // caret is never disturbed.
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(() => pushConfig(), 160);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [pushConfig, ensureIndustrySeed, pushUndo, markConfigDirty, markColsDirty, undo]);

  // Leaving prompts to save when there are unsaved changes.
  const leave = useCallback(() => router.push('/agency/marketing'), [router]);
  const exit = useCallback(() => {
    if (hasUnsaved()) setShowExitPrompt(true);
    else leave();
  }, [hasUnsaved, leave]);
  const saveAndExit = useCallback(async () => {
    const ok = await save();
    if (ok) leave();
  }, [save, leave]);

  // Parent-level Cmd/Ctrl+Z (when focus is in the editor chrome, not the iframe).
  // Edits inside the iframe forward their own voiceai:undo message.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // Warn on browser tab close / refresh with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (hasUnsaved()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsaved]);

  useEffect(() => () => { if (pushTimer.current) clearTimeout(pushTimer.current); }, []);

  const width = DEVICE_WIDTH[device];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ backgroundColor: '#0b0c0f' }}>
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ backgroundColor: '#15171c', fontFamily: 'var(--font-jakarta, system-ui, sans-serif)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 sm:px-4 shrink-0" style={{ height: 56, backgroundColor: '#0b0c0f', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={exit}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors"
          style={{ color: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Done</span>
        </button>

        {/* Page switcher: homepage or an industry landing page */}
        {INDUSTRY_PAGE_LIST.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setPageMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
              style={{ color: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{currentPage ? (INDUSTRY_PAGE_LIST.find((p) => p.slug === currentPage)?.label || currentPage) : 'Homepage'}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {pageMenuOpen && (
              <div className="absolute left-0 mt-1 rounded-lg py-1 z-20" style={{ minWidth: 190, backgroundColor: '#15171c', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 34px rgba(0,0,0,0.55)' }}>
                {[{ slug: '', label: 'Homepage' }, ...INDUSTRY_PAGE_LIST, { slug: 'signup', label: 'Signup page' }, { slug: 'webcall', label: 'Web call widget' }].map((p) => (
                  <button
                    key={p.slug || 'home'}
                    onClick={() => switchPage(p.slug)}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{ color: currentPage === p.slug ? '#fff' : 'rgba(255,255,255,0.7)', backgroundColor: currentPage === p.slug ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <MousePointerClick className="h-3.5 w-3.5" />
          Click any text on your site to edit it
        </div>

        <div className="flex-1" />

        {/* Active region chip */}
        {activeRegion && (
          <div className="hidden sm:flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }}>
            Editing: {regionLabel(activeRegion)}
          </div>
        )}

        {/* Sections panel toggle (only for the marketing template pages) */}
        {!isColumnPage(currentPage) && (
          <button
            onClick={() => setPanelOpen((o) => !o)}
            title="Show or hide sections"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
            style={{ color: panelOpen ? '#0b0c0f' : '#e5e7eb', backgroundColor: panelOpen ? '#ffffff' : 'rgba(255,255,255,0.06)' }}
          >
            <Layers className="h-4 w-4" /><span className="hidden sm:inline">Sections</span>
          </button>
        )}

        {/* Device toggle */}
        <div className="flex items-center rounded-lg p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [Device, any][]).map(([d, Icon]) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              title={d.charAt(0).toUpperCase() + d.slice(1)}
              className="inline-flex items-center justify-center rounded-md transition-colors"
              style={{ width: 32, height: 28, color: device === d ? '#0b0c0f' : 'rgba(255,255,255,0.6)', backgroundColor: device === d ? '#ffffff' : 'transparent' }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={undoDepth === 0}
          title="Undo (Cmd/Ctrl+Z)"
          className="inline-flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 32, height: 28, color: undoDepth === 0 ? 'rgba(255,255,255,0.25)' : '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.06)', cursor: undoDepth === 0 ? 'default' : 'pointer' }}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Save status */}
        <div className="hidden sm:flex items-center gap-1.5 min-w-[92px] justify-end text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {demoMode ? (
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Preview only</span>
          ) : saveState === 'saving' ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</>
          ) : saveState === 'saved' ? (
            <><Check className="h-3.5 w-3.5" style={{ color: '#34d399' }} /> Saved</>
          ) : saveState === 'dirty' ? (
            <span style={{ color: '#fbbf24' }}>Unsaved</span>
          ) : saveState === 'error' ? (
            <><AlertCircle className="h-3.5 w-3.5" style={{ color: '#f87171' }} /> Save failed</>
          ) : null}
        </div>

        {/* Save */}
        <button
          onClick={() => save()}
          disabled={demoMode || saveState !== 'dirty'}
          title="Save changes"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
          style={{ color: saveState === 'dirty' && !demoMode ? '#0b0c0f' : 'rgba(255,255,255,0.4)', backgroundColor: saveState === 'dirty' && !demoMode ? accent : 'rgba(255,255,255,0.08)', cursor: saveState === 'dirty' && !demoMode ? 'pointer' : 'default' }}
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </div>

      {/* Canvas + sections panel */}
      <div className="flex-1 flex min-h-0">
      <div className="flex-1 overflow-auto" style={{ padding: device === 'desktop' ? 0 : '20px 12px' }}>
        {!editorSrc ? (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Your site isn&apos;t ready yet. Finish setting up your agency to edit it.
          </div>
        ) : (
          <div
            className="mx-auto bg-white transition-[max-width] duration-300"
            style={{
              width: '100%',
              maxWidth: width ? width : '100%',
              height: device === 'desktop' ? '100%' : undefined,
              minHeight: device === 'desktop' ? '100%' : 'calc(100vh - 56px - 40px)',
              borderRadius: device === 'desktop' ? 0 : 14,
              overflow: 'hidden',
              boxShadow: device === 'desktop' ? 'none' : '0 20px 60px rgba(0,0,0,0.45)',
            }}
          >
            {configReady && (
              <iframe
                key={currentPage || 'home'}
                ref={iframeRef}
                title="Your website"
                src={pageUrl(currentPage)}
                onLoad={() => { if (!isColumnPage(currentPage)) pushConfig(); }}
                style={{ width: '100%', height: device === 'desktop' ? '100%' : '100%', minHeight: device === 'desktop' ? 'calc(100vh - 56px)' : 'calc(100vh - 56px - 40px)', border: 0, display: 'block', backgroundColor: '#ffffff' }}
              />
            )}
          </div>
        )}
      </div>

      {/* Sections panel */}
      {panelOpen && !isColumnPage(currentPage) && (
        <aside className="shrink-0 overflow-y-auto" style={{ width: 300, backgroundColor: '#0b0c0f', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: '#fff' }}>Sections</h3>
              <button onClick={() => setPanelOpen(false)} className="inline-flex items-center justify-center rounded-md" style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)' }} aria-label="Close sections">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Reorder with the arrows, and turn sections on or off. Your header, hero and footer always stay. Use Save when you&apos;re done.</p>
            <div className="space-y-1">
              {order.map((key, i) => {
                const def = defByKey[key];
                // valueCards (Editorial) has no flag of its own; it follows Features.
                const on = def ? (flags[def.flag] ?? sectionDefaultOn(def, template)) : (flags.showFeatures ?? true);
                const label = def ? def.label : (SECTION_LABELS[key as keyof typeof SECTION_LABELS] || key);
                const hint = def ? def.hint : 'Shown with the Features section';
                return (
                  <div key={key} className="rounded-lg p-2 flex items-start gap-2 transition-colors" style={{ backgroundColor: on ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                    <span className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Move up" className="inline-flex items-center justify-center rounded" style={{ width: 22, height: 16, color: i === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)', cursor: i === 0 ? 'default' : 'pointer' }}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveSection(i, 1)} disabled={i === order.length - 1} title="Move down" className="inline-flex items-center justify-center rounded" style={{ width: 22, height: 16, color: i === order.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)', cursor: i === order.length - 1 ? 'default' : 'pointer' }}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="block text-sm font-medium" style={{ color: on ? '#fff' : 'rgba(255,255,255,0.55)' }}>{label}</span>
                      <span className="block text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{hint}</span>
                    </span>
                    {def ? (
                      <button type="button" onClick={() => toggleSection(def.flag)} title={on ? 'Hide section' : 'Show section'} className="shrink-0 mt-1 inline-flex items-center rounded-full transition-all" style={{ width: 34, height: 20, padding: 2, backgroundColor: on ? accent : 'rgba(255,255,255,0.18)', justifyContent: on ? 'flex-end' : 'flex-start' }}>
                        <span style={{ width: 16, height: 16, borderRadius: '999px', backgroundColor: '#fff', display: 'block' }} />
                      </button>
                    ) : (
                      <span className="shrink-0" style={{ width: 34 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* Unsaved-changes prompt on exit */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowExitPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 mx-4" style={{ width: 400, maxWidth: '100%', backgroundColor: '#15171c', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            <h3 className="text-base font-semibold" style={{ color: '#fff' }}>Save your changes?</h3>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>You have unsaved changes. Save them before leaving the editor?</p>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={saveAndExit} disabled={saveState === 'saving'} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: accent, color: '#0b0c0f' }}>
                {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save &amp; exit
              </button>
              <button onClick={leave} className="inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}>Discard</button>
              <button onClick={() => setShowExitPrompt(false)} className="inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
            </div>
            {saveState === 'error' && <p className="text-xs mt-3" style={{ color: '#f87171' }}>Couldn&apos;t save. Check your connection and try again.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
