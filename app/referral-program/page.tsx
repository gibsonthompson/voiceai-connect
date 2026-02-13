import type { Metadata } from "next";
import ReferralProgramPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/referral-program",
  },
};

export default function Page() {
  return <ReferralProgramPage />;
}
