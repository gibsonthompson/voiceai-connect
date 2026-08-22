import type { Metadata } from "next";
import HowItWorksPage from "./client-page";

export const metadata: Metadata = {
  title: "How the Agency Platform Works",
  description:
    "Four steps to launch a white-label AI receptionist agency: brand your platform, connect Stripe, share your signup link, and collect monthly recurring revenue.",
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function Page() {
  return <HowItWorksPage />;
}
