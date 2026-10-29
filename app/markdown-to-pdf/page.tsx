"use client";

import { BackButton } from "@/components/BackButton";

import { useMemo, useState } from "react";
import {
  Download,
  Eraser,
  Eye,
  FileDown,
  FileText,
  Keyboard,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { isNative, saveBlobNative } from "@/lib/capacitor";

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
    .replace(/(^|\W)\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string }
  | { kind: "rule" }
  | { kind: "para"; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;

  function flushList() {
    if (list) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  }

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (code) {
        blocks.push({ kind: "code", text: code.join("\n") });
        code = null;
      } else {
        flushList();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2].trim() || " ",
      });
      continue;
    }
    if (/^\s*(\*\*\*|---|___)\s*$/.test(line)) {
      flushList();
      blocks.push({ kind: "rule" });
      continue;
    }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushList();
      blocks.push({ kind: "quote", text: quote[1] || " " });
      continue;
    }
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const item = ordered ? ordered[1] : bullet ? bullet[1] : null;
    if (item !== null) {
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push(item);
      continue;
    }
    if (!line.trim()) {
      flushList();
      continue;
    }
    flushList();
    blocks.push({ kind: "para", text: line.trim() });
  }
  flushList();
  if (code) blocks.push({ kind: "code", text: code.join("\n") });
  return blocks;
}

function markdownToHtml(markdown: string) {
  if (!markdown.trim()) return "";
  return parseBlocks(markdown)
    .map((block) => {
      switch (block.kind) {
        case "heading":
          return `<h${block.level}>${inlineMarkdown(block.text)}</h${block.level}>`;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = block.items
            .map((item) => `<li>${inlineMarkdown(item)}</li>`)
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "quote":
          return `<blockquote>${inlineMarkdown(block.text)}</blockquote>`;
        case "code":
          return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
        case "rule":
          return "<hr />";
        case "para":
          return `<p>${inlineMarkdown(block.text)}</p>`;
      }
    })
    .join("\n");
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
    description: "Click Download PDF to create a real PDF file instantly.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Save file",
    description: "The PDF saves straight to your device Downloads folder.",
    icon: <FileDown className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the editor when you want to start a new document.",
    icon: <Eraser className="h-5 w-5" />,
  },
];


