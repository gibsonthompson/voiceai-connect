'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Building2, User, Mail, Phone, MapPin, Globe, Sparkles, Lock, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAgency } from '../../context';
import { countries as SUPPORTED_COUNTRIES } from '@/lib/currency';

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

// Canadian provinces for CA country selection
const CA_PROVINCES = [
  { value: 'AB', label: 'Alberta' }, { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' }, { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' }, { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' }, { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' }, { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' }, { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' }
];

// Country calling codes for phone formatting hints
const COUNTRY_PHONE_CODES: Record<string, { code: string; placeholder: string; minDigits: number; maxDigits: number }> = {
  US: { code: '+1', placeholder: '(770) 555-1234', minDigits: 10, maxDigits: 10 },
  CA: { code: '+1', placeholder: '(416) 555-1234', minDigits: 10, maxDigits: 10 },
  GB: { code: '+44', placeholder: '7911 123456', minDigits: 10, maxDigits: 11 },
  AU: { code: '+61', placeholder: '0412 345 678', minDigits: 9, maxDigits: 10 },
  DE: { code: '+49', placeholder: '0151 12345678', minDigits: 10, maxDigits: 12 },
  FR: { code: '+33', placeholder: '06 12 34 56 78', minDigits: 9, maxDigits: 10 },
  NL: { code: '+31', placeholder: '06 12345678', minDigits: 9, maxDigits: 10 },
  IN: { code: '+91', placeholder: '98765 43210', minDigits: 10, maxDigits: 10 },
  NZ: { code: '+64', placeholder: '021 123 4567', minDigits: 8, maxDigits: 10 },
  SG: { code: '+65', placeholder: '9123 4567', minDigits: 8, maxDigits: 8 },
  JP: { code: '+81', placeholder: '090-1234-5678', minDigits: 10, maxDigits: 11 },
  BR: { code: '+55', placeholder: '11 91234-5678', minDigits: 10, maxDigits: 11 },
  MX: { code: '+52', placeholder: '55 1234 5678', minDigits: 10, maxDigits: 10 },
  AE: { code: '+971', placeholder: '50 123 4567', minDigits: 9, maxDigits: 9 },
};

// Fallback for countries not in the map
const DEFAULT_PHONE_CONFIG = { code: '', placeholder: 'Phone number', minDigits: 7, maxDigits: 15 };

const INDUSTRIES = [
  { value: 'home_services', label: 'Home Services' },
  { value: 'medical_dental', label: 'Medical & Dental' },
  { value: 'legal', label: 'Legal' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant & Food Service' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'beauty_wellness', label: 'Beauty & Wellness' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'fitness', label: 'Fitness & Recreation' },
  { value: 'other', label: 'Other' }
];

const PLAN_TYPES = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'growth', label: 'Growth' }
];

const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#050505' : '#ffffff';
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface FormData {
  businessName: string;
  industry: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  websiteUrl: string;
  planType: string;
  tempPassword: string;
}

