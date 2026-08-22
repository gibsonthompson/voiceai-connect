import type { Metadata } from "next";
import AnsweringServiceResellerPage from "./client-page";

export const metadata: Metadata = {
  title: "AI Answering Service Reseller Program",
  description:
    "Resell AI answering services under your own brand. White-label platform with branded client dashboards, per-client billing, and no revenue share on client subscriptions.",
  alternates: {
    canonical: "/ai-receptionist-answering-service-reseller",
  },
};

export default function Page() {
  return <AnsweringServiceResellerPage />;
}
