'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Phone, Mail, Globe, Building2, User,
  Calendar, DollarSign, Tag, FileText, Save
} from 'lucide-react';
import { useAgency } from '../../context';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal Sent' },
];

const SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'website', label: 'Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event/Trade Show' },
  { value: 'other', label: 'Other' },
];

export default function NewLeadPage() {
  const router = useRouter();
  const { agency, loading: contextLoading } = useAgency();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;
    
    if (!formData.business_name.trim()) {
      setError('Business name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        estimated_value: formData.estimated_value 
          ? Math.round(parseFloat(formData.estimated_value) * 100) 
          : null,
        next_follow_up: formData.next_follow_up || null,
      };

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      const data = await response.json();
      router.push(`/agency/leads/${data.lead.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
      setSaving(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        
        <h1 className="text-2xl font-semibold tracking-tight">Add New Lead</h1>
        <p className="mt-1 text-[#fafaf9]/50">Track a potential client in your pipeline</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
                  <label className="block text-sm text-[#fafaf9]/50 mb-1.5">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                    required
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
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h3 className="font-medium mb-5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#fafaf9]/50" />
                Initial Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How did you find this lead? Any initial impressions or context..."
                rows={4}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none resize-none"
              />
            </div>
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
                  <p className="text-xs text-[#fafaf9]/30 mt-1">Expected monthly recurring revenue</p>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}