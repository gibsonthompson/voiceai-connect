'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle, ExternalLink, Loader2, Shield, Trash2, Search, Globe } from 'lucide-react';

// ============================================================================
// BYOT (Bring Your Own Twilio) Settings Component
// Destination: app/agency/settings/components/BYOTSettings.tsx (NEW file)
// Import into settings page and render inside a tab or section.
// Only visible to Enterprise/Scale plan agencies (including trial)
// ============================================================================

interface BYOTStatus {
  byot_enabled: boolean;
  has_credentials: boolean;
  twilio_account_sid: string | null;
  verified_at: string | null;
}

interface TestResult {
  success: boolean;
  error?: string;
  message?: string;
  country_code?: string;
  available_numbers?: Array<{
    number: string;
    friendly_name: string;
    locality: string;
    region: string;
  }>;
  twilio_url?: string;
}

interface BYOTSettingsProps {
  agencyId: string;
  planType: string;
  subscriptionStatus: string;
  theme: any; // Your useTheme() return type
}

export default function BYOTSettings({ agencyId, planType, subscriptionStatus, theme }: BYOTSettingsProps) {
  const [status, setStatus] = useState<BYOTStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Form fields
  const [accountSid, setAccountSid] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testCountry, setTestCountry] = useState('CA');

  // Check if plan qualifies (enterprise or trialing)
  const isTrialing = ['trialing', 'trial'].includes(subscriptionStatus);
  const effectivePlan = isTrialing ? 'enterprise' : planType;
  const hasAccess = effectivePlan === 'enterprise';

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const fetchStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/byot/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.twilio_account_sid) {
          setAccountSid(data.twilio_account_sid);
        }
      }
    } catch (err) {
      console.error('Failed to fetch BYOT status:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId, API_BASE]);

  useEffect(() => {
    if (hasAccess) fetchStatus();
    else setLoading(false);
  }, [hasAccess, fetchStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setTestResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/byot/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          twilio_account_sid: accountSid,
          twilio_api_key: apiKey,
          twilio_api_secret: apiSecret
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Connected to Twilio account: ${data.twilio_account_name}` });
        setApiKey('');
        setApiSecret('');
        fetchStatus();
      } else {
        setMessage({ type: 'error', text: data.error || data.detail || 'Failed to save credentials' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/byot/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ country_code: testCountry })
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove Twilio credentials? New clients will need platform provisioning.')) return;

    setRemoving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/byot/credentials`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Twilio credentials removed.' });
        setAccountSid('');
        setApiKey('');
        setApiSecret('');
        setTestResult(null);
        fetchStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove credentials.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setRemoving(false);
    }
  };

  // ============================================
  // NOT ON SCALE PLAN — show upgrade prompt
  // ============================================
  if (!hasAccess) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-1">Twilio Integration</h3>
          <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
            Connect your own Twilio account for international phone numbers.
          </p>
        </div>
        <div 
          className="rounded-xl p-5 flex items-start gap-4"
          style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
        >
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.hover }}
          >
            <Shield className="h-5 w-5" style={{ color: theme.textMuted }} />
          </div>
          <div>
            <p className="font-medium text-sm">Scale Plan Required</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Connect your own Twilio account to provision phone numbers in any country. 
              Upgrade to the Scale plan to unlock international capabilities.
            </p>
            <a 
              href="/agency/settings?tab=billing" 
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors"
              style={{ color: theme.primary }}
            >
              Upgrade to Scale <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: theme.hover }} />
          <div className="h-4 w-full rounded" style={{ backgroundColor: theme.hover }} />
          <div className="h-10 w-full rounded" style={{ backgroundColor: theme.hover }} />
        </div>
      </div>
    );
  }

  // ============================================
  // BYOT ALREADY CONFIGURED — show status + test
  // ============================================
  if (status?.byot_enabled && status?.has_credentials) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-1">Twilio Integration</h3>
          <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
            Your Twilio account is connected. New clients get numbers from your Twilio.
          </p>
        </div>

        {/* Connected status */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: theme.primary + '08', border: `1px solid ${theme.primary}30` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primary + '15' }}
              >
                <Check className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="font-medium text-sm">Twilio Connected</p>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  {status.twilio_account_sid}
                  {status.verified_at && (
                    <> · Verified {new Date(status.verified_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: theme.errorBg, 
                border: `1px solid ${theme.errorBorder}`,
                color: theme.errorText 
              }}
            >
              {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Disconnect
            </button>
          </div>
        </div>

        {/* Regulatory bundle reminder */}
        <div 
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}
        >
          <div className="mt-0.5 flex-shrink-0">
            <AlertCircle className="h-4 w-4" style={{ color: theme.infoText }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: theme.infoText }}>
              Regulatory Bundle Required
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Most countries outside the US require a Regulatory Compliance Bundle before you can purchase phone numbers. 
              Complete this in your Twilio Console before your clients sign up, or number provisioning will fail.
            </p>
            <a 
              href="https://console.twilio.com/us1/develop/phone-numbers/regulatory-compliance/bundles" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium mt-2"
              style={{ color: theme.infoText }}
            >
              Complete Regulatory Bundle <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Test section */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
        >
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" style={{ color: theme.textMuted }} />
            Test Number Availability
          </h4>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>Country</label>
              <select
                value={testCountry}
                onChange={(e) => setTestCountry(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm transition-colors"
                style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              >
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="NL">Netherlands</option>
                <option value="IE">Ireland</option>
                <option value="NZ">New Zealand</option>
                <option value="SG">Singapore</option>
                <option value="JP">Japan</option>
              </select>
            </div>
            <button
              onClick={handleTest}
              disabled={testing}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {testResult && (
            <div 
              className="mt-4 rounded-xl p-3"
              style={{ 
                backgroundColor: testResult.success ? theme.primary + '08' : theme.warningBg,
                border: `1px solid ${testResult.success ? theme.primary + '30' : theme.warningBorder}`
              }}
            >
              {testResult.success ? (
                <>
                  <p className="text-xs font-medium" style={{ color: theme.primary }}>{testResult.message}</p>
                  {testResult.available_numbers && testResult.available_numbers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {testResult.available_numbers.map((n, i) => (
                        <p key={i} className="text-xs font-mono" style={{ color: theme.text }}>
                          {n.number} {n.locality && `(${n.locality}${n.region ? `, ${n.region}` : ''})`}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-medium" style={{ color: theme.warningText }}>{testResult.message}</p>
                  {testResult.error === 'regulatory_bundle_required' && testResult.twilio_url && (
                    <a
                      href={testResult.twilio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs underline"
                      style={{ color: theme.warningText }}
                    >
                      Complete verification in Twilio Console <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div 
            className="rounded-xl p-3 text-xs"
            style={{ 
              backgroundColor: message.type === 'success' ? theme.primary + '08' : theme.errorBg,
              border: `1px solid ${message.type === 'success' ? theme.primary + '30' : theme.errorBorder}`,
              color: message.type === 'success' ? theme.primary : theme.errorText
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // SETUP FORM — no credentials configured yet
  // ============================================
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Twilio Integration</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
          Connect your own Twilio account to provision phone numbers in any country.
        </p>
      </div>

      {/* Setup instructions */}
      <div 
        className="rounded-xl p-4"
        style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}
      >
        <h4 className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: theme.infoText }}>
          <Globe className="h-4 w-4" />
          Setup Instructions
        </h4>
        <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: theme.infoText }}>
          <li>
            Go to{' '}
            <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">
              console.twilio.com
            </a>
          </li>
          <li>Copy your Account SID from the dashboard</li>
          <li>
            Go to{' '}
            <a href="https://console.twilio.com/us1/account/keys-credentials/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
              API Keys &amp; Tokens
            </a>{' '}
            → Create a Standard API Key
          </li>
          <li>Copy the API Key SID (starts with SK) and Secret</li>
          <li>Paste all three values below</li>
        </ol>
      </div>

      {/* Credential form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1.5">Twilio Account SID</label>
          <input
            type="text"
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value.trim())}
            placeholder="AC..."
            className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1.5">API Key SID</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value.trim())}
            placeholder="SK..."
            className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1.5">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value.trim())}
            placeholder="Enter your API Secret"
            className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            required
          />
          <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>
            Your API Secret is encrypted before storage and never visible after saving.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !accountSid || !apiKey || !apiSecret}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying & Saving...
            </span>
          ) : (
            'Connect Twilio Account'
          )}
        </button>
      </form>

      {/* Message */}
      {message && (
        <div 
          className="rounded-xl p-3 flex items-center gap-2 text-xs"
          style={{ 
            backgroundColor: message.type === 'success' ? theme.primary + '08' : theme.errorBg,
            border: `1px solid ${message.type === 'success' ? theme.primary + '30' : theme.errorBorder}`,
            color: message.type === 'success' ? theme.primary : theme.errorText
          }}
        >
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}