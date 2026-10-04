import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

// Server layout for /admin. Its metadata OVERRIDES the root layout's host-aware
// client manifest (/api/client-manifest, whose start_url is a client/agency
// dashboard) with the admin PWA manifest for every /admin route, including the
// bare login page. Before this, the admin manifest was only injected inside the
// dashboard shell, so installing the PWA from the admin login screen picked up
// the client manifest and launched into the client login portal instead of the
// admin panel. Setting it here, at the route-segment level, makes
// /manifest-admin.json the single manifest for the whole /admin tree. Icons are
// pinned to the real VoiceAI Connect assets (DynamicFavicon does not run under
// /admin, so these stick).
export const metadata: Metadata = {
  title: 'VoiceAI Connect Admin',
  manifest: '/manifest-admin.json',
  icons: {
    icon: '/voiceai-favicon.ico',
    shortcut: '/voiceai-favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'VoiceAI Admin',
    statusBarStyle: 'black-translucent',
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
