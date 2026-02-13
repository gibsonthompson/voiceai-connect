import type { Metadata } from "next";
import StripeConnectFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/stripe-connect",
  },
};

export default function Page() {
  return <StripeConnectFeaturePage />;
}
