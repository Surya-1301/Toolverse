"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Eraser,
  FileCode2,
  ScanLine,
  Minimize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function formatHtmlCode(value: string) {
  let indent = 0;

  return value
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^<\/[^>]+>/.test(line)) {
        indent = Math.max(indent - 1, 0);
      }

      const formatted = `${"  ".repeat(indent)}${line}`;

      if (
        /^<[^!?/][^>]*[^/]?>$/.test(line) &&
        !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(
          line,
        )
      ) {
        indent += 1;
      }

      return formatted;
    })
    .join("\n");
}

function minifyHtmlCode(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function validateHtmlTags(value: string) {
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  const stack: string[] = [];
  const tagRegex = /<\/?([a-z][\w-]*)(\s[^>]*)?>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(value))) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (voidTags.has(tagName) || fullTag.endsWith("/>")) {
      continue;
    }

    if (fullTag.startsWith("</")) {
      const last = stack.pop();

      if (last !== tagName) {
        return `Invalid HTML: expected closing </${
          last || "unknown"
        }> but found </${tagName}>.`;
      }
    } else {
      stack.push(tagName);
    }
  }

  if (stack.length) {
    return `Invalid HTML: missing closing tag for <${
      stack[stack.length - 1]
    }>.`;
  }

  return "HTML tags look valid ✅";
}

const howToUseSteps = [
  {
    title: "Paste HTML",
    description: "Add your HTML code into the input editor.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Format code",
    description: "Use Format HTML to make your markup clean and readable.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Minify HTML",
    description: "Use Minify HTML to reduce spaces, comments, and line breaks.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "Validate tags",
    description: "Check for common opening and closing tag mistakes.",
    icon: <ScanLine className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the formatted, minified, or validated result instantly.",
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
        How to use HTML Formatter / Minifier
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

export default function HtmlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatHtml() {
    setError("");
    setOutput(formatHtmlCode(input));
  }

  function minifyHtml() {
    setError("");
    setOutput(minifyHtmlCode(input));
  }

  function validateHtml() {
    setError("");
    setOutput(validateHtmlTags(input));
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
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          HTML Formatter / Minifier
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format HTML, minify HTML, validate tags, and copy the output instantly.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            HTML input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste HTML here..."
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

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={formatHtml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          Format HTML
        </button>

        <button
          onClick={minifyHtml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Minimize2 className="h-4 w-4" />
          Minify HTML
        </button>

        <button
          onClick={validateHtml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
        <Check className="h-4 w-4" />
          Validate tags
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