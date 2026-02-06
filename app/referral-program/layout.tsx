import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agency Referral Program — Earn 40% Recurring Commission | VoiceAI Connect',
  description: 'Join the VoiceAI Connect agency referral program and earn 40% lifetime recurring commissions for every AI receptionist agency you refer. Free to join, no minimums, 90-day cookie window, monthly payouts via PayPal or bank transfer.',
  keywords: [
    'agency referral program',
    'AI receptionist referral program',
    'VoiceAI Connect referral program',
    'SaaS affiliate program',
    'recurring commission affiliate program',
    'AI agency affiliate',
    'white label AI referral',
    'voice AI partner program',
    'AI receptionist affiliate',
    'agency partner program',
    'earn recurring commissions',
    '40% recurring commission',
  ],
  openGraph: {
    title: 'Earn 40% Recurring — VoiceAI Connect Agency Referral Program',
    description: 'Refer agencies to VoiceAI Connect and earn 40% of every payment they make — forever. No caps, no expiry, 90-day cookie. Join free today.',
    url: 'https://myvoiceaiconnect.com/referral-program',
    siteName: 'VoiceAI Connect',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earn 40% Recurring — VoiceAI Connect Agency Referral Program',
    description: 'Refer agencies to VoiceAI Connect and earn 40% of every payment they make — forever. No caps, no expiry. Join free.',
  },
  alternates: {
    canonical: 'https://myvoiceaiconnect.com/referral-program',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ReferralProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}