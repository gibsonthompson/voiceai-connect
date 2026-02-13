import type { Metadata } from "next";
import HowToStartAgencyPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/how-to-start-ai-receptionist-agency",
  },
};

export default function Page() {
  return <HowToStartAgencyPage />;
}
