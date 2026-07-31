import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Formatter - Format, Validate & Minify JSON Online",
  description:
    "Format, validate, and minify JSON instantly in your browser. Free online JSON formatter by ToolverseX.",
};

export default function JsonFormatterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}