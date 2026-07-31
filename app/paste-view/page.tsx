"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { apiUrl } from "@/lib/apiBase";

type PasteRecord = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

type CopyType = "content" | "page" | "raw" | "";

export default function PasteViewPage() {
  return (
    <Suspense fallback={<PasteViewLoading />}>
      <PasteViewContent />
    </Suspense>
  );
}

function PasteViewLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading paste...
        </div>
      </div>
    </Container>
  );
}

function PasteViewContent() {
  const searchParams = useSearchParams();
  const pasteId = searchParams.get("id") || "";

  const [paste, setPaste] = useState<PasteRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    async function loadPaste() {
      if (!pasteId) {
        setError("Missing paste ID.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const response = await fetch(apiUrl(`/api/paste/${pasteId}`), {
          cache: "no-store",
        });

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

  function getPageUrl() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  function getRawUrl() {
    if (!pasteId) return "";
    return apiUrl(`/raw/${pasteId}`);
  }

  async function copyValue(type: CopyType) {
    if (!paste) return;

    let value = "";

    if (type === "content") value = paste.content;
    if (type === "page") value = getPageUrl();
    if (type === "raw") value = getRawUrl();

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <PasteViewLoading />
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : paste ? (
          <>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Paste
                </h1>

                <p className="mt-3 break-all text-sm text-slate-400">
                  ID: {paste.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <a
                  href="/paste"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  New paste
                </a>

                <a
                  href={getRawUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Raw
                </a>

                <button
                  onClick={() => copyValue("content")}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  {copied === "content" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "content" ? "Copied" : "Copy content"}
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {paste.language}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(paste.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(paste.expiresAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {paste.views} views
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                <FileText className="h-4 w-4" />
                Content
              </div>

              <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-black/30 p-4 font-mono text-sm leading-6 text-slate-100">
                {paste.content}
              </pre>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}