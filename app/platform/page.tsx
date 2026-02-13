import type { Metadata } from "next";
import PlatformPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/platform",
  },
};

export default function Page() {
  return <PlatformPage />;
}
