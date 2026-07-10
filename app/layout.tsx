import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { AppConfig } from "@/lib/types";
import { getAppConfig } from "@/lib/queries";
import { BRAND } from "@/lib/branding";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${BRAND.name} | Sitio Oficial`,
    description:
      "Sitio oficial de IAME Series Argentina y Champion Cup 2026: calendario de karting, campeonato, resultados en vivo, inscripción IAME y noticias del karting en Argentina.",
  }),
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${BRAND.name} | Champion Cup 2026`,
    description:
      "Calendario karting Argentina, inscripción IAME, campeonato y resultados en vivo del Champion Cup 2026.",
    url: SITE_URL,
    siteName: BRAND.name,
    locale: "es_AR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let config: AppConfig = {};
  try {
    config = await getAppConfig();
  } catch {
    /* DB not ready */
  }

  const live = config.live;
  const temporada = config.temporada;

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-carbon min-h-screen font-sans antialiased`}
      >
        <Navbar
          isLive={live?.is_live}
          roundLabel={live?.round_label}
        />
        <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer
          year={temporada?.year ?? new Date().getFullYear()}
          organizer={temporada?.organizador ?? BRAND.organizer}
        />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
