"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";

type FileRecord = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  downloads: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CopyType = "page" | "download" | "";

export default function SharedFilePage({ params }: PageProps) {
  const [fileId, setFileId] = useState("");
  const [file, setFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setFileId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!fileId) return;

    loadFileMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  async function loadFileMetadata(refreshOnly = false) {
    try {
      setError("");

      if (refreshOnly) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/file/meta/${fileId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "File not found.");
        setFile(null);
        return;
      }

      setFile(data);
    } catch {
      setError("Could not load file.");
      setFile(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function copyValue(type: CopyType) {
    const pageUrl = window.location.href;
    const downloadUrl = `${window.location.origin}/api/file/${fileId}`;

    let value = "";

    if (type === "page") {
      value = pageUrl;
    }

    if (type === "download") {
      value = downloadUrl;
    }

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
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

  const downloadUrl = fileId ? `/api/file/${fileId}` : "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
              <FileUp className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Shared File
            </h1>

            <p className="mt-3 text-slate-400">
              {fileId ? `ID: ${fileId}` : "Loading file..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/file-share"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Upload new
            </Link>

            {downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : null}

            <button
              onClick={() => copyValue("page")}
              disabled={!file}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "page" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "page" ? "Copied" : "Copy page"}
            </button>

            <button
              onClick={() => copyValue("download")}
              disabled={!file}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "download" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "download" ? "Copied" : "Copy download"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading file...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : file ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
                  <FileUp className="h-8 w-8" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="break-all text-2xl font-bold text-white">
                    {file.originalName}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {file.mimeType || "Unknown type"} ·{" "}
                    {formatFileSize(file.size)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                  Always download files only from people or sources you trust.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-slate-300">
                      Created: {formatDate(file.createdAt)}
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-slate-300">
                      Expires: {formatExpiry(file.expiresAt)}
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-slate-300">
                      Downloads: {file.downloads}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                    >
                      <Download className="h-4 w-4" />
                      Download file
                    </a>

                    <button
                      onClick={() => loadFileMetadata(true)}
                      disabled={isRefreshing}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BarChart3 className="h-4 w-4" />
                      )}
                      {isRefreshing ? "Refreshing..." : "Refresh stats"}
                    </button>

                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open direct
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}