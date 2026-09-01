"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlignLeft,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileText,
  List,
  TextQuote,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

/* ==========================================================================
   LOREM IPSUM DATA
   ========================================================================== */

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "eu",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
];

const STANDARD_PHRASE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

type OutputMode = "paragraphs" | "sentences" | "words";

function pick(count: number) {
  const result: string[] = [];

  for (let i = 0; i < count; i += 1) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }

  return result;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function makeSentence(wordsLength: number) {
  const length = wordsLength || 8 + Math.floor(Math.random() * 8);
  const sentence = pick(length).join(" ");
  return `${capitalize(sentence)}.`;
}

function makeParagraph(sentenceCount: number) {
  const count = sentenceCount || 4 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, () => makeSentence(0)).join(" ");
}

function generateLorem({
  mode,
  count,
  startStandard,
  includeHtml,
}: {
  mode: OutputMode;
  count: number;
  startStandard: boolean;
  includeHtml: boolean;
}) {
  const safeCount = Math.min(Math.max(count || 1, 1), 1000);

  if (mode === "words") {
    const words = pick(safeCount);
    words[0] = capitalize(words[0]);
    return words.join(" ");
  }

  if (mode === "sentences") {
    const sentences = Array.from({ length: safeCount }, () => makeSentence(0));

    if (startStandard) {
      const tail = sentences.slice(1).join(" ");
      sentences[0] = STANDARD_PHRASE;
      return tail ? `${sentences[0]} ${tail}` : sentences[0];
    }

    return sentences.join(" ");
  }

  // paragraphs
  const paragraphs = Array.from({ length: safeCount }, () => makeParagraph(0));

  if (startStandard) {
    paragraphs[0] = `${STANDARD_PHRASE}. ${paragraphs[0]}`;
  }

  return includeHtml
    ? paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n\n")
    : paragraphs.join("\n\n");
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
    title: "Pick a mode",
    description: "Generate paragraphs, sentences, or individual words.",
    icon: <AlignLeft className="h-5 w-5" />,
  },
  {
    title: "Set the amount",
    description: "Choose how many paragraphs, sentences, or words to create.",
    icon: <List className="h-5 w-5" />,
  },
  {
    title: "Toggle options",
    description: "Start with the classic phrase or wrap output in HTML tags.",
    icon: <TextQuote className="h-5 w-5" />,
  },
  {
    title: "Generate",
    description: "Create randomized placeholder text in your browser.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Copy text",
    description: "Copy the output to your clipboard with one click.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Save the generated text as a plain .txt file.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Lorem Ipsum Generator
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

export default function LoremIpsumPage() {
  const [mode, setMode] = useState<OutputMode>("paragraphs");
  const [count, setCount] = useState(3);
  const [startStandard, setStartStandard] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const modeLabel = useMemo(
    () => (mode === "paragraphs" ? "paragraphs" : mode === "sentences" ? "sentences" : "words"),
    [mode],
  );

  function generate() {
    const text = generateLorem({
      mode,
      count,
      startStandard,
      includeHtml,
    });

    setOutput(text);
    setCopied(false);
  }

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function downloadTxt() {
    if (!output) return;

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "lorem-ipsum.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setOutput("");
    setCopied(false);
  }

  const modes: { value: OutputMode; label: string }[] = [
    { value: "paragraphs", label: "Paragraphs" },
    { value: "sentences", label: "Sentences" },
    { value: "words", label: "Words" },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Lorem Ipsum Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate classic placeholder text as paragraphs, sentences, or words
          with optional HTML tags, and copy or download the result.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Output type
            </label>

            <div className="flex flex-wrap gap-2">
              {modes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    mode === item.value
                      ? "border-violet-500 bg-violet-600/20 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Number of {modeLabel}
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
              Generate between 1 and 1000.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={startStandard}
                onChange={(event) => setStartStandard(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Start with classic phrase
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={includeHtml}
                onChange={(event) => setIncludeHtml(event.target.checked)}
                disabled={mode !== "paragraphs"}
                className="h-4 w-4 accent-violet-600 disabled:opacity-40"
              />
              Wrap paragraphs in HTML
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Wand2 className="h-4 w-4" />
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
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={downloadTxt}
            disabled={!output}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <Download className="h-4 w-4" />
            Download .txt
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Generated text
            </label>

            <span className="inline-flex items-center gap-2">
              {output && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  {output.length} chars
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                <TextQuote className="h-3.5 w-3.5" />
                {output ? output.trim().split(/\s+/).filter(Boolean).length : 0} words
              </span>
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
            {output ? (
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-serif text-sm leading-7 text-slate-200">
                {output}
              </pre>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-sm leading-6 text-slate-500">
                  Generated placeholder text will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}
