"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileCode2,
  FileDown,
  FileText,
  FileUp,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";

function textToBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function base64ToText(value: string) {
  return decodeURIComponent(escape(atob(value)));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, mimeType = "application/octet-stream") {
  const cleanBase64 = base64.includes(",") ? base64.split(",").pop() || "" : base64;
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = Array.from(byteCharacters).map((char) =>
    char.charCodeAt(0),
  );
  const byteArray = new Uint8Array(byteNumbers);

  return new Blob([byteArray], { type: mimeType });
}

function getDataUrlMimeType(value: string) {
  const match = value.match(/^data:([^;]+);base64,/);

  return match?.[1] || "application/octet-stream";
}

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Paste text",
    description: "Enter plain text or Base64 content in the input editor.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Encode text",
    description: "Convert normal text into Base64 safely in your browser.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "Decode text",
    description: "Convert Base64 content back into readable text.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Upload file",
    description: "Convert any uploaded file into a Base64 data URL.",
    icon: <FileUp className="h-5 w-5" />,
  },
  {
    title: "Save file",
    description: "Convert Base64 back into a downloadable file.",
    icon: <FileDown className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the encoded or decoded output to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Base64 Encoder / Decoder
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

export default function Base64EncoderDecoderPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fileName, setFileName] = useState("decoded-file");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function encodeText() {
    try {
      setError("");

      if (!input) {
        setOutput("");
        setError("Enter text first.");
        return;
      }

      setOutput(textToBase64(input));
    } catch {
      setOutput("");
      setError("Could not encode this text.");
    }
  }

  function decodeText() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Enter Base64 first.");
        return;
      }

      setOutput(base64ToText(input.trim()));
    } catch {
      setOutput("");
      setError("Invalid Base64 text.");
    }
  }

  async function fileToBase64(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setCopied(false);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setOutput(String(reader.result || ""));
    };

    reader.onerror = () => {
      setOutput("");
      setError("Could not read this file.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function downloadBase64File() {
    try {
      setError("");

      const source = output || input;

      if (!source.trim()) {
        setError("Enter or generate Base64 first.");
        return;
      }

      const mimeType = getDataUrlMimeType(source);
      const blob = base64ToBlob(source.trim(), mimeType);

      downloadBlob(blob, fileName || "decoded-file");
    } catch {
      setError("Could not convert Base64 to file.");
    }
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
    setFileName("decoded-file");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Base64 Encoder / Decoder
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert text to Base64, decode Base64 to text, encode files, and turn
          Base64 data back into downloadable files.
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
            placeholder="Paste text or Base64 here..."
            className="min-h-[430px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Output filename
            </label>

            <input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="decoded-file"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Output
            </label>

            <button
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
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
        <button
          onClick={encodeText}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
        <Upload className="h-4 w-4" />
          Text to Base64
        </button>

        <button
          onClick={decodeText}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Base64 to text
        </button>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
          <Upload className="h-4 w-4" />
          File to Base64
          <input type="file" onChange={fileToBase64} className="hidden" />
        </label>

        <button
          onClick={downloadBase64File}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Base64 to file
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