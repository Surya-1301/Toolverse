"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";
import { fetchApi, getApiBaseUrl } from "@/lib/apiBase";

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

type CopyType = "page" | "download" | "";

export default function FilePage() {
  return (
    <Suspense fallback={<FileLoading />}>
      <FileContent />
    </Suspense>
  );
}

function FileLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading file...
        </div>
      </div>
    </Container>
  );
}

function FileContent() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("id") || "";

  const [file, setFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    document.title = "Toolverse - Your All-in-One Utility Hub.";
  }, []);

  useEffect(() => {
    async function loadFile() {
      if (!fileId) {
        setError("Missing file ID.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const response = await fetchApi(`/api/file/${fileId}/meta`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: (FileRecord & { error?: string }) | null = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              responseText ||
              `Could not load file. Backend returned ${response.status}.`,
          );
          setFile(null);
          return;
        }

        if (!data) {
          setError("File not found.");
          setFile(null);
          return;
        }

        setFile(data);
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not load file: ${caughtError.message}`
            : "Could not load file.",
        );
        setFile(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
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

    const value = type === "page" ? getPageUrl() : getDownloadUrl();

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
    link.href = getDownloadUrl();
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
          <FileLoading />
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
                  href={getDownloadUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Direct
                </a>

                <button
                  type="button"
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
                  type="button"
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
                type="button"
                onClick={downloadFile}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <Download className="h-4 w-4" />
                {isPdf ? "Download PDF" : "Download file"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}