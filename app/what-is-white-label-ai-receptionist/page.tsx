import type { Metadata } from "next";
import WhatIsWhiteLabelPage from "./client-page";

export const metadata: Metadata = {
  title: "What Is a White-Label AI Receptionist?",
  description:
    "A white-label AI receptionist lets you sell AI phone answering under your own brand. Learn how the model works, what it includes, and how agencies profit from it.",
  alternates: {
    canonical: "/what-is-white-label-ai-receptionist",
  },
};

export default function Page() {
  return <WhatIsWhiteLabelPage />;
}
