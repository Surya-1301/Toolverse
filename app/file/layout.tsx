import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared File",
  description: "View a shared file on Toolverse.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function FileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}