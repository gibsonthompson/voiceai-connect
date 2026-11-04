import type { Metadata } from "next";
import AgencyOpportunityPage from "./client-page";

// NOTE: placeholder route — rename this folder to the final slug you pick,
// then update this canonical path to match.
export const metadata: Metadata = {
  title: "Turn Missed Calls Into Recurring Revenue | VoiceAI Connect",
  description:
    "Local businesses lose thousands every month to missed calls. Put your own AI receptionist in front of them, and keep the margin. Run your own numbers and see what an AI receptionist agency could pay you.",
  alternates: {
    canonical: "/agency-opportunity",
  },
};

export default function Page() {
  return <AgencyOpportunityPage />;
}
