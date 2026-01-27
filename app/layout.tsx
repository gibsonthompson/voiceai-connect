import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora, Inter } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

// Marketing page fonts
const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VoiceAI Connect - White-Label AI Voice Agency Platform",
    template: "%s | VoiceAI Connect",
  },
  description:
    "Launch your own AI voice receptionist agency. White-label platform with your brand, your pricing, 100% of the revenue. No technical skills required.",
  keywords: [
    "AI receptionist",
    "voice AI",
    "white-label",
    "agency platform",
    "SaaS",
    "AI phone answering",
    "virtual receptionist",
    "business automation",
    "reseller platform",
    "AI agency",
    "AI voice agency",
    "start AI business",
  ],
  authors: [{ name: "VoiceAI Connect" }],
  creator: "VoiceAI Connect",
  publisher: "VoiceAI Connect",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://myvoiceaiconnect.com",
    siteName: "VoiceAI Connect",
    title: "VoiceAI Connect - Launch Your AI Voice Agency",
    description:
      "The complete white-label platform to resell AI receptionists under your brand. Keep 100% of what you charge.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceAI Connect - Launch Your AI Voice Agency",
    description:
      "The complete white-label platform to resell AI receptionists under your brand.",
    creator: "@myvoiceaiconnect",
  },
  metadataBase: new URL("https://myvoiceaiconnect.com"),
  // Apple PWA settings
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceAI",
  },
  // App manifest
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#050505" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Enable safe-area-inset CSS env variables
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${sora.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Apple PWA icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Prevent phone number detection on iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}