import type { Metadata } from "next";
import BlogPage from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/blog",
  },
};

export default function Page() {
  return <BlogPage />;
}
