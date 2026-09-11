import type { Metadata } from "next";
import SeoFaq from "@/components/SeoFaq";
import { toolSeo } from "@/lib/seoTools";

const seo = toolSeo["favicon-generator"];

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  openGraph: {
    title: seo.title,
    description: seo.description,
  },
};

export default function FaviconGeneratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <SeoFaq faq={seo.faq} pageUrl="https://toolversee.pages.dev/favicon-generator" />
    </>
  );
}
