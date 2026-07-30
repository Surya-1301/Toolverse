"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { formatFileSize } from "@/lib/formatFileSize";
import { Clock } from "lucide-react";
import { HowToUse } from "@/components/HowToUse";

const expiryOptions = [
  { label: "Never", value: "never" },
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

type UploadResult = {
  id: string;
  url: string;
  downloadUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloads: number;
  expiresAt: string | null;
};

type CopyType = "page" | "download" | "";

export default function FileSharePage() {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState("never");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setResult(null);
    setPageUrl("");
    setDownloadUrl("");
    setCopied("");

    if (!selectedFile) return;

    setFile(selectedFile);
  }

  async function uploadFile() {
    try {
      setError("");
      setResult(null);
      setPageUrl("");
      setDownloadUrl("");
      setCopied("");

      if (!file) {
        setError("Please choose a file first.");
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiry", expiry);

      const response = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not upload file.");
        return;
      }

      const fullPageUrl = `${window.location.origin}${data.url}`;
      const fullDownloadUrl = `${window.location.origin}${data.downloadUrl}`;

      setResult(data);
      setPageUrl(fullPageUrl);
      setDownloadUrl(fullDownloadUrl);
    } catch {
      setError("Could not upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function copyValue(type: CopyType) {
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

  function clearAll() {
    setFile(null);
    setExpiry("never");
    setResult(null);
    setPageUrl("");
    setDownloadUrl("");
    setError("");
    setIsUploading(false);
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
    File Share
  </h1>
  <p className="mt-4 text-base leading-7 text-slate-400">
    Upload files and create temporary shareable download links.
  </p>
</div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Upload file
          </label>

          <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-8 w-8 text-violet-300" />
            <span className="font-medium text-white">Click to choose file</span>
            <span className="mt-2 text-sm text-slate-500">
              Max 50 MB. Executable and script files are blocked.
            </span>

            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>

          {file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <p className="break-all text-sm font-medium text-white">
                {file.name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Size: {formatFileSize(file.size)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Type: {file.type || "Unknown"}
              </p>
            </div>
          ) : null}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
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

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={uploadFile}
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload file"}
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Share link</h2>
            {result ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                Uploaded
              </span>
            ) : (
              <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs text-slate-400">
                Waiting
              </span>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
            <FileUp className="h-10 w-10 text-violet-300" />

            <h3 className="mt-4 break-all font-semibold text-white">
              {file ? file.name : "No file selected"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {file
                ? `${formatFileSize(file.size)} · ${file.type || "Unknown type"}`
                : "Choose a file to generate a shareable download link."}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Always download files only from people or sources you trust.
            </p>
          </div>

          {result ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                File uploaded successfully
              </p>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    File page link
                  </label>
                  <input
                    value={pageUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Direct download link
                  </label>
                  <input
                    value={downloadUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => copyValue("page")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "download" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "download" ? "Copied" : "Copy download"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-violet-300 hover:text-violet-200"
                >
                  Open file page
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-violet-300 hover:text-violet-200"
                >
                  Download file
                  <Download className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 space-y-1">
                <p className="break-all text-xs text-emerald-100/80">
                  File: {result.originalName}
                </p>

                <p className="text-xs text-emerald-100/80">
                  Size: {formatFileSize(result.size)}
                </p>

                <p className="text-xs text-emerald-100/80">
                  Type: {result.mimeType || "Unknown"}
                </p>

                <p className="text-xs text-emerald-100/80">
                  Downloads: {result.downloads}
                </p>

                <p className="text-xs text-emerald-100/80">
                  Expires: {formatExpiry(result.expiresAt)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <HowToUse
  subtitle=""
  steps={[
    {
      title: "Choose file",
      description: "Select a file from your device up to the upload limit.",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      title: "Set expiry",
      description: "Choose when the shared file link should expire.",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Upload file",
      description: "Upload the file and generate shareable links.",
      icon: <FileUp className="h-5 w-5" />,
    },
    {
      title: "Copy link",
      description: "Copy the file page link or direct download link.",
      icon: <Copy className="h-5 w-5" />,
    },
    {
      title: "Open page",
      description: "Open the shared file page to view file details.",
      icon: <ExternalLink className="h-5 w-5" />,
    },
    {
      title: "Download",
      description: "Use the download button to save the shared file.",
      icon: <Download className="h-5 w-5" />,
    },
  ]}
/>
    </Container>
  );
}