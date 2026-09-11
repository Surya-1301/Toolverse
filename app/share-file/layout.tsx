import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share File",
  description: "Share your files quickly with Toolverse.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ShareFileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
