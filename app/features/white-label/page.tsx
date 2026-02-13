import type { Metadata } from "next";
import WhiteLabelFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/white-label",
  },
};

export default function Page() {
  return <WhiteLabelFeaturePage />;
}
