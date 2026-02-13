import type { Metadata } from "next";
import TranscriptsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/transcripts",
  },
};

export default function Page() {
  return <TranscriptsFeaturePage />;
}
