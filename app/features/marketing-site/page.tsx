import type { Metadata } from "next";
import MarketingSiteFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/marketing-site",
  },
};

export default function Page() {
  return <MarketingSiteFeaturePage />;
}
