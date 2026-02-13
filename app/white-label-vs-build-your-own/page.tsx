import type { Metadata } from "next";
import WhiteLabelVsBuildPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/white-label-vs-build-your-own",
  },
};

export default function Page() {
  return <WhiteLabelVsBuildPage />;
}
