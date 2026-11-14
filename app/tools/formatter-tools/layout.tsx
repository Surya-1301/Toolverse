import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Formatters & Minifiers - Free Online Utilities | Toolverse",
  description:
    "Format, beautify, and minify HTML, CSS, JavaScript, TypeScript, JSON, and SQL code online for free on Toolverse.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/formatter-tools/",
  },
};

export default function FormatterToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
