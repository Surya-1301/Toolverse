"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Eraser,
  FileCode2,
  Minimize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

function removeTsComments(value: string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");
}

function formatTsCode(value: string) {
  let indent = 0;
  const lines: string[] = [];

  const formatted = value
    .replace(/\{/g, "{\n")
    .replace(/\}/g, "\n}\n")
    .replace(/;/g, ";\n")
    .replace(/,/g, ",\n");

  const rawLines = formatted.split("\n");

  for (let raw of rawLines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("}") || line.startsWith(")")) {
      indent = Math.max(indent - 1, 0);
    }

    lines.push(`${"  ".repeat(indent)}${line}`);

    if (line.endsWith("{") || line.endsWith("(")) {
      indent += 1;
    }
  }

  return lines.join("\n");
}

function minifyTsCode(value: string) {
  return removeTsComments(value)
    .replace(/\s+/g, " ")
    .replace(/\s*([{}()[\];,:=+\-*/<>!&|?])\s*/g, "$1")
    .replace(/;\s*/g, ";")
    .trim();
}

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
    title: "Paste TypeScript",
    description:
      "Add your TypeScript code, interfaces, or type definitions into the input box.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Format code",
    description: "Use Format TS to beautify your code with proper indentation.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Minify TypeScript",
    description:
      "Use Minify TS to compress code into a single line, removing comments and spaces.",
    icon: <Minimize2 className="h-5 w-5" />,
  },
  {
    title: "Remove comments",
    description:
      "Strip TypeScript comments before using the code in production.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the processed TypeScript output instantly to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and output areas when you want to start over.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

export default function TypeScriptFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function formatTs() {
    setOutput(formatTsCode(input));
  }

  function minifyTs() {
    setOutput(minifyTsCode(input));
  }

  function stripComments() {
    setOutput(removeTsComments(input));
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
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          TypeScript Formatter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Beautify, format, minify, remove comments, and copy TypeScript code
          instantly in your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            TypeScript input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction getUser(id: number): Promise<User | null> {\n  return fetch(`/api/users/${id}`).then(res => res.json());\n}'}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
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
            className="min-h-[440px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={formatTs}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          Format TS
        </button>

        <button
          onClick={minifyTs}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Minimize2 className="h-4 w-4" />
          Minify TS
        </button>

        <button
          onClick={stripComments}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Remove comments
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      <HowToUse
        title="How to use TypeScript Formatter / Minifier"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
