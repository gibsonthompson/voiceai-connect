import type { Metadata } from "next";
import MarketingAgenciesPage from "./client-page";

export const metadata: Metadata = {
  title: "White-Label AI Receptionist for Marketing Agencies",
  description:
    "Add a recurring-revenue AI receptionist service to your marketing agency. White-label dashboards, fast client onboarding, and direct Stripe Connect payouts.",
  alternates: {
    canonical: "/white-label-ai-receptionist-marketing-agencies",
  },
};

export default function Page() {
  return <MarketingAgenciesPage />;
}
