/**
 * Blog post registry for Toolverse.
 * Each post targets a long-tail search query, provides genuinely useful
 * content, and internally links to the matching tool page.
 *
 * Add a new post by appending an entry here — the blog index, article pages,
 * and sitemap all pick it up automatically.
 */

import { toolSeo } from "@/lib/seoTools";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date — used for sorting, schema.datePublished, and sitemap lastmod */
  date: string;
  updated?: string;
  /** Display name for the author */
  author: string;
  /** Comma-separated topics/objects the post is about (for JSON-LD) */
  keywords: string[];
  /** Human-readable reading time (fallback: computed from body) */
  readTime: string;
  /** The tool this post funnels to — used for the CTA + related tools */
  toolSlug: string;
  /** Category label for filtering / breadcrumbs */
  category: "Guides" | "Developer Tips" | "Comparisons" | "Security";
  /** Section headings for a quick "in this article" nav (plain, pre-derived) */
  sections: { id: string; label: string }[];
  /** True for static export: all post rendering happens at build time */
  body: { type: "p" | "h2" | "h3" | "ul" | "ol" | "code" | "tip" | "link"; text?: string; items?: string[] }[];
  /** Featured on the blog homepage */
  featured?: boolean;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-compress-images-for-web",
    title: "How to Compress Images for the Web (2026 Guide)",
    description:
      "Learn how to compress JPG, PNG, and WebP images for the web without visible quality loss. Includes exact size targets, format picks, and a free browser tool.",
    date: "2026-08-20",
    author: "Toolverse",
    keywords: ["image compression", "web performance", "JPEG", "WebP", "Core Web Vitals"],
    readTime: "6 min read",
    toolSlug: "image-compressor",
    category: "Guides",
    featured: true,
    sections: [
      { id: "why-size-matters", label: "Why image size matters" },
      { id: "right-format", label: "Choosing the right format" },
      { id: "compression-settings", label: "Recommended compression settings" },
      { id: "compress-for-free", label: "Compress for free with Toolverse" },
    ],
    body: [
      {
        type: "p",
        text: "Images are the single heaviest asset on most web pages. A few uncompressed photos can easily add 3–5 MB to a page load — and that directly costs you visitors. Google research has consistently shown that pages under 1 second load convert far better, and image weight is usually the easiest win.",
      },
      { type: "h2", text: "Why image size matters" },
      {
        type: "p",
        text: "Every extra 100 KB of image weight adds meaningful time on slow connections, and on mobile data it burns your visitors' bandwidth. Beyond user experience, page speed is a ranking signal — Google's Core Web Vitals include Largest Contentful Paint (LCP), and the largest image on your page is typically what sets that metric. Compressing images is one of the most direct ways to improve LCP.",
      },
      { type: "h2", text: "Choosing the right format" },
      {
        type: "ul",
        items: [
          "JPEG — best for photos and gradients. Compresses well with slightly visible artifacts at aggressive settings.",
          "PNG — best for screenshots, logos, and anything with text or transparency. Not ideal for photos.",
          "WebP — modern format with excellent quality-per-byte. Great for photos and graphics alike.",
          "AVIF — even better compression than WebP, but still limited in some older tools.",
        ],
      },
      {
        type: "p",
        text: "A good rule: photos go to JPEG or WebP, graphics with flat colors go to PNG, and if you can use WebP you'll almost always get the smallest file.",
      },
      { type: "h2", text: "Recommended compression settings" },
      {
        type: "ul",
        items: [
          "JPEG quality 70–80% keeps artifacts invisible while cutting file size by 50–70%.",
          "Resize to the largest size the image will actually be displayed at — a 4000px photo shown in a 800px box wastes 80% of its bytes.",
          "For WebP, target quality 75–85%; it typically beats JPEG quality 80 by a wide margin.",
          "Strip metadata (EXIF) — camera GPS and device info is often tens of KB of dead weight.",
        ],
      },
      { type: "h2", text: "Compress for free with Toolverse" },
      {
        type: "p",
        text: "You don't need expensive software. Toolverse's free Image Compressor lets you compress JPG, PNG, and WebP right in your browser — upload, adjust quality, and download. No uploads to a server, no signup, no watermark.",
      },
      {
        type: "link",
        text: "Compress your images now with the free image compressor",
      },
      { type: "tip", text: "Tip: compress in batches. Most pages have 10–30 images, and doing them one by one takes forever. The Toolverse compressor handles multiple files at once." },
    ],
  },
  {
    slug: "json-vs-yaml-which-to-choose",
    title: "JSON vs YAML: Which One Should You Use?",
    description:
      "JSON and YAML are the two most common data formats for configs and APIs. Here's how they compare on syntax, nesting, comments, and when each one wins.",
    date: "2026-08-12",
    author: "Toolverse",
    keywords: ["JSON", "YAML", "config files", "data formats", "developer tools"],
    readTime: "7 min read",
    toolSlug: "yaml-json-converter",
    category: "Comparisons",
    sections: [
      { id: "what-are-they", label: "What are JSON and YAML?" },
      { id: "syntax", label: "Syntax at a glance" },
      { id: "when-to-use", label: "When to use each" },
      { id: "convert", label: "Convert between them for free" },
    ],
    body: [
      {
        type: "p",
        text: "If you write software, you've probably touched both. JSON powers APIs, databases, and package manifests. YAML is the default for Kubernetes, Docker Compose, GitHub Actions, and most CI/CD pipelines. Understanding where each one shines — and where it hurts — keeps your configs maintainable.",
      },
      { type: "h2", text: "What are JSON and YAML?" },
      {
        type: "p",
        text: "JSON is a lightweight data-interchange format. It's strict, unambiguous, and machine-parseable everywhere — every language has first-class JSON support. YAML is a superset of JSON designed for humans: it uses indentation instead of braces and brackets, so files read almost like outlines.",
      },
      { type: "h2", text: "Syntax at a glance" },
      {
        type: "p",
        text: "The core difference is how structure is delimited. JSON wraps object properties in curly braces with quoted keys and colons; YAML uses indentation, which is why tabs are forbidden in YAML files.",
      },
      {
        type: "code",
        text: '{"name": "Toolverse", "tools": ["JSON", "YAML"]}',
      },
      {
        type: "tip",
        text: "YAML gotchas: indentation matters, tabs break files, and the famous Norway problem (the string 'no' parses as a boolean) — always quote values like 'no' if you mean text.",
      },
      { type: "h2", text: "When to use each" },
      {
        type: "ul",
        items: [
          "Use JSON when data crosses system boundaries — APIs, storage, and any format another team or machine reads.",
          "Use YAML in repositories where humans read and edit config daily — CI/CD pipelines, Docker Compose, Kubernetes.",
          "Use YAML for anything with comments; JSON has no comment syntax and depends on external conventions.",
          "If you need strict validation, JSON Schema is far more established than YAML's schema tooling.",
        ],
      },
      { type: "h2", text: "Convert between them for free" },
      {
        type: "p",
        text: "Migration often means converting legacy JSON configs into YAML (or the reverse). Instead of pasting snippets into chat and hoping, use a reliable converter that validates as it goes.",
      },
      {
        type: "link",
        text: "Convert YAML to JSON or JSON to YAML with the free converter",
      },
    ],
  },
  {
    slug: "what-is-a-uuid-and-how-to-generate-them",
    title: "What Is a UUID? A Practical Guide to UUID v4 and v7",
    description:
      "UUIDs are everywhere in modern databases and APIs. Learn what they are, the differences between v4 and v7, and how to generate them in bulk for free.",
    date: "2026-07-30",
    author: "Toolverse",
    keywords: ["UUID", "GUID", "primary keys", "database", "v4", "v7"],
    readTime: "5 min read",
    toolSlug: "uuid-generator",
    category: "Developer Tips",
    sections: [
      { id: "what-is", label: "What is a UUID?" },
      { id: "v4-vs-v7", label: "UUID v4 vs v7" },
      { id: "generate", label: "Generate UUIDs in bulk" },
    ],
    body: [
      {
        type: "p",
        text: "If you've set up a database recently, you've seen UUIDs — 36-character identifiers like 550e8400-e29b-41d4-a716-446655440000. They're globally unique without talking to a central server, which makes them perfect for distributed systems, offline-first apps, and public-facing IDs.",
      },
      { type: "h2", text: "What is a UUID?" },
      {
        type: "p",
        text: "A UUID (Universally Unique Identifier) is a 128-bit number rendered as 32 hexadecimal digits grouped into five sections. The version digit tells you how it was generated, and the variant digit marks the layout. The practical promise is simple: two UUIDs generated anywhere in the world will never collide, so you never need a shared counter to issue IDs.",
      },
      { type: "h2", text: "UUID v4 vs v7" },
      {
        type: "ul",
        items: [
          "UUID v4 — fully random. Dead simple, near-zero collision risk, still the most common in the wild.",
          "UUID v7 — time-ordered and sortable. The timestamp prefix means rows land in insertion order, which dramatically improves B-tree index locality in databases like PostgreSQL.",
          "If your database is large and UUIDs are the primary key, v7 usually outperforms v4 because of cache efficiency.",
        ],
      },
      { type: "h2", text: "Generate UUIDs in bulk" },
      {
        type: "p",
        text: "You don't need a code editor open to mint test IDs. The Toolverse UUID generator produces v4 and v7 values in bulk — hundreds in one click — with easy copy, all in your browser.",
      },
      {
        type: "link",
        text: "Generate UUID v4 and v7 for free",
      },
    ],
  },
  {
    slug: "how-to-remove-image-backgrounds",
    title: "How to Remove the Background From an Image (Free, No Signup)",
    description:
      "Remove photo backgrounds for product shots, profile pictures, and thumbnails in seconds — free, private, and entirely in your browser.",
    date: "2026-07-15",
    author: "Toolverse",
    keywords: ["background removal", "transparent PNG", "photo editing", "product images"],
    readTime: "4 min read",
    toolSlug: "background-remover",
    category: "Guides",
    sections: [
      { id: "why-remove", label: "Why remove a background?" },
      { id: "how-it-works", label: "How AI background removal works" },
      { id: "try-it", label: "Try it for free" },
    ],
    body: [
      {
        type: "p",
        text: "Background removal used to mean hours of pen-tool tracing in Photoshop. Today an AI model can separate subject from background in under a second — and you no longer need to upload photos to a stranger's server to do it.",
      },
      { type: "h2", text: "Why remove a background?" },
      {
        type: "ul",
        items: [
          "Product shots — clean white or transparent backgrounds convert better in marketplaces and ads.",
          "Profile pictures — a consistent cutout looks professional on every platform.",
          "Marketing thumbnails — transparent PNGs layer over any design or color.",
          "Web graphics — remove clutter so the subject is the message.",
        ],
      },
      { type: "h2", text: "How AI background removal works" },
      {
        type: "p",
        text: "Modern background removal uses a segmentation model that predicts, per pixel, whether it belongs to the foreground subject or the background. Hair, fur, and translucent edges are the hard cases — good models handle them by estimating partial coverage per pixel instead of making a hard cut.",
      },
      { type: "h2", text: "Try it for free" },
      {
        type: "p",
        text: "Toolverse's background remover runs the model locally-driven in your browser. Upload a JPG, PNG, or WebP, get a transparent PNG back in seconds — no account, no watermark, and your photo never leaves your device.",
      },
      {
        type: "link",
        text: "Remove a background for free now",
      },
    ],
  },
  {
    slug: "password-strength-what-makes-a-strong-password",
    title: "Password Strength: What Actually Makes a Password Hard to Crack?",
    description:
      "Length beats complexity. Here's how password strength really works, what entropy means, and how to check your own passwords without sending them anywhere.",
    date: "2026-06-28",
    author: "Toolverse",
    keywords: ["password", "security", "entropy", "brute force", "password strength"],
    readTime: "5 min read",
    toolSlug: "password-strength-checker",
    category: "Security",
    sections: [
      { id: "entropy", label: "Entropy, not complexity" },
      { id: "length-wins", label: "Why length beats complexity" },
      { id: "check-yourself", label: "Check your own passwords" },
    ],
    body: [
      {
        type: "p",
        text: "Most password advice is outdated. Adding an exclamation mark and a digit to 'password' doesn't make it strong — an eight-character password with a symbol still has only ~47 bits of entropy, and a modern GPU can brute-force it in hours. The real determinant of strength is entropy: the number of guesses an attacker must try.",
      },
      { type: "h2", text: "Entropy, not complexity" },
      {
        type: "p",
        text: "Entropy measures the uncertainty of your password — how many combinations an attacker has to search. A password's entropy depends mainly on its length and the size of the character pool it draws from. Every extra character multiplies the search space; replacing a letter with a symbol barely moves the needle.",
      },
      { type: "h2", text: "Why length beats complexity" },
      {
        type: "ul",
        items: [
          "A 12-character lowercase password has ~56 bits of entropy — harder than an 8-character password with symbols.",
          "Passphrases (four random words) routinely reach 60–80 bits and are easy to remember.",
          "Common substitutions (P@ssw0rd) are instantly defeated by large dictionary-attack wordlists.",
          "Reusing a password across sites means one leak compromises everything — strength can't save you there.",
        ],
      },
      { type: "h2", text: "Check your own passwords" },
      {
        type: "p",
        text: "Use a locale checker that scores length, variety, and common patterns — and that keeps the password on your device. The Toolverse password strength checker runs entirely in your browser, so your password never leaves your keyboard.",
      },
      {
        type: "link",
        text: "Check your password strength privately",
      },
    ],
  },
  {
    slug: "what-is-a-base64-encoder-and-when-to-use-it",
    title: "What Is a Base64 Encoder and When Should You Use It?",
    description:
      "Base64 turns binary data into safe ASCII text — powering inline images, API payloads, and data URIs. Here's how it works and when it's actually a good idea.",
    date: "2026-06-10",
    author: "Toolverse",
    keywords: ["Base64", "encoding", "data URI", "API", "binary"],
    readTime: "5 min read",
    toolSlug: "base64-encoder-decoder",
    category: "Developer Tips",
    sections: [
      { id: "what-is-base64", label: "What is Base64?" },
      { id: "common-uses", label: "Common uses" },
      { id: "encode-decode", label: "Encode and decode for free" },
    ],
    body: [
      {
        type: "p",
        text: "Base64 is an encoding that represents arbitrary binary data using only 64 ASCII characters (A–Z, a–z, 0–9, +, /). Because the output is pure text, it travels safely through systems that only understand text — JSON, URLs, emails, and HTML.",
      },
      { type: "h2", text: "What is Base64?" },
      {
        type: "p",
        text: "Each Base64 character encodes 6 bits, so every three bytes of input become four characters. That's why Base64 output is about 33% larger than the original. It's an encoding, not encryption — anyone can decode it, so it's for transport compatibility, never for secrecy.",
      },
      { type: "h2", text: "Common uses" },
      {
        type: "ul",
        items: [
          "Data URIs — embedding small images directly in HTML or CSS instead of a separate request.",
          "API payloads — sending binary attachments inside JSON bodies.",
          "Emails — MIME uses Base64 to attach files safely.",
          "Auth — HTTP Basic and various tokens are Base64-encoded text.",
        ],
      },
      { type: "h2", text: "Encode and decode for free" },
      {
        type: "p",
        text: "When you need to flip binary to text or inspect a token, a local encoder keeps sensitive data private. The Toolverse Base64 encoder/decoder handles both text and files right in your browser.",
      },
      {
        type: "link",
        text: "Encode or decode Base64 in your browser",
      },
    ],
  },
];

/** Blog posts sorted newest-first */
export const sortedPosts = [...blogPosts].sort(
  (a, b) => (b.date < a.date ? -1 : 1),
);

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

/** Related tool pulled from the shared SEO catalog for each post's CTA. */
export function getPostTool(post: BlogPost) {
  return toolSeo[post.toolSlug];
}