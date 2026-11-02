import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { BotLensGate } from "@/components/BotLensGate";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Teachback — Learn it by teaching it", template: "%s · Teachback" },
  description: "Explain it to Pip. Find out what you really understand.",
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        {/* ============================================================
            BOTLENS TRACKING SCRIPT SLOT
            The BotLens team drops their tracking <Script> here, e.g.:
              <Script src="https://botlens.example/t.js" data-site="teachback" strategy="beforeInteractive" />
            (import Script from "next/script"). Keep it in <head> so it
            loads on every page before any form is used.
           ============================================================ */}
      </head>
      <body className="min-h-dvh bg-paper text-ink">
        <SiteHeader user={user ? { name: user.name, plan: user.plan } : null} />
        <main id="main">{children}</main>
        <SiteFooter />
        <BotLensGate />
      </body>
    </html>
  );
}
