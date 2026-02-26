'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Lock } from 'lucide-react';

function WaveformLogo({ size = 32, color = '#10b981' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color} opacity="0.9" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid PIN');
      }

      localStorage.setItem('admin_token', data.token);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] bg-emerald-500/[0.06]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
      </div>

      <div className="relative w-full max-w-[360px]">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 -m-3 blur-2xl bg-emerald-500/15 rounded-full" />
            <WaveformLogo size={44} />
          </div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">VoiceAI Connect</h1>
          <p className="mt-1.5 text-sm text-white/30">Platform Administration</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/30 uppercase tracking-[0.1em] mb-2.5">
                Access PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(''); }}
                  required
                  autoFocus
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 py-3.5 text-white text-center text-lg tracking-[0.3em] placeholder:text-white/15 placeholder:tracking-[0.3em] focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/[0.06] border border-red-500/10 p-3 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="group w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-[#050505] transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[11px] text-white/15">
          Secured access · VoiceAI Connect Platform
        </p>
      </div>
    </div>
  );
}