"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  FileCode,
  File,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface UniversalPreviewProps {
  /** File or Blob object to preview */
  file?: File | Blob | null;
  /** Direct URL to file (blob:, data:, or http/https) */
  url?: string | null;
  /** File name (for display and type detection) */
  name?: string;
  /** Explicit MIME type if known */
  type?: string;
  /** Custom container class */
  className?: string;
  /** Minimum or fixed height (e.g. 260, "280px") */
  height?: number | string;
  /** Show file info header & controls (default: true) */
  showControls?: boolean;
  /** Optional callback when user clicks download button inside preview */
  onDownload?: () => void;
  /** Alt text for images */
  alt?: string;
  /** Fallback placeholder message when no file is selected */
  placeholder?: string;
}

type PreviewKind = "pdf" | "image" | "audio" | "video" | "text" | "fallback";

function detectKind(name?: string, type?: string, url?: string): PreviewKind {
  const cleanType = (type || "").toLowerCase();
  const cleanName = (name || "").toLowerCase();
  const cleanUrl = (url || "").toLowerCase();

  if (
    cleanType.includes("pdf") ||
    cleanName.endsWith(".pdf") ||
    cleanUrl.includes(".pdf")
  ) {
    return "pdf";
  }

  if (
    cleanType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg|bmp|ico|heic|avif)$/i.test(cleanName) ||
    cleanUrl.startsWith("data:image/")
  ) {
    return "image";
  }

  if (
    cleanType.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(cleanName)
  ) {
    return "audio";
  }

  if (
    cleanType.startsWith("video/") ||
    /\.(mp4|webm|mov|mkv|ogv)$/i.test(cleanName)
  ) {
    return "video";
  }

  if (
    cleanType.startsWith("text/") ||
    cleanType.includes("json") ||
    cleanType.includes("xml") ||
    cleanType.includes("javascript") ||
    /\.(txt|json|csv|tsv|xml|html|md|js|ts|tsx|jsx|css)$/i.test(cleanName)
  ) {
    return "text";
  }

  return "fallback";
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function UniversalPreview({
  file,
  url,
  name,
  type,
  className = "",
  height = 280,
  showControls = true,
  onDownload,
  alt,
  placeholder = "No file selected",
}: UniversalPreviewProps) {
  const resolvedName =
    name ||
    (file && "name" in file && typeof (file as any).name === "string"
      ? (file as any).name
      : "Preview");
  const resolvedType = type || (file?.type || "");
  const kind = detectKind(resolvedName, resolvedType, url || undefined);

  // Derive active URL
  const [activeUrl, setActiveUrl] = useState<string>("");
  const isCreatedUrlRef = useRef<boolean>(false);

  useEffect(() => {
    if (url) {
      setActiveUrl(url);
      isCreatedUrlRef.current = false;
      return;
    }

    if (file) {
      try {
        const objUrl = URL.createObjectURL(file);
        setActiveUrl(objUrl);
        isCreatedUrlRef.current = true;
        return () => {
          URL.revokeObjectURL(objUrl);
          isCreatedUrlRef.current = false;
        };
      } catch {
        setActiveUrl("");
      }
    } else {
      setActiveUrl("");
    }
  }, [file, url]);

  const heightStyle =
    typeof height === "number" ? `${height}px` : height || "280px";

  if (!file && !url) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center light:border-slate-900/10 light:bg-slate-50 ${className}`}
        style={{ minHeight: heightStyle }}
      >
        <ImageIcon className="mb-2 h-8 w-8 text-slate-500 light:text-slate-400" />
        <p className="text-sm text-slate-400 light:text-slate-600">{placeholder}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015] light:border-slate-900/10 light:bg-white ${className}`}
      style={{ minHeight: heightStyle }}
    >
      {kind === "pdf" && (
        <UniversalPdfCanvasPreview
          file={file}
          url={activeUrl}
          name={resolvedName}
          heightStyle={heightStyle}
          showControls={showControls}
          onDownload={onDownload}
        />
      )}

      {kind === "image" && (
        activeUrl ? (
          <UniversalImagePreview
            url={activeUrl}
            name={resolvedName}
            fileSize={file?.size}
            heightStyle={heightStyle}
            showControls={showControls}
            onDownload={onDownload}
            alt={alt}
          />
        ) : (
          <div
            className="flex w-full flex-1 items-center justify-center p-6 text-xs text-slate-500"
            style={{ minHeight: heightStyle }}
          >
            <span>Loading preview...</span>
          </div>
        )
      )}

      {kind === "video" && (
        <div
          className="flex w-full items-center justify-center bg-black p-2"
          style={{ minHeight: heightStyle }}
        >
          {activeUrl ? (
            <video
              src={activeUrl}
              controls
              playsInline
              className="max-h-[360px] max-w-full rounded-xl"
            />
          ) : (
            <div className="text-xs text-slate-500">Loading video...</div>
          )}
        </div>
      )}

      {kind === "audio" && (
        activeUrl ? (
          <UniversalAudioPreview
            url={activeUrl}
            name={resolvedName}
            fileSize={file?.size}
            heightStyle={heightStyle}
            onDownload={onDownload}
          />
        ) : (
          <div
            className="flex w-full flex-1 items-center justify-center p-6 text-xs text-slate-500"
            style={{ minHeight: heightStyle }}
          >
            <span>Loading audio...</span>
          </div>
        )
      )}

      {kind === "text" && (
        <UniversalTextPreview
          file={file}
          url={activeUrl}
          name={resolvedName}
          heightStyle={heightStyle}
          onDownload={onDownload}
        />
      )}

      {kind === "fallback" && (
        <UniversalFallbackPreview
          name={resolvedName}
          type={resolvedType}
          fileSize={file?.size}
          heightStyle={heightStyle}
          onDownload={onDownload}
        />
      )}
    </div>
  );
}

