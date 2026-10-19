"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  Eye,
  Globe,
  Share2,
  Tags,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { copyTextNative } from "@/lib/capacitor";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500 light:text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "min-h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

const selectClass =
  "min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900";

export default function MetaTagGeneratorPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [author, setAuthor] = useState("");
  const [canonical, setCanonical] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [robotsFollow, setRobotsFollow] = useState(true);
  const [themeColor, setThemeColor] = useState("#7c3aed");

  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [ogUrl, setOgUrl] = useState("");
  const [ogSiteName, setOgSiteName] = useState("");
  const [ogType, setOgType] = useState("website");

  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [twitterSite, setTwitterSite] = useState("");
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    const lines: string[] = [];
    const t = title.trim();
    const d = description.trim();

    if (t) lines.push(`<title>${escapeAttr(t)}</title>`);
    if (d) lines.push(`<meta name="description" content="${escapeAttr(d)}" />`);
    if (keywords.trim())
      lines.push(
        `<meta name="keywords" content="${escapeAttr(keywords.trim())}" />`,
      );
    if (author.trim())
      lines.push(`<meta name="author" content="${escapeAttr(author.trim())}" />`);
    if (canonical.trim())
      lines.push(`<link rel="canonical" href="${escapeAttr(canonical.trim())}" />`);
    lines.push(
      `<meta name="robots" content="${robotsIndex ? "index" : "noindex"}, ${robotsFollow ? "follow" : "nofollow"}" />`,
    );
    if (themeColor.trim())
      lines.push(
        `<meta name="theme-color" content="${escapeAttr(themeColor.trim())}" />`,
      );

    const ot = (ogTitle.trim() || t).trim();
    const od = (ogDescription.trim() || d).trim();
    if (ot || od || ogImage.trim() || ogUrl.trim() || ogSiteName.trim()) {
      lines.push("");
      lines.push("<!-- Open Graph -->");
      lines.push(`<meta property="og:type" content="${escapeAttr(ogType)}" />`);
      if (ogSiteName.trim())
        lines.push(
          `<meta property="og:site_name" content="${escapeAttr(ogSiteName.trim())}" />`,
        );
      if (ot)
        lines.push(
          `<meta property="og:title" content="${escapeAttr(ot)}" />`,
        );
      if (od)
        lines.push(
          `<meta property="og:description" content="${escapeAttr(od)}" />`,
        );
      if (ogUrl.trim())
        lines.push(
          `<meta property="og:url" content="${escapeAttr(ogUrl.trim())}" />`,
        );
      if (ogImage.trim())
        lines.push(
          `<meta property="og:image" content="${escapeAttr(ogImage.trim())}" />`,
        );
    }

    if (ot || od || ogImage.trim() || twitterSite.trim()) {
      lines.push("");
      lines.push("<!-- Twitter / X -->");
      lines.push(
        `<meta name="twitter:card" content="${escapeAttr(twitterCard)}" />`,
      );
      if (twitterSite.trim())
        lines.push(
          `<meta name="twitter:site" content="${escapeAttr(twitterSite.trim())}" />`,
        );
      if (ot)
        lines.push(
          `<meta name="twitter:title" content="${escapeAttr(ot)}" />`,
        );
      if (od)
        lines.push(
          `<meta name="twitter:description" content="${escapeAttr(od)}" />`,
        );
      if (ogImage.trim())
        lines.push(
          `<meta name="twitter:image" content="${escapeAttr(ogImage.trim())}" />`,
        );
    }

    return lines.join("\n");
  }, [
    title,
    description,
    keywords,
    author,
    canonical,
    robotsIndex,
    robotsFollow,
    themeColor,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogSiteName,
    ogType,
    twitterCard,
    twitterSite,
  ]);

  const previewTitle = (ogTitle.trim() || title.trim() || "Your page title").slice(0, 70);
  const previewDesc = (
    ogDescription.trim() ||
    description.trim() ||
    "Your meta description will appear here, just like in Google search results."
  ).slice(0, 170);
  const previewUrl = canonical.trim() || ogUrl.trim() || "https://example.com";

  async function copySnippet() {
    if (!snippet) return;
    try {
      if (!(await copyTextNative(snippet))) return;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadSnippet() {
    if (!snippet) return;
    const blob = new Blob([snippet + "\n"], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "head-snippet.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setTitle("");
    setDescription("");
    setKeywords("");
    setAuthor("");
    setCanonical("");
    setRobotsIndex(true);
    setRobotsFollow(true);
    setThemeColor("#7c3aed");
    setOgTitle("");
    setOgDescription("");
    setOgImage("");
    setOgUrl("");
    setOgSiteName("");
    setOgType("website");
    setTwitterCard("summary_large_image");
    setTwitterSite("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Meta Tag Generator
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Generate SEO meta tags, Open Graph and Twitter cards. Preview how
          your page looks on Google and social — then copy the snippet.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white light:text-slate-900">
            <Tags className="h-5 w-5 text-violet-300" />
            Basic meta tags
          </h2>
          <div className="space-y-4">
            <Field label="Page title" hint={`${title.length}/60 recommended`}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Page"
                className={inputClass}
              />
            </Field>
            <Field
              label="Meta description"
              hint={`${description.length}/160 recommended`}
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary of the page for search results."
                rows={3}
                className={`${inputClass} min-h-20 py-2`}
              />
            </Field>
            <Field label="Keywords (optional)" hint="Comma separated">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="tools, seo, generator"
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author (optional)">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </Field>
              <Field label="Theme color">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent light:border-slate-900/10"
                    aria-label="Theme color"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </Field>
            </div>
            <Field label="Canonical URL (optional)">
              <input
                type="url"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                placeholder="https://example.com/page"
                className={inputClass}
              />
            </Field>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300 light:text-slate-700">
                <input
                  type="checkbox"
                  checked={robotsIndex}
                  onChange={(e) => setRobotsIndex(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
                Allow indexing
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300 light:text-slate-700">
                <input
                  type="checkbox"
                  checked={robotsFollow}
                  onChange={(e) => setRobotsFollow(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
                Follow links
              </label>
            </div>
          </div>

          <h2 className="mb-4 mt-8 flex items-center gap-2 text-base font-semibold text-white light:text-slate-900">
            <Share2 className="h-5 w-5 text-violet-300" />
            Open Graph & Twitter
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="OG title (defaults to page title)">
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Share title"
                  className={inputClass}
                />
              </Field>
              <Field label="Site name (optional)">
                <input
                  type="text"
                  value={ogSiteName}
                  onChange={(e) => setOgSiteName(e.target.value)}
                  placeholder="My Site"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="OG description (defaults to meta description)">
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Description shown when shared."
                rows={2}
                className={`${inputClass} min-h-16 py-2`}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="OG image URL (optional)" hint="1200×630 recommended">
                <input
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://example.com/og.png"
                  className={inputClass}
                />
              </Field>
              <Field label="OG page URL (optional)">
                <input
                  type="url"
                  value={ogUrl}
                  onChange={(e) => setOgUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="OG type">
                <select
                  value={ogType}
                  onChange={(e) => setOgType(e.target.value)}
                  className={selectClass}
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                  <option value="profile">profile</option>
                </select>
              </Field>
              <Field label="Twitter card">
                <select
                  value={twitterCard}
                  onChange={(e) => setTwitterCard(e.target.value)}
                  className={selectClass}
                >
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary</option>
                </select>
              </Field>
            </div>
            <Field label="Twitter @site (optional)">
              <input
                type="text"
                value={twitterSite}
                onChange={(e) => setTwitterSite(e.target.value)}
                placeholder="@mysite"
                className={inputClass}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Preview + output */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white light:text-slate-900">
              <Eye className="h-5 w-5 text-violet-300" />
              Live preview
            </h2>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Google search
            </p>
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-slate-50">
              <p className="truncate text-lg text-[#8ab4f8] light:text-[#1a0dab]">
                {previewTitle}
              </p>
              <p className="mt-0.5 truncate text-sm text-[#bdc1c6] light:text-[#006621]">
                {previewUrl}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[#bdc1c6] light:text-[#545454]">
                {previewDesc}
              </p>
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Social share card
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 light:border-slate-900/10 light:bg-white">
              {ogImage.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ogImage.trim()}
                  alt="OG preview"
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-24 items-center justify-center bg-gradient-to-br from-violet-600/40 to-slate-900 text-sm text-slate-500">
                  <Globe className="mr-2 h-4 w-4" /> No OG image set
                </div>
              )}
              <div className="p-4">
                <p className="truncate text-sm text-slate-500">
                  {previewUrl.replace(/^https?:\/\//, "")}
                </p>
                <p className="mt-1 truncate font-semibold text-white light:text-slate-900">
                  {previewTitle}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400 light:text-slate-600">
                  {previewDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white light:text-slate-900">
                Generated snippet
              </h2>
              <span className="text-xs text-slate-500">
                {snippet.split("\n").length} lines
              </span>
            </div>
            <pre className="max-h-96 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-5 text-slate-300 light:border-slate-900/10 light:bg-slate-950 light:text-slate-300">
              {snippet || "<!-- Fill in the form to generate meta tags -->"}
            </pre>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copySnippet}
                disabled={!snippet}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy snippet"}
              </button>
              <button
                type="button"
                onClick={downloadSnippet}
                disabled={!snippet}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 light:border-slate-900/15 light:text-slate-900 light:hover:bg-slate-900/5"
              >
                <Download className="h-4 w-4" />
                .html
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the Meta Tag Generator"
          subtitle=""
          steps={[
            {
              title: "Add page title & description",
              description: "Write the title and meta description shown in search results.",
              icon: <Tags className="h-5 w-5" />,
            },
            {
              title: "Set indexing & canonical",
              description: "Choose index/follow preferences and add a canonical URL to avoid duplicates.",
              icon: <Globe className="h-5 w-5" />,
            },
            {
              title: "Add Open Graph tags",
              description: "Set the title, description, image and site name for Facebook/LinkedIn shares.",
              icon: <Share2 className="h-5 w-5" />,
            },
            {
              title: "Add Twitter card details",
              description: "Pick a card style and add your @site handle for rich previews on X.",
              icon: <Share2 className="h-5 w-5" />,
            },
            {
              title: "Check the live preview",
              description: "See exactly how your page appears on Google and in social feeds.",
              icon: <Eye className="h-5 w-5" />,
            },
            {
              title: "Copy & paste into <head>",
              description: "Copy the snippet or download it, then paste it inside your page's <head>.",
              icon: <Copy className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
