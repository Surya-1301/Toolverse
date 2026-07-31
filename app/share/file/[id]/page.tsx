"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";

type FileRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  downloads: number;
  downloadUrl: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function SharedFilePage({ params }: PageProps) {
  const [fileId, setFileId] = useState("");
  const [file, setFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!fileId) return;

    async function loadFile() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/file/${fileId}/meta`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "File not found.");
          setFile(null);
          return;
        }

        setFile(data);
      } catch {
        setError("Could not load file.");
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

  const isPdf = file?.mimeType === "application/pdf";
  const downloadPath = fileId ? `/api/file/${fileId}/download` : "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
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
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {isPdf ? "Shared PDF" : "Shared File"}
            </h1>

            <p className="mt-3 break-all text-slate-400">
              {file.originalName}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Type</p>
                <p className="mt-1 break-all text-sm text-slate-200">
                  {file.mimeType}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Size</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Created</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(file.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Expires</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatExpiry(file.expiresAt)}
                </p>
              </div>
            </div>

            <a
              href={downloadPath}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Download className="h-4 w-4" />
              {isPdf ? "Open PDF" : "Download file"}
            </a>
          </div>
        ) : null}
      </div>
    </Container>
  );
}