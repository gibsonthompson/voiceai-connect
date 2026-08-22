import type { Metadata } from "next";
import PricingModelsPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Receptionist Agency Pricing",
  description:
    "VoiceAI Connect pricing for agencies: a free usage-based tier, Pro at $99/mo, and Scale at $499/mo. Set your own client prices and keep 100% of the revenue.",
  alternates: {
    canonical: "/ai-receptionist-agency-pricing",
  },
};

export default function Page() {
  return <PricingModelsPage />;
}
