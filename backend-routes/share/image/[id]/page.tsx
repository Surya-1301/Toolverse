"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, getApiBaseUrl } from "@/lib/apiBase";

type ImageRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  directUrl?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CopyType = "markdown" | "html" | "";

export default function SharedImagePage({ params }: PageProps) {
  const [imageId, setImageId] = useState("");
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    document.title = "ToolverseX - Your All-in-One Utility Hub.";
  }, []);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setImageId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!imageId) return;

    async function loadImage() {
      try {
        setIsLoading(true);
        setError("");
        setImageFailed(false);
        setCopied("");

        const response = await fetch(apiUrl(`/api/image/${imageId}/meta`), {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Image not found.");
          setImage(null);
          return;
        }

        setImage(data);
      } catch {
        setError("Could not load image.");
        setImage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadImage();
  }, [imageId]);

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

  function getDirectImageUrl() {
    if (!imageId) return "";
    return `${getApiBaseUrl()}/api/image/${imageId}/direct`;
  }

  async function copyValue(type: CopyType) {
    if (!image) return;

    const imageUrl = getDirectImageUrl();

    let value = "";

    if (type === "markdown") {
      value = `![${image.originalName}](${imageUrl})`;
    }

    if (type === "html") {
      value = `<img src="${imageUrl}" alt="${image.originalName}" />`;
    }

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function downloadImage() {
    if (!image) return;

    const link = document.createElement("a");
    link.href = apiUrl(`/api/image/${image.id}/direct`);
    link.download = image.originalName || `${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const imageSrc = imageId ? apiUrl(`/api/image/${imageId}/direct`) : "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading image...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : image ? (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  Shared Image
                </h1>

                <p className="mt-3 break-all text-slate-400">
                  {image.originalName}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 sm:justify-end">
                <button
                  onClick={() => copyValue("markdown")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "markdown" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "markdown" ? "Copied" : "Copy Markdown"}
                </button>

                <button
                  onClick={() => copyValue("html")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied === "html" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "html" ? "Copied" : "Copy HTML"}
                </button>

                <button
                  onClick={downloadImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Download className="h-4 w-4" />
                  Download image
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {image.mimeType}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {formatFileSize(image.size)}
              </span>

              {image.width && image.height ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {image.width} × {image.height}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(image.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(image.expiresAt)}
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
              {imageSrc && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={image.originalName}
                  onError={() => setImageFailed(true)}
                  className="mx-auto max-h-[75vh] max-w-full object-contain"
                />
              ) : (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Could not display this image. Check that{" "}
                  <span className="font-mono">/api/image/{imageId}/direct</span>{" "}
                  exists and returns the image file.
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}
