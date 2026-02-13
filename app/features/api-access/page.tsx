import type { Metadata } from "next";
import ApiAccessFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/api-access",
  },
};

export default function Page() {
  return <ApiAccessFeaturePage />;
}
