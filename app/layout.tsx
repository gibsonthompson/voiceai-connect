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
  // PWA manifest
  manifest: "/manifest.json",
  // Apple PWA settings
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceAI",
  },
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
  // CRITICAL: This enables safe-area-inset CSS variables AND standalone mode
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
        
        {/* PWA / iOS Standalone Mode - These are REQUIRED */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VoiceAI" />
        
        {/* Prevent automatic detection/formatting */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="date=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
        
        {/* Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}