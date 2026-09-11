import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  User,
} from "lucide-react";
import { Container } from "@/components/Container";
import { getPost, getPostTool, sortedPosts, type BlogPost } from "@/lib/blogPosts";

/* -----------------------------------------------------------------------
   Static params for next build — required for `output: "export"`.
   ----------------------------------------------------------------------- */

export function generateStaticParams() {
  return sortedPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

/* -----------------------------------------------------------------------
   Metadata for each blog article.
   ----------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://toolversee.pages.dev/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `https://toolversee.pages.dev/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

/* -----------------------------------------------------------------------
   Category badge color map.
   ----------------------------------------------------------------------- */

const categoryColors: Record<string, string> = {
  Guides: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20",
  "Developer Tips": "bg-violet-500/15 text-violet-300 ring-violet-400/20",
  Comparisons: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20",
  Security: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
};

/* -----------------------------------------------------------------------
   Minimal markdown-like body renderer.
   ----------------------------------------------------------------------- */

function BodyRenderer({ body, tool }: { body: BlogPost["body"]; tool?: ReturnType<typeof getPostTool> }) {
  return (
    <div className="prose prose-slate max-w-none space-y-5 text-base leading-8 text-slate-300 [&>h2]:mt-12 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-white [&>h3]:mt-8 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-white [&>p]:text-slate-400">
      {body.map((block, i) => {
        const key = `${block.type}-${i}`;

        if (block.type === "h2") {
          const id = block.text
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return (
            <h2 key={key} id={id}>
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          const id = block.text
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return (
            <h3 key={key} id={id}>
              {block.text}
            </h3>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={key} className="space-y-2">
              {block.items?.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={key} className="list-decimal space-y-2 pl-6">
              {block.items?.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={key}
              className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm text-slate-300"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "tip") {
          return (
            <div
              key={key}
              className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-200"
            >
              💡 {block.text}
            </div>
          );
        }

        if (block.type === "link") {
          if (!tool) return null;
          return (
            <Link
              key={key}
              href={`/${tool.slug}`}
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              {block.text}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          );
        }

        if (block.type === "p") {
          return <p key={key}>{block.text}</p>;
        }

        return null;
      })}
    </div>
  );
}

/* -----------------------------------------------------------------------
   CTA card linking to the tool this post funnels to.
   ----------------------------------------------------------------------- */

function ToolCta({ tool }: { tool: ReturnType<typeof getPostTool> }) {
  if (!tool) return null;

  return (
    <div className="mt-12 rounded-3xl border border-violet-400/20 bg-violet-600/10 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-violet-300">
        Try it now
      </p>
      <h3 className="mt-2 text-xl font-bold text-white">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {tool.description}
      </p>
      <Link
        href={`/${tool.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        Open {tool.title.split(" - ")[0]}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Article page.
   ----------------------------------------------------------------------- */

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-3xl font-bold text-white">Post not found</h1>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </Container>
    );
  }

  const tool = getPostTool(post);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Toolverse",
      url: "https://toolversee.pages.dev",
    },
    mainEntityOfPage: `https://toolversee.pages.dev/blog/${post.slug}`,
    keywords: post.keywords.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://toolversee.pages.dev/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://toolversee.pages.dev/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://toolversee.pages.dev/blog/${post.slug}`,
      },
    ],
  };

  return (
    <Container className="py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
              categoryColors[post.category] || categoryColors.Guides
            }`}
          >
            {post.category}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          {post.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-white/10 pb-6 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {post.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("en", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
        </div>

        {/* Table of contents */}
        <nav className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            In this article
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {post.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-slate-400 transition hover:text-violet-300"
                >
                  {section.label}
                </a>
              </li>
            ))}
            {tool ? (
              <li>
                <a
                  href="#try-it"
                  className="text-slate-400 transition hover:text-violet-300"
                >
                  Try it now — {tool.title.split(" - ")[0]}
                </a>
              </li>
            ) : null}
          </ul>
        </nav>

        {/* Body */}
        <div className="mt-10">
          <BodyRenderer body={post.body} tool={tool} />
        </div>

        {/* Tool CTA */}
        {tool ? (
          <div id="try-it">
            <ToolCta tool={tool} />
          </div>
        ) : null}

        {/* Related articles — same category or same tool target */}
        {(() => {
          const related = sortedPosts.filter(
            (p) =>
              p.slug !== post.slug &&
              (p.category === post.category || p.toolSlug === post.toolSlug),
          );
          if (related.length === 0) return null;
          const shown = related.slice(0, 3);
          return (
            <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Related articles
              </p>
              <ul className="mt-3 space-y-3">
                {shown.map((rel) => (
                  <li key={rel.slug}>
                    <Link
                      href={`/blog/${rel.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3 transition hover:border-violet-400/40 hover:bg-white/[0.05]"
                    >
                      <span className="text-sm font-semibold text-white transition group-hover:text-violet-200">
                        {rel.title}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </article>
    </Container>
  );
}