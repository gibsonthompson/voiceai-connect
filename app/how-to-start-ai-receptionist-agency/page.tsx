import type { Metadata } from "next";
import HowToStartAgencyPage from "./client-page";

export const metadata: Metadata = {
  title: "Start an AI Receptionist Agency",
  description:
    "The practical path to launching a white-label AI receptionist agency: choose a platform, pick a niche, set your pricing, and land your first local business clients.",
  alternates: {
    canonical: "/how-to-start-ai-receptionist-agency",
  },
};

export default function Page() {
  return <HowToStartAgencyPage />;
}
