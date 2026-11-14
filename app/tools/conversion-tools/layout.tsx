import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversion Tools - Free Online File & Data Converters | Toolverse",
  description:
    "Convert Markdown, CSV, JSON, YAML, Excel, XML, colors, and regex online for free on Toolverse.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/conversion-tools/",
  },
};

export default function ConversionToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
