import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import MuiProvider from "@/components/providers/MuiProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import CartProvider from "@/components/providers/CartProvider";
import AccountSetupGate from "@/components/account/AccountSetupGate";
import Navbar from "@/components/navigation/Navbar";
import MobileTabBar from "@/components/navigation/MobileTabBar";
import Footer from "@/components/footer/Footer";
import Toaster from "@/components/ui/Toaster";
import { PRODUCTS } from "@/lib/constants";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://forma.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FORMA — A curated collection of collectible objects.",
    template: "%s | FORMA",
  },
  description:
    `${PRODUCTS.length} collectible 3D-printed pieces, each professionally designed, printed and finished. A curated collection, not a catalog.`,
  keywords: [
    "collectible 3D prints",
    "curated 3D printed objects",
    "designer 3D printed collectibles",
    "art print collection",
  ],
  authors: [{ name: "FORMA" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "FORMA — A curated collection of collectible objects.",
    description: `${PRODUCTS.length} collectible 3D-printed pieces, each professionally designed, printed and finished.`,
    siteName: "FORMA",
    images: [{ url: "/images/og-cover.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FORMA — A curated collection of collectible objects.",
    description: `${PRODUCTS.length} collectible 3D-printed pieces, each professionally designed, printed and finished.`,
    images: ["/images/og-cover.jpg"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "FORMA",
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo-v3.png`,
    },
    {
      "@type": "Store",
      name: "FORMA collection",
      description: `A curated collection of ${PRODUCTS.length} collectible 3D-printed objects.`,
      provider: { "@type": "Organization", name: "FORMA" },
      areaServed: "IN",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-text">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MuiProvider>
        <ThemeProvider>
          <SessionProvider>
            <CartProvider />
            <AccountSetupGate />
            <Navbar />
            {/* pt-16 compensates for the navbar now being fixed (out of flow) so every
                page keeps its old top spacing; the homepage hero cancels this itself
                with -mt-16 so its video can bleed up behind the transparent navbar. */}
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
            <MobileTabBar />
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
