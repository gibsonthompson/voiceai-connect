import type { Metadata } from "next";
import AiDemoFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/ai-demo",
  },
};

export default function Page() {
  return <AiDemoFeaturePage />;
}
