import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Support & Feedback | Toolverse",
  description:
    "Get in touch with the Toolverse team for support, bug reports, product feedback, and policy questions.",
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}