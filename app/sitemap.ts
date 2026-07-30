import type { MetadataRoute } from "next";

const baseUrl = "https://toolverse.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/json-formatter",
    "/qr-generator",
    "/image-compressor",
    "/privacy",
    "/terms",
    "/contact",
    "/report-abuse"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}