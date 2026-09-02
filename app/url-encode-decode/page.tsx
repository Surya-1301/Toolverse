"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  FileCode2,
  FileText,
  Link2,
  RefreshCw,
  Replace,
  Sparkles,
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
    title: "Enter text",
    description: "Paste the text or URL you want to encode or decode.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Encode",
    description: "Turn special characters into percent-encoded form.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Decode",
    description: "Restore percent-encoded text back to readable form.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Pick encoding mode",
    description: "Use Component mode for query values, or URL mode for full URLs.",
    icon: <Replace className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the encoded or decoded result to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use URL Encode / Decode
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

/* ==========================================================================
   ENCODING HELPERS
========================================================================== */

type EncodingMode = "component" | "url";

function encode(value: string, mode: EncodingMode): string {
  // encodeURIComponent escapes everything except A-Z a-z 0-9 - _ . ! ~ * ' ( )
  // encodeURI escapes everything except ; / ? : @ & = + $ , # (reserved chars)
  return mode === "component"
    ? encodeURIComponent(value)
    : encodeURI(value);
}

function decode(value: string, mode: EncodingMode): string {
  // decodeURIComponent throws on lone '%' e.g. in some malformed inputs;
  // decodeURI won't decode reserved chars like '#' '&' '=' '/'.
  return mode === "component"
    ? decodeURIComponent(value)
    : decodeURI(value);
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function UrlEncodeDecodePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EncodingMode>("component");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function runEncode() {
    try {
      setError("");
      if (!input) {
        setOutput("");
        setError("Enter some text to encode first.");
        return;
      }
      setOutput(encode(input, mode));
    } catch (caughtError) {
      setOutput("");
      setError(caughtError instanceof Error ? caughtError.message : "Could not encode this text.");
    }
  }

  function runDecode() {
    try {
      setError("");
      if (!input.trim()) {
        setOutput("");
        setError("Enter some URL-encoded text to decode first.");
        return;
      }
      setOutput(decode(input.trim(), mode));
    } catch (caughtError) {
      setOutput("");
      setError(
        "Invalid percent-encoding. Check for stray '%' characters.",
      );
    }
  }

  async function copyOutput() {
    if (!output) {
      setError("Generate some output first.");
      return;
    }
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          URL Encode / Decode
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Encode and decode text for safe use in URLs and query strings.
          Everything runs locally in your browser.
        </p>
      </div>

      <div className="mt-10 mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Encoding mode selector */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-slate-300">Encoding mode</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode("component")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                mode === "component"
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-white"
              }`}
            >
              <Replace className="h-4 w-4" />
              Component
              <span className="hidden text-[11px] font-normal opacity-70 sm:inline">
                (query values)
              </span>
            </button>
            <button
              onClick={() => setMode("url")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                mode === "url"
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-white"
              }`}
            >
              <Link2 className="h-4 w-4" />
              URL
              <span className="hidden text-[11px] font-normal opacity-70 sm:inline">
                (full URLs)
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {mode === "component"
              ? "Component mode escapes all special characters, ideal for query parameter values (encodeURIComponent)."
              : "URL mode preserves reserved URL characters like & = ? / and is ideal for whole URLs (encodeURI)."}
          </p>
        </div>

        {/* Input */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Input
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            rows={6}
            placeholder={mode === "component" ? "Hello, world! 100% & <tag>" : "https://example.com/path?name=John Doe&age=30"}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={runEncode}
            disabled={!input}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Encode
          </button>
          <button
            onClick={runDecode}
            disabled={!input}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
            Decode
          </button>
          <button
            onClick={copyOutput}
            disabled={!output}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium leading-6 text-red-200">{error}</p>
          </div>
        )}

        {output && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">
                Output
              </label>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                {output.length} chars
              </span>
            </div>
            <textarea
              value={output}
              readOnly
              rows={6}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-violet-500/20 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300 outline-none"
            />
          </div>
        )}
      </div>

      <HowToUseSection />
    </Container>
  );
}
