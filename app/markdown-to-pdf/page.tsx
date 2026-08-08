"use client";

import { useMemo, useState } from "react";
import { Download, Eraser } from "lucide-react";
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
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
      }

      if (/^[-*]\s+/.test(line)) {
        return `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>`;
      }

      if (!line.trim()) return "<br />";
      return `<p>${inlineMarkdown(line)}</p>`;
    })
    .join("\n");
}

export default function MarkdownToPdfPage() {
  const [input, setInput] = useState("");

  const html = useMemo(() => markdownToHtml(input), [input]);
  const hasOutput = input.trim().length > 0;

  function downloadPdf() {
    const win = window.open("", "_blank");

    if (!win) return;

    win.document.write(
      `<!doctype html>
<html>
<head>
  <title>Markdown PDF</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      line-height: 1.6;
      color: #111;
    }

    code {
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
    }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.25;
    }
  </style>
</head>
<body>
  ${html}
  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>`,
    );

    win.document.close();
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Markdown to PDF
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Write Markdown, preview it live, and download as PDF using your
          browser print dialog.
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
            Live preview
          </label>

          <div className="relative min-h-[460px] rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-200">
            {!hasOutput ? (
              <div className="absolute inset-0 flex items-start justify-start p-6">
                <span className="text-sm text-slate-500">
                  Output will appear here...
                </span>
              </div>
            ) : null}

            {hasOutput ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Download className="h-4 w-4" />
          Download PDF
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