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
import { apiUrl, getApiBaseUrl } from "@/lib/apiBase";

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
<<<<<<< HEAD
  url?: string;
  expiresAt: string | null;
=======
  url: string;
  expiresAt: string | null;

>>>>>>> dd890f8 (Fix frontend tool API integrations)
  downloadUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  downloads?: number;
<<<<<<< HEAD
=======

>>>>>>> dd890f8 (Fix frontend tool API integrations)
  directUrl?: string;
  width?: number | null;
  height?: number | null;
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

<<<<<<< HEAD
  function resetResultState() {
    setResult(null);
    setOwnerUrl("");
    setUserUrl("");
    setDirectUrl("");
    setCopied(false);
=======
  function getResultTitle() {
    if (!result) return "Share link";
    if (uploadKind === "image") return "Image shared";
    if (uploadKind === "pdf") return "PDF shared";
    return "File shared";
  }

  function getSelectedIcon() {
    if (uploadKind === "image") {
      return <ImageIcon className="h-10 w-10 text-violet-300" />;
    }

    if (uploadKind === "pdf") {
      return <FileText className="h-10 w-10 text-violet-300" />;
    }

    return <FileUp className="h-10 w-10 text-violet-300" />;
>>>>>>> dd890f8 (Fix frontend tool API integrations)
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
<<<<<<< HEAD
    resetResultState();
=======
    setResult(null);
    setOwnerUrl("");
    setUserUrl("");
    setDirectUrl("");
    setCopied(false);
>>>>>>> dd890f8 (Fix frontend tool API integrations)

    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadKind(getUploadKind(selectedFile));
  }

  async function uploadSelectedFile() {
    try {
      setError("");
<<<<<<< HEAD
      resetResultState();
=======
      setResult(null);
      setOwnerUrl("");
      setUserUrl("");
      setDirectUrl("");
      setCopied(false);
>>>>>>> dd890f8 (Fix frontend tool API integrations)

      if (!file) {
        setError("Please choose an image, PDF, or file first.");
        return;
      }

      setIsUploading(true);

      const kind = getUploadKind(file);
      const endpoint =
        kind === "image" ? "/api/image/upload" : "/api/file/upload";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiry", expiry);

      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        body: formData,
      });

<<<<<<< HEAD
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            `Could not upload file. Backend returned ${response.status}.`,
        );
        return;
      }

      if (!data?.id) {
        setError("Upload succeeded but no file ID was returned.");
=======
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not upload file.");
>>>>>>> dd890f8 (Fix frontend tool API integrations)
        return;
      }

      const frontendOrigin = window.location.origin;
      const backendOrigin = getApiBaseUrl();

      const ownerPath =
<<<<<<< HEAD
        kind === "image" ? `/image?id=${data.id}` : `/file?id=${data.id}`;

      const userPath =
        kind === "image"
          ? `/share-image?id=${data.id}`
          : `/share-file?id=${data.id}`;
=======
  kind === "image" ? `/image?id=${data.id}` : `/file?id=${data.id}`;

const userPath =
  kind === "image"
    ? `/share-image?id=${data.id}`
    : `/share-file?id=${data.id}`;
>>>>>>> dd890f8 (Fix frontend tool API integrations)

      const directPath =
        kind === "image"
          ? `/api/image/${data.id}/direct`
          : `/api/file/${data.id}/download`;

      setUploadKind(kind);
      setResult(data);

<<<<<<< HEAD
      setOwnerUrl(`${frontendOrigin}${ownerPath}`);
      setUserUrl(`${frontendOrigin}${userPath}`);
      setDirectUrl(`${backendOrigin}${directPath}`);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        "Could not upload file. Check that the backend Worker URL is correct.",
      );
