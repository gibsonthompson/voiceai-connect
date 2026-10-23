import type { Metadata } from "next";
import PlatformPage from "./client-page";

export const metadata: Metadata = {
  title: "White-Label AI Receptionist Platform for Agencies",
  description:
    "The white-label AI receptionist platform agencies resell under their own brand. Branded client dashboards, auto-provisioned phone numbers, Stripe Connect payouts, and Free, Pro, and Scale plans.",
  alternates: {
    canonical: "/platform",
  },
  openGraph: {
    title: "White-Label AI Receptionist Platform for Agencies",
    description:
      "Resell an AI phone receptionist under your own brand. Branded client dashboards, auto-provisioned numbers, Stripe Connect payouts, and usage-based pricing.",
    url: "https://www.myvoiceaiconnect.com/platform",
    type: "website",
  },
};

// Single source of truth for the on-page FAQ. The visible FAQ section in
// client-page.tsx renders straight from this array, and the FAQPage schema
// below is built from the same array, so the structured data can never drift
// from what a visitor actually sees (which is what Google's FAQ guidelines
// require). Keep answers accurate to real product behavior and real pricing
// (Free / Pro / Scale).
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is a white-label AI receptionist platform?",
    a: "It is software that lets you sell an AI phone receptionist to local businesses under your own brand. You set the pricing, your logo and domain are on everything the client sees, and VoiceAI Connect runs the AI, the phone numbers, and the billing behind the scenes. The client never knows we exist.",
  },
  {
    q: "How much does it cost to start?",
    a: "There are three plans. Free has no monthly fee and bills on usage (per active client and per minute). Pro is $99 a month for full white-label branding and a lower per-client rate. Scale is $499 a month with no per-client fee and the lowest per-minute rate. You set what you charge your own clients and keep the difference.",
  },
  {
    q: "Do my clients have to change their phone number?",
    a: "No. The business keeps its existing number and forwards calls to the AI number we provision. Nothing changes for their customers, and the forwarding stays in place through the free trial and after.",
  },
  {
    q: "What can each client's receptionist actually do?",
    a: "It answers 24/7 in English and Spanish, books appointments into Google Calendar, transfers urgent calls, filters spam and robocalls, and takes unlimited concurrent calls. Every call gets a recording, a transcript, and an AI-written summary in the client's branded dashboard.",
  },
  {
    q: "How fast can a client go live?",
    a: "Under a minute. When a client finishes your signup form, the platform provisions their phone number, configures the AI for their business, and sends dashboard credentials automatically. There is no manual setup on your end.",
  },
  {
    q: "Is there a contract or a setup fee?",
    a: "No setup fee and no contract. Start on Free with no card, or begin a 14-day trial on Pro or Scale. You can cancel anytime, and you only pay for the plan plus usage.",
  },
];

const BASE_URL = "https://www.myvoiceaiconnect.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/platform#software`,
      name: "VoiceAI Connect",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${BASE_URL}/platform`,
      description:
        "White-label AI receptionist platform for agencies. Resell AI phone answering under your own brand with branded client dashboards, auto-provisioned phone numbers, and Stripe Connect payouts.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description:
            "No monthly fee. Usage-based billing per active client and per minute.",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "99",
          priceCurrency: "USD",
          description:
            "Full white-label branding and a lower per-client rate.",
        },
        {
          "@type": "Offer",
          name: "Scale",
          price: "499",
          priceCurrency: "USD",
          description:
            "No per-client fee and the lowest per-minute rate.",
        },
      ],
      publisher: {
        "@type": "Organization",
        name: "VoiceAI Connect",
        url: BASE_URL,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/platform#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Platform",
          item: `${BASE_URL}/platform`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/platform#faq`,
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlatformPage faq={FAQ_ITEMS} />
    </>
  );
}
