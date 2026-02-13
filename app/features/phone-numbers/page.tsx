import type { Metadata } from "next";
import PhoneNumbersFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/phone-numbers",
  },
};

export default function Page() {
  return <PhoneNumbersFeaturePage />;
}
