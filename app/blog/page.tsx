import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { Container } from "@/components/Container";
import { sortedPosts } from "@/lib/blogPosts";

export const metadata: Metadata = {
  title: "Blog - Guides, Tips & Comparisons | Toolverse",
  description:
    "Practical guides and developer tips on image compression, JSON vs YAML, UUIDs, password strength, Base64, background removal, and more — from the Toolverse team.",
  alternates: {
    canonical: "https://toolversee.pages.dev/blog",
  },
  openGraph: {
    title: "Blog - Guides, Tips & Comparisons | Toolverse",
    description:
      "Practical guides and developer tips on image compression, JSON vs YAML, UUIDs, password strength, Base64, background removal, and more.",
    url: "https://toolversee.pages.dev/blog",
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Toolverse Blog",
  url: "https://toolversee.pages.dev/blog",
  description: metadata.description,
  publisher: {
    "@type": "Organization",
    name: "Toolverse",
    url: "https://toolversee.pages.dev",
  },
};

const categoryColors: Record<string, string> = {
  Guides: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20",
  "Developer Tips": "bg-violet-500/15 text-violet-300 ring-violet-400/20",
  Comparisons: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20",
  Security: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
};

export default function BlogIndexPage() {
  const featured = sortedPosts.filter((p) => p.featured).slice(0, 1)[0];
  const rest = sortedPosts.filter((p) => p.slug !== featured?.slug);

  return (
    <Container className="py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Toolverse Blog
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Guides, tips &amp; comparisons
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-400">
          Practical write-ups from the Toolverse team — the how and why behind
          the tools you use every day.
        </p>
      </div>

      {featured ? (
        <Link
          href={`/blog/${featured.slug}`}
          className="group mt-12 block rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 font-semibold text-violet-300 ring-1 ring-violet-400/20">
              <BookOpen className="h-3.5 w-3.5" />
              Featured
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ring-1 ${
                categoryColors[featured.category] || categoryColors.Guides
              }`}
            >
              {featured.category}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white transition group-hover:text-violet-200 sm:text-3xl">
            {featured.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-400">
            {featured.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(featured.date).toLocaleDateString("en", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>{featured.readTime}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-violet-300">
              Read article
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ) : null}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                  categoryColors[post.category] || categoryColors.Guides
                }`}
              >
                {post.category}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold leading-6 text-white transition group-hover:text-violet-200">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">
              {post.description}
            </p>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString("en", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>{post.readTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}