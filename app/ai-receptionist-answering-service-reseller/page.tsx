import type { Metadata } from "next";
import AnsweringServiceResellerPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/ai-receptionist-answering-service-reseller",
  },
};

export default function Page() {
  return <AnsweringServiceResellerPage />;
}
