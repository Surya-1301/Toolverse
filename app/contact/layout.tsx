import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Support & Feedback | Toolverse",
  description:
    "Get in touch with the Toolverse team for support, bug reports, product feedback, and policy questions.",
  alternates: {
    canonical: "https://toolversee.pages.dev/contact/",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}