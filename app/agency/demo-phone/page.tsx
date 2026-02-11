'use client';

import { useState, useEffect } from 'react';
import {
  Phone, Loader2, Trash2, Plus, PhoneCall, MessageSquare,
  Headphones, Sparkles, Lock, Check, AlertCircle, Copy,
  Bot, Users, Clock, Mic, ArrowRight
} from 'lucide-react';
import { useAgency } from '../context';
import { usePlanFeatures } from '../../../hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';

// ============================================================================
// HELPERS
// ============================================================================
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return phone;
}

export default function DemoPhonePage() {
  const { agency, branding, loading: agencyLoading, refreshAgency, demoMode } = useAgency();
  const { planName } = usePlanFeatures();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';

  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding?.primaryColor || '#10b981';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

  // Subscription checks
  const subscriptionStatus = agency?.subscription_status;
  const isTrialing = subscriptionStatus === 'trialing' || subscriptionStatus === 'trial';
  const isActive = subscriptionStatus === 'active';
  // Paid = active subscription that is NOT a trial
  const isPaid = isActive && !isTrialing;
  const hasDemo = !!agency?.demo_phone_number;

  // Pre-fill area code from agency phone
  useEffect(() => {
    if (agency?.phone && !areaCode) {
      const digits = agency.phone.replace(/\D/g, '');
      const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
      if (ten.length === 10) {
        setAreaCode(ten.slice(0, 3));
      }
    }
  }, [agency?.phone]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (demoMode) {
      // Simulate creation in demo mode
      await refreshAgency();
      return;
    }

    if (!areaCode || !/^\d{3}$/.test(areaCode)) {
      setError('Please enter a valid 3-digit area code');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency?.id}/demo-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ area_code: areaCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to create demo phone');
        return;
      }

      await refreshAgency();
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (demoMode) {
      setShowDeleteConfirm(false);
      await refreshAgency();
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency?.id}/demo-phone`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete demo phone');
        return;
      }

      setShowDeleteConfirm(false);
      await refreshAgency();
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (agencyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // ============================================================================
  // LOCKED STATE — Trial or unpaid
  // ============================================================================
  if (!isPaid && !demoMode) {
    return (
      <LockedFeature
        title="Demo Phone Number"
        description="Get a dedicated phone number that showcases your AI receptionist to prospects. Available on paid plans after your trial ends."
        requiredPlan="Professional"
        badgeText="Paid Feature"
        ctaText={isTrialing ? 'Subscribe to Unlock' : 'Upgrade to Unlock'}
        currentPlanText={
          isTrialing
            ? "This feature is available once your trial converts to a paid subscription"
            : `You're on the ${agency?.plan_type || 'Starter'} plan`
        }
        features={[
          'Dedicated demo phone number',
          'AI roleplays as prospect\'s receptionist',
          'Auto-sends signup link after call',
          'Choose your own area code',
        ]}
      >
        {/* Locked preview */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: textColor }}>Demo Phone</h1>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              A dedicated phone number that showcases AI receptionist capabilities to prospects
            </p>
          </div>

          {/* How It Works — always visible */}
          <HowItWorksCard isDark={isDark} textColor={textColor} mutedTextColor={mutedTextColor} borderColor={borderColor} cardBg={cardBg} primaryColor={primaryColor} />
        </div>
      </LockedFeature>
    );
  }

  // ============================================================================
  // ACTIVE STATE — Demo exists
  // ============================================================================
  if (hasDemo) {
    const demoNumber = formatPhoneDisplay(agency!.demo_phone_number!);

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold">Demo Phone</h1>
          <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
            Your dedicated demo line for showcasing AI receptionist capabilities
          </p>
        </div>

        {/* Active Demo Card */}
        <div
          className="rounded-xl p-5 sm:p-6 mb-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Your Demo Number</h3>
                <span
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: '#10b981' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Phone number display */}
          <div
            className="flex items-center justify-between rounded-xl p-4 mb-4"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            <div className="flex items-center gap-3">
              <PhoneCall className="h-6 w-6 text-white" />
              <span className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                {demoNumber}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(agency!.demo_phone_number!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/90 hover:text-white transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Usage hints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="text-xs font-medium" style={{ color: textColor }}>Post-call SMS</p>
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>
                  Callers automatically receive your signup link via text after hanging up
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}
            >
              <Headphones className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
              <div>
                <p className="text-xs font-medium" style={{ color: textColor }}>On your marketing site</p>
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>
                  This number appears automatically in your "Experience It Live" section
                </p>
              </div>
            </div>
          </div>

          {/* Delete */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs sm:text-sm transition-colors"
              style={{ color: isDark ? '#f87171' : '#dc2626' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete demo number
            </button>
          ) : (
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
              }}
            >
              <p className="text-xs sm:text-sm" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                This will release the phone number permanently. Are you sure?
              </p>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: mutedTextColor }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <HowItWorksCard isDark={isDark} textColor={textColor} mutedTextColor={mutedTextColor} borderColor={borderColor} cardBg={cardBg} primaryColor={primaryColor} />

        {error && (
          <div
            className="mt-4 rounded-xl p-4 flex items-start gap-3 text-sm"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
              color: isDark ? '#f87171' : '#dc2626',
            }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // CREATE STATE — No demo yet, paid plan
  // ============================================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold">Demo Phone</h1>
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
          Create a dedicated phone number that showcases AI receptionist capabilities to prospects
        </p>
      </div>

      {/* Create Card */}
      <div
        className="rounded-xl p-5 sm:p-6 mb-6"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg">Create Your Demo Number</h3>
            <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>
              Get a phone number prospects can call to experience your AI receptionist
            </p>
          </div>
        </div>

        {/* Area Code Input */}
        <div className="mb-5">
          <label
            className="block text-xs sm:text-sm font-medium mb-1.5"
            style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
          >
            Area Code
          </label>
          <p className="text-[10px] sm:text-xs mb-2" style={{ color: mutedTextColor }}>
            Choose an area code that matches your target market. We'll provision a local number.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: mutedTextColor }}
              >
                (
              </span>
              <input
                type="text"
                value={areaCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setAreaCode(val);
                  setError('');
                }}
                placeholder="404"
                maxLength={3}
                className="w-24 rounded-lg pl-6 pr-6 py-2.5 text-center text-lg font-mono font-bold tracking-widest transition-colors focus:outline-none"
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textColor,
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: mutedTextColor }}
              >
                )
              </span>
            </div>
            <span className="text-sm" style={{ color: mutedTextColor }}>
              XXX-XXXX
            </span>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={creating || !areaCode || areaCode.length < 3}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: primaryColor }}
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating demo number...
            </>
          ) : (
            <>
              <Phone className="h-4 w-4" />
              Create Demo Number
            </>
          )}
        </button>

        {creating && (
          <p className="mt-3 text-xs" style={{ color: mutedTextColor }}>
            Setting up your AI assistant and provisioning a phone number. This usually takes 10-15 seconds...
          </p>
        )}

        {error && (
          <div
            className="mt-4 rounded-lg p-3 flex items-start gap-2 text-sm"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
              color: isDark ? '#f87171' : '#dc2626',
            }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* How It Works */}
      <HowItWorksCard isDark={isDark} textColor={textColor} mutedTextColor={mutedTextColor} borderColor={borderColor} cardBg={cardBg} primaryColor={primaryColor} />
    </div>
  );
}

