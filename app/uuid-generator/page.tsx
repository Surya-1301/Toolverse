"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  Hash,
  ListPlus,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function createUuidV4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(char) / 4)))
    ).toString(16),
  );
}

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
    title: "Choose count",
    description: "Enter how many UUID v4 values you want to generate.",
    icon: <ListPlus className="h-5 w-5" />,
  },
  {
    title: "Generate UUIDs",
    description: "Create one or many random UUID v4 identifiers instantly.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review list",
    description: "Check all generated UUIDs in the output panel.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    title: "Copy one",
    description: "Copy an individual UUID from the generated list.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Copy all",
    description: "Copy the full UUID list to your clipboard at once.",
    icon: <Check className="h-5 w-5" />,
  },
  {
    title: "Clear output",
    description: "Reset the generated list when you want to start again.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use UUID Generator
      </h2>

      {/* Desktop / tablet layout — unchanged */}
      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Mobile-only: cyan icon left + title/description right */}
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

export default function UuidGeneratorPage() {
  const [count, setCount] = useState(10);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedValue, setCopiedValue] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  const output = useMemo(() => uuids.join("\n"), [uuids]);

  function generateUuids() {
    const safeCount = Math.min(Math.max(count || 1, 1), 1000);

    setCount(safeCount);
    setUuids(Array.from({ length: safeCount }, () => createUuidV4()));
    setCopiedValue("");
    setCopiedAll(false);
  }

  async function copyOne(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);

    setTimeout(() => {
      setCopiedValue("");
    }, 1500);
  }

  async function copyAll() {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopiedAll(true);

    setTimeout(() => {
      setCopiedAll(false);
    }, 1500);
  }

  function clearAll() {
    setUuids([]);
    setCopiedValue("");
    setCopiedAll(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          UUID Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate secure UUID v4 values, bulk create identifiers, and copy
          individual or full results instantly.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Number of UUIDs
            </label>

            <input
              type="number"
              min="1"
              max="1000"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Generate between 1 and 1000 UUID v4 values.
            </p>
          </div>

          <button
            onClick={generateUuids}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </button>

          <button
            onClick={copyAll}
            disabled={!uuids.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copiedAll ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiedAll ? "Copied" : "Copy all"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-4">
          {uuids.length ? (
            <div className="space-y-3">
              {uuids.map((uuid) => (
                <div
                  key={uuid}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <code className="break-all text-sm text-slate-200">
                    {uuid}
                  </code>

                  <button
                    onClick={() => copyOne(uuid)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {copiedValue === uuid ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedValue === uuid ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
              <p className="text-sm leading-6 text-slate-500">
                Generated UUIDs will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}