import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Compressor - Compress Images Online",
  description:
    "Compress JPG, PNG, and WebP images in your browser. Reduce image file size for free with Toolverse.",
};

export default function ImageCompressorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}