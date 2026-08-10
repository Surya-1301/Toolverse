"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  Eye,
  FileDown,
  FileText,
  Keyboard,
  Sparkles,
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
    description: "Type or paste Markdown content into the editor.",
    icon: <Keyboard className="h-5 w-5" />,
  },
  {
    title: "Use formatting",
    description: "Add headings, bold text, italic text, code, and lists.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Preview output",
    description: "Check the rendered preview before creating your PDF.",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    title: "Generate PDF",
    description: "Click Download PDF to open the browser print dialog.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Save file",
    description: "Choose Save as PDF from your browser print options.",
    icon: <FileDown className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the editor when you want to start a new document.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Markdown to PDF
      </h2>
      {/* Desktop/tablet: keep the existing card layout */}
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

      {/* Mobile only: icon on the left, title + description on the right */}
      <div className="mt-6 space-y-4 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-start gap-4 rounded-2xl border border-[#183b4f] bg-[#0b0e1f] p-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#0d526b] bg-[#09283c] text-[#65e4f7] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              {step.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-5 text-[#f4fbff]">
                {step.title}
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-[#8fa9b8]">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MarkdownToPdfPage() {
  const [input, setInput] = useState("");

  const html = useMemo(() => markdownToHtml(input), [input]);

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
      <BackToToolsLink />

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
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            placeholder="Write Markdown here..."
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Live preview
          </label>

          <div
            className="min-h-[460px] rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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

      <HowToUseSection />
    </Container>
  );
}