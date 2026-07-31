import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "URL Shortener - Shorten Links Online",
  description:
    "Shorten long URLs into clean, shareable links with ToolverseX URL Shortener.",
};

export default function UrlShortenerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}