import type { Metadata } from "next";
import VoicemailFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/voicemail",
  },
};

export default function Page() {
  return <VoicemailFeaturePage />;
}
