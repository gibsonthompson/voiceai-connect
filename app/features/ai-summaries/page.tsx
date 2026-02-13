import type { Metadata } from "next";
import AiSummariesFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/ai-summaries",
  },
};

export default function Page() {
  return <AiSummariesFeaturePage />;
}
