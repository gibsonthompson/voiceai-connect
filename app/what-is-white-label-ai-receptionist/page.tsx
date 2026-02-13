import type { Metadata } from "next";
import WhatIsWhiteLabelPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/what-is-white-label-ai-receptionist",
  },
};

export default function Page() {
  return <WhatIsWhiteLabelPage />;
}
