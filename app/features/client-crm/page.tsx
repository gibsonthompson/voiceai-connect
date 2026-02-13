import type { Metadata } from "next";
import ClientCrmFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/client-crm",
  },
};

export default function Page() {
  return <ClientCrmFeaturePage />;
}
