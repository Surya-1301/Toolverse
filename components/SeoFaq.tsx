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
};

type SeoFaqProps = {
  faq: { q: string; a: string }[];
  pageUrl: string;
  crumbs?: { name: string; url: string }[];
  pageName?: string;
  heading?: string;
  subheading?: string;
};

export default function SeoFaq({ faq, pageUrl, crumbs, pageName, heading, subheading }: SeoFaqProps) {
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
      {faq && faq.length > 0 ? (
        <section
          id="faq"
          aria-labelledby="tool-faq-heading"
          className="mx-auto mt-10 w-full max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8"
        >
          <div className="text-center">
            <p className="text-xs font-mono font-medium tracking-[0.28em] text-slate-500 light:text-slate-500">
              FAQ
            </p>
            <h2
              id="tool-faq-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl light:text-slate-900"
            >
              {heading || `Frequently asked questions`}
            </h2>
            {subheading ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base light:text-slate-600">
                {subheading}
              </p>
            ) : null}
          </div>

          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {faq.map((item, index) => (
              <details
                key={`${item.q}-${index}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] transition open:border-violet-500/40 open:bg-white/[0.05] light:border-slate-900/10 light:bg-white light:open:bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white marker:hidden light:text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg font-medium leading-none text-slate-300 transition group-open:rotate-45 group-open:border-violet-500/40 group-open:text-violet-300 light:border-slate-900/10 light:text-slate-500 light:group-open:text-violet-600"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm leading-6 text-slate-400 light:text-slate-600">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}