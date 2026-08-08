"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Eraser,
  FileCode2,
  Paintbrush,
  Sparkles,
  Minimize2,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function removeCssComments(value: string) {
  return value.replace(/\/\*[\s\S]*?\*\//g, "");
}

function formatCssCode(value: string) {
  let indent = 0;

  return removeCssComments(value)
    .replace(/\{/g, "{\n")
    .replace(/;/g, ";\n")
    .replace(/\}/g, "\n}\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line === "}") {
        indent = Math.max(indent - 1, 0);
        return `${"  ".repeat(indent)}}`;
      }

      const formatted = `${"  ".repeat(indent)}${line}`;

      if (line.endsWith("{")) {
        indent += 1;
      }

      return formatted;
    })
    .join("\n");
}

function minifyCssCode(value: string) {
  return removeCssComments(value)
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const howToUseSteps = [
  {
    title: "Paste CSS",
    description: "Add your CSS stylesheet or style snippet into the input box.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Format styles",
    description: "Use Format CSS to make the stylesheet readable and clean.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Minify CSS",
    description: "Reduce spaces, comments, and unnecessary characters.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "Remove comments",
    description: "Strip CSS comments before using the code in production.",
    icon: <Paintbrush className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the processed CSS output instantly to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and output areas when you want to start over.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use CSS Formatter / Minifier
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

export default function CssFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function formatCss() {
    setOutput(formatCssCode(input));
  }

  function minifyCss() {
    setOutput(minifyCssCode(input));
  }

  function stripComments() {
    setOutput(removeCssComments(input));
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
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          CSS Formatter / Minifier
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format CSS, minify stylesheets, remove comments, and copy the output.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            CSS input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste CSS here..."
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
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={formatCss}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          Format CSS
        </button>

        <button
          onClick={minifyCss}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
       <Minimize2 className="h-4 w-4" />
          Minify CSS
        </button>

        <button
          onClick={stripComments}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Remove comments
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