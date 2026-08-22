import type { Metadata } from "next";
import WhiteLabelVsBuildPage from "./client-page";

export const metadata: Metadata = {
  title: "White-Label vs Build Your Own AI Receptionist",
  description:
    "Buy a white-label AI receptionist platform or build your own? Compare cost, time to launch, maintenance, and margin for agencies weighing both paths.",
  alternates: {
    canonical: "/white-label-vs-build-your-own",
  },
};

export default function Page() {
  return <WhiteLabelVsBuildPage />;
}
