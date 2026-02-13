import type { Metadata } from "next";
import AppointmentsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/appointments",
  },
};

export default function Page() {
  return <AppointmentsFeaturePage />;
}
