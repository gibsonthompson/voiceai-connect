'use client';

// ============================================================================
// /cc/signup - Create a call-center account (separate from agency signup).
// Posts to /api/cc/signup, then sends the owner to set their password via the
// returned token. After they set it they land in the /cc console.
// ============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Headset } from 'lucide-react';

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'BM', label: 'Bermuda' },
  { value: 'AU', label: 'Australia' },
];

export default function CallCenterSignupPage() {
  const [form, setForm] = useState({ name: '', firstName: '', lastName: '', email: '', phone: '', country: 'US' });
  const [countryOpen, setCountryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const field: React.CSSProperties = { width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fafaf9' };
  const label: React.CSSProperties = { display: 'block', color: '#fafaf9', fontSize: 13, marginBottom: 6 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${backendUrl}/api/cc/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          country: form.country,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Could not create the account.');
        setSubmitting(false);
        return;
      }
      // Send them to set their password using the returned token; set-password
      // logs them in and routes a call-center owner to /cc/dashboard.
      window.location.href = `/auth/set-password?token=${encodeURIComponent(data.token)}`;
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedCountry = COUNTRIES.find((c) => c.value === form.country) || COUNTRIES[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ height: 40, width: 40, borderRadius: 12, background: '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headset size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ color: '#fafaf9', fontSize: 18, fontWeight: 600, margin: 0 }}>Create your call center</h1>
            <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: 13, margin: 0 }}>Answer calls for the businesses you serve</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={label}>Call center name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Answering" required style={field} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>First name</label>
              <input type="text" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required style={field} />
            </div>
            <div>
              <label style={label}>Last name</label>
              <input type="text" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} style={field} />
            </div>
          </div>
          <div>
            <label style={label}>Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required style={field} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} style={field} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={label}>Country</label>
              <button type="button" onClick={() => setCountryOpen((o) => !o)} style={{ ...field, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selectedCountry.label}</span>
                <span style={{ color: 'rgba(250,250,249,0.5)' }}>▾</span>
              </button>
              {countryOpen && (
                <div style={{ position: 'absolute', zIndex: 20, marginTop: 4, width: '100%', borderRadius: 12, overflow: 'hidden', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {COUNTRIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => { set('country', c.value); setCountryOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 14, background: c.value === form.country ? 'rgba(255,255,255,0.06)' : 'transparent', color: '#fafaf9', border: 'none', cursor: 'pointer' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting || !form.name || !form.firstName || !form.email}
            style={{ width: '100%', borderRadius: 12, padding: '11px', fontSize: 14, fontWeight: 600, background: '#10b981', color: '#04221a', border: 'none', cursor: submitting ? 'default' : 'pointer', opacity: submitting || !form.name || !form.firstName || !form.email ? 0.6 : 1 }}>
            {submitting ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Loader2 size={16} className="animate-spin" /> Creating...</span> : 'Create account'}
          </button>
        </form>

        <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: 13, marginTop: 18, textAlign: 'center' }}>
          Already have an account? <Link href="/cc/login" style={{ color: '#10b981' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
