import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Tools - Free Online Image Utilities | Toolverse",
  description:
    "Compress, convert, resize, crop, blur, upscale, and remove backgrounds from images online for free on Toolverse.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/image-tools/",
  },
};

export default function ImageToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
