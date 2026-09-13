import type { MetadataRoute } from "next";
import { toolSeo } from "@/lib/seoTools";
import { blogPosts } from "@/lib/blogPosts";

const siteUrl = "https://toolversee.pages.dev";

export const dynamic = "force-static";

const toolSlugs = Object.keys(toolSeo);

// The last date the sitemap content itself changed. Keep this ≤ today's date
// so Google does not discard lastmod as "impossible / in the future".
const lastmod = new Date("2026-09-12");

// Static pages outside the tool catalog (paths only — changefreq/priority are
// ignored by Google and only add noise to the XML).
const staticPaths = [
  "",
  "tools",
  "blog",
  "tools/conversion-tools",
  "tools/formatter-tools",
  "tools/image-tools",
  "tools/text-developer-tools",
  "pdf/add-pages",
  "pdf/compress",
  "pdf/extract-images",
  "pdf/header-footer",
  "pdf/merge",
  "pdf/metadata-editor",
  "pdf/pdf-to-text",
  "pdf/repair",
  "pdf/sign",
];

const legalPaths = ["contact", "privacy", "terms", "report-abuse"];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolUrls = toolSlugs.map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: lastmod,
  }));

  const blogUrls = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
  }));

  const staticUrls = staticPaths.map((path) => ({
    url: path ? `${siteUrl}/${path}` : siteUrl,
    lastModified: lastmod,
  }));

  const legalUrls = legalPaths.map((path) => ({
    url: `${siteUrl}/${path}`,
    lastModified: lastmod,
  }));

  return [...staticUrls, ...toolUrls, ...blogUrls, ...legalUrls];
}