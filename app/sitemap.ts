import type { MetadataRoute } from "next";
import { toolSeo } from "@/lib/seoTools";
import { blogPosts } from "@/lib/blogPosts";

const siteUrl = "https://toolversee.pages.dev";

export const dynamic = "force-static";

const toolSlugs = Object.keys(toolSeo);

// Static pages outside the tool catalog
const staticPages = [
  { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
  { path: "tools", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "blog", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "tools/conversion-tools", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "tools/formatter-tools", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "tools/image-tools", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "tools/text-developer-tools", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "pdf/add-pages", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/compress", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/extract-images", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/header-footer", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/merge", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/metadata-editor", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/pdf-to-text", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/repair", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "pdf/sign", changeFrequency: "monthly" as const, priority: 0.7 },
];

const legalPages = [
  { path: "contact", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "report-abuse", changeFrequency: "yearly" as const, priority: 0.3 },
];

const lastmod = new Date("2026-09-12");

export default function sitemap(): MetadataRoute.Sitemap {
  const toolUrls = toolSlugs.map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: lastmod,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogUrls = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const staticUrls = staticPages.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${siteUrl}/${path}` : siteUrl,
    lastModified: lastmod,
    changeFrequency,
    priority,
  }));

  const legalUrls = legalPages.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}/${path}`,
    lastModified: lastmod,
    changeFrequency,
    priority,
  }));

  return [...staticUrls, ...toolUrls, ...blogUrls, ...legalUrls];
}