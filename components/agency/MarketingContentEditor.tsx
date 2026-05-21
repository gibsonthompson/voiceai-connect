'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Save, Loader2, Check, Plus, Trash2,
  Phone, Type, AlertTriangle, BarChart3, Lightbulb, ListOrdered,
  LayoutGrid, DollarSign, HelpCircle, FileText, Star
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Types — aligned with types/marketing.ts
// ────────────────────────────────────────────────────────────────────────────
interface HeroConfig {
  badge: string;
  headline: string[];
  subtitle: string;
  description: string;
  demoPhone: string;
  demoInstructions: string;
  trustItems: string[];
}

interface StatsConfig {
  setupTime: string;
  responseTime: string;
  businessesServed: string;
  satisfaction: string;
}

interface ProblemConfig {
  title: string;
  description: string;
}

interface SolutionConfig {
  headline: string;
  paragraphs: string[];
  highlight: string;
}

interface StepConfig {
  title: string;
  description: string;
  time: string;
}

interface FeatureConfig {
  title: string;
  description: string;
  icon: string;
}

interface PricingTier {
  name: string;
  price: number;
  subtitle: string;
  features: string[];
  isPopular: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FooterConfig {
  email: string;
  tagline: string;
}

// What the editor manages — subset of full MarketingConfig
// Benefits, industries, testimonials are preserved on save but not edited here
interface EditorConfig {
  hero: HeroConfig;
  stats: StatsConfig;
  problems: ProblemConfig[];
  solution: SolutionConfig;
  steps: StepConfig[];
  features: FeatureConfig[];
  pricing: PricingTier[];
  faqs: FAQItem[];
  footer: FooterConfig;
}

// ────────────────────────────────────────────────────────────────────────────
// Defaults
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: EditorConfig = {
  hero: {
    badge: 'AI-Powered Phone Answering',
    headline: ['Never Miss', 'Another Call'],
    subtitle: 'AI Receptionist Starting at $49/month',
    description: 'Professional AI that answers every call, books appointments, and sends you instant summaries — 24/7.',
    demoPhone: '',
    demoInstructions: 'Takes 30 seconds. Free to call.',
    trustItems: ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering'],
  },
  stats: { setupTime: '10 min', responseTime: '< 1 sec', businessesServed: '200+', satisfaction: '96%' },
  problems: [
    { title: 'Missed Calls = Lost Revenue', description: 'I was on another call when a $5,000 job went to voicemail. They called my competitor instead.' },
    { title: "Can't Answer While Working", description: "I'm elbow-deep in a project when the phone rings. Answer and lose focus, or ignore and lose business?" },
    { title: 'After-Hours Opportunities Gone', description: "Someone called at 8pm ready to book. By morning, they'd already hired someone else." },
  ],
  solution: {
    headline: 'Your 24/7 AI Receptionist',
    paragraphs: [
      'Imagine having a professional receptionist who never sleeps, never takes breaks, and answers every call exactly the way you would.',
      'An AI assistant trained specifically on your business that handles calls while you focus on what matters.',
    ],
    highlight: 'You get a text summary of every call within seconds, plus an app where you can see transcripts, listen to recordings, and manage everything.',
  },
  steps: [
    { title: 'Tell Us About Your Business', description: 'Answer a few questions so our AI knows how to represent you perfectly.', time: '2 minutes' },
    { title: 'We Train Your AI', description: 'Our system creates a custom AI receptionist that sounds natural and knows your business.', time: '5 minutes' },
    { title: 'Get Your Phone Number', description: 'Forward your calls to your new AI number, or use it as a dedicated line.', time: '1 minute' },
    { title: 'Start Taking Calls', description: 'Your AI handles calls 24/7. You get text summaries and full access via our app.', time: 'Instant' },
  ],
  features: [
    { title: 'Appointment Booking', description: 'AI checks your Google Calendar in real time, offers available slots, and books appointments automatically.', icon: 'calendar' },
    { title: 'Instant Text Summaries', description: 'Within seconds of each call ending, you get a text with all the important details.', icon: 'message' },
    { title: 'Smart Call Transfer', description: 'Set rules for when calls should be transferred to you immediately.', icon: 'transfer' },
    { title: 'Trained on YOUR Business', description: 'Your AI knows your services, hours, service area, and how you handle different situations.', icon: 'training' },
    { title: '24/7 Coverage', description: '3am on a Sunday? Holiday weekend? Your AI never sleeps.', icon: 'moon' },
    { title: 'Natural Conversations', description: "Sounds human, not robotic. Speaks English and Spanish — automatically detects the caller's language.", icon: 'mic' },
  ],
  pricing: [
    { name: 'Starter', price: 49, subtitle: 'For solo operators', features: ['1 AI phone number', 'Up to 50 calls/month', 'Calendar integration', 'Text summaries', 'Call recordings'], isPopular: false },
    { name: 'Professional', price: 99, subtitle: 'For growing businesses', features: ['Everything in Starter', 'Up to 150 calls/month', 'Lead qualification', 'Call transfer rules', 'Analytics dashboard'], isPopular: true },
    { name: 'Growth', price: 149, subtitle: 'For high-volume operations', features: ['Everything in Professional', 'Up to 500 calls/month', 'Up to 3 phone numbers', 'Custom AI training', 'Priority support'], isPopular: false },
  ],
  faqs: [
    { question: "Do callers know they're talking to an AI?", answer: "Most don't. Our AI uses natural conversation patterns and a voice that sounds human. If someone directly asks, the AI will be honest." },
    { question: 'How does appointment booking work?', answer: 'The AI connects to your Google Calendar, checks real availability, offers times, and books the appointment — all during the live call.' },
    { question: "What if the AI can't answer something?", answer: "It handles it gracefully — offers to have someone call back with details. You get a text summary of what was asked." },
    { question: 'Does it speak Spanish?', answer: "Yes — automatically on every plan. The AI detects the caller's language and switches. Summaries are sent in English." },
    { question: 'Do I need a website for this to work?', answer: 'No. All you need is a phone number. Forward your existing line to the AI number, or use the AI number directly.' },
  ],
  footer: {
    email: '',
    tagline: 'Professional AI that answers every call, books appointments, and sends instant summaries — 24/7.',
  },
};

const ICON_OPTIONS = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'message', label: 'Message' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'training', label: 'Location/Training' },
  { value: 'moon', label: 'Moon/24-7' },
  { value: 'mic', label: 'Microphone' },
];

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────
interface MarketingContentEditorProps {
  agency: any;
  demoMode: boolean;
  refreshAgency: () => Promise<void>;
  isDark: boolean;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  agencyPrimaryColor: string;
  backendUrl: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Accordion section wrapper
// ────────────────────────────────────────────────────────────────────────────
function Section({
  title, icon: Icon, description, isOpen, onToggle, children, isDark, textColor, mutedTextColor, borderColor, cardBg, agencyPrimaryColor
}: {
  title: string; icon: any; description: string; isOpen: boolean; onToggle: () => void;
  children: React.ReactNode;
  isDark: boolean; textColor: string; mutedTextColor: string; borderColor: string; cardBg: string; agencyPrimaryColor: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 sm:p-5 text-left transition-colors"
        style={{ borderBottom: isOpen ? `1px solid ${borderColor}` : 'none' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm block" style={{ color: textColor }}>{title}</span>
          <span className="text-xs" style={{ color: mutedTextColor }}>{description}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: mutedTextColor }} /> : <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: mutedTextColor }} />}
      </button>
      {isOpen && <div className="p-4 sm:p-5 space-y-4">{children}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export default function MarketingContentEditor({
  agency, demoMode, refreshAgency,
  isDark, textColor, mutedTextColor, borderColor, cardBg, inputBg, inputBorder, agencyPrimaryColor, backendUrl
}: MarketingContentEditorProps) {

  const [config, setConfig] = useState<EditorConfig>(DEFAULT_CONFIG);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['hero']));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing marketing_config from agency
  useEffect(() => {
    if (!agency) return;
    const mc = agency.marketing_config;
    if (mc && typeof mc === 'object') {
      setConfig(prev => ({
        hero: { ...prev.hero, ...mc.hero },
        stats: { ...prev.stats, ...mc.stats },
        problems: mc.problems?.length ? mc.problems : prev.problems,
        solution: { ...prev.solution, ...mc.solution },
        steps: mc.steps?.length ? mc.steps : prev.steps,
        features: mc.features?.length ? mc.features : prev.features,
        pricing: mc.pricing?.length ? mc.pricing.map((t: any) => ({ ...t, price: typeof t.price === 'number' ? t.price : parseInt(t.price) || 0 })) : prev.pricing,
        faqs: mc.faqs?.length ? mc.faqs.map((f: any) => ({ question: f.question || '', answer: f.answer || '' })) : prev.faqs,
        footer: { ...prev.footer, email: mc.footer?.email || prev.footer.email, tagline: mc.footer?.tagline || prev.footer.tagline },
      }));
    }
  }, [agency]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const update = useCallback((updater: (prev: EditorConfig) => EditorConfig) => {
    setConfig(prev => updater(prev));
    setHasChanges(true);
    setSaved(false);
  }, []);

  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor };
  const inputClass = "w-full rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors focus:outline-none";
  const labelStyle = { color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' };
  const labelClass = "block text-xs sm:text-sm font-medium mb-1.5";

  // Save handler — deep merges with existing marketing_config to preserve
  // sections this editor doesn't manage (benefits, industries, testimonials, etc.)
  const handleSave = async () => {
    if (demoMode) { setSaved(true); setHasChanges(false); setTimeout(() => setSaved(false), 3000); return; }
    if (!agency) return;
    setSaving(true); setSaved(false);
    try {
      // Deep merge: preserve existing marketing_config keys not managed by editor
      const existing = (agency.marketing_config && typeof agency.marketing_config === 'object') ? agency.marketing_config : {};
      const merged = {
        ...existing,
        hero: config.hero,
        stats: config.stats,
        problems: config.problems,
        solution: config.solution,
        steps: config.steps,
        features: config.features,
        pricing: config.pricing,
        faqs: config.faqs,
        footer: { ...(existing.footer || {}), email: config.footer.email, tagline: config.footer.tagline },
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ marketing_config: merged }),
      });
      if (response.ok) {
        await refreshAgency();
        setSaved(true); setHasChanges(false);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Failed to save marketing content:', error);
      alert('Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const sectionTheme = { isDark, textColor, mutedTextColor, borderColor, cardBg, agencyPrimaryColor };
  const subCardStyle = { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', border: `1px solid ${borderColor}` };

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
        <h3 className="font-medium text-sm sm:text-base mb-1" style={{ color: textColor }}>Website Content</h3>
        <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>
          Customize every section of your marketing website. Click a section to expand and edit.
        </p>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <Section title="Hero Section" icon={Type} description="Headline, subtitle, demo phone, trust badges"
        isOpen={openSections.has('hero')} onToggle={() => toggleSection('hero')} {...sectionTheme}>
        <div>
          <label className={labelClass} style={labelStyle}>Badge Text</label>
          <input type="text" value={config.hero.badge} onChange={e => update(p => ({ ...p, hero: { ...p.hero, badge: e.target.value } }))}
            placeholder="AI-Powered Phone Answering" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Headline Lines (one per line)</label>
          <textarea value={config.hero.headline.join('\n')} rows={2}
            onChange={e => update(p => ({ ...p, hero: { ...p.hero, headline: e.target.value.split('\n') } }))}
            placeholder={"Never Miss\nAnother Call"} className={inputClass + ' resize-none'} style={inputStyle} />
          <p className="mt-1 text-xs" style={{ color: mutedTextColor }}>Each line renders separately. Usually 2 lines.</p>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Subtitle</label>
          <input type="text" value={config.hero.subtitle} onChange={e => update(p => ({ ...p, hero: { ...p.hero, subtitle: e.target.value } }))}
            placeholder="AI Receptionist Starting at $49/month" className={inputClass} style={inputStyle} />
          <p className="mt-1 text-xs" style={{ color: mutedTextColor }}>Appears below the headline in smaller text.</p>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Description</label>
          <textarea value={config.hero.description} rows={3}
            onChange={e => update(p => ({ ...p, hero: { ...p.hero, description: e.target.value } }))}
            placeholder="Professional AI that answers every call..." className={inputClass + ' resize-y'} style={inputStyle} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" style={{ color: agencyPrimaryColor }} />Demo Phone Number</span>
            </label>
            <input type="text" value={config.hero.demoPhone}
              onChange={e => update(p => ({ ...p, hero: { ...p.hero, demoPhone: e.target.value } }))}
              placeholder="(470) 555-0199" className={inputClass} style={inputStyle} />
            <p className="mt-1 text-xs" style={{ color: mutedTextColor }}>Leave empty to use your auto-provisioned demo number.</p>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Demo Instructions</label>
            <input type="text" value={config.hero.demoInstructions}
              onChange={e => update(p => ({ ...p, hero: { ...p.hero, demoInstructions: e.target.value } }))}
              placeholder="Takes 30 seconds. Free to call." className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Trust Items (one per line)</label>
          <textarea value={config.hero.trustItems.join('\n')} rows={3}
            onChange={e => update(p => ({ ...p, hero: { ...p.hero, trustItems: e.target.value.split('\n').filter(Boolean) } }))}
            placeholder={"10-Minute Setup\nNo Credit Card Required\n24/7 Call Answering"} className={inputClass + ' resize-none'} style={inputStyle} />
          <p className="mt-1 text-xs" style={{ color: mutedTextColor }}>Shown as checkmarks below the hero CTAs.</p>
        </div>
      </Section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <Section title="Stats Bar" icon={BarChart3} description="Key numbers shown below the hero"
        isOpen={openSections.has('stats')} onToggle={() => toggleSection('stats')} {...sectionTheme}>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'setupTime' as const, label: 'Setup Time', placeholder: '10 min' },
            { key: 'responseTime' as const, label: 'Response Time', placeholder: '< 1 sec' },
            { key: 'businessesServed' as const, label: 'Businesses Served', placeholder: '200+' },
            { key: 'satisfaction' as const, label: 'Satisfaction Rate', placeholder: '96%' },
          ]).map(s => (
            <div key={s.key}>
              <label className={labelClass} style={labelStyle}>{s.label}</label>
              <input type="text" value={config.stats[s.key]}
                onChange={e => update(p => ({ ...p, stats: { ...p.stats, [s.key]: e.target.value } }))}
                placeholder={s.placeholder} className={inputClass} style={inputStyle} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── PROBLEMS ──────────────────────────────────────────────────── */}
      <Section title="Problem Statements" icon={AlertTriangle} description="Pain points your clients' customers face"
        isOpen={openSections.has('problems')} onToggle={() => toggleSection('problems')} {...sectionTheme}>
        {config.problems.map((p, i) => (
          <div key={i} className="rounded-lg p-3 space-y-3" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>Problem {i + 1}</span>
              {config.problems.length > 1 && (
                <button onClick={() => update(prev => ({ ...prev, problems: prev.problems.filter((_, j) => j !== i) }))}
                  className="p-1 rounded transition-colors" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <input type="text" value={p.title} placeholder="Problem title"
              onChange={e => update(prev => ({ ...prev, problems: prev.problems.map((pr, j) => j === i ? { ...pr, title: e.target.value } : pr) }))}
              className={inputClass} style={inputStyle} />
            <textarea value={p.description} placeholder="Description or quote" rows={2}
              onChange={e => update(prev => ({ ...prev, problems: prev.problems.map((pr, j) => j === i ? { ...pr, description: e.target.value } : pr) }))}
              className={inputClass + ' resize-none'} style={inputStyle} />
          </div>
        ))}
        {config.problems.length < 5 && (
          <button onClick={() => update(p => ({ ...p, problems: [...p.problems, { title: '', description: '' }] }))}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
            <Plus className="h-3.5 w-3.5" />Add Problem
          </button>
        )}
      </Section>

      {/* ── SOLUTION ──────────────────────────────────────────────────── */}
      <Section title="Solution" icon={Lightbulb} description="How your service solves those problems"
        isOpen={openSections.has('solution')} onToggle={() => toggleSection('solution')} {...sectionTheme}>
        <div>
          <label className={labelClass} style={labelStyle}>Headline</label>
          <input type="text" value={config.solution.headline}
            onChange={e => update(p => ({ ...p, solution: { ...p.solution, headline: e.target.value } }))}
            placeholder="Your 24/7 AI Receptionist" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Paragraphs</label>
          {config.solution.paragraphs.map((para, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <textarea value={para} rows={2}
                onChange={e => update(p => ({ ...p, solution: { ...p.solution, paragraphs: p.solution.paragraphs.map((pp, j) => j === i ? e.target.value : pp) } }))}
                className={inputClass + ' resize-none flex-1'} style={inputStyle} />
              {config.solution.paragraphs.length > 1 && (
                <button onClick={() => update(p => ({ ...p, solution: { ...p.solution, paragraphs: p.solution.paragraphs.filter((_, j) => j !== i) } }))}
                  className="p-1 self-start mt-2" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
          {config.solution.paragraphs.length < 4 && (
            <button onClick={() => update(p => ({ ...p, solution: { ...p.solution, paragraphs: [...p.solution.paragraphs, ''] } }))}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
              <Plus className="h-3.5 w-3.5" />Add Paragraph
            </button>
          )}
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Highlight Callout</label>
          <textarea value={config.solution.highlight} rows={2}
            onChange={e => update(p => ({ ...p, solution: { ...p.solution, highlight: e.target.value } }))}
            className={inputClass + ' resize-y'} style={inputStyle} />
        </div>
      </Section>

      {/* ── STEPS ─────────────────────────────────────────────────────── */}
      <Section title="How It Works" icon={ListOrdered} description="Step-by-step onboarding process"
        isOpen={openSections.has('steps')} onToggle={() => toggleSection('steps')} {...sectionTheme}>
        {config.steps.map((step, i) => (
          <div key={i} className="rounded-lg p-3 space-y-2" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>Step {i + 1}</span>
              {config.steps.length > 2 && (
                <button onClick={() => update(p => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }))}
                  className="p-1 rounded" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <input type="text" value={step.title} placeholder="Step title"
              onChange={e => update(p => ({ ...p, steps: p.steps.map((s, j) => j === i ? { ...s, title: e.target.value } : s) }))}
              className={inputClass} style={inputStyle} />
            <textarea value={step.description} placeholder="Step description" rows={2}
              onChange={e => update(p => ({ ...p, steps: p.steps.map((s, j) => j === i ? { ...s, description: e.target.value } : s) }))}
              className={inputClass + ' resize-none'} style={inputStyle} />
            <input type="text" value={step.time} placeholder="2 minutes"
              onChange={e => update(p => ({ ...p, steps: p.steps.map((s, j) => j === i ? { ...s, time: e.target.value } : s) }))}
              className={inputClass} style={inputStyle} />
          </div>
        ))}
        {config.steps.length < 6 && (
          <button onClick={() => update(p => ({ ...p, steps: [...p.steps, { title: '', description: '', time: '' }] }))}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
            <Plus className="h-3.5 w-3.5" />Add Step
          </button>
        )}
      </Section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <Section title="Features" icon={LayoutGrid} description="Key capabilities to highlight"
        isOpen={openSections.has('features')} onToggle={() => toggleSection('features')} {...sectionTheme}>
        {config.features.map((feat, i) => (
          <div key={i} className="rounded-lg p-3 space-y-2" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>Feature {i + 1}</span>
              {config.features.length > 1 && (
                <button onClick={() => update(p => ({ ...p, features: p.features.filter((_, j) => j !== i) }))}
                  className="p-1 rounded" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
              <input type="text" value={feat.title} placeholder="Feature title"
                onChange={e => update(p => ({ ...p, features: p.features.map((f, j) => j === i ? { ...f, title: e.target.value } : f) }))}
                className={inputClass} style={inputStyle} />
              <select value={feat.icon}
                onChange={e => update(p => ({ ...p, features: p.features.map((f, j) => j === i ? { ...f, icon: e.target.value } : f) }))}
                className={inputClass} style={inputStyle}>
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <textarea value={feat.description} placeholder="Feature description" rows={2}
              onChange={e => update(p => ({ ...p, features: p.features.map((f, j) => j === i ? { ...f, description: e.target.value } : f) }))}
              className={inputClass + ' resize-none'} style={inputStyle} />
          </div>
        ))}
        {config.features.length < 8 && (
          <button onClick={() => update(p => ({ ...p, features: [...p.features, { title: '', description: '', icon: 'calendar' }] }))}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
            <Plus className="h-3.5 w-3.5" />Add Feature
          </button>
        )}
      </Section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <Section title="Pricing Tiers" icon={DollarSign} description="Plans and pricing shown on your website"
        isOpen={openSections.has('pricing')} onToggle={() => toggleSection('pricing')} {...sectionTheme}>
        {config.pricing.map((tier, i) => (
          <div key={i} className="rounded-lg p-3 space-y-3" style={{
            ...subCardStyle,
            border: tier.isPopular ? `2px solid ${agencyPrimaryColor}` : subCardStyle.border
          }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>Tier {i + 1}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: tier.isPopular ? agencyPrimaryColor : mutedTextColor }}>
                  <input type="checkbox" checked={tier.isPopular}
                    onChange={e => update(p => ({ ...p, pricing: p.pricing.map((t, j) => ({ ...t, isPopular: j === i ? e.target.checked : false })) }))} />
                  <Star className="h-3 w-3" />Popular
                </label>
                {config.pricing.length > 1 && (
                  <button onClick={() => update(p => ({ ...p, pricing: p.pricing.filter((_, j) => j !== i) }))}
                    className="p-1 rounded" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input type="text" value={tier.name} placeholder="Plan name"
                onChange={e => update(p => ({ ...p, pricing: p.pricing.map((t, j) => j === i ? { ...t, name: e.target.value } : t) }))}
                className={inputClass} style={inputStyle} />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: mutedTextColor }}>$</span>
                <input type="number" value={tier.price} placeholder="99"
                  onChange={e => update(p => ({ ...p, pricing: p.pricing.map((t, j) => j === i ? { ...t, price: parseInt(e.target.value) || 0 } : t) }))}
                  className={inputClass + ' pl-7'} style={inputStyle} />
              </div>
              <input type="text" value={tier.subtitle} placeholder="For growing businesses"
                onChange={e => update(p => ({ ...p, pricing: p.pricing.map((t, j) => j === i ? { ...t, subtitle: e.target.value } : t) }))}
                className={inputClass + ' col-span-2 sm:col-span-1'} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={labelStyle}>Features (one per line)</label>
              <textarea value={tier.features.join('\n')} rows={4}
                onChange={e => update(p => ({ ...p, pricing: p.pricing.map((t, j) => j === i ? { ...t, features: e.target.value.split('\n').filter(Boolean) } : t) }))}
                placeholder={"Everything in Starter\nUp to 150 calls/month\nLead qualification"}
                className={inputClass + ' resize-y font-mono text-xs'} style={inputStyle} />
            </div>
          </div>
        ))}
        {config.pricing.length < 4 && (
          <button onClick={() => update(p => ({ ...p, pricing: [...p.pricing, { name: '', price: 0, subtitle: '', features: [], isPopular: false }] }))}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
            <Plus className="h-3.5 w-3.5" />Add Tier
          </button>
        )}
      </Section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <Section title="FAQ" icon={HelpCircle} description="Common questions and answers"
        isOpen={openSections.has('faq')} onToggle={() => toggleSection('faq')} {...sectionTheme}>
        {config.faqs.map((faq, i) => (
          <div key={i} className="rounded-lg p-3 space-y-2" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: mutedTextColor }}>FAQ {i + 1}</span>
              {config.faqs.length > 1 && (
                <button onClick={() => update(p => ({ ...p, faqs: p.faqs.filter((_, j) => j !== i) }))}
                  className="p-1 rounded" style={{ color: '#ef4444' }}><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <input type="text" value={faq.question} placeholder="Question"
              onChange={e => update(p => ({ ...p, faqs: p.faqs.map((f, j) => j === i ? { ...f, question: e.target.value } : f) }))}
              className={inputClass} style={inputStyle} />
            <textarea value={faq.answer} placeholder="Answer" rows={3}
              onChange={e => update(p => ({ ...p, faqs: p.faqs.map((f, j) => j === i ? { ...f, answer: e.target.value } : f) }))}
              className={inputClass + ' resize-y'} style={inputStyle} />
          </div>
        ))}
        {config.faqs.length < 15 && (
          <button onClick={() => update(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ color: agencyPrimaryColor, backgroundColor: `${agencyPrimaryColor}10` }}>
            <Plus className="h-3.5 w-3.5" />Add FAQ
          </button>
        )}
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <Section title="Footer" icon={FileText} description="Contact info and footer tagline"
        isOpen={openSections.has('footer')} onToggle={() => toggleSection('footer')} {...sectionTheme}>
        <div>
          <label className={labelClass} style={labelStyle}>Contact Email</label>
          <input type="email" value={config.footer.email}
            onChange={e => update(p => ({ ...p, footer: { ...p.footer, email: e.target.value } }))}
            placeholder="hello@youragency.com" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Footer Tagline</label>
          <textarea value={config.footer.tagline} rows={2}
            onChange={e => update(p => ({ ...p, footer: { ...p.footer, tagline: e.target.value } }))}
            placeholder="Professional AI that answers every call..." className={inputClass + ' resize-none'} style={inputStyle} />
        </div>
      </Section>

      {/* ── SAVE BAR ──────────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ backgroundColor: cardBg, border: `1px solid ${hasChanges ? agencyPrimaryColor : borderColor}`, transition: 'border-color 0.2s' }}>
        <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>
          {hasChanges ? 'You have unsaved changes.' : 'All changes saved and live on your marketing website.'}
        </p>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: agencyPrimaryColor }}>
              <Check className="h-4 w-4" />{demoMode ? 'Saved! (demo)' : 'Saved!'}
            </span>
          )}
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium text-white disabled:opacity-40 transition-colors w-full sm:w-auto"
            style={{ backgroundColor: agencyPrimaryColor }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
}