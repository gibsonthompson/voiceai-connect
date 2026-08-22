import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora, Inter } from "next/font/google";
import Script from "next/script";
import ErrorReporter from "@/components/ErrorReporter";
import SupportWidget from "@/components/support-widget";
import AttributionCapture from "@/components/attribution-capture";
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
    default: "VoiceAI Connect: White-Label AI Receptionist Platform for Agencies",
    template: "%s | VoiceAI Connect",
  },
  description:
    "Launch your own AI voice receptionist agency. White-label platform purpose-built for agencies and resellers. Your brand, your pricing, 100% of the revenue. Start free, no credit card required.",
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
  // Host-aware manifest. /api/client-manifest returns the platform manifest
  // (start_url /agency/dashboard) on the platform host and an agency-branded,
  // client-scoped manifest (start_url /client/dashboard) on agency hosts. This
  // is why installing to the home screen from a client subdomain no longer
  // opens /agency/dashboard -> /agency/login. (Plain string, so no page is
  // forced into dynamic rendering; only the API route itself is dynamic.)
  manifest: "/api/client-manifest",
  // icons intentionally omitted -- the DynamicFavicon handles dashboard pages,
  // and static <link> tags in <head> handle the marketing site.
  // Removed to prevent conflict with app/icon.* file conventions.
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
    title: "VoiceAI Connect: White-Label AI Receptionist Platform for Agencies",
    description:
      "Launch your own AI voice receptionist agency. White-label platform with branded dashboards, automated phone provisioning, and Stripe Connect billing. Start free, no credit card required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceAI Connect: White-Label AI Receptionist Platform for Agencies",
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
        {/* Static favicon links for marketing site. DynamicFavicon overrides href on dashboard pages. */}
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="alternate" type="application/rss+xml" title="VoiceAI Connect Blog" href="https://myvoiceaiconnect.com/feed.xml" />
        <meta name="application-name" content="VoiceAI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VoiceAI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/*
          Render-blocking init for authenticated app routes. Runs before first
          paint so there is no wrong-colored frame on hard tab navigations.

          (1) Tags /agency, /client, /admin, /platform with the app-shell class.
          (2) Kills the cross-document view transition on those routes. The
              CSS animation:none rule alone still lets the snapshot overlay
              paint a frame during the swap; skipTransition() drops the whole
              transition so navigation is a plain instant document replace with
              no cross-fade (that overlay frame is not a page surface, so the
              agency theme never colored it, which is why light mode still
              flashed dark). Bound for both the incoming (pagereveal) and
              outgoing (pageswap) side.
          (3) For /agency and /client, resolves the agency's REAL theme before
              paint: cached agency.website_theme is authoritative (the theme
              toggle keeps that cache in sync), then the voiceai_ui_theme hint,
              then dark. It tags <html> with theme-dark/theme-light (globals.css
              paints the matching base), sets color-scheme so the browser's own
              base canvas (painted during the navigation gap) matches the theme
              instead of a dark UA default, writes the resolved value back to
              voiceai_ui_theme so the loading skeleton and useTheme agree, and
              sets an inline html/body background as a final override before the
              React tree mounts.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;var isDash=(p.indexOf('/client')===0||p.indexOf('/agency')===0);var isApp=isDash||p.indexOf('/admin')===0||p.indexOf('/platform')===0;if(isApp){document.documentElement.classList.add('app-shell');var _skipVT=function(ev){try{if(ev&&ev.viewTransition&&document.documentElement.classList.contains('app-shell')){ev.viewTransition.skipTransition();}}catch(e){}};window.addEventListener('pagereveal',_skipVT);window.addEventListener('pageswap',_skipVT);}if(isDash){var mode=null;try{var a=localStorage.getItem('agency');if(a){var pa=JSON.parse(a);if(pa&&(pa.website_theme==='light'||pa.website_theme==='dark')){mode=pa.website_theme;}}}catch(e){}if(!mode){var t=localStorage.getItem('voiceai_ui_theme');mode=(t==='light')?'light':'dark';}var isDark=mode!=='light';document.documentElement.classList.add(isDark?'theme-dark':'theme-light');document.documentElement.style.colorScheme=isDark?'dark':'light';try{localStorage.setItem('voiceai_ui_theme',isDark?'dark':'light');}catch(e){}var bg=isDark?'#050505':'#f9fafb';var fg=isDark?'#fafaf9':'#111827';var s=document.createElement('style');s.id='theme-init';s.textContent='html.app-shell,html.app-shell body{background:'+bg+' !important;color:'+fg+' !important}';document.head.appendChild(s);}}catch(e){}})();`,
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
        <AttributionCapture />
        {children}
        <SupportWidget />
      </body>
    </html>
  );
}