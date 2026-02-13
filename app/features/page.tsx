import type { Metadata } from "next";
import FeaturesIndexPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features",
  },
};

export default function Page() {
  return <FeaturesIndexPage />;
}
