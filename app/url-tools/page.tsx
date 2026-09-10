"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eraser,
  FileCode2,
  FileText,
  Globe2,
  Link2,
  ListTree,
  Loader2,
  Network,
  RefreshCw,
  Replace,
  Search,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   COMMON
   ========================================================================== */

type Tab = "parse" | "encode" | "redirects";

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
    title: "Pick a tool",
    description: "Switch between Parse, Encode / Decode, and Redirects tabs.",
    icon: <ListTree className="h-5 w-5" />,
  },
  {
    title: "Enter a URL",
    description: "Paste any URL, encoded text, or link you want to inspect.",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Parse components",
    description: "Break a URL into protocol, domain, path, query, and hash.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Encode or decode",
    description: "Convert text for safe URLs, or restore percent-encoded strings.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Trace redirects",
    description: "Follow every hop and see the final destination.",
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: "Copy result",
    description: "Copy the output you need and clear when done.",
    icon: <Copy className="h-5 w-5" />,
  },
];

/* ==========================================================================
   PARSE HELPERS
   ========================================================================== */

type ParsedUrl = {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  queryParams: Array<{ key: string; value: string }>;
};

function parseUrl(value: string): ParsedUrl {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a URL first.");

  const url = new URL(
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  );

  return {
    protocol: url.protocol.replace(":", ""),
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    queryParams: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value })),
  };
}

function formatParsedUrl(parsed: ParsedUrl) {
  return [
    `Protocol: ${parsed.protocol || "-"}`,
    `Origin: ${parsed.origin || "-"}`,
    `Domain: ${parsed.hostname || "-"}`,
    `Port: ${parsed.port || "-"}`,
    `Path: ${parsed.pathname || "-"}`,
    `Query: ${parsed.search || "-"}`,
    `Hash: ${parsed.hash || "-"}`,
    `Username: ${parsed.username || "-"}`,
    `Password: ${parsed.password ? "********" : "-"}`,
    "",
    "Query parameters:",
    ...parsed.queryParams.map(({ key, value }) => `  ${key} = ${value}`),
    parsed.queryParams.length === 0 ? "  - None" : "",
  ].join("\n");
}

/* ==========================================================================
   ENCODE / DECODE HELPERS
   ========================================================================== */

type EncodingMode = "component" | "url";

function encodeUrl(value: string, mode: EncodingMode): string {
  return mode === "component" ? encodeURIComponent(value) : encodeURI(value);
}

function decodeUrl(value: string, mode: EncodingMode): string {
  return mode === "component" ? decodeURIComponent(value) : decodeURI(value);
}

/* ==========================================================================
   REDIRECT HELPERS
   ========================================================================== */

