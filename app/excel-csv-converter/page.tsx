"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileSpreadsheet,
  RefreshCw,
  Table2,
  Upload,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function csvToHtmlTable(csv: string) {
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);

  if (!rows.length) {
    return "";
  }

  return `
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body>
  <table border="1">
    ${rows
      .map(
        (row, rowIndex) => `
    <tr>
      ${row
        .map((cell) =>
          rowIndex === 0
            ? `<th>${escapeHtml(cell)}</th>`
            : `<td>${escapeHtml(cell)}</td>`,
        )
        .join("")}
    </tr>`,
      )
      .join("")}
  </table>
</body>
</html>`.trim();
}

function htmlTableToCsv(html: string) {
  const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));

  if (!rows.length) {
    throw new Error("No HTML table rows found. Paste an HTML table first.");
  }

  return rows
    .map((rowMatch) => {
      const cells = Array.from(
        rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi),
      );

      return cells
        .map((cellMatch) => {
          const text = cellMatch[1]
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();

          if (/[",\n\r]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
          }

          return text;
        })
        .join(",");
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
    title: "Paste or upload",
    description: "Paste CSV data or upload a CSV file from your device.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Choose conversion",
    description: "Convert CSV to Excel-compatible format or table HTML to CSV.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Generate output",
    description: "Click the conversion button to create the final output.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review result",
    description: "Check the generated table markup or CSV in the output box.",
    icon: <Table2 className="h-5 w-5" />,
  },
  {
    title: "Download file",
    description: "Download the result as an XLS or CSV file.",
    icon: <Download className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and output areas when starting again.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Excel to CSV / CSV to Excel
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

export default function ExcelCsvConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function convertCsvToExcel() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter CSV first.");
        return;
      }

      setOutput(csvToHtmlTable(input));
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert CSV.",
      );
    }
  }

  function convertExcelHtmlToCsv() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please paste an HTML table first.");
        return;
      }

      setOutput(htmlTableToCsv(input));
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert table to CSV.",
      );
    }
  }

  async function uploadCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setInput(await file.text());
    setOutput("");
    setError("");
    setCopied(false);

    event.target.value = "";
  }

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function downloadExcel() {
    if (!output) return;

    const blob = new Blob([output], {
      type: "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spreadsheet.xls";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    if (!output) return;

    const blob = new Blob([output], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spreadsheet.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Excel to CSV / CSV to Excel
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert CSV into an Excel-compatible file, or convert an HTML table
          copied from Excel into CSV.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste CSV or an HTML table here..."
            className="min-h-[440px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
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
            className="min-h-[420px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
          <Upload className="h-4 w-4" />
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={uploadCsv}
            className="hidden"
          />
        </label>

        <button
          onClick={convertCsvToExcel}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          CSV to Excel
        </button>

        <button
          onClick={convertExcelHtmlToCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Excel HTML to CSV
        </button>

        <button
          onClick={downloadExcel}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Download XLS
        </button>

        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Download CSV
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