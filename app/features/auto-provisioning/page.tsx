import type { Metadata } from "next";
import AutoProvisioningFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/auto-provisioning",
  },
};

export default function Page() {
  return <AutoProvisioningFeaturePage />;
}
