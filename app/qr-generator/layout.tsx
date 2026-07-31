import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Generator - Create QR Codes Online",
  description:
    "Create free QR codes for URLs, text, and more. Download your QR code as PNG or SVG with ToolverseX.",
};

export default function QrGeneratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}