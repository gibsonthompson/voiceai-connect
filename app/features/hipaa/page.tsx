import type { Metadata } from "next";
import HipaaFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/hipaa",
  },
};

export default function Page() {
  return <HipaaFeaturePage />;
}
