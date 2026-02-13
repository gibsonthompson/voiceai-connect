import type { Metadata } from "next";
import MarketingAgenciesPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/white-label-ai-receptionist-marketing-agencies",
  },
};

export default function Page() {
  return <MarketingAgenciesPage />;
}
