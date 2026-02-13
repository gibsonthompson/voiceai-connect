import type { Metadata } from "next";
import PricingModelsPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/ai-receptionist-agency-pricing",
  },
};

export default function Page() {
  return <PricingModelsPage />;
}
