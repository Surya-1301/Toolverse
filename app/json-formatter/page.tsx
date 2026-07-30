"use client";

import { useState } from "react";
import { Check, Copy, Eraser, FileJson, Minimize2, Wand2 } from "lucide-react";
import { Container } from "@/components/Container";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatJson() {
    try {
      setError("");

      if (!input.trim()) {
        setError("Please enter JSON first.");
        setOutput("");
        return;
      }

      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);

      setOutput(formatted);
    } catch {
      setError("Invalid JSON. Please check your syntax.");
      setOutput("");
    }
  }

  function minifyJson() {
    try {
      setError("");

      if (!input.trim()) {
        setError("Please enter JSON first.");
        setOutput("");
        return;
      }

      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);

      setOutput(minified);
    } catch {
      setError("Invalid JSON. Please check your syntax.");
      setOutput("");
    }
  }

  function validateJson() {
    try {
      setError("");

      if (!input.trim()) {
        setError("Please enter JSON first.");
        setOutput("");
        return;
      }

      JSON.parse(input);
      setOutput("Valid JSON ✅");
    } catch {
      setError("Invalid JSON. Please check your syntax.");
      setOutput("");
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
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300">
          <FileJson className="h-7 w-7" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          JSON Formatter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format, validate, and minify JSON instantly in your browser. Your data
          stays on your device.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={formatJson}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Wand2 className="h-4 w-4" />
            Format
          </button>

          <button
            onClick={minifyJson}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Minimize2 className="h-4 w-4" />
            Minify
          </button>

          <button
            onClick={validateJson}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Check className="h-4 w-4" />
            Validate
          </button>

          <button
            onClick={copyOutput}
            disabled={!output}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Input JSON
            </label>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Paste JSON here...\n\nExample:\n{"name":"Toolverse","type":"tools"}`}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Output
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted output will appear here..."
              spellCheck={false}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">How to use</h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-400">
          <li>Paste your JSON into the input box.</li>
          <li>Click Format to make it readable.</li>
          <li>Click Minify to remove spaces and line breaks.</li>
          <li>Click Validate to check if your JSON is correct.</li>
          <li>Use Copy to copy the result.</li>
        </ol>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">FAQ</h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Is my JSON uploaded?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              No. This JSON formatter runs in your browser, so your JSON stays
              on your device.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Can I minify JSON?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yes. Click the Minify button to remove unnecessary whitespace from
              valid JSON.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Does it validate JSON?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yes. If your JSON has a syntax error, the tool will show an
              invalid JSON message.
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}