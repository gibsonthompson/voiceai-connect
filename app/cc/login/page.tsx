'use client';

// ============================================================================
// /cc/login - Call-center login (separate account type from agencies).
// Posts to /api/auth/cc/login, stores the session, and lands in the /cc console.
// The account object (data.call_center) is stored under the same 'agency' key
// the dashboard context reads; the context recognizes the cc_* role + the
// user.call_center_id and loads it as a call-center account.
// ============================================================================

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Headset } from 'lucide-react';

function CallCenterLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('expired')) setError('Your session expired. Please sign in again.');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${backendUrl}/api/auth/cc/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || 'Invalid email or password.');
        setSubmitting(false);
        return;
      }
      try {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.call_center) localStorage.setItem('agency', JSON.stringify(data.call_center));
      } catch {}
      if (data.requires_upgrade) { window.location.href = data.redirect || '/cc/reactivate'; return; }
      window.location.href = '/cc/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ height: 40, width: 40, borderRadius: 12, background: '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headset size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ color: '#fafaf9', fontSize: 18, fontWeight: 600, margin: 0 }}>Call center sign in</h1>
            <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: 13, margin: 0 }}>Access your call-center console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', color: '#fafaf9', fontSize: 13, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fafaf9' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#fafaf9', fontSize: 13, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fafaf9' }} />
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting || !email || !password}
            style={{ width: '100%', borderRadius: 12, padding: '11px', fontSize: 14, fontWeight: 600, background: '#10b981', color: '#04221a', border: 'none', cursor: submitting ? 'default' : 'pointer', opacity: submitting || !email || !password ? 0.6 : 1 }}>
            {submitting ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Loader2 size={16} className="animate-spin" /> Signing in...</span> : 'Sign in'}
          </button>
        </form>

        <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: 13, marginTop: 18, textAlign: 'center' }}>
          New here? <Link href="/cc/signup" style={{ color: '#10b981' }}>Create a call-center account</Link>
        </p>
      </div>
    </div>
  );
}

export default function CallCenterLoginPage() {
  return (
    <Suspense fallback={null}>
      <CallCenterLoginForm />
    </Suspense>
  );
}
