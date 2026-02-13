import type { Metadata } from "next";
import DemoPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/demo",
  },
};

export default function Page() {
  return <DemoPage />;
}
