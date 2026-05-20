import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora, Inter } from "next/font/google";
import Script from "next/script";
import ErrorReporter from "@/components/ErrorReporter";
import SupportWidget from "@/components/support-widget";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

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

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "VoiceAI Connect — White-Label AI Receptionist Platform for Agencies",
    template: "%s | VoiceAI Connect",
  },
  description:
    "Launch your own AI voice receptionist agency. White-label platform purpose-built for agencies and resellers — your brand, your pricing, 100% of the revenue. Start free, no credit card required.",
  keywords: [
    "white-label AI receptionist",
    "AI receptionist platform",
    "AI phone answering service",
    "white-label voice AI",
    "AI receptionist reseller",
    "AI receptionist for agencies",
    "voice AI platform",
    "AI answering service white label",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceAI",
  },
  alternates: {
    canonical: "https://www.myvoiceaiconnect.com",
    types: {
      "application/rss+xml": "https://myvoiceaiconnect.com/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.myvoiceaiconnect.com",
    siteName: "VoiceAI Connect",
    title: "VoiceAI Connect — White-Label AI Receptionist Platform for Agencies",
    description:
      "Launch your own AI voice receptionist agency. White-label platform with branded dashboards, automated phone provisioning, and Stripe Connect billing. Start free, no credit card required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceAI Connect — White-Label AI Receptionist Platform for Agencies",
    description:
      "Launch your own AI voice receptionist agency. White-label platform with your brand, your pricing, 100% of the revenue.",
  },
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
  metadataBase: new URL("https://www.myvoiceaiconnect.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${sora.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="alternate" type="application/rss+xml" title="VoiceAI Connect Blog" href="https://myvoiceaiconnect.com/feed.xml" />
        <meta name="application-name" content="VoiceAI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VoiceAI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/*
          Blocking script: injects a <style> with !important that overrides
          globals.css dark background for dashboard pages. Must use a style
          tag (not just inline styles) to beat CSS specificity before paint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;if(p.indexOf('/client')===0||p.indexOf('/agency')===0){var t=localStorage.getItem('voiceai_ui_theme');var isDark=t!=='light';var bg=isDark?'#0a0a0a':'#f9fafb';var fg=isDark?'#fafaf9':'#111827';var s=document.createElement('style');s.id='theme-init';s.textContent='html,body{background:'+bg+' !important;color:'+fg+' !important}';document.head.appendChild(s);}}catch(e){}})();`,
          }}
        />
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TL2XTKPJ');`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TL2XTKPJ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ErrorReporter />
        {children}
        <SupportWidget />
      </body>
    </html>
  );
}