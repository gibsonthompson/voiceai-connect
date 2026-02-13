import type { Metadata } from "next";
import SecurityFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/security",
  },
};

export default function Page() {
  return <SecurityFeaturePage />;
}