/**
 * PDF Canvas Preview: Renders PDF pages onto an HTML5 Canvas using pdfjs-dist.
 * Zero iframe usage, zero download listener triggers in Android WebView!
 */
function UniversalPdfCanvasPreview({
  file,
  url,
  name,
  heightStyle,
  showControls,
  onDownload,
}: {
  file?: File | Blob | null;
  url: string;
  name: string;
  heightStyle: string;
  showControls: boolean;
  onDownload?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(360);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Load PDF Document via ArrayBuffer
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        let buffer: ArrayBuffer;
        if (file) {
          buffer = await file.arrayBuffer();
        } else if (url) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          buffer = await res.arrayBuffer();
        } else {
          throw new Error("No PDF source provided");
        }

        if (cancelled) return;

        const task = pdfjsLib.getDocument({ data: buffer });
        const doc: any = await task.promise;
        if (cancelled) {
          try {
            doc?.destroy?.();
          } catch {}
          return;
        }

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF preview error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not render PDF preview in browser",
        );
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [file, url]);

  // Render Current Page on Canvas
  useEffect(() => {
    if (!pdfDoc || loading || error) return;
    let cancelled = false;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    pdfDoc
      .getPage(currentPage)
      .then((page: any) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const unscaled = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(containerWidth - 32, 180);
        const baseScale = availableWidth / unscaled.width;
        const finalScale = Math.max(0.2, baseScale * zoom);
        const dpr = Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          2,
        );

        const viewport = page.getViewport({ scale: finalScale * dpr });
        const displayWidth = Math.round(viewport.width / dpr);
        const displayHeight = Math.round(viewport.height / dpr);

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = renderTask;

        renderTask.promise.catch(() => {});
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.warn("PDF page render error:", err);
        }
      });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, currentPage, zoom, containerWidth, loading, error]);

  if (loading) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ minHeight: heightStyle }}
      >
        <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
        <p className="text-xs font-medium text-slate-300 light:text-slate-600">
          Rendering PDF preview…
        </p>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-2 p-6 text-center"
        style={{ minHeight: heightStyle }}
      >
        <AlertCircle className="h-8 w-8 text-amber-400" />
        <p className="text-xs font-semibold text-slate-200 light:text-slate-800">
          {name}
        </p>
        <p className="max-w-xs text-[11px] text-slate-400 light:text-slate-500">
          {error || "PDF preview unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-1 flex-col overflow-hidden bg-slate-950 light:bg-slate-900"
      style={{ minHeight: heightStyle }}
    >
      {/* Sticky PDF Toolbar */}
      {showControls && (
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 backdrop-blur">
          {/* Pagination */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-[11px] font-semibold text-slate-300">
              {currentPage} / {numPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom & Download */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 text-xs"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              title="Reset zoom"
              className="min-w-11 text-center text-[11px] font-medium text-slate-400 hover:text-white"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(2.5, Math.round((z + 0.2) * 10) / 10))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 text-xs"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="ml-1 inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
                title="Download this file"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 scroll-smooth">
        <div className="relative overflow-hidden rounded-lg bg-white shadow-xl">
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>
    </div>
  );
}

/**
 * Image Preview with Zoom and Fit
 */
function UniversalImagePreview({
  url,
  name,
  fileSize,
  heightStyle,
  showControls,
  onDownload,
  alt,
}: {
  url: string;
  name: string;
  fileSize?: number;
  heightStyle: string;
  showControls: boolean;
  onDownload?: () => void;
  alt?: string;
}) {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [zoom, setZoom] = useState(1.0);

  return (
    <div
      className="flex w-full flex-1 flex-col overflow-hidden bg-white/[0.015] light:bg-slate-50"
      style={{ minHeight: heightStyle }}
    >
      {showControls && (
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 light:border-slate-900/10 light:bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate text-[11px] font-semibold text-white light:text-slate-900">
              {name}
            </span>
            {dimensions && (
              <span className="text-[10px] text-slate-400 light:text-slate-500">
                ({dimensions.w} × {dimensions.h}
                {fileSize ? ` · ${formatBytes(fileSize)}` : ""})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.5, Math.round((z - 0.2) * 10) / 10))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 light:border-slate-900/10 light:bg-slate-100 light:hover:bg-slate-200"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              title="Reset zoom"
              className="min-w-10 text-center text-[11px] font-medium text-slate-400 light:text-slate-600"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(3.0, Math.round((z + 0.2) * 10) / 10))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 transition hover:bg-slate-700 light:border-slate-900/10 light:bg-slate-100 light:hover:bg-slate-200"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="ml-1 inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 items-center justify-center overflow-auto p-3">
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={alt || name}
            onLoad={(e) => {
              const img = e.currentTarget;
              setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            style={{
              transform: `scale(${zoom})`,
              transition: "transform 0.15s ease-out",
            }}
            className="max-h-[380px] max-w-full rounded-lg object-contain shadow-md"
          />
        ) : (
          <div className="text-xs text-slate-500">Loading preview...</div>
        )}
      </div>
    </div>
  );
}

/**
 * Audio Preview with Playback
 */
function UniversalAudioPreview({
  url,
  name,
  fileSize,
  heightStyle,
  onDownload,
}: {
  url: string;
  name: string;
  fileSize?: number;
  heightStyle: string;
  onDownload?: () => void;
}) {
  return (
    <div
      className="flex w-full flex-1 flex-col items-center justify-center gap-4 bg-white/[0.015] p-6 text-center light:bg-slate-50"
      style={{ minHeight: heightStyle }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
        <Music className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white light:text-slate-900">
          {name}
        </p>
        {fileSize && (
          <p className="text-xs text-slate-400 light:text-slate-600">
            {formatBytes(fileSize)}
          </p>
        )}
      </div>

      {url ? (
        <audio src={url} controls className="w-full max-w-sm rounded-xl" />
      ) : null}

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          <Download className="h-4 w-4" />
          <span>Download Audio</span>
        </button>
      )}
    </div>
  );
}

/**
 * Text / Code Preview
 */
function UniversalTextPreview({
  file,
  url,
  name,
  heightStyle,
  onDownload,
}: {
  file?: File | Blob | null;
  url: string;
  name: string;
  heightStyle: string;
  onDownload?: () => void;
}) {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadText() {
      try {
        let content = "";
        if (file) {
          content = await file.text();
        } else if (url) {
          const res = await fetch(url);
          content = await res.text();
        }
        if (!cancelled) {
          setText(content.slice(0, 10000)); // preview first 10k chars
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    loadText();
    return () => {
      cancelled = true;
    };
  }, [file, url]);

  return (
    <div
      className="flex w-full flex-1 flex-col overflow-hidden bg-white/[0.015] light:bg-slate-50"
      style={{ minHeight: heightStyle }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-300">
        <span className="truncate font-mono">{name}</span>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-6 items-center gap-1 rounded bg-sky-500 px-2 text-[10px] font-semibold text-white hover:bg-sky-500"
          >
            <Download className="h-3 w-3" />
            <span>Save</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center p-6 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading text…
          </div>
        ) : (
          <pre className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap break-all">
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * Fallback File Card Preview
 */
function UniversalFallbackPreview({
  name,
  type,
  fileSize,
  heightStyle,
  onDownload,
}: {
  name: string;
  type?: string;
  fileSize?: number;
  heightStyle: string;
  onDownload?: () => void;
}) {
  return (
    <div
      className="flex w-full flex-1 flex-col items-center justify-center gap-3 bg-white/[0.015] p-6 text-center light:bg-slate-50"
      style={{ minHeight: heightStyle }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 light:bg-sky-100 light:text-sky-500">
        <File className="h-7 w-7" />
      </div>
      <div>
        <p className="break-all text-sm font-semibold text-white light:text-slate-900">
          {name}
        </p>
        <p className="mt-1 text-xs text-slate-400 light:text-slate-600">
          {type || "Document"} {fileSize ? `· ${formatBytes(fileSize)}` : ""}
        </p>
      </div>

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          <Download className="h-4 w-4" />
          <span>Download File</span>
        </button>
      )}
    </div>
  );
}
