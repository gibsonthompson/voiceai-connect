import type { Metadata } from "next";
import BusinessHoursFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/business-hours",
  },
};

export default function Page() {
  return <BusinessHoursFeaturePage />;
}
