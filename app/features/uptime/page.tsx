import type { Metadata } from "next";
import UptimeFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/uptime",
  },
};

export default function Page() {
  return <UptimeFeaturePage />;
}
