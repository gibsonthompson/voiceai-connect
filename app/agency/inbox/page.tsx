'use client';

// ============================================================================
// AGENCY INBOX — the agency's side of messages with VoiceAI Connect (platform).
// This is where an agency reads and replies to the platform's support/help
// responses. Previously this route was a broken copy of the ADMIN inbox (it
// used an admin token and hit /api/admin/inbox), so agencies could never see a
// reply, which is exactly why they kept asking "where can I see the response
// from support". It now renders PlatformMessages, which talks to the agency
// platform-threads API with the agency's own token.
// ============================================================================

import { Loader2, MessageSquare } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import PlatformMessages from '@/components/agency/PlatformMessages';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function AgencyInboxPage() {
  const { agency, loading } = useAgency();
  const theme = useTheme();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Inbox</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>
            Messages and support replies from the VoiceAI Connect team land here.
          </p>
        </div>
      </div>

      {agency?.id ? (
        <PlatformMessages agencyId={agency.id} backendUrl={backendUrl} />
      ) : (
        <div className="min-h-[30vh] flex items-center justify-center text-sm" style={{ color: theme.textMuted }}>
          Could not load your account. Refresh the page and try again.
        </div>
      )}
    </div>
  );
}