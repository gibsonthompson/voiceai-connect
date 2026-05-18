'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, Eye, EyeOff, Lock } from 'lucide-react';

interface DashboardAccessProps {
  clientId: string;
  theme: any;
}

const ACCESS_OPTIONS = [
  { value: 'full', label: 'Full Access', desc: 'Client can view calls, edit settings, and manage their AI', icon: Eye },
  { value: 'read_only', label: 'Read Only', desc: 'Client can view calls and summaries but cannot change settings', icon: Lock },
  { value: 'none', label: 'No Access', desc: 'Client cannot log in — agency manages everything on their behalf', icon: EyeOff },
];

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

export default function DashboardAccessSelector({ clientId, theme }: DashboardAccessProps) {
  const [access, setAccess] = useState('full');
  const [origAccess, setOrigAccess] = useState('full');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`${backendUrl}/api/client/${clientId}/ai-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const d = await r.json();
          const val = d.settings?.dashboard_access || 'full';
          setAccess(val);
          setOrigAccess(val);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard access:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccess();
  }, [clientId, backendUrl]);

  const handleSave = async (newAccess: string) => {
    if (newAccess === 'none' && !confirm('This will prevent the client from logging into their dashboard. Continue?')) return;
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${backendUrl}/api/client/${clientId}/dashboard-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dashboard_access: newAccess }),
      });
      if (r.ok) {
        setAccess(newAccess);
        setOrigAccess(newAccess);
        setMessage('Dashboard access updated');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const d = await r.json();
        setMessage(d.error || 'Failed to update');
      }
    } catch {
      setMessage('Error updating access');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" style={{ color: theme.primary }} />
        <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Client Dashboard Access</span>
      </div>

      {message && (
        <div
          className="p-2 rounded-lg text-[10px] font-medium"
          style={{
            backgroundColor: message.includes('updated') ? hexToRgba('#22c55e', 0.1) : hexToRgba('#ef4444', 0.1),
            color: message.includes('updated') ? '#22c55e' : '#ef4444',
          }}
        >
          {message}
        </div>
      )}

      <div className="space-y-1.5">
        {ACCESS_OPTIONS.map(opt => {
          const selected = access === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => { if (opt.value !== access) handleSave(opt.value); }}
              disabled={saving}
              className="w-full text-left p-2.5 rounded-lg border transition disabled:opacity-60"
              style={{
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.03) : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selected ? theme.primary : theme.textMuted }} />
                <div>
                  <span className="font-medium text-[11px]" style={{ color: selected ? theme.primary : theme.text }}>
                    {opt.label}
                  </span>
                  <p className="text-[9px]" style={{ color: theme.textMuted }}>{opt.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {saving && (
        <div className="flex items-center justify-center gap-2 py-1">
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: theme.primary }} />
          <span className="text-[10px]" style={{ color: theme.textMuted }}>Updating...</span>
        </div>
      )}
    </div>
  );
}
