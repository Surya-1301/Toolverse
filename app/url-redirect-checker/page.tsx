"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Link2,
  Network,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Container } from "@/components/Container";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Enter a URL",
    description: "Paste the URL you want to trace through.",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Check redirects",
    description: "Follow every redirect the URL makes.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "View the chain",
    description: "See each hop, its status, and final destination.",
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: "Spot issues",
    description: "Detect loops, broken links, or blocked requests.",
    icon: <ShieldAlert className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use URL Redirect Checker
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-[#071522] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-[#092B40] text-[#63E5F7] shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold leading-5 text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type Hop = {
  url: string;
  status: number;
  location: string;
  final: boolean;
};

export default function UrlRedirectCheckerPage() {
  const [url, setUrl] = useState("");
  const [hops, setHops] = useState<Hop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setHops([]);

    const target = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const collected: Hop[] = [];
    const seen = new Set<string>();
    let current: string | null = target;

    try {
      while (current && collected.length < 10) {
        seen.add(current);

        const response: Response | null = await fetch(current, {
          redirect: "manual",
          mode: "cors",
        }).catch(() => null);

        // Fallback: cross-origin may block manual redirect; try following.
        if (!response) {
          const followed = await fetch(current).catch(() => null);
          if (followed) {
            collected.push({
              url: current,
              status: followed.status,
              location: followed.url,
              final: true,
            });
          } else {
            setError("Could not fetch the URL — the server blocked the request (likely CORS).");
          }
          break;
        }

        const status: number = response.status;
        const redirectTo: string = response.headers.get("location") || "";

        let nextUrl: string | null = null;
        if ([301, 302, 303, 307, 308].includes(status) && redirectTo) {
          try {
            nextUrl = new URL(redirectTo, current).toString();
          } catch {
            nextUrl = null;
          }
        }

        collected.push({
          url: current,
          status,
          location: redirectTo,
          final: !nextUrl,
        });

        if (!nextUrl) break;

        if (seen.has(nextUrl)) {
          setError("Redirect loop detected — the URL keeps redirecting to itself.");
          break;
        }

        current = nextUrl;
      }

      setHops(collected);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to check the URL.",
      );
    } finally {
      setLoading(false);
    }
  }

  const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Redirect Checker
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Trace every redirect a link makes and see where it finally lands.
          Useful for spotting shortener chains, moved pages, and broken hops.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Link2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void check();
              }}
              placeholder="https://example.com/short-link"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <button
            onClick={check}
            disabled={!url.trim() || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Checking..." : "Check redirects"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <ShieldAlert className="h-6 w-6 text-red-300" />
            <p className="text-sm leading-6 text-red-200">{error}</p>
          </div>
        ) : null}

        {hops.length ? (
          <div className="mt-6 space-y-3">
            {hops.map((hop, index) => (
              <div
                key={`${hop.url}-${index}`}
                className="rounded-2xl border border-white/10 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    Hop {index + 1}
                  </span>
                  <span
                    className={[
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      hop.final
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300",
                    ].join(" ")}
                  >
                    {hop.status}
                    {isRedirect(hop.status) ? " Redirect" : hop.final ? " Final" : ""}
                  </span>
                </div>

                <p className="mt-2 break-all font-mono text-sm text-slate-200">
                  {hop.url}
                </p>

                {hop.location ? (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        Location
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-violet-200">
                        {hop.location}
                      </p>
                    </div>
                  </div>
                ) : null}

                {hop.final ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Final destination
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <HowToUseSection />
    </Container>
  );
}