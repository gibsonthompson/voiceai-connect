import type { Metadata } from "next";
import AnalyticsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/analytics",
  },
};

export default function Page() {
  return <AnalyticsFeaturePage />;
}
