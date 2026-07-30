import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://toolverse.dev"),
  title: {
    default: "Toolverse - Free Online Tools",
    template: "%s | Toolverse",
  },
  description:
    "Free online tools for developers, creators, and everyday users. Format JSON, generate QR codes, compress images, share files, and more.",
  keywords: [
    "online tools",
    "free online tools",
    "developer tools",
    "json formatter",
    "qr generator",
    "image compressor",
    "toolverse",
  ],
  authors: [{ name: "Toolverse" }],
  creator: "Toolverse",
  publisher: "Toolverse",
  applicationName: "Toolverse",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Toolverse - Free Online Tools",
    description:
      "Free online tools for developers, creators, and everyday users.",
    url: "https://toolverse.dev",
    siteName: "Toolverse",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolverse - Free Online Tools",
    description:
      "Free online tools for developers, creators, and everyday users.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col bg-slate-950 text-white">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}