type Hop = {
  url: string;
  status: number;
  location: string;
  final: boolean;
};

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function UrlToolsPage() {
  const [tab, setTab] = useState<Tab>("parse");

  /* ---- Parse state ---- */
  const [parseInput, setParseInput] = useState("");
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [parseError, setParseError] = useState("");
  const [parseCopied, setParseCopied] = useState(false);

  const formattedOutput = useMemo(() => (parsed ? formatParsedUrl(parsed) : ""), [parsed]);

  function handleParse() {
    try {
      setParseError("");
      setParseCopied(false);
      setParsed(parseUrl(parseInput));
    } catch (e) {
      setParsed(null);
      setParseError(e instanceof Error ? e.message : "Could not parse this URL.");
    }
  }

  async function copyParsed() {
    if (!formattedOutput) return;
    await navigator.clipboard.writeText(formattedOutput);
    setParseCopied(true);
    setTimeout(() => setParseCopied(false), 1500);
  }

  /* ---- Encode / Decode state ---- */
  const [encInput, setEncInput] = useState("");
  const [encOutput, setEncOutput] = useState("");
  const [encMode, setEncMode] = useState<EncodingMode>("component");
  const [encError, setEncError] = useState("");
  const [encCopied, setEncCopied] = useState(false);

  function runEncode() {
    try {
      setEncError("");
      if (!encInput) {
        setEncOutput("");
        setEncError("Enter some text to encode first.");
        return;
      }
      setEncOutput(encodeUrl(encInput, encMode));
    } catch (e) {
      setEncOutput("");
      setEncError(e instanceof Error ? e.message : "Could not encode this text.");
    }
  }

  function runDecode() {
    try {
      setEncError("");
      if (!encInput.trim()) {
        setEncOutput("");
        setEncError("Enter some URL-encoded text to decode first.");
        return;
      }
      setEncOutput(decodeUrl(encInput.trim(), encMode));
    } catch {
      setEncOutput("");
      setEncError("Invalid percent-encoding. Check for stray '%' characters.");
    }
  }

  async function copyEncoded() {
    if (!encOutput) return;
    await navigator.clipboard.writeText(encOutput);
    setEncCopied(true);
    setTimeout(() => setEncCopied(false), 1500);
  }

  /* ---- Redirect state ---- */
  const [redirUrl, setRedirUrl] = useState("");
  const [hops, setHops] = useState<Hop[]>([]);
  const [redirLoading, setRedirLoading] = useState(false);
  const [redirError, setRedirError] = useState("");

  async function checkRedirects() {
    const trimmed = redirUrl.trim();
    if (!trimmed) return;

    setRedirLoading(true);
    setRedirError("");
    setHops([]);

    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      let current = url;
      const seen = new Set<string>();
      const collected: Hop[] = [];
      const MAX_HOPS = 15;

      for (let i = 0; i < MAX_HOPS; i++) {
        if (seen.has(current)) {
          setRedirError("Redirect loop detected — the URL keeps redirecting to itself.");
          break;
        }
        seen.add(current);

        const response = await fetch(current, { method: "GET", redirect: "manual" });

        if (response.type === "opaqueredirect" || response.status === 0) {
          const followed = await fetch(current).catch(() => null);
          if (followed) {
            collected.push({ url: current, status: followed.status, location: followed.url, final: true });
          } else {
            setRedirError("Could not fetch the URL — the server blocked the request (likely CORS).");
          }
          break;
        }

        const status = response.status;
        const redirectTo = response.headers.get("location") || "";

        let nextUrl: string | null = null;
        if (REDIRECT_STATUSES.includes(status) && redirectTo) {
          try {
            nextUrl = new URL(redirectTo, current).toString();
          } catch {
            nextUrl = null;
          }
        }

        collected.push({ url: current, status, location: redirectTo, final: !nextUrl });
        if (!nextUrl) break;
        current = nextUrl;
      }

      setHops(collected);
    } catch (e) {
      setRedirError(e instanceof Error ? e.message : "Failed to check the URL.");
    } finally {
      setRedirLoading(false);
    }
  }

  const isRedirect = (s: number) => REDIRECT_STATUSES.includes(s);

  /* ---- Tab switcher ---- */
  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "parse", label: "Parse", icon: <Globe2 className="h-4 w-4" /> },
    { key: "encode", label: "Encode / Decode", icon: <Sparkles className="h-4 w-4" /> },
    { key: "redirects", label: "Redirects", icon: <Network className="h-4 w-4" /> },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Tools
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
         Break down, transform, and trace any URL from a single, streamlined workspace.        </p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Tab switcher */}
        <div className="flex gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                tab === item.key
                  ? "border-violet-500 bg-violet-600/20 text-white"
                  : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* ===== PARSE TAB ===== */}
        {tab === "parse" && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              URL
            </label>
            <textarea
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="https://example.com/path?name=John&page=2#section"
              rows={4}
              spellCheck={false}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />

            {parseError && (
              <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {parseError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleParse}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <Wand2 className="h-4 w-4" />
                Parse URL
              </button>
              <button
                onClick={copyParsed}
                disabled={!formattedOutput}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {parseCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {parseCopied ? "Copied!" : "Copy result"}
              </button>
              <button
                onClick={() => { setParseInput(""); setParsed(null); setParseError(""); }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>

            {parsed && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Parsed components
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    ["Protocol", parsed.protocol],
                    ["Origin", parsed.origin],
                    ["Domain", parsed.hostname],
                    ["Port", parsed.port || "—"],
                    ["Path", parsed.pathname],
                    ["Query", parsed.search || "—"],
                    ["Hash", parsed.hash || "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-mono text-right text-slate-100">{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {parsed.queryParams.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Query parameters
                    </p>
                    <div className="space-y-1">
                      {parsed.queryParams.map(({ key, value }) => (
                        <div key={key} className="flex justify-between gap-4 text-sm">
                          <span className="font-mono text-violet-300">{key}</span>
                          <span className="font-mono text-right text-slate-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {parsed.username && (
                  <div className="mt-3 flex justify-between gap-4 text-sm">
                    <span className="text-slate-400">Username</span>
                    <span className="font-mono text-slate-100">{parsed.username}</span>
                  </div>
                )}
                {parsed.password && (
                  <div className="mt-1 flex justify-between gap-4 text-sm">
                    <span className="text-slate-400">Password</span>
                    <span className="font-mono text-slate-100">********</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== ENCODE / DECODE TAB ===== */}
        {tab === "encode" && (
          <div className="mt-6">
            {/* Mode selector */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-slate-300">Encoding mode</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "component" as const, label: "Component", desc: "encodeURIComponent — escapes everything except A-Z a-z 0-9 - _ . ! ~ * ' ( )" },
                  { key: "url" as const, label: "URL", desc: "encodeURI — preserves reserved URL characters like / ? : @ & = + $ , #" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setEncMode(m.key)}
                    className={[
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      encMode === m.key
                        ? "border-violet-500 bg-violet-600/20 text-white"
                        : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {encMode === "component"
                  ? "Component mode escapes everything for safe use inside query values (encodeURIComponent)."
                  : "URL mode preserves reserved URL characters like & = ? / and is ideal for whole URLs (encodeURI)."}
              </p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Input
            </label>
            <textarea
              value={encInput}
              onChange={(e) => { setEncInput(e.target.value); setEncError(""); }}
              rows={6}
              placeholder={encMode === "component" ? "Hello, world! 100% & <tag>" : "https://example.com/path?name=John Doe&age=30"}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />

            {encError && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {encError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={runEncode}
                disabled={!encInput}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                Encode
              </button>
              <button
                onClick={runDecode}
                disabled={!encInput}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" />
                Decode
              </button>
              <button
                onClick={copyEncoded}
                disabled={!encOutput}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {encCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {encCopied ? "Copied!" : "Copy output"}
              </button>
              <button
                onClick={() => { setEncInput(""); setEncOutput(""); setEncError(""); }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>

            {encOutput && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Output
                </p>
                <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">
                  {encOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ===== REDIRECTS TAB ===== */}
        {tab === "redirects" && (
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
                <Link2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
                <input
                  value={redirUrl}
                  onChange={(e) => setRedirUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void checkRedirects(); }}
                  placeholder="https://example.com/short-link"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
              <button
                onClick={checkRedirects}
                disabled={!redirUrl.trim() || redirLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {redirLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {redirLoading ? "Checking..." : "Check redirects"}
              </button>
            </div>

            {redirError && (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <ShieldAlert className="h-6 w-6 text-red-300" />
                <p className="text-sm leading-6 text-red-200">{redirError}</p>
              </div>
            )}

            {hops.length > 0 && (
              <div className="mt-6 space-y-0">
                {hops.map((hop, index) => (
                  <div
                    key={`${hop.url}-${index}`}
                    className={[
                      "relative flex items-start gap-4 border-l-2 py-4 pl-6",
                      index < hops.length - 1 ? "border-white/10" : "border-transparent",
                      isRedirect(hop.status) ? "border-l-violet-500/40" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                        hop.final
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-violet-500 bg-violet-500/20 text-violet-300",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-slate-100">{hop.url}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                            hop.status >= 200 && hop.status < 300
                              ? "bg-emerald-500/20 text-emerald-300"
                              : hop.status >= 300 && hop.status < 400
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-red-500/20 text-red-300",
                          ].join(" ")}
                        >
                          {hop.status}
                        </span>
                        {hop.location && (
                          <span className="text-xs text-slate-500">
                            → <span className="font-mono text-slate-400">{hop.location}</span>
                          </span>
                        )}
                        {hop.final && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Final
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!redirLoading && hops.length === 0 && !redirError && (
              <div className="mt-6 flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
                <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
                  <Network className="h-4 w-4" />
                  Paste a URL above to trace its redirect chain.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <HowToUse
        title="How to use URL Tools"
        subtitle="Parse components, encode or decode safely, and follow redirect chains."
        steps={howToUseSteps}
      />
    </Container>
  );
}
