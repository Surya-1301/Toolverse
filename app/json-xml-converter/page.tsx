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
  FileType2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code)),
    );
}

function jsonToXml(value: JsonValue, rootName = "root", indent = ""): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return `${indent}<item>\n${jsonToXml(item, "item", `${indent}  `)}\n${indent}</item>`;
        }
        return `${indent}<item>${escapeXml(String(item))}</item>`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        if (item && typeof item === "object") {
          return `${indent}<${key}>\n${jsonToXml(item, key, `${indent}  `)}\n${indent}</${key}>`;
        }
        return `${indent}<${key}>${escapeXml(String(item))}</${key}>`;
      })
      .join("\n");
  }

  return `${indent}<${rootName}>${escapeXml(String(value))}</${rootName}>`;
}

function parseXmlToJson(xml: string): JsonValue {
  // Strip comments and XML declaration
  const cleaned = xml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .trim();

  if (!cleaned) {
    throw new Error("Empty XML input.");
  }

  // Sanity check for balanced tags
  const openTags = (cleaned.match(/<[^\/!][^>]*>/g) || []).length;
  const closeTags = (cleaned.match(/<\/[^>]+>/g) || []).length;

  if (openTags !== closeTags) {
    throw new Error("Unbalanced XML tags detected.");
  }

  const tagPattern = /<([^!/?][^>]*)>([\s\S]*?)<\/\1>|<([^!/?][^>]*)\/>/g;
  const matches: Array<{ name: string; content: string }> = [];
  let match: RegExpExecArray | null;

  const allMatches: Array<{ name: string; content: string; selfClosing: boolean }> = [];

  // Extract all elements (opening + closing, and self-closing)
  const openClosePattern = /<([^\/!?][^>]*)>([\s\S]*?)<\/\1>/g;
  while ((match = openClosePattern.exec(cleaned)) !== null) {
    allMatches.push({
      name: match[1].trim().split(/\s+/)[0],
      content: match[2],
      selfClosing: false,
    });
  }

  const selfClosePattern = /<([^\/!?][^>]*)\/>/g;
  while ((match = selfClosePattern.exec(cleaned)) !== null) {
    allMatches.push({
      name: match[1].trim().split(/\s+/)[0],
      content: "",
      selfClosing: true,
    });
  }

  if (allMatches.length === 0) {
    // Just text content
    return unescapeXml(cleaned.trim());
  }

  const result: Record<string, JsonValue> = {};

  for (const element of allMatches) {
    const inner = element.content.trim();

    // Check if inner content is a nested element
    if (/<[^>]+>/.test(inner)) {
      const nested = parseXmlToJson(inner);

      if (Array.isArray(nested)) {
        result[element.name] = nested;
      } else if (nested && typeof nested === "object") {
        // Merge into existing if multiple same-named siblings
        if (result[element.name]) {
          const existing = result[element.name];

          if (Array.isArray(existing)) {
            existing.push(nested);
          } else {
            result[element.name] = [existing, nested];
          }
        } else {
          result[element.name] = nested;
        }
      } else {
        result[element.name] = nested;
      }
    } else {
      // Text content
      const textValue = unescapeXml(inner);

      if (textValue === "") {
        result[element.name] = "";
      } else if (textValue === "null") {
        result[element.name] = null;
      } else if (textValue === "true") {
        result[element.name] = true;
      } else if (textValue === "false") {
        result[element.name] = false;
      } else if (!Number.isNaN(Number(textValue)) && textValue !== "") {
        result[element.name] = Number(textValue);
      } else {
        // If duplicate key exists, make into array
        if (result[element.name] !== undefined) {
          const existing = result[element.name];

          if (Array.isArray(existing)) {
            existing.push(textValue);
            result[element.name] = existing;
          } else {
            result[element.name] = [existing, textValue];
          }
        } else {
          result[element.name] = textValue;
        }
      }
    }
  }

  return result;
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
    description: "Add JSON or XML content into the input editor.",
    icon: <FileJson className="h-5 w-5" />,
  },
  {
    title: "Choose direction",
    description: "Select JSON to XML or XML to JSON based on your input.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Convert data",
    description: "Click the convert button to generate the output.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review output",
    description: "Check the converted JSON or XML in the output editor.",
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

export default function JsonXmlConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function jsonToXml() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter JSON first.");
        return;
      }

      const parsed = JSON.parse(input) as JsonValue;
      const xml = jsonToXml(parsed)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");

      setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${"  " + xml.split("\n").join("\n  ")}\n</root>`);
    } catch {
      setOutput("");
      setError("Invalid JSON. Please check your syntax.");
    }
  }

  function xmlToJson() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setError("Please enter XML first.");
        return;
      }

      const converted = parseXmlToJson(input);
      setOutput(JSON.stringify(converted, null, 2));
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid XML input.",
      );
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
          JSON ↔ XML Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert JSON to XML or XML to JSON with validation errors, copy, and
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
            placeholder={'{"name": "John", "age": 30, "tags": ["a", "b"]}'}
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
          onClick={jsonToXml}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          JSON to XML
        </button>

        <button
          onClick={xmlToJson}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <FileType2 className="h-4 w-4" />
          XML to JSON
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

      <HowToUse
        title="How to use JSON ↔ XML Converter"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
