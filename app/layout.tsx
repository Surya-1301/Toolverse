import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { FileText, Flag, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import "./globals.css";

const siteUrl = "https://toolverse.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toolverse - Free Online Utility Tools",
    template: "%s | Toolverse",
  },
  description:
    "Toolverse is a free online utility hub for JSON formatting, QR code generation, image and PDF compression, paste sharing, file sharing, URL shortening, and image hosting.",
  keywords: [
    "Toolverse",
    "free online tools",
    "JSON formatter",
    "QR code generator",
    "image compressor",
    "PDF compressor",
    "paste sharing",
    "file sharing",
    "URL shortener",
    "image hosting",
    "developer tools",
    "web utilities",
  ],
  authors: [{ name: "Toolverse" }],
  creator: "Toolverse",
  publisher: "Toolverse",
  applicationName: "Toolverse",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Toolverse",
    title: "Toolverse - Free Online Utility Tools",
    description:
      "Free online tools for JSON formatting, QR codes, image/PDF compression, paste sharing, file sharing, URL shortening, and image hosting.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Toolverse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolverse - Free Online Utility Tools",
    description:
      "Free online tools for JSON formatting, QR codes, image/PDF compression, paste sharing, file sharing, URL shortening, and image hosting.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
   shortcut: "/favicon.ico",
   apple: "apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

const footerLinks = [
  {
    label: "Privacy",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    label: "Terms",
    href: "/terms",
    icon: FileText,
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Mail,
  },
  {
    label: "Abuse",
    href: "/report-abuse",
    icon: Flag,
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"4fdd1b111cc042a1b8559e0c749b5a8f"}'
          strategy="afterInteractive"
        />

        <div className="flex min-h-screen flex-col">
          <Header />

          <main className="flex-1">{children}</main>

          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href="/"
                    className="inline-flex text-base font-semibold tracking-tight text-white transition hover:text-violet-200"
                  >
                    Toolverse
                  </Link>

                  <p className="mt-2 text-sm text-slate-500">
                    © {new Date().getFullYear()} Toolverse. All rights
                    reserved.
                  </p>
                </div>

                <nav
                  aria-label="Footer navigation"
                  className="flex flex-wrap items-center gap-x-6 gap-y-3"
                >
                  {footerLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-300"
                      >
                        <Icon className="h-4 w-4 text-slate-600 transition group-hover:text-violet-300" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
