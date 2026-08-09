"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  Eye,
  FileCode2,
  Keyboard,
} from "lucide-react";
import { Container } from "@/components/Container";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }

      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (heading) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }

      const level = heading[1].length;
      html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>\n`;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }

      html += `<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>\n`;
      continue;
    }

    if (inList) {
      html += "</ul>\n";
      inList = false;
    }

    html += `<p>${inlineMarkdown(trimmed)}</p>\n`;
  }

  if (inList) {
    html += "</ul>\n";
  }

  return html.trim();
}

function BackToToolsLink() {
  return (
    <Link
      href="/tools/conversion-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Write Markdown",
    description: "Type or paste Markdown content into the input editor.",
    icon: <Keyboard className="h-5 w-5" />,
  },
  {
    title: "Convert to HTML",
    description: "The tool automatically converts Markdown into clean HTML.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Review output",
    description: "Check the generated HTML in the output editor.",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    title: "Copy HTML",
    description: "Copy the converted HTML code to your clipboard instantly.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Download file",
    description: "Download the converted result as an HTML file.",
    icon: <Download className="h-5 w-5" />,
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
        How to use Markdown to HTML
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

export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => markdownToHtml(input), [input]);

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function downloadHtml() {
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "markdown.html";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Markdown to HTML
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert Markdown into clean HTML with live output and copy/download
          support.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Markdown input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            placeholder="Paste Markdown here..."
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              HTML output
            </label>

           
          </div>

          <textarea
            readOnly
            value={output}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            placeholder="HTML output will appear here..."
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={copyOutput}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy HTML"}
        </button>

        <button
          onClick={downloadHtml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Download HTML
        </button>

        <button
          onClick={() => setInput("")}
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