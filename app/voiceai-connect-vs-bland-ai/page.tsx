import type { Metadata } from "next";
import VsBlandAIPage from "./client-page";

export const metadata: Metadata = {
  title: "VoiceAI Connect vs Bland AI",
  description:
    "VoiceAI Connect vs Bland AI for agencies: white-label client dashboards and done-for-you onboarding versus raw voice API infrastructure you assemble yourself.",
  alternates: {
    canonical: "/voiceai-connect-vs-bland-ai",
  },
};

export default function Page() {
  return <VsBlandAIPage />;
}
