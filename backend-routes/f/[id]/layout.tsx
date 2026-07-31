import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared File",
  description: "Download a shared file on Toolverse.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SharedFileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}