export default function SeoFaq({
  faq,
  pageUrl,
}: {
  faq: { q: string; a: string }[];
  pageUrl: string;
}) {
  const schema = {
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}