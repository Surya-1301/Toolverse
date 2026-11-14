import type { Metadata } from "next";
import SeoFaq from "@/components/SeoFaq";
import { toolSeo } from "@/lib/seoTools";

const seo = toolSeo["instagram-reels-downloader"];

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

export default function InstagramReelsDownloaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <SeoFaq faq={seo.faq} pageUrl="https://toolversee.pages.dev/instagram-reels-downloader/" />
    </>
  );
}
