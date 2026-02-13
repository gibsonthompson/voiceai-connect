import type { Metadata } from "next";
import NotificationsFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/notifications",
  },
};

export default function Page() {
  return <NotificationsFeaturePage />;
}