export default function AddClientPage() {
  const { agency, branding, loading: contextLoading } = useAgency();
  const router = useRouter();

  // Default country to agency's country, fallback to US
  const defaultCountry = agency?.country?.toUpperCase() || 'US';

  const [form, setForm] = useState<FormData>({
    businessName: '',
    industry: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessCity: '',
    businessState: '',
    businessCountry: defaultCountry,
    websiteUrl: '',
    planType: 'starter',
    tempPassword: generateTempPassword()
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<{ clientId: string; businessName: string; phoneNumber: string; email: string; tempPassword: string } | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  const buttonTextColor = getContrastColor(primaryColor);

  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const labelColor = isDark ? 'rgba(250,250,249,0.7)' : '#374151';
  const errorBg = isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2';
  const errorBorder = isDark ? 'rgba(239,68,68,0.2)' : '#fecaca';
  const errorText = isDark ? '#f87171' : '#dc2626';
  const successBg = isDark ? `${primaryColor}10` : `${primaryColor}08`;

  // Derived state
  const isUS = form.businessCountry === 'US';
  const isCA = form.businessCountry === 'CA';
  const hasStateDropdown = isUS || isCA;
  const phoneConfig = COUNTRY_PHONE_CODES[form.businessCountry] || DEFAULT_PHONE_CONFIG;
  const selectedCountryData = SUPPORTED_COUNTRIES.find(c => c.code === form.businessCountry);

  const updateForm = (field: keyof FormData, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Reset state when country changes
      if (field === 'businessCountry' && value !== prev.businessCountry) {
        updated.businessState = '';
        updated.phone = ''; // Reset phone since format changes
      }
      return updated;
    });
    if (error || fieldErrors.length) {
      setError('');
      setFieldErrors([]);
    }
  };

  const formatPhoneDisplay = (value: string) => {
    // Only format US/CA phones with the mask
    if (isUS || isCA) {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // For international, just return the raw digits — let user format themselves
    return value;
  };

  const handlePhoneChange = (value: string) => {
    if (isUS || isCA) {
      // US/CA: strip to digits, max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      updateForm('phone', digits);
    } else {
      // International: allow digits, spaces, dashes, parens — store as-is
      // Strip everything except digits for storage
      const cleaned = value.replace(/[^\d\s\-()+ ]/g, '');
      updateForm('phone', cleaned);
    }
  };

  const getPhoneDigitCount = (phone: string): number => {
    return phone.replace(/\D/g, '').length;
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter': return agency.price_starter || 4900;
      case 'pro': return agency.price_pro || 9900;
      case 'growth': return agency.price_growth || 14900;
      default: return 0;
    }
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.businessName.trim()) errs.push('Business name is required');
    if (!form.industry) errs.push('Industry is required');
    if (!form.firstName.trim()) errs.push('First name is required');
    if (!form.email.trim() || !form.email.includes('@')) errs.push('Valid email is required');

    // Phone validation — adaptive to country
    const digitCount = getPhoneDigitCount(form.phone);
    const minDigits = phoneConfig.minDigits;
    const maxDigits = phoneConfig.maxDigits;
    if (digitCount < minDigits || digitCount > maxDigits) {
      if (minDigits === maxDigits) {
        errs.push(`Phone number must be ${minDigits} digits for ${selectedCountryData?.name || form.businessCountry}`);
      } else {
        errs.push(`Phone number must be ${minDigits}-${maxDigits} digits for ${selectedCountryData?.name || form.businessCountry}`);
      }
    }

    if (!form.businessCity.trim()) errs.push('City is required');
    if (!form.businessState.trim()) errs.push(isUS ? 'State is required' : isCA ? 'Province is required' : 'State / Region is required');
    if (!form.businessCountry) errs.push('Country is required');
    if (!form.tempPassword || form.tempPassword.length < 6) errs.push('Temporary password is required (min 6 characters)');
    if (errs.length > 0) {
      setFieldErrors(errs);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!agency) return;
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    setFieldErrors([]);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      // Strip phone to digits only for backend
      const phoneDigits = form.phone.replace(/\D/g, '');

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: phoneDigits,
          businessName: form.businessName.trim(),
          industry: form.industry,
          businessCity: form.businessCity.trim(),
          businessState: form.businessState.trim(),
          businessCountry: form.businessCountry,
          websiteUrl: form.websiteUrl.trim() || undefined,
          planType: form.planType,
          tempPassword: form.tempPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.message || data.error || 'Failed to add client');
        }
        return;
      }

      setSuccess({
        clientId: data.client.id,
        businessName: data.client.business_name,
        phoneNumber: data.client.phone_number,
        email: data.client.email,
        tempPassword: form.tempPassword
      });

    } catch (err) {
      console.error('Add client error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-5"
            style={{ backgroundColor: successBg }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
          </div>

          <h2 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
            Client Added Successfully!
          </h2>

          <p className="text-sm mb-1" style={{ color: mutedTextColor }}>
            <span className="font-medium" style={{ color: textColor }}>{success.businessName}</span> is now set up with a 7-day free trial.
          </p>

          <div
            className="rounded-xl p-4 mt-6 mb-6 text-left space-y-2"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${borderColor}` }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: mutedTextColor }}>AI Phone Number</span>
              <span className="font-mono font-medium" style={{ color: textColor }}>{success.phoneNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: mutedTextColor }}>Status</span>
              <span className="font-medium" style={{ color: '#f59e0b' }}>7-Day Trial</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: mutedTextColor }}>Welcome SMS</span>
              <span className="font-medium" style={{ color: primaryColor }}>Sent ✓</span>
            </div>
            <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
              <p className="text-xs font-medium mb-2" style={{ color: mutedTextColor }}>Client Login Credentials</p>
              <div className="flex justify-between text-sm">
                <span style={{ color: mutedTextColor }}>Email</span>
                <span className="font-mono font-medium" style={{ color: textColor }}>{success.email}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span style={{ color: mutedTextColor }}>Temp Password</span>
                <span className="font-mono font-medium" style={{ color: textColor }}>{success.tempPassword}</span>
              </div>
            </div>
          </div>

          <p className="text-xs mb-6" style={{ color: mutedTextColor }}>
            Share these credentials with the client so they can log into their dashboard. They can change their password in Settings.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/agency/clients/${success.clientId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: primaryColor, color: buttonTextColor }}
            >
              View Client
            </Link>
            <Link
              href="/agency/clients/new"
              onClick={(e) => {
                e.preventDefault();
                setSuccess(null);
                setForm({
                  businessName: '', industry: '', firstName: '', lastName: '',
                  email: '', phone: '', businessCity: '', businessState: '',
                  businessCountry: defaultCountry,
                  websiteUrl: '', planType: 'starter', tempPassword: generateTempPassword()
                });
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: textColor }}
            >
              Add Another Client
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textColor
  };

  // Build the state/region label based on country
  const stateLabel = isUS ? 'State' : isCA ? 'Province' : 'State / Region';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/agency/clients"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: textColor }}>
          Add New Client
        </h1>
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
          Set up a new AI receptionist. The client will receive a welcome SMS with their phone number.
        </p>
      </div>

      {/* Error display */}
      {(error || fieldErrors.length > 0) && (
        <div
          className="rounded-xl p-4 mb-6 flex gap-3"
          style={{ backgroundColor: errorBg, border: `1px solid ${errorBorder}` }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: errorText }} />
          <div>
            {error && <p className="text-sm font-medium" style={{ color: errorText }}>{error}</p>}
            {fieldErrors.length > 0 && (
              <ul className="text-sm space-y-1" style={{ color: errorText }}>
                {fieldErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        {/* Business Info Section */}
        <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="h-4 w-4" style={{ color: primaryColor }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: mutedTextColor }}>
              Business Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Business Name <span style={{ color: errorText }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Smith Plumbing Co."
                value={form.businessName}
                onChange={(e) => updateForm('businessName', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={inputStyle}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  Industry <span style={{ color: errorText }}>*</span>
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => updateForm('industry', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  Plan
                </label>
                <select
                  value={form.planType}
                  onChange={(e) => updateForm('planType', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                >
                  {PLAN_TYPES.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label} — ${(getPlanPrice(p.value) / 100).toFixed(0)}/mo
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country Picker */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Country <span style={{ color: errorText }}>*</span>
              </label>
              <select
                value={form.businessCountry}
                onChange={(e) => updateForm('businessCountry', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={inputStyle}
                disabled={submitting}
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City + State/Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  City <span style={{ color: errorText }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder={isUS ? 'e.g. Atlanta' : isCA ? 'e.g. Toronto' : 'e.g. London'}
                  value={form.businessCity}
                  onChange={(e) => updateForm('businessCity', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  {stateLabel} <span style={{ color: errorText }}>*</span>
                </label>
                {isUS ? (
                  <select
                    value={form.businessState}
                    onChange={(e) => updateForm('businessState', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={inputStyle}
                    disabled={submitting}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                ) : isCA ? (
                  <select
                    value={form.businessState}
                    onChange={(e) => updateForm('businessState', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={inputStyle}
                    disabled={submitting}
                  >
                    <option value="">Select province...</option>
                    {CA_PROVINCES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Greater London"
                    value={form.businessState}
                    onChange={(e) => updateForm('businessState', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={inputStyle}
                    disabled={submitting}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Website URL <span className="font-normal" style={{ color: mutedTextColor }}>(optional — used to build AI knowledge base)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                <input
                  type="text"
                  placeholder="www.smithplumbing.com"
                  value={form.websiteUrl}
                  onChange={(e) => updateForm('websiteUrl', e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Owner Info Section */}
        <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 mb-5">
            <User className="h-4 w-4" style={{ color: primaryColor }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: mutedTextColor }}>
              Owner / Contact
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  First Name <span style={{ color: errorText }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => updateForm('firstName', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Smith"
                  value={form.lastName}
                  onChange={(e) => updateForm('lastName', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Email <span style={{ color: errorText }}>*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                <input
                  type="email"
                  placeholder="john@smithplumbing.com"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Phone <span style={{ color: errorText }}>*</span>
                {phoneConfig.code && (
                  <span className="font-normal ml-1.5" style={{ color: mutedTextColor }}>({phoneConfig.code})</span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                <input
                  type="tel"
                  placeholder={phoneConfig.placeholder}
                  value={(isUS || isCA) ? formatPhoneDisplay(form.phone) : form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>
              {!isUS && !isCA && phoneConfig.code && (
                <p className="text-xs mt-1" style={{ color: mutedTextColor }}>
                  Enter the local number without country code. We&apos;ll add {phoneConfig.code} automatically.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Login Credentials Section */}
        <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 mb-5">
            <Lock className="h-4 w-4" style={{ color: primaryColor }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: mutedTextColor }}>
              Login Credentials
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: labelColor }}>
                Temporary Password <span style={{ color: errorText }}>*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.tempPassword}
                    onChange={(e) => updateForm('tempPassword', e.target.value)}
                    className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono focus:outline-none transition-colors"
                    style={inputStyle}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: mutedTextColor }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm('tempPassword', generateTempPassword())}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-colors"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: isDark ? 'rgba(250,250,249,0.7)' : '#374151', border: `1px solid ${inputBorder}` }}
                  disabled={submitting}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: mutedTextColor }}>
                Share this with the client so they can log in. They can change it in their dashboard settings.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="p-5 sm:p-6">
          <div
            className="rounded-xl p-3.5 mb-5 flex gap-3"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', border: `1px solid ${borderColor}` }}
          >
            <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
            <p className="text-xs leading-relaxed" style={{ color: mutedTextColor }}>
              This will provision an AI receptionist with a local phone number, create the client&apos;s account,
              and send them a welcome SMS. They&apos;ll start on a 7-day free trial with no credit card required.
              This may take up to 30 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
              style={{ backgroundColor: primaryColor, color: buttonTextColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up AI receptionist...
                </>
              ) : (
                <>
                  Add Client
                </>
              )}
            </button>
            <Link
              href="/agency/clients"
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                color: isDark ? 'rgba(250,250,249,0.7)' : '#374151',
                border: `1px solid ${borderColor}`
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}