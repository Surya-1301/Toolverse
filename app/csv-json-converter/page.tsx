"use client";

import { useState } from "react";
import { Check, Copy, Download, Eraser, Upload } from "lucide-react";
import { Container } from "@/components/Container";

type CsvRow = Record<string, string>;

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

function csvToJsonValue(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function jsonToCsvValue(json: string) {
  const parsed = JSON.parse(json) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];

  if (!rows.length) {
    return "";
  }

  if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    throw new Error("JSON must be an object or an array of objects.");
  }

  const objectRows = rows as Array<Record<string, unknown>>;
  const headers = Array.from(new Set(objectRows.flatMap((row) => Object.keys(row))));

  return [
    headers.map(escapeCsvCell).join(","),
    ...objectRows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(","),
    ),
  ].join("\n");
}

export default function CsvJsonConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function csvToJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter CSV first.");
        return;
      }

      const converted = csvToJsonValue(input);
      setOutput(JSON.stringify(converted, null, 2));
    } catch (caughtError) {
      setOutput("");
      setError(caughtError instanceof Error ? caughtError.message : "Invalid CSV input.");
    }
  }

  function jsonToCsv() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      setOutput(jsonToCsvValue(input));
    } catch (caughtError) {
      setOutput("");
      setError(caughtError instanceof Error ? caughtError.message : "Invalid JSON input.");
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

  function downloadOutput() {
    if (!output) return;

    const isJson = output.trim().startsWith("[") || output.trim().startsWith("{");
    const blob = new Blob([output], {
      type: isJson ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = isJson ? "converted.json" : "converted.csv";

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
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          CSV ↔ JSON Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert CSV to JSON or JSON to CSV, upload CSV files, copy results,
          and download the converted output.
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
            placeholder="Paste CSV or JSON here..."
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
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
          onClick={csvToJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          CSV to JSON
        </button>

        <button
          onClick={jsonToCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          JSON to CSV
        </button>

        <button
          onClick={downloadOutput}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Download
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>
    </Container>
  );
}