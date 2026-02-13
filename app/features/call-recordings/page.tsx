import type { Metadata } from "next";
import CallRecordingsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/call-recordings",
  },
};

export default function Page() {
  return <CallRecordingsFeaturePage />;
}
