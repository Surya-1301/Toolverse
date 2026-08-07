"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eraser,
  ExternalLink,
  FileText,
  FileUp,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { fetchApi, getApiBaseUrl } from "@/lib/apiBase";
import { encryptFileWithRandomKey } from "@/lib/clientEncryption";
import { getUploadKind, validateUploadForSharing } from "@/lib/uploadValidators";

const expiryOptions = [
  { label: "Never", value: "never" },
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

type UploadKind = "image" | "pdf" | "file";

type UploadResult = {
  id: string;
  expiresAt: string | null;
  size?: number;
  directUrl?: string;
  downloadUrl?: string;
};

export default function FileSharePage() {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState("never");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadKind>("file");

  const [ownerUrl, setOwnerUrl] = useState("");
  const [userUrl, setUserUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  function resetResultState() {
    setResult(null);
    setOwnerUrl("");
    setUserUrl("");
    setDirectUrl("");
    setCopied(false);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    resetResultState();

    if (!selectedFile) return;

    const validationError = validateUploadForSharing(selectedFile);

    if (validationError) {
      setFile(null);
      setUploadKind("file");
      setError(validationError);
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setUploadKind(getUploadKind(selectedFile));
  }

  async function uploadSelectedFile() {
    try {
      setError("");
      resetResultState();

      if (!file) {
        setError("Please choose an image, PDF, or file first.");
        return;
      }

      const validationError = validateUploadForSharing(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);

      const kind = getUploadKind(file);
      const endpoint =
        kind === "image" ? "/api/image/upload" : "/api/file/upload";

      const encrypted = await encryptFileWithRandomKey(file);

      if (
        !encrypted.iv ||
        !encrypted.metadataIv ||
        !encrypted.encryptedMetadata
      ) {
        setError("Could not create encryption metadata. Please try again.");
        return;
      }

      const formData = new FormData();

      formData.append("file", encrypted.encryptedFile);
      formData.append("expiry", expiry);

      /**
       * These original fields let the Worker validate the original file type
       * and size even though the uploaded bytes are now encrypted.
       */
      formData.append("originalName", file.name);
      formData.append("originalMimeType", file.type || "application/octet-stream");
      formData.append("originalSize", String(file.size));

      formData.append("encrypted", "true");
      formData.append("encryptionAlgorithm", encrypted.algorithm);
      formData.append("encryptionIv", encrypted.iv);
      formData.append("encryptionMetadataIv", encrypted.metadataIv);
      formData.append("encryptedMetadata", encrypted.encryptedMetadata);

      const response = await fetchApi(endpoint, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: (UploadResult & { error?: string }) | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            responseText ||
            `Could not upload file. Backend returned ${response.status}.`,
        );
        return;
      }

      if (!data?.id) {
        setError("Upload succeeded but no file ID was returned.");
        return;
      }

      const frontendOrigin = window.location.origin;
      const backendOrigin = getApiBaseUrl();
      const keyHash = `#key=${encodeURIComponent(encrypted.key)}`;

      const ownerPath =
        kind === "image" ? `/image?id=${data.id}` : `/file?id=${data.id}`;

      const userPath =
        kind === "image"
          ? `/share-image?id=${data.id}`
          : `/share-file?id=${data.id}`;

      const directPath =
        kind === "image"
          ? `/api/image/${data.id}/direct`
          : `/api/file/${data.id}/download`;

      setUploadKind(kind);
      setResult(data);

      setOwnerUrl(`${frontendOrigin}${ownerPath}${keyHash}`);
      setUserUrl(`${frontendOrigin}${userPath}${keyHash}`);
      setDirectUrl(`${backendOrigin}${directPath}`);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not upload file: ${caughtError.message}`
          : "Could not upload file. Check that the backend Worker URL is correct.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function copyUserUrl() {
    if (!userUrl) return;

    await navigator.clipboard.writeText(userUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setFile(null);
    setExpiry("never");
    setResult(null);
    setUploadKind("file");
    setOwnerUrl("");
    setUserUrl("");
    setDirectUrl("");
    setError("");
    setIsUploading(false);
    setCopied(false);
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
          Upload & Share
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Upload images, PDFs, and files with automatic AES-GCM encryption.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Upload image, PDF, or file
          </label>

          <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-8 w-8 text-violet-300" />

            <span className="font-medium text-white">
              Click to choose image, PDF, or file
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Allowed: images up to 25 MB, PDFs up to 50 MB, text/docs/ZIP up to
              100 MB.
            </span>

            <input
              type="file"
              accept="image/*,application/pdf,text/*,.txt,.md,.csv,.json,.xml,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.odt,.ods,.odp,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-start gap-3">
                {uploadKind === "image" ? (
                  <ImageIcon className="mt-0.5 h-5 w-5 text-violet-300" />
                ) : uploadKind === "pdf" ? (
                  <FileText className="mt-0.5 h-5 w-5 text-violet-300" />
                ) : (
                  <FileUp className="mt-0.5 h-5 w-5 text-violet-300" />
                )}

                <div className="min-w-0">
                  <p className="break-all text-sm font-medium text-white">
                    {file.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {formatFileSize(file.size)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Type: {file.type || "Unknown type"}
                  </p>
                </div>
              </div>
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

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
            <div className="flex gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                A random 256-bit key is created automatically. Only people with
                the full share link can decrypt the file.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={uploadSelectedFile}
              disabled={!file || isUploading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Encrypting & uploading..." : "Upload & share"}
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">
              {result ? "Share links ready" : "Upload output"}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-xs ${
                result
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-500/10 text-slate-400"
              }`}
            >
              {result ? "Encrypted" : "Waiting"}
            </span>
          </div>

          {result ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Owner link with key
                  </label>
                  <input
                    value={ownerUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    User share link with key
                  </label>
                  <input
                    value={userUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Encrypted direct URL
                  </label>
                  <input
                    value={directUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <a
                  href={ownerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open owner
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={userUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open user
                  <ExternalLink className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={copyUserUrl}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy user"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-center text-sm text-slate-500">
              Your encrypted share link appears here after upload.
            </div>
          )}
        </div>
      </div>

      <HowToUse
        title="How to use Upload & Share"
        subtitle=""
        steps={[
          {
            title: "Choose content",
            description: "Select an allowed image, PDF, text, document, or ZIP file.",
            icon: <Upload className="h-5 w-5" />,
          },
          {
            title: "Upload",
            description:
              "Your browser validates, encrypts, then uploads encrypted bytes.",
            icon: <LockKeyhole className="h-5 w-5" />,
          },
          {
            title: "Share full link",
            description:
              "Send the generated user link so recipients can decrypt it.",
            icon: <Copy className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}