import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text Tools - Free Online Text Utilities | Toolverse",
  description:
    "Free online text utilities: word counter, case converter, duplicate line remover, text compare, and text-to-speech.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/text-tools/",
  },
};

export default function TextToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
