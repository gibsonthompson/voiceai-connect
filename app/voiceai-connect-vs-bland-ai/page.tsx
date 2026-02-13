import type { Metadata } from "next";
import VsBlandAIPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/voiceai-connect-vs-bland-ai",
  },
};

export default function Page() {
  return <VsBlandAIPage />;
}
