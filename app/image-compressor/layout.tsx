import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image & PDF Compressor - Compress Files Online",
  description:
    "Compress images and optimize PDF files in your browser with Toolverse.",
};

export default function ImageCompressorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}