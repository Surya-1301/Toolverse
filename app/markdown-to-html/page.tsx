"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Eraser } from "lucide-react";
import { Container } from "@/components/Container";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2">$1</a>',
    );
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
            placeholder="Paste Markdown here..."
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            HTML output
          </label>

          <textarea
            readOnly
            value={output}
            placeholder="HTML output will appear here..."
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={copyOutput}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
    </Container>
  );
}