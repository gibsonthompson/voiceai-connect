import type { Metadata } from "next";
import IndustriesFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/industries",
  },
};

export default function Page() {
  return <IndustriesFeaturePage />;
}
