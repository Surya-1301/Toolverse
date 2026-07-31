"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, getApiBaseUrl } from "@/lib/apiBase";

type FileRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  downloads: number;
  downloadUrl?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CopyType = "page" | "download" | "";

export default function HostedFilePage({ params }: PageProps) {
  const [fileId, setFileId] = useState("");
  const [file, setFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    document.title = "ToolverseX - Your All-in-One Utility Hub.";
  }, []);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setFileId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  async function loadFile() {
    if (!fileId) return;

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch(apiUrl(`/api/file/${fileId}/meta`), {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "File not found.");
        setFile(null);
        return;
      }

      setFile(data);
      document.title = "ToolverseX - Your All-in-One Utility Hub.";
    } catch {
      setError("Could not load file.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

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

  function getDownloadPath() {
    if (!fileId) return "";
    return apiUrl(`/api/file/${fileId}/download`);
  }

  function getDownloadUrl() {
    if (!fileId) return "";
    return `${getApiBaseUrl()}/api/file/${fileId}/download`;
  }

  function getPageUrl() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  async function copyValue(type: CopyType) {
    if (!file) return;

    let value = "";

    if (type === "page") value = getPageUrl();
    if (type === "download") value = getDownloadUrl();

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function downloadFile() {
    if (!file) return;

    const link = document.createElement("a");
    link.href = getDownloadPath();
    link.download = file.originalName || file.id;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isPdf = file?.mimeType === "application/pdf";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
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
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {isPdf ? "Hosted PDF" : "Hosted File"}
                </h1>

                <p className="mt-3 break-all text-sm text-slate-400">
                  ID: {file.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/file-share"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Upload new
                </Link>

                <a
                  href={getDownloadPath()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Direct
                </a>

                <button
                  onClick={() => copyValue("page")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "page" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "page" ? "Copied" : "Copy page"}
                </button>

                <button
                  onClick={downloadFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Download className="h-4 w-4" />
                  {isPdf ? "Download PDF" : "Download file"}
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {file.mimeType}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {formatFileSize(file.size)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(file.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(file.expiresAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {file.downloads} downloads
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <h2 className="break-all text-xl font-semibold text-white">
                {file.originalName}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {isPdf
                  ? "This PDF is ready to open or download."
                  : "This file is ready to download."}
              </p>

              <button
                onClick={downloadFile}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <Download className="h-4 w-4" />
                {isPdf ? "Open / Download PDF" : "Download file"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button
                onClick={() => copyValue("download")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copied === "download" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "download" ? "Copied" : "Copy Download"}
              </button>

              <button
                onClick={() => copyValue("page")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copied === "page" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "page" ? "Copied" : "Copy Page"}
              </button>

              <button
                onClick={loadFile}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4" />
                Refresh stats
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}
