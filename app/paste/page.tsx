"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eraser,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Clock, Code2, } from "lucide-react";
import { HowToUse } from "@/components/HowToUse";

const languages = [
  { label: "Plain text", value: "plain_text" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "Python", value: "python" },
  { label: "Shell", value: "shell" },
];

const expiryOptions = [
  { label: "Never", value: "never" },
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

export default function PastePage() {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plain_text");
  const [expiry, setExpiry] = useState("never");
  const [resultUrl, setResultUrl] = useState("");
  const [rawUrl, setRawUrl] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createPaste() {
    try {
      setError("");
      setResultUrl("");
      setRawUrl("");
      setCopied(false);

      if (!content.trim()) {
        setError("Please enter text or code first.");
        return;
      }

      setIsCreating(true);

      const response = await fetch("/api/paste/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          language,
          expiry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create paste.");
        return;
      }

      const fullUrl = `${window.location.origin}${data.url}`;
      const fullRawUrl = `${window.location.origin}${data.rawUrl}`;

      setResultUrl(fullUrl);
      setRawUrl(fullRawUrl);
    } catch {
      setError("Could not create paste. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    if (!resultUrl) return;

    await navigator.clipboard.writeText(resultUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setContent("");
    setLanguage("plain_text");
    setExpiry("never");
    setResultUrl("");
    setRawUrl("");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      
      <div className="mx-auto max-w-3xl text-center">
  <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
    Paste
  </h1>

  <p className="mt-4 text-base leading-7 text-slate-400">
      Share text and code snippets with quick, clean links.
  </p>
</div>

      <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Paste content
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste your text or code here..."
              spellCheck={false}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Language
            </label>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
            >
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <label className="mb-2 mt-4 block text-sm font-medium text-slate-300">
              Expires
            </label>

            <select
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
            >
              {expiryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {resultUrl ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-200">
              Paste created successfully
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={resultUrl}
                readOnly
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
              />

              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Open paste
              </a>

              {rawUrl ? (
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Raw view
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={createPaste}
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Create paste"}
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
      <HowToUse
  subtitle=""
  steps={[
    {
      title: "Paste content",
      description: "Add your text, notes, or code into the paste editor.",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Choose language",
      description: "Select a language to label the pasted content.",
      icon: <Code2 className="h-5 w-5" />,
    },
    {
      title: "Set expiry",
      description: "Choose when the paste should expire or keep it forever.",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Create paste",
      description: "Generate a clean link that you can share instantly.",
      icon: <Send className="h-5 w-5" />,
    },
    {
      title: "Copy link",
      description: "Copy the paste link or open the raw text view.",
      icon: <Copy className="h-5 w-5" />,
    },
  ]}
/>
    </Container>
  );
}