import type { Metadata } from "next";
import MobileDashboardFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/mobile-dashboard",
  },
};

export default function Page() {
  return <MobileDashboardFeaturePage />;
}
