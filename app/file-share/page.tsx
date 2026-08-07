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
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, fetchApi, getApiBaseUrl } from "@/lib/apiBase";
import { encryptFileForUpload } from "@/lib/clientEncryption";

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
  url?: string;
  expiresAt: string | null;
  downloadUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  downloads?: number;
  directUrl?: string;
  width?: number | null;
  height?: number | null;
};

export default function FileSharePage() {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState("never");
  const [encryptUpload, setEncryptUpload] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadKind>("file");

  const [ownerUrl, setOwnerUrl] = useState("");
  const [userUrl, setUserUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  function getUploadKind(selectedFile: File): UploadKind {
    if (selectedFile.type.startsWith("image/")) return "image";
    if (selectedFile.type === "application/pdf") return "pdf";
    return "file";
  }

  function getSelectedKindLabel() {
    if (!file) return "File";
    if (uploadKind === "image") return "Image";
    if (uploadKind === "pdf") return "PDF";
    return "File";
  }

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

      if (encryptUpload) {
        if (password.length < 8) {
          setError("Use at least 8 characters for the encryption password.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Encryption passwords do not match.");
          return;
        }
      }

      setIsUploading(true);

      const kind = encryptUpload ? "file" : getUploadKind(file);
      const endpoint =
        kind === "image" ? "/api/image/upload" : "/api/file/upload";

      const formData = new FormData();
      let uploadFile = file;

      if (encryptUpload) {
        const encrypted = await encryptFileForUpload(file, password);
        uploadFile = encrypted.encryptedFile;
        formData.append("encrypted", "true");
        formData.append("encryptionAlgorithm", encrypted.algorithm);
        formData.append("encryptionKdf", encrypted.kdf);
        formData.append("encryptionIterations", String(encrypted.iterations));
        formData.append("encryptionSalt", encrypted.salt);
        formData.append("encryptionIv", encrypted.iv);
        formData.append("encryptionMetadataIv", encrypted.metadataIv);
        formData.append("encryptedMetadata", encrypted.encryptedMetadata);
      }

      formData.append("file", uploadFile);
      formData.append("expiry", expiry);

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

      setOwnerUrl(`${frontendOrigin}${ownerPath}`);
      setUserUrl(`${frontendOrigin}${userPath}`);
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
    setEncryptUpload(false);
    setPassword("");
    setConfirmPassword("");
  }

  function formatExpiry(value: string | null) {
    if (!value) return "Never";

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  const selectedKindLabel = getSelectedKindLabel();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Upload & Share
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Upload images, PDFs, and files to create shareable pages.
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
              Images get image pages. PDFs and files get file pages.
            </span>

            <input
              type="file"
              accept="image/*,application/pdf,*/*"
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
                    {selectedKindLabel} · {formatFileSize(file.size)}
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

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(event) => setEncryptUpload(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/10 bg-slate-900"
              />
              <span>
                <span className="block font-medium text-white">
                  Encrypt before upload
                </span>
                <span className="mt-1 block text-slate-500">
                  AES-GCM runs in this browser. Toolverse stores only encrypted
                  bytes in R2. If the password is lost, the file cannot be
                  recovered.
                </span>
              </span>
            </label>

            {encryptUpload ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Encryption password"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                />
              </div>
            ) : null}
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
              {isUploading
                ? encryptUpload
                  ? "Encrypting..."
                  : "Uploading..."
                : "Upload & share"}
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

        {/* Keep your existing share-link/result UI below this point.
            The important encryption changes are above:
            - encryptUpload state
            - password fields
            - encryptFileForUpload()
            - encrypted FormData fields
            - encrypted uploads forced to /api/file/upload
        */}
      </div>
    </Container>
  );
}