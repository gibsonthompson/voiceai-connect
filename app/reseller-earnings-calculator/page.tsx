import type { Metadata } from "next";
import ResellerCalculatorPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Receptionist Reseller Earnings Calculator | VoiceAI Connect",
  description:
    "See how much you can make reselling AI receptionists. A live calculator of your monthly profit and margin after platform fees, per-client costs, and voice minutes.",
  alternates: {
    canonical: "/reseller-earnings-calculator",
  },
};

export default function Page() {
  return <ResellerCalculatorPage />;
}
