"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Eraser, Upload, Wand2 } from "lucide-react";
import * as XLSX from "xlsx";
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
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function csvToAoa(csv: string) {
  return csv
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .map(parseCsvLine);
}

function aoaToCsv(aoa: string[][]) {
  return aoa
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? "";
          if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(","),
    )
    .join("\n");
}

function csvToWorkbook(csv: string) {
  const rows = csvToAoa(csv);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

function sheetToAoa(workbook: XLSX.WorkBook, sheetName: string) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
  return (aoa ?? []).map((r) => (Array.isArray(r) ? r.map(String) : []));
}

export default function ExcelCsvConverterPage() {
  // Removed default demo text
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [xlsxSheets, setXlsxSheets] = useState<
    Array<{ name: string; aoa: string[][] }>
  >([]);
  const [activeSheetName, setActiveSheetName] = useState<string | null>(null);

  const activeSheet = useMemo(() => {
    if (!activeSheetName) return null;
    return xlsxSheets.find((s) => s.name === activeSheetName) ?? null;
  }, [xlsxSheets, activeSheetName]);

  const activeSheetCsv = useMemo(() => {
    if (!activeSheet) return "";
    return aoaToCsv(activeSheet.aoa);
  }, [activeSheet]);

  // Keep output synced to selected sheet (when XLSX is present)
  function selectSheet(name: string) {
    setActiveSheetName(name);
    const sheet = xlsxSheets.find((s) => s.name === name);
    setOutput(sheet ? aoaToCsv(sheet.aoa) : "");
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setCopied(false);

    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "csv") {
        const text = await file.text();
        setInput(text);
        setOutput("");
        setXlsxSheets([]);
        setActiveSheetName(null);
        return;
      }

      if (ext === "xlsx") {
        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        const sheets = wb.SheetNames.map((name) => ({
          name,
          aoa: sheetToAoa(wb, name),
        }));

        setXlsxSheets(sheets);

        const firstName = sheets[0]?.name ?? null;
        setActiveSheetName(firstName);

        const firstCsv = sheets[0] ? aoaToCsv(sheets[0].aoa) : "";
        // Load first sheet into both panels for a consistent experience
        setInput(firstCsv);
        setOutput(firstCsv);

        return;
      }

      setError("Unsupported file type. Please upload .csv or .xlsx");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not read file.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function convertCsvToExcel() {
    setError("");
    if (!input.trim()) {
      setError("Please enter or upload CSV first.");
      return;
    }
    // Optional: keep output same as input so panels look consistent
    setOutput(input);
  }

  function excelToCsv() {
    setError("");
    if (!xlsxSheets.length) {
      setError("Please upload an .xlsx file first.");
      return;
    }
    // Ensure output matches selected sheet
    setOutput(activeSheetCsv);
  }

  async function copyText() {
    const textToCopy = output.trim() ? output : input;
    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadXlsx() {
    try {
      setError("");
      if (!input.trim()) {
        setError("Please enter or upload CSV first.");
        return;
      }

      const wb = csvToWorkbook(input);
      const xlsxBytes = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      const blob = new Blob([xlsxBytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "spreadsheet.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not create XLSX.",
      );
    }
  }

  function downloadCsv() {
    try {
      setError("");

      // Prefer output if present, else input
      const csv = output.trim() ? output : input;

      if (!csv.trim()) {
        setError("Nothing to download. Upload an .xlsx or paste CSV first.");
        return;
      }

      const fileName =
        xlsxSheets.length && activeSheetName
          ? `${activeSheetName}.csv`
          : "spreadsheet.csv";

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not download CSV.",
      );
    }
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
    setXlsxSheets([]);
    setActiveSheetName(null);
  }

  // Same UI for both panels
  const panelClassName =
    "min-h-[420px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Excel to CSV / CSV to Excel
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
           Convert CSV into an Excel-compatible file, or convert an Excel sheet into CSV.
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
            placeholder="Paste CSV or upload a file..."
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Output
            </label>

            <button
              onClick={copyText}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {xlsxSheets.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {xlsxSheets.map((sheet) => {
                const active = sheet.name === activeSheetName;
                return (
                  <button
                    key={sheet.name}
                    onClick={() => selectSheet(sheet.name)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold transition",
                      active
                        ? "bg-violet-600 text-white"
                        : "border border-white/10 text-slate-200 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {sheet.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          <textarea
            value={output}
            onChange={(event) => setOutput(event.target.value)}
            placeholder="Converted output will appear here..."
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
          Upload CSV / XLSX
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={uploadFile}
            className="hidden"
          />
        </label>

         <button
          onClick={excelToCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
           CSV to Excel
        </button>

        <button
          onClick={excelToCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Excel to CSV
        </button>

        <button
          onClick={downloadXlsx}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Download XLSX
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
    </Container>
  );
}