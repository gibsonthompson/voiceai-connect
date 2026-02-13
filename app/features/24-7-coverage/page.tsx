import type { Metadata } from "next";
import Coverage247FeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/24-7-coverage",
  },
};

export default function Page() {
  return <Coverage247FeaturePage />;
}
