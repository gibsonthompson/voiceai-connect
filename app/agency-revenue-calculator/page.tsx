import type { Metadata } from "next";
import AgencyRevenueCalculatorPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Receptionist Agency Revenue Calculator | VoiceAI Connect",
  description:
    "See what your agency can earn offering AI receptionists to your clients. A live calculator of monthly profit and margin after platform fees, per-client costs, and voice minutes.",
  alternates: {
    canonical: "/agency-revenue-calculator",
  },
};

export default function Page() {
  return <AgencyRevenueCalculatorPage />;
}
