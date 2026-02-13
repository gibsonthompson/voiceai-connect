import type { Metadata } from "next";
import KnowledgeBaseFeaturePage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/features/knowledge-base",
  },
};

export default function Page() {
  return <KnowledgeBaseFeaturePage />;
}
