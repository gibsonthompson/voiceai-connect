import type { Metadata } from "next";
import DevelopersPage from "./client-page";

export const metadata: Metadata = {
  title: "Developer API & Webhooks",
  description:
    "The VoiceAI Connect REST API and signed webhooks. Read and manage clients, calls, and appointments, and push real-time call and booking events into any system. A Scale-plan feature.",
  alternates: {
    canonical: "/developers",
  },
};

export default function Page() {
  return <DevelopersPage />;
}
