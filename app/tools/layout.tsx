import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools - Explore All Online Tools",
  description:
    "Explore all Toolverse tools including JSON Formatter, QR Generator, Image Compressor, Paste, URL Shortener, Image Host, and File Share.",
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}