export default function MarkdownToPdfPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const html = useMemo(() => markdownToHtml(input), [input]);

  /** Render one markdown line's inline marks to plain PDF text. */
  function pdfText(value: string) {
    return value
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/(^|\W)\*([^*\n]+)\*/g, "$1$2")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  }

  async function downloadPdf() {
    if (!input.trim() || isGenerating) return;
    setError("");
    setIsGenerating(true);
    try {
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const mono = await pdf.embedFont(StandardFonts.Courier);

      const PAGE_W = 595; // A4
      const PAGE_H = 842;
      const MARGIN = 56;
      const MAX_W = PAGE_W - MARGIN * 2;
      let page = pdf.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      function newPage() {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      function need(space: number) {
        if (y - space < MARGIN) newPage();
      }
      function wrap(text: string, font: typeof regular, size: number) {
        const words = text.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let current = "";
        for (const word of words) {
          const trial = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(trial, size) > MAX_W && current) {
            lines.push(current);
            current = word;
          } else {
            current = trial;
          }
        }
        if (current) lines.push(current);
        return lines.length ? lines : [""];
      }
      function drawLines(
        lines: string[],
        font: typeof regular,
        size: number,
        color = rgb(0.1, 0.1, 0.1),
        indent = 0,
      ) {
        const height = size * 1.5;
        for (const line of lines) {
          need(height);
          y -= height;
          page.drawText(line, {
            x: MARGIN + indent,
            y,
            size,
            font,
            color,
          });
        }
      }

      for (const block of parseBlocks(input)) {
        switch (block.kind) {
          case "heading": {
            const size = Math.max(13, 24 - block.level * 2);
            need(size * 1.5 + 10);
            y -= 10;
            drawLines(wrap(pdfText(block.text), bold, size), bold, size);
            break;
          }
          case "list": {
            block.items.forEach((item, index) => {
              const marker = block.ordered ? `${index + 1}. ` : "• ";
              const lines = wrap(pdfText(item), regular, 11);
              drawLines(
                lines.map((line, i) => (i === 0 ? marker + line : `   ${line}`)),
                regular,
                11,
              );
            });
            y -= 4;
            break;
          }
          case "quote": {
            const lines = wrap(pdfText(block.text), italic, 11);
            need(lines.length * 16.5 + 8);
            const h = lines.length * 16.5;
            page.drawRectangle({
              x: MARGIN,
              y: y - h - 4,
              width: 3,
              height: h + 4,
              color: rgb(0.49, 0.23, 0.93),
            });
            drawLines(lines, italic, 11, rgb(0.28, 0.28, 0.33), 12);
            y -= 4;
            break;
          }
          case "code": {
            const lines: string[] = [];
            for (const raw of block.text.split("\n")) {
              lines.push(
                ...wrap(raw.trim() ? raw : " ", mono, 9.5).map((l) =>
                  l ? `  ${l}` : " ",
                ),
              );
            }
            need(lines.length * 14.25 + 12);
            const h = lines.length * 14.25;
            page.drawRectangle({
              x: MARGIN,
              y: y - h - 8,
              width: MAX_W,
              height: h + 12,
              color: rgb(0.95, 0.96, 0.98),
            });
            y -= 6;
            drawLines(lines, mono, 9.5, rgb(0.15, 0.15, 0.2));
            y -= 10;
            break;
          }
          case "rule": {
            need(20);
            y -= 10;
            page.drawLine({
              start: { x: MARGIN, y },
              end: { x: PAGE_W - MARGIN, y },
              thickness: 1,
              color: rgb(0.8, 0.82, 0.88),
            });
            y -= 10;
            break;
          }
          case "para": {
            drawLines(wrap(pdfText(block.text), regular, 11), regular, 11);
            y -= 4;
            break;
          }
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      if (isNative()) {
        await saveBlobNative(blob, "markdown.pdf");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "markdown.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not generate the PDF.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools/conversion-tools" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Markdown to PDF
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Write Markdown, preview it live, and download a real PDF file.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <label className="mb-3 block text-sm font-semibold text-slate-300 light:text-slate-700">
            Markdown input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
            placeholder="Write Markdown here..."
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <label className="mb-3 block text-sm font-semibold text-slate-300 light:text-slate-700">
            Live preview
          </label>

          {html ? (
            <div
              className="md-preview min-h-[460px] rounded-2xl border border-white/10 bg-slate-950 p-6 text-left text-slate-200 light:border-slate-900/10 light:bg-white light:text-slate-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-6 text-sm text-slate-500 light:border-slate-900/15 light:bg-white">
              Your formatted preview appears here as you type.
            </div>
          )}
          <style>{`.md-preview h1{font-size:1.6rem;font-weight:800;margin:.4em 0;line-height:1.25}
.md-preview h2{font-size:1.35rem;font-weight:800;margin:.5em 0;line-height:1.3}
.md-preview h3{font-size:1.15rem;font-weight:700;margin:.5em 0}
.md-preview h4,.md-preview h5,.md-preview h6{font-size:1rem;font-weight:700;margin:.5em 0}
.md-preview p{margin:.55em 0;line-height:1.7}
.md-preview ul,.md-preview ol{margin:.55em 0 .55em 1.4em;line-height:1.7}
.md-preview ul{list-style:disc}
.md-preview ol{list-style:decimal}
.md-preview li{margin:.25em 0}
.md-preview blockquote{margin:.7em 0;padding:.4em .9em;border-left:3px solid #0ea5e9;opacity:.9}
.md-preview pre{background:rgba(148,163,184,.12);border-radius:.6rem;padding:.8rem;overflow:auto;margin:.7em 0}
.md-preview code{font-family:ui-monospace,monospace;font-size:.85em;background:rgba(148,163,184,.16);padding:.1em .35em;border-radius:.3rem}
.md-preview pre code{background:transparent;padding:0}
.md-preview hr{margin:1em 0;opacity:.3}
.md-preview a{color:#a78bfa;text-decoration:underline}`}</style>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={downloadPdf}
          disabled={!input.trim() || isGenerating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-500 px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? "Generating…" : "Download PDF"}
        </button>

        <button
          onClick={() => setInput("")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>
      <HowToUse
        title="How to use Markdown to PDF"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}