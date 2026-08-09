"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Eraser,
  Globe2,
  Link2,
  ListTree,
  Search,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

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
  queryParams: Array<{
    key: string;
    value: string;
  }>;
};

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

function parseUrl(value: string): ParsedUrl {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter a URL first.");
  }

  const url = new URL(
    /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`,
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
    queryParams: Array.from(url.searchParams.entries()).map(
      ([key, value]) => ({
        key,
        value,
      }),
    ),
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
    parsed.queryParams.length
      ? parsed.queryParams
          .map(
            (param) =>
              `- ${param.key}: ${param.value}`,
          )
          .join("\n")
      : "- None",
  ].join("\n");
}

const howToUseSteps = [
  {
    title: "Paste URL",
    description:
      "Enter a full URL or domain into the input field.",
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    title: "Parse URL",
    description:
      "Break the URL into protocol, domain, path, query, and hash.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "View domain",
    description:
      "Check the protocol, origin, hostname, and port.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Decode query",
    description:
      "Read decoded query parameters as clean key-value pairs.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Copy result",
    description:
      "Copy the formatted parsed URL result to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear input",
    description:
      "Reset the parser when you want to inspect another URL.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use URL Parser
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>

            <h3 className="text-sm font-semibold text-white">
              {step.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function UrlParserPage() {
  // Empty initial state — no predefined URL
  const [input, setInput] = useState("");

  const [parsed, setParsed] =
    useState<ParsedUrl | null>(null);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const formattedOutput = useMemo(
    () => (parsed ? formatParsedUrl(parsed) : ""),
    [parsed],
  );

  function handleParse() {
    try {
      setError("");
      setCopied(false);

      setParsed(parseUrl(input));
    } catch (caughtError) {
      setParsed(null);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not parse this URL.",
      );
    }
  }

  async function copyOutput() {
    if (!formattedOutput) return;

    await navigator.clipboard.writeText(formattedOutput);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setParsed(null);
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Parser
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Parse protocol, domain, path, query parameters, hash
          fragments, and copy formatted URL details.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            URL input
          </label>

          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="Paste URL here..."
            className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

          {/* Error */}
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleParse}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Wand2 className="h-4 w-4" />
              Parse URL
            </button>

            <button
              onClick={copyOutput}
              disabled={!formattedOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              {copied ? "Copied" : "Copy result"}
            </button>

            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>

          {/* Parsed summary */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <ClipboardList className="h-4 w-4" />
              Parsed summary
            </div>

            <textarea
              readOnly
              value={formattedOutput}
              placeholder="Parsed output will appear here..."
              className="min-h-[260px] w-full rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              URL parts
            </label>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {parsed ? "Parsed" : "Waiting"}
            </span>
          </div>

          {parsed ? (
            <div className="space-y-4">
              {[
                ["Protocol", parsed.protocol || "-"],
                ["Origin", parsed.origin || "-"],
                ["Domain", parsed.hostname || "-"],
                ["Port", parsed.port || "-"],
                ["Path", parsed.pathname || "-"],
                ["Query", parsed.search || "-"],
                ["Hash", parsed.hash || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-slate-200">
                    {value}
                  </p>
                </div>
              ))}

              {/* Query parameters */}
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-violet-300" />

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Query parameters
                  </p>
                </div>

                {parsed.queryParams.length ? (
                  <div className="space-y-3">
                    {parsed.queryParams.map(
                      (param, index) => (
                        <div
                          key={`${param.key}-${index}`}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <p className="break-all font-mono text-sm text-violet-200">
                            {param.key}
                          </p>

                          <p className="mt-1 break-all font-mono text-sm text-slate-300">
                            {param.value}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No query parameters.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[580px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm leading-6 text-slate-500">
                URL parts will appear here after parsing.
              </p>
            </div>
          )}
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}