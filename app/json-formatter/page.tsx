"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Braces,
  Check,
  ClipboardCheck,
  Code2,
  Copy,
  Eraser,
  Minimize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/formatter-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Paste JSON",
    description: "Add your JSON data into the input editor.",
    icon: <Braces className="h-5 w-5" />,
  },
  {
    title: "Format JSON",
    description: "Use Format JSON to make your data readable and indented.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Minify JSON",
    description: "Use Minify JSON to remove spaces and line breaks.",
    icon: <Minimize2 className="h-5 w-5" />,
  },
  {
    title: "Validate syntax",
    description: "Check if your JSON is valid or find syntax errors quickly.",
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the formatted or minified JSON result to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and output boxes when you want to start over.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use JSON Formatter
      </h2>

      {/* Mobile: compact horizontal cards with cyan theme. */}
      <div className="mt-8 space-y-4 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-[#123f52] bg-[#0a0f21] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#0d536b] bg-[#092b40] text-[#63e5f7] shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              {step.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-5 text-[#f4fbff]">
                {step.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8fa9b8]">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: preserve the original card layout. */}
      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
    } catch {
      setOutput("");
      setError("Invalid JSON. Please check your syntax.");
    }
  }

  function minifyJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch {
      setOutput("");
      setError("Invalid JSON. Please check your syntax.");
    }
  }

  function validateJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      JSON.parse(input);
      setOutput("Valid JSON ✅");
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid JSON. Please check your syntax.",
      );
    }
  }

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
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
          JSON Formatter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format, validate, and minify JSON instantly in your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            JSON input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste JSON here..."
            className="min-h-[430px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Output
            </label>

            <button
              onClick={copyOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Output will appear here..."
            className="min-h-[410px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={formatJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          Format JSON
        </button>

        <button
          onClick={minifyJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Minimize2 className="h-4 w-4" />
          Minify JSON
        </button>

        <button
          onClick={validateJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Code2 className="h-4 w-4" />
          Validate JSON
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      <HowToUseSection />
    </Container>
  );
}