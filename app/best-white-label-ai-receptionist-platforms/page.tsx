import type { Metadata } from "next";
import BestWhiteLabelPlatformsPage from "./client-page";

export const metadata: Metadata = {
  title: "Best White-Label AI Receptionist Platforms (2026)",
  description:
    "Compare the top white-label AI receptionist platforms for agencies in 2026 on branding, client dashboards, onboarding speed, pricing, and payout structure.",
  alternates: {
    canonical: "/best-white-label-ai-receptionist-platforms",
  },
};

export default function Page() {
  return <BestWhiteLabelPlatformsPage />;
}
