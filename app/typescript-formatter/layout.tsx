import type { Metadata } from "next";
import SeoFaq from "@/components/SeoFaq";
import { toolSeo } from "@/lib/seoTools";

const seo = toolSeo["typescript-formatter"];

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: `https://toolversee.pages.dev/${seo.slug}/`,
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: `https://toolversee.pages.dev/${seo.slug}/`,
  },
};

export default function TypescriptFormatterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <SeoFaq faq={seo.faq} pageUrl="https://toolversee.pages.dev/typescript-formatter/" />
    </>
  );
}
