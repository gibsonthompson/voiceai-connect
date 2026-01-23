'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, PhoneCall, Clock, Copy, 
  ChevronRight, AlertCircle, Sun, Moon, CheckCircle,
  Loader2, PhoneOff, Zap
} from 'lucide-react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  agencyName: string;
  supportEmail: string | null;
  supportPhone: string | null;
}

interface Stats {
  callsThisMonth: number;
  highUrgency: number;
  callLimit: number;
  trialDaysLeft: number | null;
}

export interface ClientDashboardClientProps {
  client: any;
  branding: Branding;
  recentCalls: any[];
  stats: Stats;
}

// Helper functions
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ClientDashboardClient({
  client,
  branding,
  recentCalls,
  stats,
}: ClientDashboardClientProps) {
  const [copied, setCopied] = useState(false);

  const copyPhoneNumber = () => {
    if (client.vapi_phone_number) {
      navigator.clipboard.writeText(client.vapi_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Theme colors (dark mode only now, controlled by layout)
  const theme = {
    bg: '#0a0a0a',
    text: '#f5f5f0',
    textMuted: 'rgba(245, 245, 240, 0.5)',
    textMuted4: 'rgba(245, 245, 240, 0.4)',
    textMuted6: 'rgba(245, 245, 240, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111',
  };

  // Provisioning status
  const hasPhoneNumber = !!client.vapi_phone_number;
  const hasAssistant = !!client.vapi_assistant_id;
  const isProvisioned = hasPhoneNumber && hasAssistant;
  const isProvisioningPending = !isProvisioned && client.subscription_status !== 'cancelled';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="mt-1" style={{ color: theme.textMuted }}>
          Here&apos;s your AI receptionist activity.
        </p>
      </div>

      {/* Trial Banner */}
      {client.subscription_status === 'trial' && stats.trialDaysLeft !== null && (
        <div 
          className="mb-8 rounded-xl border p-4 flex items-center justify-between"
          style={{ 
            borderColor: hexToRgba(branding.accentColor, 0.3),
            backgroundColor: hexToRgba(branding.accentColor, 0.05),
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: hexToRgba(branding.accentColor, 0.1) }}
            >
              <Clock className="h-5 w-5" style={{ color: branding.accentColor }} />
            </div>
            <div>
              <p className="font-medium">
                {stats.trialDaysLeft > 0 ? `${stats.trialDaysLeft} days left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                Upgrade to keep your AI receptionist active.
              </p>
            </div>
          </div>
          <button 
            className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{ backgroundColor: branding.accentColor, color: isLightColor(branding.accentColor) ? '#0a0a0a' : '#f5f5f0' }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Phone Number Card */}
      <div 
        className="mb-8 rounded-xl border p-6"
        style={{ 
          borderColor: isProvisioned ? 'rgba(52, 211, 153, 0.3)' : hexToRgba(branding.primaryColor, 0.2),
          background: isProvisioned 
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, transparent 100%)'
            : `linear-gradient(135deg, ${hexToRgba(branding.primaryColor, 0.1)} 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ 
                backgroundColor: isProvisioned ? 'rgba(52, 211, 153, 0.2)' : hexToRgba(branding.primaryColor, 0.2),
              }}
            >
              {isProvisioned ? (
                <Phone className="h-7 w-7 text-emerald-400" />
              ) : isProvisioningPending ? (
                <Loader2 className="h-7 w-7 animate-spin" style={{ color: branding.primaryColor }} />
              ) : (
                <PhoneOff className="h-7 w-7" style={{ color: theme.textMuted }} />
              )}
            </div>
            <div>
              <p className="text-sm" style={{ color: theme.textMuted }}>Your AI Phone Number</p>
              <p className="text-2xl font-semibold tracking-tight">
                {client.vapi_phone_number || (isProvisioningPending ? 'Being assigned...' : 'Not assigned')}
              </p>
            </div>
          </div>
          
          {hasPhoneNumber && (
            <button 
              onClick={copyPhoneNumber}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: theme.border, backgroundColor: hexToRgba(branding.primaryColor, 0.05) }}
            >
              {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </button>
          )}
        </div>

        {/* Provisioning Status */}
        {isProvisioningPending && (
          <div 
            className="mt-4 pt-4 border-t flex items-center gap-4"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              {hasPhoneNumber ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-sm" style={{ color: hasPhoneNumber ? '#34d399' : theme.textMuted }}>
                Phone Number
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasAssistant ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-sm" style={{ color: hasAssistant ? '#34d399' : theme.textMuted }}>
                AI Assistant
              </span>
            </div>
          </div>
        )}

        {isProvisioned && (
          <p className="mt-4 text-sm" style={{ color: theme.textMuted4 }}>
            Forward your business calls to this number
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {[
          {
            label: 'Calls This Month',
            value: stats.callsThisMonth,
            subtext: `of ${stats.callLimit} included`,
            icon: PhoneCall,
            color: branding.primaryColor,
          },
          {
            label: 'High Priority',
            value: stats.highUrgency,
            subtext: 'Urgent calls',
            icon: AlertCircle,
            color: '#fbbf24',
          },
          {
            label: 'Status',
            value: isProvisioned ? 'Active' : 'Setting Up',
            subtext: isProvisioned ? 'Receiving calls' : 'Almost ready',
            icon: isProvisioned ? Zap : Loader2,
            color: isProvisioned ? '#34d399' : branding.accentColor,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-6"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>{stat.subtext}</p>
              </div>
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: hexToRgba(stat.color, 0.1) }}
              >
                <stat.icon 
                  className={`h-6 w-6 ${stat.icon === Loader2 ? 'animate-spin' : ''}`} 
                  style={{ color: stat.color }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Calls */}
      <div 
        className="rounded-xl border"
        style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
      >
        <div 
          className="flex items-center justify-between border-b p-6"
          style={{ borderColor: theme.border }}
        >
          <h2 className="font-medium">Recent Calls</h2>
          <Link 
            href="/client/calls" 
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: branding.primaryColor }}
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-6">
          {recentCalls.length === 0 ? (
            <div className="py-12 text-center">
              <div 
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
              >
                <PhoneCall className="h-8 w-8" style={{ color: theme.textMuted4 }} />
              </div>
              <p className="mt-4 font-medium" style={{ color: theme.textMuted6 }}>No calls yet</p>
              <p className="text-sm" style={{ color: theme.textMuted4 }}>
                {isProvisioned 
                  ? 'Forward calls to your AI number to get started!'
                  : 'Your AI receptionist is being set up...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/client/calls/${call.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-white/[0.02]"
                  style={{ 
                    borderColor: theme.border, 
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
                    >
                      <PhoneCall className="h-5 w-5" style={{ color: branding.primaryColor }} />
                    </div>
                    <div>
                      <p className="font-medium">{call.customer_name || 'Unknown Caller'}</p>
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        {call.customer_phone || call.caller_phone} • {call.service_requested || 'General inquiry'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? { backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }
                          : call.urgency_level === 'medium'
                          ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }
                          : { backgroundColor: hexToRgba(branding.primaryColor, 0.1), color: theme.textMuted6 }
                      }
                    >
                      {call.urgency_level || 'normal'}
                    </span>
                    <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}