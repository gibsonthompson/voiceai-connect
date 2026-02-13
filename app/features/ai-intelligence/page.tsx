import type { Metadata } from "next";
import AiIntelligenceFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/ai-intelligence",
  },
};

export default function Page() {
  return <AiIntelligenceFeaturePage />;
}
