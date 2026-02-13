import type { Metadata } from "next";
import GoHighLevelPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/gohighlevel-ai-receptionist",
  },
};

export default function Page() {
  return <GoHighLevelPage />;
}
