'use client';

// ============================================================================
// /cc/businesses/new - add a business to the call center (native provisioning).
//
// A lean, call-center-appropriate version of the reseller client-create flow:
// no plan tiles, no pricing, no card gate (call centers are invoiced and hand-
// onboarded). The manager enters the business + owner basics, we provision the
// AI receptionist on the agency's default plan, set the timezone they picked,
// and drop them on the new business's config page.
//
// Posts to the same backend the reseller flow uses:
//   POST /api/agency/:agencyId/clients/add   -> 202 { jobId }
//   GET  /api/agency/:agencyId/clients/provisioning-status/:jobId  (poll)
// then PUT /api/agency/:agencyId/cc/businesses/:clientId/config { timezone }.
//
// Theme-aware (useTheme) so it white-labels in light and dark. Managers only
// (the /cc layout confines agents away from here).
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Building2, User, Phone, Mail, MapPin, Briefcase,
  Clock, Check, AlertCircle, PhoneCall, Settings, Plus,
} from 'lucide-react';
import { useAgency } from '../../../agency/context';
import { useTheme } from '../../../../hooks/useTheme';
import { SELECTABLE_INDUSTRIES } from '@/lib/industries';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Halifax',
];

function genPassword(): string {
  // Readable temp password; the owner is hand-onboarded and can reset later.
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

interface Success {
  clientId: string;
  businessName: string;
  phoneNumber: string | null;
  email: string;
  tempPassword: string;
}

export default function AddBusiness() {
  const { agency } = useAgency();
  const theme = useTheme();
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('US');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [customIndustries, setCustomIndustries] = useState<{ key: string; label: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<Success | null>(null);

  // Load the agency's custom industries so the dropdown matches the reseller flow.
  useEffect(() => {
    if (!agency?.id) return;
    const token = localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${base}/api/agency/${agency.id}/custom-industries`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.industries)) setCustomIndustries(d.industries.map((ci: any) => ({ key: ci.key || ci.value, label: ci.label || ci.name })).filter((ci: any) => ci.key && ci.label)); })
      .catch(() => {});
  }, [agency?.id]);

  // The agency's default plan key (first visible plan). Call centers are invoiced,
  // so there is no plan picker; every business lands on this plan silently.
  const defaultPlan = useMemo(() => {
    const raw = (agency as any)?.plans;
    if (Array.isArray(raw)) {
      const first = raw.filter((p: any) => p && p.key && p.visible !== false).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))[0];
      if (first) return first.key as string;
    }
    return 'starter';
  }, [agency]);

  const industryOptions = useMemo(
    () => [...SELECTABLE_INDUSTRIES.map((i) => ({ value: i.value, label: i.label })), ...customIndustries.map((ci) => ({ value: ci.key, label: ci.label }))],
    [customIndustries]
  );

  const validate = (): boolean => {
    const e: string[] = [];
    if (!businessName.trim()) e.push('Business name is required.');
    if (!firstName.trim()) e.push('Owner first name is required.');
    if (!email.trim() || !email.includes('@')) e.push('A valid owner email is required.');
    if (phone.replace(/\D/g, '').length < 10) e.push('A valid 10-digit phone number is required.');
    if (!city.trim()) e.push('City is required.');
    if (!state.trim()) e.push(country === 'CA' ? 'Province is required.' : 'State is required.');
    if (!industry) e.push('Industry is required.');
    setErrors(e);
    return e.length === 0;
  };

  const pollProvisioning = async (jobId: string, token: string | null): Promise<any> => {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    for (let i = 0; i < 100; i++) { // ~5 min at 3s
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`${base}/api/agency/${agency!.id}/clients/provisioning-status/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (d && (d.status === 'done' || d.status === 'error')) return d;
      } catch { /* transient, keep polling */ }
    }
    return null;
  };

  const submit = async () => {
    if (!agency?.id || submitting) return;
    if (!validate()) return;
    setSubmitting(true); setErrors([]); setStage('Creating the business...');
    const token = localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const tempPassword = genPassword();
    try {
      const res = await fetch(`${base}/api/agency/${agency.id}/clients/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ''),
          businessName: businessName.trim(),
          industry,
          businessCity: city.trim(),
          businessState: state.trim(),
          businessCountry: country,
          planType: defaultPlan,
          pricingMode: 'plan',
          tempPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      let client: any = null;
      if (res.status === 202 && data.jobId) {
        setStage('Provisioning the AI phone number, this can take a minute...');
        const final = await pollProvisioning(data.jobId, token);
        if (!final) { setErrors(['Setup is taking longer than usual. It may still finish, check the Businesses list in a moment.']); return; }
        if (final.status === 'error') { setErrors([final.result?.error || 'Could not add the business.']); return; }
        client = final.result?.client;
      } else if (res.ok) {
        client = data.client;
      } else {
        if (data.error === 'billing_required') { setErrors(['This account needs billing set up before adding a business. Contact support, call centers should be exempt.']); return; }
        setErrors(data.errors || [data.message || data.error || 'Could not add the business.']); return;
      }

      if (!client?.id) { setErrors(['The business was created but could not be read back. Check the Businesses list.']); return; }

      // Persist the chosen timezone (the backend derives one from the phone area
      // code; this honors the manager's explicit pick). Best-effort.
      if (timezone) {
        setStage('Saving settings...');
        try {
          await fetch(`${base}/api/agency/${agency.id}/cc/businesses/${client.id}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ timezone }),
          });
        } catch { /* non-fatal */ }
      }

      setSuccess({ clientId: client.id, businessName: client.business_name || businessName.trim(), phoneNumber: client.phone_number || client.vapi_phone_number || null, email: client.email || email.trim(), tempPassword });
    } catch {
      setErrors(['Could not reach the server. Please try again.']);
    } finally {
      setSubmitting(false); setStage('');
    }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>
  );

  // ---- Success state --------------------------------------------------------
  if (success) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-8 text-center" style={card}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: theme.primary15 }}>
              <Check className="h-7 w-7" style={{ color: theme.primary }} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: theme.text }}>{success.businessName} is live</h1>
            <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>The AI receptionist is provisioned and answering.</p>

            <div className="mt-5 rounded-xl p-4 text-left space-y-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px]" style={{ color: theme.textMuted }}>AI phone number</span>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{success.phoneNumber ? fmtPhone(success.phoneNumber) : 'Provisioning...'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px]" style={{ color: theme.textMuted }}>Owner login</span>
                <span className="text-sm truncate" style={{ color: theme.text }}>{success.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px]" style={{ color: theme.textMuted }}>Temp password</span>
                <span className="text-sm font-mono" style={{ color: theme.text }}>{success.tempPassword}</span>
              </div>
            </div>
            <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>Have the business forward its existing number to the AI number above. The owner can sign in with the temp password and change it anytime.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => router.push(`/cc/businesses/${success.clientId}`)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                <Settings className="h-4 w-4" /> Configure business
              </button>
              <button onClick={() => { setSuccess(null); setBusinessName(''); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCity(''); setState(''); setIndustry(''); }} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: theme.hover, color: theme.text }}>
                <Plus className="h-4 w-4" /> Add another
              </button>
            </div>
            <button onClick={() => router.push('/cc/businesses')} className="mt-3 text-[13px] font-medium" style={{ color: theme.textMuted }}>Back to Businesses</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form -----------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <a href="/cc/businesses" className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 mb-4" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Businesses
      </a>

      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Building2 className="h-5 w-5" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Add a business</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Provision an AI receptionist for a new business you answer for.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4 sm:space-y-5">
        {/* Business */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-center gap-2 mb-4"><Building2 className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="text-sm font-semibold" style={{ color: theme.text }}>Business</h2></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Business name</Label><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Bella's Salon" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Industry</Label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field}>
                <option value="">Select industry...</option>
                {industryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div><Label>Time zone</Label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-center gap-2 mb-4"><User className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="text-sm font-semibold" style={{ color: theme.text }}>Owner</h2></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>First name</Label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maria" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Last name</Label><input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Lopez" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Email</Label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@bellas.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Phone</Label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
          </div>
          <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>The phone area code sets the AI number's local area and the default timezone. Post-call texts go to this number unless you change it later.</p>
        </div>

        {/* Location */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="text-sm font-semibold" style={{ color: theme.text }}>Location</h2></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label>City</Label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Atlanta" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>{country === 'CA' ? 'Province' : 'State'}</Label><input value={state} onChange={(e) => setState(e.target.value)} placeholder={country === 'CA' ? 'ON' : 'GA'} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Country</Label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40` }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.error }} />
            <ul className="text-[13px] space-y-0.5" style={{ color: theme.error }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 sticky bottom-3">
          <span className="text-[12px] inline-flex items-center gap-1.5" style={{ color: theme.textMuted }}>
            {submitting && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {stage}</>}
          </span>
          <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />} {submitting ? 'Setting up...' : 'Add business'}
          </button>
        </div>
      </div>
    </div>
  );
}
