import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting...",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}