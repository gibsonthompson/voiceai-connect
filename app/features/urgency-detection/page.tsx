import type { Metadata } from "next";
import UrgencyDetectionFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/urgency-detection",
  },
};

export default function Page() {
  return <UrgencyDetectionFeaturePage />;
}
