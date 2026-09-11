"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Clock3,
  Eraser,
  FileText,
  Hash,
  ListChecks,
  Type,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   HOW TO USE
========================================================================== */

const howToUseSteps = [
  {
    title: "Paste text",
    description: "Enter or paste your text into the editor to begin counting.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "Pick a metric",
    description: "Switch between word, character, and structural counts.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    title: "Check reading time",
    description: "Get an estimated reading time based on word count.",
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    title: "Review breakdown",
    description: "See letters, numbers, spaces, punctuation, and more.",
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    title: "Copy stats",
    description: "Copy the text or its counts to your clipboard.",
    icon: <Clipboard className="h-5 w-5" />,
  },
  {
    title: "Clear",
    description: "Reset the editor and start a new count.",
    icon: <Eraser className="h-5 w-5" />,
  },
];


/* ==========================================================================
   COUNT HELPERS
========================================================================== */

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function countSentences(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[^.!?]+[.!?]+(?=\s|$)/gu);
  return matches?.length ?? 1;
}

function countParagraphs(text: string) {
  const trimmed = text.trim();
  return trimmed
    ? trimmed.split(/\n\s*\n/u).filter(Boolean).length
    : 0;
}

function countLines(text: string) {
  return text ? text.split(/\r?\n/u).length : 0;
}

/* ==========================================================================
   RESULT TYPES
========================================================================== */

type ResultKey =
  | "Words"
  | "Characters"
  | "No spaces"
  | "Letters"
  | "Numbers"
  | "Spaces"
  | "Punctuation"
  | "Sentences"
  | "Paragraphs"
  | "Lines"
  | "Reading time";

const resultLabels: ResultKey[] = [
  "Words",
  "Characters",
  "No spaces",
  "Letters",
  "Numbers",
  "Spaces",
  "Punctuation",
  "Sentences",
  "Paragraphs",
  "Lines",
  "Reading time",
];

/* ==========================================================================
   PAGE
========================================================================== */

export default function TextCounterPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultKey>("Words");

  /* ------------------------------------------------------------------------
     STATISTICS
  ------------------------------------------------------------------------ */

  const stats = useMemo(() => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/gu, "").length;
    const letters = (text.match(/[\p{L}]/gu) ?? []).length;
    const numbers = (text.match(/[0-9]/gu) ?? []).length;
    const spaces = (text.match(/\s/gu) ?? []).length;
    const punctuation = (text.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
    const words = countWords(text);
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);
    const lines = countLines(text);
    const readingMinutes = words ? Math.max(1, Math.ceil(words / 200)) : 0;

    return {
      words,
      characters,
      charactersNoSpaces,
      letters,
      numbers,
      spaces,
      punctuation,
      sentences,
      paragraphs,
      lines,
      readingMinutes,
    };
  }, [text]);

  /* ------------------------------------------------------------------------
     RESULT VALUE
  ------------------------------------------------------------------------ */

  const resultValue = useMemo(() => {
    switch (selectedResult) {
      case "Words":
        return stats.words;
      case "Characters":
        return stats.characters;
      case "No spaces":
        return stats.charactersNoSpaces;
      case "Letters":
        return stats.letters;
      case "Numbers":
        return stats.numbers;
      case "Spaces":
        return stats.spaces;
      case "Punctuation":
        return stats.punctuation;
      case "Sentences":
        return stats.sentences;
      case "Paragraphs":
        return stats.paragraphs;
      case "Lines":
        return stats.lines;
      case "Reading time":
        return stats.readingMinutes ? `${stats.readingMinutes} min` : "0 min";
      default:
        return 0;
    }
  }, [selectedResult, stats]);

  /* ------------------------------------------------------------------------
     COPY
  ------------------------------------------------------------------------ */

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(String(resultValue));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  /* ------------------------------------------------------------------------
     CLEAR
  ------------------------------------------------------------------------ */

  function clear() {
    setText("");
    setCopied(false);
    setSelectedResult("Words");
  }

  /* ------------------------------------------------------------------------
     UI
  ------------------------------------------------------------------------ */

  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      <Link
        href="/tools/text-developer-tools"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Text Counter
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
          Count words, characters, letters, numbers, spaces, punctuation,
          sentences, paragraphs, lines, and reading time — all in one place.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] p-3.5 sm:mt-10 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {resultLabels.map((label) => {
            const active = selectedResult === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedResult(label)}
                className={`
                  rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200
                  sm:px-4 sm:py-2.5 sm:text-sm
                  ${active
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white"}
                  max-[480px]:flex-1 max-[480px]:text-[11px]
                `}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              placeholder="Paste or type your text here..."
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                {selectedResult}
              </p>
              <p className="mt-2 break-all font-mono text-4xl font-bold text-white">
                {typeof resultValue === "number" ? resultValue.toLocaleString() : resultValue}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyResult}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? "Copied" : "Copy result"}
              </button>
              <button
                onClick={copyText}
                disabled={!text}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                <FileText className="h-4 w-4" />
                Copy text
              </button>
            </div>

            <button
              onClick={clear}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
      <HowToUse
        title="How to use Text Counter"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}