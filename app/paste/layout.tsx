import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paste - View a shared text or code snippet",
  description: "View a shared text or code snippet on Toolverse.",
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