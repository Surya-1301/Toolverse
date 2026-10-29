import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Download, FileText, Flag, Mail, Newspaper, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { BackButtonHandler } from "@/components/BackButtonHandler";
import { DownloadInterceptor } from "@/components/DownloadInterceptor";
import { StatusBarHandler } from "@/components/StatusBarHandler";
import "./globals.css";

const siteUrl = "https://toolversee.pages.dev";

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
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Toolverse - All-in-one online utility tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolverse - Free Online Utility Tools",
    description:
      "Free online tools for JSON formatting, QR codes, image/PDF compression, paste sharing, file sharing, URL shortening, and image hosting.",
    images: [`${siteUrl}/og.png`],
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
   apple: "/icon-512.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070a14",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Toolverse",
  url: siteUrl,
  description:
    "Free online utility tools for formatting, generating, compressing, hosting, sharing, and shortening.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/tools?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "Toolverse",
    url: siteUrl,
  },
};

const footerLinks = [
  {
    label: "Blog",
    href: "/blog",
    icon: Newspaper,
  },
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
  {
    label: "Download app",
    href: "https://downloadtoolverse.dpdns.org/",
    icon: Download,
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Toolverse" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#070a14] text-slate-100 antialiased light:bg-[#f1f5f9] light:text-slate-900">
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"4fdd1b111cc042a1b8559e0c749b5a8f"}'
          strategy="afterInteractive"
        />

        <div className="flex min-h-screen flex-col">
          <BackButtonHandler />
          <DownloadInterceptor />
          <StatusBarHandler />
          <Header />

          <main className="flex-1">{children}</main>

          <footer className="border-t border-white/[0.05] bg-transparent light:border-slate-900/[0.05] light:bg-transparent text-slate-400 light:text-slate-600">
            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href="/"
                    className="inline-flex text-base font-semibold tracking-tight text-white transition hover:text-sky-200 light:text-slate-900 light:hover:text-sky-700"
                  >
                    Toolverse
                  </Link>

                  <p className="mt-2 text-sm text-slate-500 light:text-slate-500">
                    © {new Date().getFullYear()} Toolverse. All rights
                    reserved.
                  </p>
                </div>

                <nav
                  aria-label="Footer navigation"
                  className="grid grid-cols-3 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2"
                >
                  {footerLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        {...(item.href.startsWith("http")
                          ? {
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {})}
                        className="group inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-500 transition hover:text-sky-300 light:text-slate-600 light:hover:text-sky-700 light:text-slate-500"
                      >
                        <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-sky-300 light:text-slate-500" />
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
