import type { Metadata } from "next";
import AddAIVoiceToAgencyPage from "./client-page";

export const metadata: Metadata = {
  title: "How Much Can You Make Reselling AI Receptionists?",
  description:
    "Realistic earnings for AI receptionist resellers: revenue and margin at 10, 25, 50, and 100 clients, and the platform costs that shape your monthly profit.",
  alternates: {
    canonical: "/how-much-can-you-make-ai-receptionist-reseller",
  },
};

export default function Page() {
  return <AddAIVoiceToAgencyPage />;
}
