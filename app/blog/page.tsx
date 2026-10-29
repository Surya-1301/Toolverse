import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { BackButton } from "@/components/BackButton";
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
  "Developer Tips": "bg-sky-500/15 text-sky-300 ring-sky-400/20",
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

      {/* Back navigation */}
      <div className="mb-6 flex justify-start">
        <BackButton />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
          Toolverse Blog
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Guides, tips &amp; comparisons
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-400 light:text-slate-600">
          Practical write-ups from the Toolverse team — the how and why behind
          the tools you use every day.
        </p>
      </div>

      {featured ? (
        <Link
          href={`/blog/${featured.slug}`}
          className="apple-glass group relative mt-12 block overflow-hidden rounded-3xl p-8 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15"
        >
          <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 font-semibold text-sky-300 border border-sky-400/20">
              <BookOpen className="h-3.5 w-3.5" />
              Featured
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-semibold border ${
                categoryColors[featured.category] || categoryColors.Guides
              }`}
            >
              {featured.category}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white transition group-hover:text-sky-300 sm:text-3xl light:text-slate-900">
            {featured.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-400 light:text-slate-600">
            {featured.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 light:text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(featured.date).toLocaleDateString("en", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>{featured.readTime}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-sky-400 group-hover:text-sky-300">
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
            className="apple-glass group relative flex flex-col overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15"
          >
            <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                  categoryColors[post.category] || categoryColors.Guides
                }`}
              >
                {post.category}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold leading-6 text-white transition group-hover:text-sky-300 light:text-slate-900">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400 light:text-slate-600">
              {post.description}
            </p>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500 light:text-slate-500">
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