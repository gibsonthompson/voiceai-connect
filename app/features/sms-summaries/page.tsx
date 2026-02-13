import type { Metadata } from "next";
import SmsSummariesFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/sms-summaries",
  },
};

export default function Page() {
  return <SmsSummariesFeaturePage />;
}
