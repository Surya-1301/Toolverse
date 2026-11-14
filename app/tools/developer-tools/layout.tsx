import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Tools - Free Online Web & Coding Utilities | Toolverse",
  description:
    "Free online developer utilities: IP lookup, UUID generator, password generator, hash generator, JWT decoder, HTTP tester, and regex tester.",
  alternates: {
    canonical: "https://toolversee.pages.dev/tools/developer-tools/",
  },
};

export default function DeveloperToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
