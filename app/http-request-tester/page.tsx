"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Clock,
  Globe2,
  Loader2,
  Play,
  Send,
  Server,
  Trash2,
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
    title: "Set the URL",
    description: "Enter the endpoint you want to test.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Pick a method",
    description: "Choose GET, POST, PUT, PATCH, or DELETE.",
    icon: <Send className="h-5 w-5" />,
  },
  {
    title: "Add headers",
    description: "Specify headers and an optional JSON body.",
    icon: <Server className="h-5 w-5" />,
  },
  {
    title: "Send the request",
    description: "Fire it off and inspect status, headers, and body.",
    icon: <Play className="h-5 w-5" />,
  },
  {
    title: "Review timing",
    description: "See how long the request took to complete.",
    icon: <Clock className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use HTTP Request Tester
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">
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

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;
type Method = (typeof METHODS)[number];

export default function HttpRequestTesterPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<Method>("GET");
  const [headersText, setHeadersText] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function send() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setLoading(true);
    setError("");
    setResult(null);

    const target = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    const headers = new Headers();
    for (const line of headersText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const index = trimmed.indexOf(":");
      if (index === -1) continue;
      headers.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim());
    }

    let requestBody: string | undefined;
    if (method !== "GET" && method !== "HEAD" && body.trim()) {
      requestBody = body;
      if (!headers.has("Content-Type")) {
        try {
          JSON.parse(body);
          headers.set("Content-Type", "application/json");
        } catch {
          headers.set("Content-Type", "text/plain");
        }
      }
    }

    const started = performance.now();

    try {
      const response = await fetch(target, {
        method,
        headers,
        body: requestBody,
        redirect: "follow",
      });
      const time = Math.round(performance.now() - started);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyResponse() {
    if (!result) return;
    const text = `Status: ${result.status} ${result.statusText}\n\nHeaders:\n${Object.entries(
      result.headers,
    )
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}\n\nBody:\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function clearAll() {
    setUrl("");
    setBody("");
    setHeadersText("");
    setResult(null);
    setError("");
  }

  const statusColor =
    result && result.status < 300
      ? "text-emerald-400"
      : result && result.status < 400
        ? "text-amber-400"
        : "text-red-400";

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          HTTP Request Tester
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Send HTTP requests to any API and inspect the status, headers, body,
          and timing. Great for debugging endpoints and webhooks.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* URL + method */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as Method)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-violet-500"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder="https://api.example.com/endpoint"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Headers + body */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Headers
            </label>
            <textarea
              value={headersText}
              onChange={(event) => setHeadersText(event.target.value)}
              rows={6}
              placeholder={"Authorization: Bearer token\nContent-Type: application/json"}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Body{" "}
              <span className="font-normal text-slate-500">
                ({method === "GET" || method === "HEAD" ? "not sent for this method" : "JSON"})
              </span>
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              disabled={method === "GET" || method === "HEAD"}
              placeholder={'{\n  "key": "value"\n}'}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={send}
            disabled={!url.trim() || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Sending..." : "Send request"}
          </button>

          <button
            onClick={copyResponse}
            disabled={!result}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy response"}
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm leading-6 text-red-200">{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            {/* Status summary */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <span className={`text-2xl font-bold ${statusColor}`}>
                {result.status}
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {result.statusText || "OK"}
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {result.time} ms
              </span>
            </div>

            {/* Response headers */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">
                Response headers ({Object.keys(result.headers).length})
              </p>
              <div className="max-h-48 space-y-1 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-3">
                {Object.entries(result.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-xs leading-6">
                    <span className="shrink-0 font-semibold text-violet-300">
                      {key}:
                    </span>
                    <span className="break-all text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response body */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">
                Response body
              </p>
              <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                {result.body || "(empty body)"}
              </pre>
            </div>
          </div>
        ) : null}
      </div>

      <HowToUseSection />
    </Container>
  );
}