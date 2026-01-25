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

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'contacted':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'qualified':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'proposal':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'won':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'lost':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-white/[0.06] text-[#fafaf9]/50 border-white/[0.08]';
  }
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { agency, loading: contextLoading } = useAgency();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activityKey, setActivityKey] = useState(0);  // For refreshing activity log
  
  // Composer modal state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  
  // Form state
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
      
      // Populate form
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
      setActivityKey(prev => prev + 1);  // Refresh activity log
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
        setActivityKey(prev => prev + 1);  // Refresh activity log
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
    setActivityKey(prev => prev + 1);  // Refresh activity log
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-6 lg:p-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="text-center py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-8 w-8 text-red-400/50" />
          </div>
          <p className="mt-4 font-medium text-[#fafaf9]/70">{error}</p>
          <Link 
            href="/agency/leads"
            className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back Button & Header */}
      <div className="mb-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/10">
              <span className="text-2xl font-medium text-blue-400">
                {lead?.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{lead?.business_name}</h1>
              <p className="mt-1 text-[#fafaf9]/50">
                Added {lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50"
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
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#fafaf9]/50">Quick Actions:</span>
        <button
          onClick={() => openComposer('email')}
          disabled={!lead?.email}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="h-4 w-4" />
          Send Email
        </button>
        <button
          onClick={() => openComposer('sms')}
          disabled={!lead?.phone}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4" />
          Send SMS
        </button>
        {lead?.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            Call
          </a>
        )}
      </div>

      {/* Quick Status Buttons */}
      <div className="mb-8">
        <p className="text-sm text-[#fafaf9]/50 mb-3">Pipeline Stage</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => handleQuickStatusChange(status.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                formData.status === status.value
                  ? getStatusStyle(status.value) + ' border-current'
                  : 'border-white/[0.08] bg-white/[0.02] text-[#fafaf9]/60 hover:bg-white/[0.04]'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Business Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#fafaf9]/50" />
              Business Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Plumbing, HVAC, Dental"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-[#fafaf9]/50" />
              Contact Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-5 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#fafaf9]/50" />
              Internal Notes
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this lead... meetings, conversations, next steps, etc."
              rows={6}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none resize-none"
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
        <div className="space-y-6">
          {/* Lead Status & Source */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-5 flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#fafaf9]/50" />
              Lead Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
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
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-5 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#fafaf9]/50" />
              Deal Info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Estimated Value ($/mo)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                    placeholder="99"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#fafaf9]/50 mb-1.5">Next Follow-up</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
                  <input
                    type="date"
                    value={formData.next_follow_up}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#fafaf9]/50" />
              Timestamps
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#fafaf9]/50">Created</span>
                <span>{lead?.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#fafaf9]/50">Last Updated</span>
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