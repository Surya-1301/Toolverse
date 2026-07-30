"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  Eye,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";

type ImageRecord = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CopyType = "page" | "direct" | "markdown" | "html" | "";

export default function HostedImagePage({ params }: PageProps) {
  const [imageId, setImageId] = useState("");
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setImageId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!imageId) return;
    loadImageMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  async function loadImageMetadata(refreshOnly = false) {
    try {
      setError("");

      if (refreshOnly) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/image/meta/${imageId}`);
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
      setIsRefreshing(false);
    }
  }

  async function copyValue(type: CopyType) {
    const pageUrl = window.location.href;
    const directUrl = `${window.location.origin}/api/image/${imageId}`;

    let value = "";

    if (type === "page") value = pageUrl;
    if (type === "direct") value = directUrl;
    if (type === "markdown") {
      value = `![${image?.originalName || "Hosted image"}](${directUrl})`;
    }
    if (type === "html") {
      const width = image?.width ? ` width="${image.width}"` : "";
      const height = image?.height ? ` height="${image.height}"` : "";

      value = `<img src="${directUrl}" alt="${
        image?.originalName || "Hosted image"
      }"${width}${height} />`;
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

  const directUrl = imageId ? `/api/image/${imageId}` : "";
  const dimensions =
    image?.width && image?.height ? `${image.width} × ${image.height}` : null;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
              <ImageIcon className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Hosted Image
            </h1>

            <p className="mt-3 text-slate-400">
              {imageId ? `ID: ${imageId}` : "Loading image..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/image-host"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Upload new
            </Link>

            {directUrl ? (
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
                Direct
              </a>
            ) : null}

            <button
              onClick={() => copyValue("page")}
              disabled={!image}
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
              onClick={() => copyValue("direct")}
              disabled={!image}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "direct" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "direct" ? "Copied" : "Copy direct"}
            </button>
          </div>
        </div>

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
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {image.mimeType}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {formatFileSize(image.size)}
              </span>

              {dimensions ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {dimensions}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(image.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(image.expiresAt)}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                <Eye className="h-4 w-4" />
                {image.views} views
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={directUrl}
                alt={image.originalName}
                className="mx-auto max-h-[720px] w-full object-contain"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => copyValue("markdown")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copied === "html" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "html" ? "Copied" : "Copy HTML"}
              </button>

              <button
                onClick={() => loadImageMetadata(true)}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh stats"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}