import type { Metadata } from "next";
import VoiceOptionsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/voice-options",
  },
};

export default function Page() {
  return <VoiceOptionsFeaturePage />;
}
