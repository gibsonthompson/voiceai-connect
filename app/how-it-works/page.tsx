import type { Metadata } from "next";
import HowItWorksPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function Page() {
  return <HowItWorksPage />;
}
