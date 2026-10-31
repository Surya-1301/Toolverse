"use client";

import { BackButton } from "@/components/BackButton";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eraser,
  Eye,
  FileCode2,
  Keyboard,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { copyTextNative } from "@/lib/capacitor";

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


export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => markdownToHtml(input), [input]);

  async function copyOutput() {
    if (!(await copyTextNative(output))) return;
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
      <div className="mb-8">
        <BackButton fallbackHref="/tools/conversion-tools" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Markdown to HTML
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Convert Markdown into clean HTML with live output and copy/download
          support.
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
            placeholder="Paste Markdown here..."
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300 light:text-slate-700">
              HTML output
            </label>

           
          </div>

          <textarea
            readOnly
            value={output}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
            placeholder="HTML output will appear here..."
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          onClick={copyOutput}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 transition hover:bg-sky-400"
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
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-500 px-4 py-2.5 text-[11px] transition sm:text-sm"
        >
          <Download className="h-4 w-4 shrink-0" />
          Download HTML
        </button>

        <button
          onClick={() => setInput("")}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition sm:col-span-1"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>
      <HowToUse
        title="How to use Markdown to HTML"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}