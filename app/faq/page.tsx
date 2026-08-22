import type { Metadata } from "next";
import FAQPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Receptionist Agency FAQ",
  description:
    "Answers on reselling white-label AI receptionists: pricing, client onboarding, Stripe Connect payouts, Spanish calls, Google Calendar booking, and international numbers.",
  alternates: {
    canonical: "/faq",
  },
};

export default function Page() {
  return <FAQPage />;
}