=======
      // These stay on pages.dev so users mostly see your frontend domain.
      setOwnerUrl(`${frontendOrigin}${ownerPath}`);
      setUserUrl(`${frontendOrigin}${userPath}`);

      // Direct file/image serving goes to the backend Worker.
      setDirectUrl(`${backendOrigin}${directPath}`);
    } catch {
      setError("Could not upload file. Please try again.");
>>>>>>> dd890f8 (Fix frontend tool API integrations)
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

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
<<<<<<< HEAD
              type="button"
=======
>>>>>>> dd890f8 (Fix frontend tool API integrations)
              onClick={uploadSelectedFile}
              disabled={!file || isUploading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload & share"}
            </button>

            <button
<<<<<<< HEAD
              type="button"
=======
>>>>>>> dd890f8 (Fix frontend tool API integrations)
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
<<<<<<< HEAD
            <h2 className="font-semibold">
              {result ? "Share links ready" : "Share link"}
            </h2>
=======
            <h2 className="font-semibold">{getResultTitle()}</h2>
>>>>>>> dd890f8 (Fix frontend tool API integrations)

            {result ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                Ready
              </span>
            ) : (
              <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs text-slate-400">
                Waiting
              </span>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
<<<<<<< HEAD
            {uploadKind === "image" ? (
              <ImageIcon className="h-10 w-10 text-violet-300" />
            ) : uploadKind === "pdf" ? (
              <FileText className="h-10 w-10 text-violet-300" />
            ) : (
              <FileUp className="h-10 w-10 text-violet-300" />
            )}
=======
            {getSelectedIcon()}
>>>>>>> dd890f8 (Fix frontend tool API integrations)

            <h3 className="mt-4 break-all font-semibold text-white">
              {file ? file.name : "No file selected"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {file
                ? `${selectedKindLabel} · ${formatFileSize(file.size)} · ${
                    file.type || "Unknown type"
                  }`
                : "Choose an image, PDF, or file to generate shareable links."}
            </p>

<<<<<<< HEAD
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Owner link and user link stay on your Pages domain. Direct
              file/image delivery uses the backend Worker.
            </p>

=======
>>>>>>> dd890f8 (Fix frontend tool API integrations)
            {result ? (
              <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">ID</p>
                  <p className="mt-1 break-all text-slate-200">{result.id}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Type</p>
                  <p className="mt-1 text-slate-200">{selectedKindLabel}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Size</p>
                  <p className="mt-1 text-slate-200">
                    {file
                      ? formatFileSize(file.size)
                      : typeof result.size === "number"
                        ? formatFileSize(result.size)
                        : "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Expires</p>
                  <p className="mt-1 text-slate-200">
                    {formatExpiry(result.expiresAt)}
                  </p>
                </div>
<<<<<<< HEAD
              </div>
            ) : null}
=======

                {uploadKind === "image" && result.width && result.height ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
                    <p className="text-slate-500">Dimensions</p>
                    <p className="mt-1 text-slate-200">
                      {result.width} × {result.height}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Owner link and user link stay on your Pages domain. Direct
              file/image delivery uses the backend Worker.
            </p>
>>>>>>> dd890f8 (Fix frontend tool API integrations)
          </div>

          {result ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Owner link
                  </label>
                  <input
                    value={ownerUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    User share link
                  </label>
                  <input
                    value={userUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Direct file link
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
<<<<<<< HEAD
                  type="button"
=======
>>>>>>> dd890f8 (Fix frontend tool API integrations)
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
          ) : null}
        </div>
      </div>

      <HowToUse
        title="How to use Upload & Share"
        subtitle=""
        steps={[
          {
            title: "Choose a file",
            description: "Upload an image, PDF, or any supported file.",
            icon: <Upload className="h-5 w-5" />,
          },
          {
            title: "Select expiry",
            description: "Choose how long the shared page should stay active.",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            title: "Upload",
            description: "Create owner and user share links instantly.",
            icon: <FileUp className="h-5 w-5" />,
          },
          {
            title: "Share user link",
            description: "Send the clean user link to anyone who needs access.",
            icon: <Copy className="h-5 w-5" />,
          },
          {
            title: "Open owner page",
            description: "Use the owner page to view details and stats.",
            icon: <ExternalLink className="h-5 w-5" />,
          },
          {
            title: "Download anytime",
            description: "Users can open or download shared content.",
            icon: <FileText className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> dd890f8 (Fix frontend tool API integrations)
