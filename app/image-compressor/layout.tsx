import type { Metadata } from "next";
import SeoFaq from "@/components/SeoFaq";
import { toolSeo } from "@/lib/seoTools";

const seo = toolSeo["image-compressor"];

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  openGraph: {
    title: seo.title,
    description: seo.description,
  },
};

export default function ImageCompressorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <SeoFaq
        faq={seo.faq}
        pageUrl="https://toolversee.pages.dev/image-compressor"
      />
    </>
  );
}