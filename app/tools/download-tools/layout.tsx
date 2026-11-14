import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media & Download Tools - Free Video and Audio Downloaders | Toolverse",
  description:
    "Free video and audio downloader tools: YouTube downloader, Instagram reels downloader, music downloader, and audio converter.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/download-tools/",
  },
};

export default function DownloadToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
