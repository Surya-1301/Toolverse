"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Code2,
  Copy,
  Eraser,
  ExternalLink,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { fetchApi, getApiBaseUrl } from "@/lib/apiBase";

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
  directUrl: string;
  expiresAt: string | null;
  width: number | null;
  height: number | null;
};

type CopyType = "page" | "direct" | "markdown" | "html" | "";

export default function ImageHostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [expiry, setExpiry] = useState("never");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setResult(null);
    setPageUrl("");
    setDirectUrl("");
    setCopied("");

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setFile(null);
      setPreview("");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  async function uploadImage() {
    try {
      setError("");
      setResult(null);
      setPageUrl("");
      setDirectUrl("");
      setCopied("");

      if (!file) {
        setError("Please choose an image first.");
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiry", expiry);

      const response = await fetchApi("/api/image/upload", {
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
            `Could not upload image. Backend returned ${response.status}.`,
        );
        return;
      }

      if (!data?.id) {
        setError("Upload succeeded but no image ID was returned.");
        return;
      }

      const frontendOrigin = window.location.origin;
      const backendOrigin = getApiBaseUrl();

      const fullPageUrl = `${frontendOrigin}/image?id=${data.id}`;
      const fullDirectUrl = `${backendOrigin}/api/image/${data.id}/direct`;

      setResult(data);
      setPageUrl(fullPageUrl);
      setDirectUrl(fullDirectUrl);
    } catch (caughtError) {
      console.error(caughtError);

      setError(
        caughtError instanceof Error
          ? `Could not upload image: ${caughtError.message}`
          : "Could not upload image. Please check your backend Worker URL.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function copyValue(type: CopyType) {
    let value = "";

    if (type === "page") {
      value = pageUrl;
    }

    if (type === "direct") {
      value = directUrl;
    }

    if (type === "markdown") {
      value = `![${file?.name || "Hosted image"}](${directUrl})`;
    }

    if (type === "html") {
      const width = result?.width ? ` width="${result.width}"` : "";
      const height = result?.height ? ` height="${result.height}"` : "";

      value = `<img src="${directUrl}" alt="${
        file?.name || "Hosted image"
      }"${width}${height} />`;
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
    setPreview("");
    setExpiry("never");
    setResult(null);
    setPageUrl("");
    setDirectUrl("");
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

  const dimensions =
    result?.width && result?.height ? `${result.width} × ${result.height}` : "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Host
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Upload images and get clean shareable links instantly.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Upload image
          </label>

          <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-8 w-8 text-violet-300" />

            <span className="font-medium text-white">
              Click to choose image
            </span>

            <span className="mt-2 text-sm text-slate-500">
              JPG, PNG, WebP, GIF up to 25 MB
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
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
              type="button"
              onClick={uploadImage}
              disabled={!file || isUploading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload image"}
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
            <h2 className="font-semibold">Preview</h2>

            {result ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                Uploaded
              </span>
            ) : (
              <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs text-slate-400">
                Local
              </span>
            )}
          </div>

          <div className="mt-5 flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Image preview"
                className="max-h-[320px] w-full object-contain"
              />
            ) : (
              <div className="text-center text-sm text-slate-500">
                <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                Image preview appears here
              </div>
            )}
          </div>

          {result ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                Image uploaded successfully
              </p>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Page link
                  </label>
                  <input
                    value={pageUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Direct image link
                  </label>
                  <input
                    value={directUrl}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => copyValue("page")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
                  onClick={() => copyValue("direct")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "direct" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "direct" ? "Copied" : "Copy direct"}
                </button>

                <button
                  type="button"
                  onClick={() => copyValue("markdown")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "markdown" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "markdown" ? "Copied" : "Markdown"}
                </button>

                <button
                  type="button"
                  onClick={() => copyValue("html")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "html" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "html" ? "Copied" : "HTML embed"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-violet-300 hover:text-violet-200"
                >
                  Open image page
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={directUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-violet-300 hover:text-violet-200"
                >
                  Open direct image
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs text-emerald-100/80">
                  Expires: {formatExpiry(result.expiresAt)}
                </p>

                {dimensions ? (
                  <p className="text-xs text-emerald-100/80">
                    Dimensions: {dimensions}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <HowToUse
        title="How to use Image Host"
        subtitle=""
        steps={[
          {
            title: "Choose image",
            description:
              "Select a JPG, PNG, WebP, or GIF image from your device.",
            icon: <Upload className="h-5 w-5" />,
          },
          {
            title: "Set expiry",
            description: "Choose when the hosted image should expire.",
            icon: <Clock className="h-5 w-5" />,
          },
          {
            title: "Upload image",
            description: "Upload the image and generate shareable links.",
            icon: <ImageIcon className="h-5 w-5" />,
          },
          {
            title: "Copy links",
            description: "Copy the image page link or direct image link.",
            icon: <Copy className="h-5 w-5" />,
          },
          {
            title: "Use embeds",
            description: "Copy Markdown or HTML embed code for websites.",
            icon: <Code2 className="h-5 w-5" />,
          },
          {
            title: "Open preview",
            description: "Open the hosted image page or direct image URL.",
            icon: <ExternalLink className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}