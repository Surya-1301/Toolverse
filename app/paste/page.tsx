"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Code2,
  Copy,
  Eraser,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Send,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

const expiryOptions = [
  { label: "Never", value: "never" },
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

const languageOptions = [
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

type PasteResult = {
  id: string;
  url: string;
  rawUrl: string;
  expiresAt: string | null;
};

type CopyType = "page" | "raw" | "";

export default function PastePage() {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plain_text");
  const [expiry, setExpiry] = useState("never");
  const [customAlias, setCustomAlias] = useState("");

  const [result, setResult] = useState<PasteResult | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [rawUrl, setRawUrl] = useState("");

  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingAlias, setIsCheckingAlias] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  function validateAlias(alias: string) {
    if (!alias) {
      return "Enter an alias first.";
    }

    if (!/^[a-z0-9-]{3,40}$/.test(alias)) {
      return "Alias must be 3-40 characters and use lowercase letters, numbers, or hyphens.";
    }

    if (alias.startsWith("-") || alias.endsWith("-")) {
      return "Alias cannot start or end with a hyphen.";
    }

    if (alias.includes("--")) {
      return "Alias cannot contain consecutive hyphens.";
    }

    return "";
  }

  async function openAlias() {
    try {
      setError("");
      setResult(null);
      setPasteUrl("");
      setRawUrl("");
      setCopied("");

      const alias = customAlias.trim().toLowerCase();
      const aliasError = validateAlias(alias);

      if (aliasError) {
        setError(aliasError);
        return;
      }

      setIsCheckingAlias(true);

      const response = await fetch(`/api/paste/${alias}`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        window.open(`/paste/${alias}`, "_blank", "noopener,noreferrer");
        return;
      }

      if (response.status === 404) {
        setError(
          "No paste found with this alias. Add content below and click Create paste to create it."
        );
        return;
      }

      if (response.status === 410) {
        setError(
          "This paste has expired. Add content below and click Create paste to recreate it."
        );
        return;
      }

      const data = await response.json().catch(() => null);
      setError(data?.error || "Could not check this alias.");
    } catch {
      setError("Could not check this alias. Please try again.");
    } finally {
      setIsCheckingAlias(false);
    }
  }

  async function createPaste() {
    try {
      setError("");
      setResult(null);
      setPasteUrl("");
      setRawUrl("");
      setCopied("");

      if (!content.trim()) {
        setError("Paste content is required.");
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
          customAlias,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create paste.");
        return;
      }

      const fullPasteUrl = `${window.location.origin}${data.url}`;
      const fullRawUrl = `${window.location.origin}${data.rawUrl}`;

      setResult(data);
      setPasteUrl(fullPasteUrl);
      setRawUrl(fullRawUrl);
    } catch {
      setError("Could not create paste. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyValue(type: CopyType) {
    const value = type === "page" ? pasteUrl : rawUrl;

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function clearAll() {
    setContent("");
    setLanguage("plain_text");
    setExpiry("never");
    setCustomAlias("");
    setResult(null);
    setPasteUrl("");
    setRawUrl("");
    setError("");
    setIsCreating(false);
    setIsCheckingAlias(false);
    setCopied("");
  }

  function formatExpiry(value: string | null) {
    if (!value) return "Never";

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Paste
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Create or open quick shareable notes using a readable paste alias.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Paste alias
          </label>

          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 focus-within:border-violet-500">
              <span className="flex items-center border-r border-white/10 bg-white/[0.03] px-4 py-3 text-base font-bold text-slate-200 sm:text-lg">
                /paste/
              </span>

              <input
                value={customAlias}
                onChange={(event) =>
                  setCustomAlias(event.target.value.toLowerCase())
                }
                placeholder="alias"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base font-semibold text-slate-100 outline-none placeholder:font-medium placeholder:italic placeholder:text-slate-500 sm:text-lg"
              />
            </div>

            <button
              type="button"
              onClick={openAlias}
              disabled={isCheckingAlias}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
            >
              {isCheckingAlias ? "..." : "Go"}
            </button>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Type an existing alias and click Go to open previous notes. If it
            does not exist, add content and create it.
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Content
          </label>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste your text or code here..."
            spellCheck={false}
            className="min-h-[420px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Language
            </label>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
            >
              {languageOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Expires
            </label>

            <select
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
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
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
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

        {result ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-200">
                  Paste created successfully
                </p>

                <p className="mt-1 text-xs text-emerald-100/80">
                  ID: {result.id}
                </p>

                <p className="mt-1 text-xs text-emerald-100/80">
                  Expires: {formatExpiry(result.expiresAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => copyValue("page")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/10"
                >
                  {copied === "page" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "page" ? "Copied" : "Copy paste"}
                </button>

                <button
                  onClick={() => copyValue("raw")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/10"
                >
                  {copied === "raw" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "raw" ? "Copied" : "Copy raw"}
                </button>

                <a
                  href={pasteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                >
                  Open paste
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                >
                  Open raw
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={pasteUrl}
                readOnly
                className="w-full rounded-xl border border-emerald-400/20 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
              />

              <input
                value={rawUrl}
                readOnly
                className="w-full rounded-xl border border-emerald-400/20 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
              />
            </div>
          </div>
        ) : null}
      </div>

      <HowToUse
        subtitle="Create or open notes with a readable paste alias."
        steps={[
          {
            title: "Enter alias",
            description: "Type a new alias or an old one you already created.",
            icon: <Link2 className="h-5 w-5" />,
          },
          {
            title: "Open old notes",
            description: "Click Go to open the paste if the alias exists.",
            icon: <ExternalLink className="h-5 w-5" />,
          },
          {
            title: "Create notes",
            description: "If the alias does not exist, add content and create it.",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            title: "Choose settings",
            description: "Set language and expiry for the paste.",
            icon: <Clock className="h-5 w-5" />,
          },
          {
            title: "Share link",
            description: "Copy or open the generated paste link.",
            icon: <Send className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}