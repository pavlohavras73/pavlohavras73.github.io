import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { site } from "@/content";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { TransitionProvider } from "@/components/shell/TransitionProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: AI agents & full-stack frontend`, template: `%s` },
  description: "Pavlo Havras: AI agents and automation, full-stack frontend. Lobby.gg, an FPV drone simulator, a personal AI agent and web work.",
  openGraph: { type: "website", siteName: site.name, images: ["/img/site-aeroflux.jpg"] },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2307090C'/%3E%3Ctext x='32' y='42' font-family='Arial' font-weight='700' font-size='26' text-anchor='middle' fill='%23FFB020'%3EPH%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Script src="/a.js" strategy="afterInteractive" />
        <LenisProvider>
          <TransitionProvider>{children}</TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
