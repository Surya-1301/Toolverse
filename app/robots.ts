import type { MetadataRoute } from "next";
​
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://toolversee.pages.dev/sitemap.xml",
  };
}