"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Hash,
  RefreshCw,
  Shuffle,
  Sparkles,
  Type,
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
    title: "Set the length",
    description: "Choose how many characters each string has.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    title: "Pick a charset",
    description: "Toggle lowercase, uppercase, digits, and symbols.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "Choose a count",
    description: "Generate one string or a whole batch at once.",
    icon: <Shuffle className="h-5 w-5" />,
  },
  {
    title: "Separate them",
    description: "Join the batch with a comma, space, newline, or custom separator.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Copy results",
    description: "Copy a single string or the entire batch.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Stays private",
    description: "Everything is generated locally in your browser.",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Random String Generator
      </h2>

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

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{};:,.<>?/";

function randomInt(max: number) {
  // Use cryptographically strong randomness when available.
  const cryptoApi = typeof crypto !== "undefined" && "getRandomValues" in crypto ? crypto : null;
  if (cryptoApi) {
    const array = new Uint32Array(1);
    cryptoApi.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function generateFromCharset(length: number, chars: string) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

export default function RandomStringGeneratorPage() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [separator, setSeparator] = useState("\n");
  const [customSeparator, setCustomSeparator] = useState("-");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const charset = [
    useLower ? LOWERCASE : "",
    useUpper ? UPPERCASE : "",
    useDigits ? DIGITS : "",
    useSymbols ? SYMBOLS : "",
  ].join("");

  const activeCharsets = [useLower, useUpper, useDigits, useSymbols].filter(
    Boolean,
  ).length;

  function regenerate() {
    if (charset.length === 0) return;
    const sep = separator === "custom" ? customSeparator : separator;
    const strings = Array.from({ length: count }, () =>
      generateFromCharset(length, charset),
    );
    setOutput(strings.join(sep));
    setCopied(false);
  }

  function regenerateSingle(single: string) {
    // Replace just one line in the batch with a fresh string.
    const sep = separator === "custom" ? customSeparator : separator;
    const parts = output.split(sep);
    const index = parts.indexOf(single);
    if (index === -1) return;
    parts[index] = generateFromCharset(length, charset);
    setOutput(parts.join(sep));
    setCopied(false);
  }

  function toggleCharset(kind: "lower" | "upper" | "digits" | "symbols") {
    if (activeCharsets === 1 && charsetSwitchOn(kind)) return;
    switch (kind) {
      case "lower":
        setUseLower((value) => !value);
        break;
      case "upper":
        setUseUpper((value) => !value);
        break;
      case "digits":
        setUseDigits((value) => !value);
        break;
      case "symbols":
        setUseSymbols((value) => !value);
        break;
    }
    setCopied(false);
  }

  function charsetSwitchOn(kind: "lower" | "upper" | "digits" | "symbols") {
    switch (kind) {
      case "lower":
        return useLower;
      case "upper":
        return useUpper;
      case "digits":
        return useDigits;
      case "symbols":
        return useSymbols;
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Random String Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate random strings with full control over character set,
          length, and quantity. Great for test data, tokens, and temp
          passwords.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Charset toggles */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Character set
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "lower" as const, label: "a–z", value: useLower },
                { key: "upper" as const, label: "A–Z", value: useUpper },
                { key: "digits" as const, label: "0–9", value: useDigits },
                { key: "symbols" as const, label: "!@#", value: useSymbols },
              ]
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleCharset(option.key)}
                className={[
                  "rounded-xl border px-4 py-2.5 font-mono text-sm font-semibold transition",
                  option.value
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {charset.length
              ? `${charset.length} characters in the pool.`
              : "Pick at least one character set."}
          </p>
        </div>

        {/* Length + count */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Length: {length}
            </label>
            <input
              type="range"
              min="4"
              max="128"
              step="1"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Count: {count}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Separator
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "\n", label: "Newline" },
              { key: ",", label: "Comma" },
              { key: " ", label: "Space" },
              { key: "custom", label: "Custom" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSeparator(option.key)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  separator === option.key
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}

            {separator === "custom" ? (
              <input
                value={customSeparator}
                onChange={(event) => setCustomSeparator(event.target.value)}
                maxLength={8}
                placeholder="-"
                className="w-20 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-sm text-white outline-none transition focus:border-violet-500"
              />
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={regenerate}
            disabled={!charset.length}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </button>

          <button
            onClick={copyOutput}
            disabled={!output}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy all"}
          </button>
        </div>

        {/* Output */}
        {output ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-300">
              Result{count > 1 ? `s` : ""} ({count} string{count > 1 ? "s" : ""})
            </p>
            <div className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-slate-950">
              {count > 1 ? (
                <ul className="divide-y divide-white/5">
                  {output.split(separator).map((line, index) => (
                    <li key={index} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-8 shrink-0 text-xs font-semibold text-slate-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-100">
                        {line}
                      </code>
                      <button
                        onClick={() => regenerateSingle(line)}
                        aria-label={`Regenerate string ${index + 1}`}
                        className="shrink-0 text-slate-500 transition hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <pre className="break-all p-4 font-mono text-sm text-slate-100">
                  {output}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex min-h-[72px] items-center justify-center rounded-xl border border-dashed border-white/10">
            <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
              <ArrowRight className="h-4 w-4" />
              Set the options and generate a string to see it here.
            </p>
          </div>
        )}
      </div>

      <HowToUseSection />
    </Container>
  );
}