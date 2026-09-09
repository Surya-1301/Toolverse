"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownUp,
  Check,
  Copy,
  Download,
  Eraser,
  FileText,
  ListFilter,
  Scissors,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

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
    title: "Paste your lines",
    description: "Drop a list of lines, words, or URLs into the editor.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Pick options",
    description: "Trim whitespace, remove blanks, dedupe, and sort.",
    icon: <ListFilter className="h-5 w-5" />,
  },
  {
    title: "Choose sort",
    description: "Sort alphabetically or keep the original order.",
    icon: <ArrowDownUp className="h-5 w-5" />,
  },
  {
    title: "Process",
    description: "Let the tool clean and deduplicate your list.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Check counts",
    description: "Compare input and output line counts instantly.",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    title: "Copy result",
    description: "Copy the cleaned list in one click.",
    icon: <Copy className="h-5 w-5" />,
  },
];


export default function DuplicateLineRemoverPage() {
  const [input, setInput] = useState("");
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [sort, setSort] = useState<"none" | "asc" | "desc">("asc");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const inputLines = useMemo(() => {
    if (!input.trim()) return 0;
    return input.split("\n").length;
  }, [input]);

  const outputLines = useMemo(() => {
    if (!output) return 0;
    return output.split("\n").length;
  }, [output]);

  function process() {
    let lines = input.split("\n");

    if (trim) {
      lines = lines.map((line) => line.trim());
    }

    if (removeEmpty) {
      lines = lines.filter((line) => line.length > 0);
    }

    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((line) => {
        const key = ignoreCase ? line.toLowerCase() : line;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (sort === "asc") {
      lines.sort((a, b) =>
        (ignoreCase ? a.toLowerCase() : a).localeCompare(ignoreCase ? b.toLowerCase() : b),
      );
    } else if (sort === "desc") {
      lines.sort((a, b) =>
        (ignoreCase ? b.toLowerCase() : b).localeCompare(ignoreCase ? a.toLowerCase() : a),
      );
    }

    setOutput(lines.join("\n"));
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
    anchor.download = "cleaned-lines.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setCopied(false);
  }

  const removed = inputLines - outputLines;

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Duplicate Line Remover
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Remove duplicate lines, trim whitespace, drop empty lines, and sort
          any text list instantly.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Input */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-slate-300">
                Input lines
              </label>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                {inputLines} lines
              </span>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={"apple\nbanana\napple\n  banana\n\ncherry"}
              className="min-h-[300px] w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          {/* Output */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-slate-300">
                Cleaned output
              </label>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  removed > 0
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                {outputLines} lines
                {removed > 0 ? ` · -${removed} dupes` : ""}
              </span>
            </div>

            <textarea
              value={output}
              readOnly
              placeholder="Processed lines will appear here."
              className="min-h-[300px] w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Options */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={trim}
              onChange={(event) => setTrim(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Trim whitespace
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(event) => setRemoveEmpty(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Remove empty lines
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={dedupe}
              onChange={(event) => setDedupe(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Remove duplicates
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(event) => setIgnoreCase(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Ignore letter case
          </label>

          <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-300">
              <ArrowDownUp className="h-4 w-4" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as "none" | "asc" | "desc")}
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                <option value="asc">Sort A → Z</option>
                <option value="desc">Sort Z → A</option>
                <option value="none">Keep original order</option>
              </select>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={process}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Wand2 className="h-4 w-4" />
            Process lines
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
            Download
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
      <HowToUse
        title="How to use Duplicate Line Remover"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}