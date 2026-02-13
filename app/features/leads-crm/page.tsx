import type { Metadata } from "next";
import LeadsCRMFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/leads-crm",
  },
};

export default function Page() {
  return <LeadsCRMFeaturePage />;
}
