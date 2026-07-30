"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";

type PasteRecord = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const languageLabels: Record<string, string> = {
  plain_text: "Plain text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
  python: "Python",
  shell: "Shell",
};

export default function PasteViewPage({ params }: PageProps) {
  const [pasteId, setPasteId] = useState("");
  const [paste, setPaste] = useState<PasteRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setPasteId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!pasteId) return;

    async function loadPaste() {
      try {
        setError("");
        setIsLoading(true);

        const response = await fetch(`/api/paste/${pasteId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Paste not found.");
          setPaste(null);
          return;
        }

        setPaste(data);
      } catch {
        setError("Could not load paste.");
        setPaste(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadPaste();
  }, [pasteId]);

  async function copyContent() {
    if (!paste?.content) return;

    await navigator.clipboard.writeText(paste.content);
    setCopiedContent(true);

    setTimeout(() => {
      setCopiedContent(false);
    }, 1500);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);

    setTimeout(() => {
      setCopiedLink(false);
    }, 1500);
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatExpiry(value: string | null) {
    if (!value) return "Never";
    return formatDate(value);
  }

  const rawUrl = pasteId ? `/raw/${pasteId}` : "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
              <FileText className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Paste
            </h1>

            <p className="mt-3 text-slate-400">
              {pasteId ? `ID: ${pasteId}` : "Loading paste..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/paste"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              New paste
            </Link>

            {rawUrl ? (
              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
                Raw
              </a>
            ) : null}

            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {copiedLink ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedLink ? "Copied link" : "Copy link"}
            </button>

            <button
              onClick={copyContent}
              disabled={!paste}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copiedContent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedContent ? "Copied" : "Copy content"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading paste...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : paste ? (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Language: {languageLabels[paste.language] || paste.language}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(paste.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(paste.expiresAt)}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                <Eye className="h-4 w-4" />
                {paste.views} views
              </span>
            </div>

            <pre className="overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm leading-6 text-slate-100">
              <code>{paste.content}</code>
            </pre>
          </>
        ) : null}
      </div>
    </Container>
  );
}