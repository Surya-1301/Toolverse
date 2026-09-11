/* Tool slug → breadcrumb parent trail. Centralized here so every tool page
   gets breadcrumbs without per-page edits (the tool layout already renders
   <SeoFaq>). */
import { toolSeo } from "@/lib/seoTools";

const TOOL_CATEGORY: Record<string, { parent: string; parentUrl: string }> = {
  // -- Formatter tools
  "html-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },
  "css-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },
  "javascript-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },
  "json-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },
  "sql-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },
  "typescript-formatter": { parent: "Formatter & Minifier", parentUrl: "/tools/formatter-tools" },

  // -- Conversion tools
  "markdown-to-pdf": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "markdown-to-html": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "yaml-json-converter": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "csv-json-converter": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "excel-csv-converter": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "color-converter": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "regex-tester": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "json-xml-converter": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },
  "image-to-base64": { parent: "Conversion Tools", parentUrl: "/tools/conversion-tools" },

  // -- Image tools
  "image-converter": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "image-resizer-cropper": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "image-watermark-tool": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "background-remover": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "favicon-generator": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "og-image-generator": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "image-blur": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "image-upscaler": { parent: "Image Tools", parentUrl: "/tools/image-tools" },
  "image-placeholder": { parent: "Image Tools", parentUrl: "/tools/image-tools" },

  // -- Developer tools (default fallback also maps here for safety)
  "ip-lookup": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "credit-card-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "fake-address-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "uuid-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "password-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "hash-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "random-string-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "base64-encoder-decoder": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "jwt-decoder": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "lorem-ipsum-generator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "text-counter": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "case-converter": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "duplicate-line-remover": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "timestamp-converter": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "url-tools": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "text-to-speech": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "audio-converter": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "domain-lookup": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "http-request-tester": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "text-compare": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },
  "email-phone-iban-validator": { parent: "Text & Developer Tools", parentUrl: "/tools/text-developer-tools" },

  // -- PDF tools
  "pdf-editor": { parent: "PDF Tools", parentUrl: "/pdf-editor" },
  "pdf-to-markdown": { parent: "PDF Tools", parentUrl: "/pdf-editor" },
};

type SeoFaqProps = {
  faq: { q: string; a: string }[];
  pageUrl: string;
  crumbs?: { name: string; url: string }[];
  pageName?: string;
};

export default function SeoFaq({ faq, pageUrl, crumbs, pageName }: SeoFaqProps) {
  // BreadcrumbList schema — tool pages get "Home > Tools > {parent} > {tool}".
  // Uses the passed trail, or derives one from the tool-slug mapping above.
  // Tools not listed in a category page get a 2-level "Home > Tools > {tool}".
  const trail =
    crumbs ??
    (() => {
      const segments = pageUrl.replace("https://toolversee.pages.dev/", "").split("/");
      const slug = segments[0] || "";
      const category = TOOL_CATEGORY[slug];

      const base: { name: string; url: string }[] = category
        ? [
            { name: "Home", url: "https://toolversee.pages.dev/" },
            { name: "Tools", url: "https://toolversee.pages.dev/tools" },
            {
              name: category.parent,
              url: `https://toolversee.pages.dev${category.parentUrl}`,
            },
          ]
        : [
            { name: "Home", url: "https://toolversee.pages.dev/" },
            { name: "Tools", url: "https://toolversee.pages.dev/tools" },
          ];

      return [
        ...base,
        {
          name:
            pageName ||
            (slug ? toolSeo[slug]?.title?.split(" - ")[0] : undefined) ||
            segments[segments.length - 1],
          url: pageUrl,
        },
      ];
    })();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": pageUrl ? `${pageUrl}#faq` : undefined,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}