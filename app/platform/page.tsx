import type { Metadata } from "next";
import PlatformPage from "./client-page";

export const metadata: Metadata = {
  title: "Platform Overview for AI Receptionist Agencies",
  description:
    "See how the VoiceAI Connect platform works: branded client dashboards, 60-second onboarding, automated phone numbers, Stripe Connect payouts, and a built-in lead CRM.",
  alternates: {
    canonical: "/platform",
  },
};

export default function Page() {
  return <PlatformPage />;
}
