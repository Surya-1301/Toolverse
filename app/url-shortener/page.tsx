"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Copy,
  Eraser,
  ExternalLink,
  Link2,
  Loader2,
  QrCode,
  Send,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { apiUrl, fetchApi } from "@/lib/apiBase";
import { type ClickLog } from "@/lib/localDb";

function BackToToolsLink() {
  return (
    <Link
      href="/tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

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
  const [clickLogs, setClickLogs] = useState<ClickLog[]>([]);

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

      const response = await fetchApi("/api/shorten", {
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

      const responseText = await response.text();
      let data: (ShortUrlResult & { error?: string }) | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            responseText ||
            `Could not shorten URL. Backend returned ${response.status}.`,
        );
        return;
      }

      if (!data?.slug) {
        setError("Short URL created but no slug was returned.");
        return;
      }

      const fullUrl = `${window.location.origin}/go?slug=${data.slug}`;
      setShortUrl(fullUrl);
      setResult(data);
      setClicks(data.clicks);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not shorten URL: ${caughtError.message}`
          : "Could not shorten URL. Please check your backend Worker URL.",
      );
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

      const response = await fetchApi(`/api/shorten/${result.slug}`, {
        cache: "no-store",
      });

      const responseText = await response.text();
      let data:
        | {
            clicks?: number;
            clickLogs?: ClickLog[];
            error?: string;
          }
        | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            responseText ||
            `Could not load stats. Backend returned ${response.status}.`,
        );
        return;
      }

      setClicks(typeof data?.clicks === "number" ? data.clicks : 0);
      setClickLogs(Array.isArray(data?.clickLogs) ? data.clickLogs : []);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not load stats: ${caughtError.message}`
          : "Could not load stats.",
      );
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
    setClickLogs([]);
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
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Shortener
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Shrink long URLs into clean, memorable links you can share anywhere.
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
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                />

                <button
                  type="button"
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

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open
                  <ExternalLink className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={refreshStats}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <BarChart3 className="h-4 w-4" />
                  Refresh
                </button>

                <Link
                  href={qrHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <QrCode className="h-4 w-4" />
                  QR
                </Link>

                <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200">
                  <Clock className="h-4 w-4" />
                  {clicks ?? 0}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-emerald-100/80 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-400">Alias</p>
                  <p className="mt-1 text-white">/s/{result.slug}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-400">Expires</p>
                  <p className="mt-1 text-white">
                    {formatExpiry(result.expiresAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Click Stats */}
          {clicks !== null && clicks > 0 && clickLogs.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">
                  Click Statistics
                </h3>
                <span className="ml-auto rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                  {clicks} total
                </span>
              </div>

              {/* Clicks by date */}
              {(() => {
                const byDate: Record<string, number> = {};
                for (const log of clickLogs) {
                  const day = log.timestamp.slice(0, 10);
                  byDate[day] = (byDate[day] || 0) + 1;
                }
                const sortedDates = Object.entries(byDate)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 7);

                if (sortedDates.length === 0) return null;

                const maxCount = Math.max(...sortedDates.map(([, c]) => c), 1);

                return (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-slate-400">
                      Clicks by date
                    </p>
                    <div className="space-y-1.5">
                      {sortedDates.map(([date, count]) => (
                        <div key={date} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-right font-mono text-[11px] text-slate-500">
                            {date.slice(5)}
                          </span>
                          <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/5">
                            <div
                              className="absolute inset-y-0 left-0 rounded bg-violet-500/40"
                              style={{
                                width: `${Math.round((count / maxCount) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[11px] text-slate-400">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Top referrers */}
              {(() => {
                const refCounts: Record<string, number> = {};
                for (const log of clickLogs) {
                  const ref = log.referer
                    ? new URL(log.referer).hostname
                    : "Direct / No referer";
                  refCounts[ref] = (refCounts[ref] || 0) + 1;
                }
                const topRefs = Object.entries(refCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5);

                if (topRefs.length === 0) return null;

                return (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-slate-400">
                      Top referrers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topRefs.map(([ref, count]) => (
                        <span
                          key={ref}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300"
                        >
                          {ref}
                          <span className="font-mono text-violet-400">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Recent clicks */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">
                  Recent clicks
                </p>
                <div className="max-h-[300px] overflow-auto rounded-xl border border-white/10 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500">
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Referrer</th>
                        <th className="hidden px-3 py-2 font-medium sm:table-cell">
                          Device
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...clickLogs].reverse().slice(0, 20).map((log, i) => {
                        const time = new Date(log.timestamp);
                        const timeStr = time.toLocaleTimeString("en", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const dateStr = time.toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        });

                        let refHost = "Direct";
                        try {
                          if (log.referer) {
                            refHost = new URL(log.referer).hostname;
                          }
                        } catch {
                          refHost = log.referer || "Unknown";
                        }

                        let device = "Unknown";
                        if (log.userAgent) {
                          const ua = log.userAgent.toLowerCase();
                          if (ua.includes("mobile") || ua.includes("android"))
                            device = "📱 Mobile";
                          else if (ua.includes("tablet") || ua.includes("ipad"))
                            device = "📱 Tablet";
                          else if (
                            ua.includes("chrome") ||
                            ua.includes("firefox") ||
                            ua.includes("safari") ||
                            ua.includes("edge")
                          )
                            device = "🖥️ Desktop";
                          else if (ua.includes("curl") || ua.includes("bot"))
                            device = "🤖 Bot";
                        }

                        return (
                          <tr key={i} className="text-slate-300">
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-400">
                              {dateStr} {timeStr}
                            </td>
                            <td className="max-w-[150px] truncate px-3 py-2">
                              {refHost}
                            </td>
                            <td className="hidden px-3 py-2 sm:table-cell">
                              {device}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
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
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/tablet: keep the existing HowToUse layout. */}
      <div className="hidden md:block">
        <HowToUse
          title="How to use URL Shortener"
          subtitle=""
          steps={[
            {
              title: "Paste URL",
              description: "Enter a long URL to shorten.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Choose alias",
              description: "Optionally set a custom short slug.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Set expiry",
              description: "Choose how long the short link stays active.",
              icon: <Clock className="h-5 w-5" />,
            },
            {
              title: "Shorten",
              description: "Create the short URL instantly.",
              icon: <Send className="h-5 w-5" />,
            },
            {
              title: "Copy link",
              description: "Copy and share the generated short URL.",
              icon: <Copy className="h-5 w-5" />,
            },
            {
              title: "Track clicks",
              description: "Refresh to see the latest click count.",
              icon: <BarChart3 className="h-5 w-5" />,
            },
          ]}
        />
      </div>

      {/* Mobile only: icon on the left, title and description on the right. */}
      <section
        className="mt-10 md:hidden"
        aria-labelledby="mobile-how-to-use-title"
      >
        <div className="mx-auto max-w-xl">
          <h2
            id="mobile-how-to-use-title"
            className="text-center text-2xl font-bold tracking-tight text-white"
          >
How to use URL Shortener
          </h2>

          <div className="mt-6 space-y-3">
            {[
              {
                title: "Paste URL",
                description: "Enter a long URL to shorten.",
                icon: <Link2 className="h-5 w-5" />,
              },
              {
                title: "Choose alias",
                description: "Optionally set a custom short slug.",
                icon: <Link2 className="h-5 w-5" />,
              },
              {
                title: "Set expiry",
                description: "Choose how long the short link stays active.",
                icon: <Clock className="h-5 w-5" />,
              },
              {
                title: "Shorten",
                description: "Create the short URL instantly.",
                icon: <Send className="h-5 w-5" />,
              },
              {
                title: "Copy link",
                description: "Copy and share the generated short URL.",
                icon: <Copy className="h-5 w-5" />,
              },
              {
                title: "Track clicks",
                description: "Refresh to see the latest click count.",
                icon: <BarChart3 className="h-5 w-5" />,
              },
            ].map((step) => (
              <div
                key={step.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                  {step.icon}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Container>
  );
}