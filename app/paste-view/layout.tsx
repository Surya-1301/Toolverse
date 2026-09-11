import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Paste",
  description: "View a shared paste on Toolverse.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PasteViewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}