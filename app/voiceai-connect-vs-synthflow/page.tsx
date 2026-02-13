import type { Metadata } from "next";
import VsynthflowPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/voiceai-connect-vs-synthflow",
  },
};

export default function Page() {
  return <VsynthflowPage />;
}
