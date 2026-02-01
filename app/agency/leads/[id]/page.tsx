'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Phone, Mail, Globe, Building2, User,
  Calendar, DollarSign, Tag, FileText, Save, Trash2, Clock,
  CheckCircle, XCircle, MessageSquare, PhoneCall
} from 'lucide-react';
import { useAgency } from '../../context';
import ActivityLog from '../../../../components/ActivityLog';
import ComposerModal from '../../../../components/ComposerModal';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  source: string;
  status: string;
  notes: string;
  estimated_value: number;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'amber' },
  { value: 'qualified', label: 'Qualified', color: 'purple' },
  { value: 'proposal', label: 'Proposal Sent', color: 'cyan' },
  { value: 'won', label: 'Won', color: 'emerald' },
  { value: 'lost', label: 'Lost', color: 'red' },
];

const SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'website', label: 'Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event/Trade Show' },
  { value: 'other', label: 'Other' },
];

// Helper to determine text color based on background luminance
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#050505' : '#ffffff';
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { agency, branding, loading: contextLoading } = useAgency();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activityKey, setActivityKey] = useState(0);
  
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    source: '',
    status: 'new',
    notes: '',
    estimated_value: '',
    next_follow_up: '',
  });

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  const buttonTextColor = getContrastColor(primaryColor);

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(59,130,246,0.1)', text: isDark ? '#60a5fa' : '#2563eb', border: 'rgba(59,130,246,0.2)' };
      case 'contacted':
        return { bg: 'rgba(245,158,11,0.1)', text: isDark ? '#fbbf24' : '#d97706', border: 'rgba(245,158,11,0.2)' };
      case 'qualified':
        return { bg: 'rgba(168,85,247,0.1)', text: isDark ? '#a78bfa' : '#7c3aed', border: 'rgba(168,85,247,0.2)' };
      case 'proposal':
        return { bg: 'rgba(6,182,212,0.1)', text: isDark ? '#22d3ee' : '#0891b2', border: 'rgba(6,182,212,0.2)' };
      case 'won':
        return { bg: `${primaryColor}15`, text: primaryColor, border: `${primaryColor}30` };
      case 'lost':
        return { bg: 'rgba(239,68,68,0.1)', text: isDark ? '#f87171' : '#dc2626', border: 'rgba(239,68,68,0.2)' };
      default:
        return { bg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', text: mutedTextColor, border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' };
    }
  };

  useEffect(() => {
    if (agency && leadId) {
      fetchLead();
    }
  }, [agency, leadId]);

  const fetchLead = async () => {
    if (!agency || !leadId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Lead not found');
        } else {
          setError('Failed to load lead');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLead(data.lead);
      
      setFormData({
        business_name: data.lead.business_name || '',
        contact_name: data.lead.contact_name || '',
        email: data.lead.email || '',
        phone: data.lead.phone || '',
        website: data.lead.website || '',
        industry: data.lead.industry || '',
        source: data.lead.source || '',
        status: data.lead.status || 'new',
        notes: data.lead.notes || '',
        estimated_value: data.lead.estimated_value ? String(data.lead.estimated_value / 100) : '',
        next_follow_up: data.lead.next_follow_up ? data.lead.next_follow_up.split('T')[0] : '',
      });
    } catch (err) {
      console.error('Failed to fetch lead:', err);
      setError('Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agency || !leadId) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        estimated_value: formData.estimated_value 
          ? Math.round(parseFloat(formData.estimated_value) * 100) 
          : null,
        next_follow_up: formData.next_follow_up || null,
        userId: user.id,
      };

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await response.json();
      setLead(data.lead);
      setSuccessMessage('Lead updated successfully');
      setActivityKey(prev => prev + 1);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agency || !leadId) return;
    
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      router.push('/agency/leads');
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead');
      setDeleting(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!agency || !leadId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setFormData(prev => ({ ...prev, status: newStatus }));
        setSuccessMessage('Status updated');
        setActivityKey(prev => prev + 1);
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openComposer = (type: 'email' | 'sms') => {
    setComposerType(type);
    setComposerOpen(true);
  };

  const handleOutreachSent = () => {
    setActivityKey(prev => prev + 1);
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="text-center py-16 sm:py-20">
          <div 
            className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <XCircle className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: isDark ? '#f87171' : '#dc2626', opacity: 0.5 }} />
          </div>
          <p className="mt-4 font-medium" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>{error}</p>
          <Link 
            href="/agency/leads"
            className="mt-4 inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button & Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
            >
              <span className="text-lg sm:text-2xl font-medium" style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                {lead?.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">{lead?.business_name}</h1>
              <p className="text-sm" style={{ color: mutedTextColor }}>
                Added {lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: isDark ? '#f87171' : '#dc2626',
              }}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex-1 sm:flex-none justify-center"
              style={{ backgroundColor: primaryColor, color: buttonTextColor }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div 
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 text-sm"
          style={{
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
            color: isDark ? '#f87171' : '#dc2626',
          }}
        >
          {error}
        </div>
      )}
      {successMessage && (
        <div 
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 text-sm flex items-center gap-2"
          style={{
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}30`,
            color: primaryColor,
          }}
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="mb-6 sm:mb-8">
        <span className="text-xs sm:text-sm block mb-2 sm:mb-3" style={{ color: mutedTextColor }}>Quick Actions:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openComposer('email')}
            disabled={!lead?.email}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: isDark ? '#a78bfa' : '#7c3aed',
            }}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => openComposer('sms')}
            disabled={!lead?.phone}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: isDark ? '#22d3ee' : '#0891b2',
            }}
          >
            <MessageSquare className="h-4 w-4" />
            SMS
          </button>
          {lead?.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: isDark ? '#4ade80' : '#16a34a',
              }}
            >
              <PhoneCall className="h-4 w-4" />
              Call
            </a>
          )}
        </div>
      </div>

      {/* Quick Status Buttons */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: mutedTextColor }}>Pipeline Stage</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => {
            const style = getStatusStyle(status.value);
            const isActive = formData.status === status.value;
            return (
              <button
                key={status.value}
                onClick={() => handleQuickStatusChange(status.value)}
                className="rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all"
                style={isActive ? {
                  backgroundColor: style.bg,
                  border: `1px solid ${style.text}`,
                  color: style.text,
                } : {
                  backgroundColor: cardBg,
                  border: `1px solid ${inputBorder}`,
                  color: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280',
                }}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Business Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Business Information */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="h-4 w-4" style={{ color: mutedTextColor }} />
              Business Information
            </h3>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Business Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Plumbing, HVAC"
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
              <User className="h-4 w-4" style={{ color: mutedTextColor }} />
              Contact Information
            </h3>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-4 w-4" style={{ color: mutedTextColor }} />
              Internal Notes
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this lead..."
              rows={4}
              className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm resize-none focus:outline-none"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
            />
          </div>

          {/* Activity Log */}
          {agency && lead && (
            <ActivityLog 
              key={activityKey}
              agencyId={agency.id} 
              entityType="lead" 
              entityId={lead.id} 
            />
          )}
        </div>

        {/* Right Column - Lead Details */}
        <div className="space-y-4 sm:space-y-6">
          {/* Lead Status & Source */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
              <Tag className="h-4 w-4" style={{ color: mutedTextColor }} />
              Lead Details
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                >
                  <option value="">Select source</option>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deal Value & Follow-up */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="h-4 w-4" style={{ color: mutedTextColor }} />
              Deal Info
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Estimated Value ($/mo)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                    placeholder="99"
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Next Follow-up</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type="date"
                    value={formData.next_follow_up}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))}
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Clock className="h-4 w-4" style={{ color: mutedTextColor }} />
              Timestamps
            </h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span style={{ color: mutedTextColor }}>Created</span>
                <span>{lead?.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: mutedTextColor }}>Last Updated</span>
                <span>{lead?.updated_at ? new Date(lead.updated_at).toLocaleString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composer Modal */}
      {agency && lead && (
        <ComposerModal
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          agencyId={agency.id}
          lead={lead}
          type={composerType}
          onSent={handleOutreachSent}
        />
      )}
    </div>
  );
}