// ============================================================================
// HOW IT WORKS CARD (shared across all states)
// ============================================================================
function HowItWorksCard({
  isDark, textColor, mutedTextColor, borderColor, cardBg, primaryColor
}: {
  isDark: boolean; textColor: string; mutedTextColor: string;
  borderColor: string; cardBg: string; primaryColor: string;
}) {
  return (
    <div
      className="rounded-xl p-5 sm:p-6"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
    >
      <h3 className="font-semibold text-sm sm:text-base mb-1">How the Demo Works</h3>
      <p className="text-xs sm:text-sm mb-5" style={{ color: mutedTextColor }}>
        When a prospect calls your demo number, the AI walks them through an interactive experience
      </p>

      {/* Conversation flow */}
      <div className="space-y-4 mb-6">
        {[
          {
            step: '1',
            icon: Mic,
            title: 'AI greets the caller',
            desc: 'A warm, professional voice answers and explains this is a live demo of your AI receptionist service.',
          },
          {
            step: '2',
            icon: Users,
            title: 'Gathers business context',
            desc: 'The AI asks "What type of business do you run?" — plumber, dentist, lawyer, restaurant, anything.',
          },
          {
            step: '3',
            icon: Bot,
            title: 'Roleplays as their receptionist',
            desc: 'Based on their answer, the AI acts out a realistic call scenario for their industry — taking a service request, scheduling an appointment, handling an intake call, etc.',
          },
          {
            step: '4',
            icon: Sparkles,
            title: 'Showcases key features',
            desc: 'The AI naturally mentions instant text summaries, 24/7 availability, and how setup takes just minutes — all within the conversation.',
          },
          {
            step: '5',
            icon: MessageSquare,
            title: 'Follow-up SMS with signup link',
            desc: 'After the call ends, the caller automatically receives a text with your signup link so they can start their free trial.',
          },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium" style={{ color: textColor }}>
                <span
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold mr-1.5"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  {item.step}
                </span>
                {item.title}
              </p>
              <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: mutedTextColor }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* What the caller experiences */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
          border: `1px solid ${borderColor}`,
        }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: textColor }}>
          💡 Why this converts
        </p>
        <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: mutedTextColor }}>
          Instead of explaining what an AI receptionist does, prospects <strong style={{ color: textColor }}>experience it firsthand</strong>. 
          They hear the voice quality, feel the natural conversation flow, and see how it handles their specific industry — 
          all in a 60-second phone call. The follow-up text makes it effortless to convert from "that was cool" to "I want this for my business."
        </p>
      </div>
    </div>
  );
}