import type { Metadata } from "next";
import ExportsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/exports",
  },
};

export default function Page() {
  return <ExportsFeaturePage />;
}
