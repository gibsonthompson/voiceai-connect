import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceAI Connect - White-Label AI Voice Agency Platform",
  description: "Launch your own AI voice receptionist agency. White-label platform with your brand, your pricing, your clients.",
  keywords: ["AI receptionist", "voice AI", "white-label", "agency platform", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
