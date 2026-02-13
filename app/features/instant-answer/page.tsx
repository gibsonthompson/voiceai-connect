import type { Metadata } from "next";
import InstantAnswerFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/instant-answer",
  },
};

export default function Page() {
  return <InstantAnswerFeaturePage />;
}
