import type { Metadata } from "next";
import AgencyIncomePage from "./client-page";

export const metadata: Metadata = {
  title: "How Much Can You Make With an AI Receptionist Agency? Income Calculator | VoiceAI Connect",
  description:
    "A live calculator for AI receptionist resellers: see what local businesses lose to missed calls, what to charge them for an AI receptionist, and how much your agency keeps after platform fees. Pricing guidance and profit math in one place.",
  keywords: [
    "ai receptionist agency income",
    "how much can you make with an ai receptionist agency",
    "ai receptionist pricing",
    "what to charge for an ai receptionist",
    "ai receptionist reseller profit",
    "white label ai receptionist earnings",
    "missed call revenue calculator",
  ],
  alternates: {
    canonical: "/ai-receptionist-agency-income",
  },
  openGraph: {
    title: "What to charge for AI receptionists, and what you keep",
    description:
      "Pick a local business type and see its missed-call losses, the right price to charge, and your agency profit after platform costs.",
    url: "/ai-receptionist-agency-income",
    type: "website",
  },
};

export default function Page() {
  return <AgencyIncomePage />;
}
