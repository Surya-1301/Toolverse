"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Braces,
  Check,
  Code2,
  Copy,
  Download,
  Eraser,
  FileJson,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function parseScalar(value: string): JsonValue {
  const trimmed = value.trim();

  if (trimmed === "") return "";
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed);
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function yamlToObject(yaml: string) {
  const result: Record<string, JsonValue> = {};

  for (const rawLine of yaml.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid YAML line: ${rawLine}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      throw new Error(`Invalid YAML key in line: ${rawLine}`);
    }

    result[key] = parseScalar(value);
  }

  return result;
}

function objectToYaml(value: JsonValue, indent = ""): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return `${indent}-\n${objectToYaml(item, `${indent}  `)}`;
        }

        return `${indent}- ${String(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        if (item && typeof item === "object") {
          return `${indent}${key}:\n${objectToYaml(item, `${indent}  `)}`;
        }

        return `${indent}${key}: ${String(item)}`;
      })
      .join("\n");
  }

  return `${indent}${String(value)}`;
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
    title: "Paste input",
    description: "Add YAML or JSON content into the input editor.",
    icon: <FileJson className="h-5 w-5" />,
  },
  {
    title: "Choose direction",
    description: "Select YAML to JSON or JSON to YAML based on your input.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Convert data",
    description: "Click the convert button to generate the output.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review output",
    description: "Check the converted YAML or JSON in the output editor.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "Copy/download",
    description: "Copy the converted result or download it as a text file.",
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
        How to use YAML ↔ JSON Converter
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

export default function YamlJsonConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function yamlToJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter YAML first.");
        return;
      }

      const converted = yamlToObject(input);
      setOutput(JSON.stringify(converted, null, 2));
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid YAML input.",
      );
    }
  }

  function jsonToYaml() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      const parsed = JSON.parse(input) as JsonValue;
      setOutput(objectToYaml(parsed));
    } catch {
      setOutput("");
      setError("Invalid JSON. Please check your syntax.");
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

  function downloadOutput() {
    if (!output) return;

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "converted.txt";

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
          YAML ↔ JSON Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert YAML to JSON or JSON to YAML with validation errors, copy, and
          download support.
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
            placeholder="Paste YAML or JSON here..."
            className="min-h-[480px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
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
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
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
          onClick={yamlToJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          YAML to JSON
        </button>

        <button
          onClick={jsonToYaml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Braces className="h-4 w-4" />
          JSON to YAML
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
      <HowToUseSection />
    </Container>
  );
}