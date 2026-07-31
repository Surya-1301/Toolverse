"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { HowToUse } from "@/components/HowToUse";
import {
  BarChart3,
  Check,
  Copy,
  Eraser,
  ExternalLink,
  Link2,
  Loader2,
  QrCode,
  Send,
} from "lucide-react";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { apiUrl } from "@/lib/apiBase";

const expiryOptions = [
  { label: "Never", value: "never" },
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

type ShortUrlResult = {
  slug: string;
  url: string;
  longUrl: string;
  clicks: number;
  expiresAt: string | null;
};

export default function UrlShortenerPage() {
  return (
    <Suspense fallback={<UrlShortenerLoading />}>
      <UrlShortenerContent />
    </Suspense>
  );
}

function UrlShortenerLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading URL Shortener...
        </div>
      </div>
    </Container>
  );
}

function UrlShortenerContent() {
  const searchParams = useSearchParams();

  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiry, setExpiry] = useState("never");
  const [shortUrl, setShortUrl] = useState("");
  const [result, setResult] = useState<ShortUrlResult | null>(null);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clicks, setClicks] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "expired") {
      setError("That short URL has expired.");
    }
  }, [searchParams]);

  async function createShortUrl() {
    try {
      setError("");
      setShortUrl("");
      setResult(null);
      setCopied(false);
      setClicks(null);

      if (!longUrl.trim()) {
        setError("Please enter a URL first.");
        return;
      }

      setIsCreating(true);

      const response = await fetch(apiUrl("/api/shorten"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          longUrl,
          customSlug,
          expiry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not shorten URL.");
        return;
      }

      const fullUrl = `${window.location.origin}/go?slug=${data.slug}`;
      setShortUrl(fullUrl);
      setResult(data);
      setClicks(data.clicks);
    } catch {
      setError("Could not shorten URL. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyShortUrl() {
    if (!shortUrl) return;

    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  async function refreshStats() {
    if (!result?.slug) return;

    try {
      setError("");

      const response = await fetch(apiUrl(`/api/shorten/${result.slug}`));
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not load stats.");
        return;
      }

      setClicks(data.clicks);
    } catch {
      setError("Could not load stats.");
    }
  }

  function clearAll() {
    setLongUrl("");
    setCustomSlug("");
    setExpiry("never");
    setShortUrl("");
    setResult(null);
    setError("");
    setCopied(false);
    setClicks(null);
  }

  function formatExpiry(value: string | null) {
    if (!value) return "Never";

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  const qrHref = shortUrl
    ? `/qr-generator?text=${encodeURIComponent(shortUrl)}`
    : "/qr-generator";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Shortener
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Turn long URLs into short, clean, shareable links.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Long URL
            </label>

            <input
              value={longUrl}
              onChange={(event) => setLongUrl(event.target.value)}
              placeholder="https://example.com/very/long/url"
              type="url"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Must start with http:// or https://
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Custom alias{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-400 sm:justify-start">
                  /s/
                </span>

                <input
                  value={customSlug}
                  onChange={(event) =>
                    setCustomSlug(event.target.value.toLowerCase())
                  }
                  placeholder="my-link"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                3-30 characters: letters, numbers, hyphens.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Expires
              </label>

              <select
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              >
                {expiryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Expired links are removed when opened.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {shortUrl && result ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                Short URL created successfully
              </p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={shortUrl}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                />

                <button
                  onClick={copyShortUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-500">Slug</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    /s/{result.slug}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-500">Clicks</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {clicks ?? result.clicks}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-500">Expires</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatExpiry(result.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Open short URL
                  <ExternalLink className="h-4 w-4" />
                </a>

                <Link
                  href={qrHref}
                  className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Create QR
                  <QrCode className="h-4 w-4" />
                </Link>

                <button
                  onClick={refreshStats}
                  className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Refresh stats
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={createShortUrl}
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isCreating ? "Shortening..." : "Shorten URL"}
            </button>

            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <HowToUse
        subtitle=""
        steps={[
          {
            title: "Paste long URL",
            description:
              "Enter a full URL that starts with http:// or https://.",
            icon: <Link2 className="h-5 w-5" />,
          },
          {
            title: "Add alias",
            description: "Optionally create a custom short slug for the link.",
            icon: <Send className="h-5 w-5" />,
          },
          {
            title: "Set expiry",
            description: "Choose when the short URL should stop working.",
            icon: <Clock className="h-5 w-5" />,
          },
          {
            title: "Copy short link",
            description: "Copy the generated link and share it anywhere.",
            icon: <Copy className="h-5 w-5" />,
          },
          {
            title: "Create QR",
            description:
              "Open the QR Generator with your short link prefilled.",
            icon: <QrCode className="h-5 w-5" />,
          },
          {
            title: "Refresh stats",
            description: "Update the analytics for your short link.",
            icon: <BarChart3 className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}
