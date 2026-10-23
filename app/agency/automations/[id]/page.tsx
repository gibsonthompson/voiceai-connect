'use client';

// ============================================================================
// AUTOMATION BUILDER PAGE - fetch one workflow, hand it to the visual canvas,
// and own the save / activate / pause calls against the workflows API.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAgency } from '../../context';
import { useTheme } from '../../../../hooks/useTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import WorkflowBuilder from '@/components/agency/automations/WorkflowBuilder';
import { Loader2, AlertCircle, Lock } from 'lucide-react';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''}`,
});

export default function AutomationBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { agency } = useAgency();
  const theme = useTheme();
  const pf = usePlanFeatures();

  const id = params?.id as string;
  const agencyId = agency?.id;

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!agencyId || !id) return;
    setError(null);
    try {
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Could not load this automation (${res.status})`);
      const data = await res.json();
      setWorkflow(data.workflow);
    } catch (e: any) {
      setError(e?.message || 'Could not load this automation');
    } finally {
      setLoading(false);
    }
  }, [agencyId, id]);

  useEffect(() => { load(); }, [load]);

  const onSaveDraft = useCallback(async (partial: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setWorkflow(data.workflow);
    } finally {
      setSaving(false);
    }
  }, [agencyId, id]);

  const onActivate = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${id}/activate`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Could not turn this on'); return; }
      setWorkflow(data.workflow);
    } finally { setSaving(false); }
  }, [agencyId, id]);

  const onPause = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${id}/pause`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setWorkflow(data.workflow);
    } finally { setSaving(false); }
  }, [agencyId, id]);

  if (pf.isFree) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Lock className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted }} />
        <h1 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>Automations are on Pro</h1>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Upgrade to build and run automated follow-ups.</p>
        <a href="/agency/settings?tab=billing" className="inline-block px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.primary, color: theme.primaryText }}>Upgrade</a>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>;

  if (error || !workflow) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: theme.error }} />
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{error || 'Not found'}</p>
        <button type="button" onClick={() => router.push('/agency/automations')} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.primary, color: theme.primaryText }}>Back to automations</button>
      </div>
    );
  }

  return (
    <WorkflowBuilder
      workflow={workflow}
      plan={pf.plan}
      saving={saving}
      onSaveDraft={onSaveDraft}
      onActivate={onActivate}
      onPause={onPause}
      onBack={() => router.push('/agency/automations')}
    />
  );
}
