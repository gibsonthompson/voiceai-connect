import type { Metadata } from "next";
import AddAIVoiceToAgencyPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/how-much-can-you-make-ai-receptionist-reseller",
  },
};

export default function Page() {
  return <AddAIVoiceToAgencyPage />;
}
