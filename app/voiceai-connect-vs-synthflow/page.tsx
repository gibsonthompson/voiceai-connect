import type { Metadata } from "next";
import VsynthflowPage from "./client-page";

export const metadata: Metadata = {
  title: "VoiceAI Connect vs Synthflow",
  description:
    "VoiceAI Connect vs Synthflow for agencies: compare white-label reselling, branded client dashboards, Stripe Connect payouts, and client onboarding speed.",
  alternates: {
    canonical: "/voiceai-connect-vs-synthflow",
  },
};

export default function Page() {
  return <VsynthflowPage />;
}
