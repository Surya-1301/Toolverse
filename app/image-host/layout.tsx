import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hosted Image",
  description: "View a hosted image on ToolverseX.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function HostedImageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}