import type { Metadata } from "next";
import SeoFaq from "@/components/SeoFaq";
import { toolSeo } from "@/lib/seoTools";

const seo = toolSeo["ip-lookup"];

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  openGraph: {
    title: seo.title,
    description: seo.description,
  },
};

export default function IpLookupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <SeoFaq faq={seo.faq} pageUrl="https://toolversee.pages.dev/ip-lookup" />
    </>
  );
}
