import type { Metadata } from "next";
import FAQPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/faq",
  },
};

export default function Page() {
  return <FAQPage />;
}
