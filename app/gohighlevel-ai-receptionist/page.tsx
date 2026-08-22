import type { Metadata } from "next";
import GoHighLevelPage from "./client-page";

export const metadata: Metadata = {
  title: "GoHighLevel AI Receptionist Alternative",
  description:
    "Want an AI receptionist beyond GoHighLevel? Compare branded client dashboards, 60-second onboarding, and mobile-first agency operations with VoiceAI Connect.",
  alternates: {
    canonical: "/gohighlevel-ai-receptionist",
  },
};

export default function Page() {
  return <GoHighLevelPage />;
}
