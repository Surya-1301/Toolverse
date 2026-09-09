"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  Focus,
  ImageUp,
  Loader2,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import UploadZone from "@/components/UploadZone";

type Mode = "full" | "region";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/image-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Upload an image",
    description: "Choose a photo from your device.",
    icon: <ImageUp className="h-5 w-5" />,
  },
  {
    title: "Pick a mode",
    description: "Blur the whole image or only a selected region.",
    icon: <Focus className="h-5 w-5" />,
  },
  {
    title: "Set the strength",
    description: "Adjust the blur radius from subtle to heavy.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Move the region",
    description: "Drag to reposition a blur box over the area to hide.",
    icon: <Square className="h-5 w-5" />,
  },
  {
    title: "Preview",
    description: "Check the result before downloading.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Download PNG",
    description: "Save the blurred image as a PNG file.",
    icon: <Download className="h-5 w-5" />,
  },
];


export default function BlurImagePage() {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [mode, setMode] = useState<Mode>("full");
  const [radius, setRadius] = useState(12);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [region, setRegion] = useState({ x: 25, y: 25, w: 50, h: 50 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{
    handle: string;
    startMouseX: number;
    startMouseY: number;
    startRegion: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  function loadImage(file: File) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSource(img);
      setSourceUrl(objectUrl);
      setImageName(file.name.replace(/\.[^.]+$/, "") || "image");
      setPreviewUrl("");
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }

  function process() {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsProcessing(true);

    setTimeout(() => {
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the full image blurred.
      ctx.filter = `blur(${radius}px)`;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      if (mode === "region") {
        // Draw a sharp copy of just the region back on top.
        const regionX = (region.x / 100) * canvas.width;
        const regionY = (region.y / 100) * canvas.height;
        const regionW = (region.w / 100) * canvas.width;
        const regionH = (region.h / 100) * canvas.height;

        ctx.filter = "none";
        ctx.drawImage(
          source,
          regionX,
          regionY,
          regionW,
          regionH,
          regionX,
          regionY,
          regionW,
          regionH,
        );

        // Soft edge on the selection so it blends.
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(regionX, regionY, regionW, regionH);
      }

      setPreviewUrl(canvas.toDataURL("image/png"));
      setIsProcessing(false);
    }, 30);
  }

  function download() {
    if (!previewUrl) return;

    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = `${imageName || "image"}-blurred.png`;
    anchor.click();
  }

  function onRegionPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    rect: DOMRect,
  ) {
    // If a resize handle was clicked, don't start a move drag
    const target = event.target as HTMLElement;
    if (target.closest("[data-resize-handle]")) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    dragRef.current = {
      offsetX: px - region.x,
      offsetY: py - region.y,
    };
  }

  function onRegionPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
    rect: DOMRect,
  ) {
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    if (resizeRef.current) {
      const r = resizeRef.current;
      const dxPct = ((mx - r.startMouseX) / rect.width) * 100;
      const dyPct = ((my - r.startMouseY) / rect.height) * 100;
      const s = r.startRegion;
      const min = 5;
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
      const h = r.handle;

      if (h === "se") {
        nw = Math.max(min, s.w + dxPct);
        nh = Math.max(min, s.h + dyPct);
      } else if (h === "sw") {
        nw = Math.max(min, s.w - dxPct);
        nh = Math.max(min, s.h + dyPct);
        nx = s.x + s.w - nw;
      } else if (h === "ne") {
        nw = Math.max(min, s.w + dxPct);
        nh = Math.max(min, s.h - dyPct);
        ny = s.y + s.h - nh;
      } else if (h === "nw") {
        nw = Math.max(min, s.w - dxPct);
        nh = Math.max(min, s.h - dyPct);
        nx = s.x + s.w - nw;
        ny = s.y + s.h - nh;
      } else if (h === "n") {
        nh = Math.max(min, s.h - dyPct);
        ny = s.y + s.h - nh;
      } else if (h === "s") {
        nh = Math.max(min, s.h + dyPct);
      } else if (h === "w") {
        nw = Math.max(min, s.w - dxPct);
        nx = s.x + s.w - nw;
      } else if (h === "e") {
        nw = Math.max(min, s.w + dxPct);
      }

      nx = Math.max(0, Math.min(nx, 100 - nw));
      ny = Math.max(0, Math.min(ny, 100 - nh));
      setRegion({ x: nx, y: ny, w: nw, h: nh });
      setPreviewUrl("");
      return;
    }

    if (!dragRef.current) return;

    const px = (mx / rect.width) * 100;
    const py = (my / rect.height) * 100;

    const nextX = Math.min(Math.max(px - dragRef.current.offsetX, 0), 100 - region.w);
    const nextY = Math.min(Math.max(py - dragRef.current.offsetY, 0), 100 - region.h);

    setRegion((current) => ({ ...current, x: nextX, y: nextY }));
    setPreviewUrl("");
  }

  function endDrag() {
    dragRef.current = null;
    resizeRef.current = null;
  }

  function onResizePointerDown(handle: string, event: React.PointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    resizeRef.current = {
      handle,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startRegion: { ...region },
    };
  }

  function clearAll() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSource(null);
    setImageName("");
    setPreviewUrl("");
    setSourceUrl("");
    setRegion({ x: 25, y: 25, w: 50, h: 50 });
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Blur Image
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
         Blur faces, license plates, personal information, or any sensitive area — instantly.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: controls */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Source image
              </label>
              <UploadZone
                onFile={loadImage}
                fileName={imageName || null}
                allowedLabel="PNG, JPG, WebP, HEIC, or HEIF"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Upload a PNG or JPG photo to blur.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Blur mode
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setMode("full"); setPreviewUrl(""); }}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    mode === "full"
                      ? "border-violet-500 bg-violet-600/20 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Sparkles className="h-4 w-4" />
                  Whole image
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("region"); setPreviewUrl(""); }}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    mode === "region"
                      ? "border-violet-500 bg-violet-600/20 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Square className="h-4 w-4" />
                  Region only
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Blur strength: {radius}px
              </label>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={radius}
                onChange={(event) => { setRadius(Number(event.target.value)); setPreviewUrl(""); }}
                className="w-full accent-violet-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                Higher values produce a heavier blur.
              </p>
            </div>

            {mode === "region" ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Region position
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(["x", "y", "w", "h"] as const).map((key) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        {key} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={region[key]}
                        onChange={(event) => {
                          setRegion((current) => ({
                            ...current,
                            [key]: Number(event.target.value),
                          }));
                          setPreviewUrl("");
                        }}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Drag the dashed box on the preview to reposition it.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={process}
                disabled={!source || isProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isProcessing ? "Processing..." : "Apply blur"}
              </button>

              <button
                onClick={download}
                disabled={!previewUrl}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>

              <button
                onClick={clearAll}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* RIGHT: preview */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">Preview</p>
            <div
              className="relative w-full touch-none select-none rounded-2xl border border-white/10 bg-slate-950"
              style={{ aspectRatio: source ? `${source.naturalWidth}/${source.naturalHeight}` : "4/3" }}
            >
              {source ? (
                previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Blurred preview"
                    className="pointer-events-none h-full w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourceUrl}
                    alt="Original preview"
                    className="pointer-events-none h-full w-full object-contain"
                  />
                )
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 px-8 text-center">
                    <ImageUp className="h-8 w-8 text-slate-600" />
                    <p className="text-sm leading-6 text-slate-500">
                      Upload an image to preview the blur.
                    </p>
                  </div>
                </div>
              )}

              {mode === "region" && source ? (
                <div
                  className="absolute cursor-move border-2 border-dashed border-white/90 bg-white/5"
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.w}%`,
                    height: `${region.h}%`,
                  }}
                  onPointerDown={(event) => {
                    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
                    onRegionPointerDown(event, rect);
                  }}
                  onPointerMove={(event) => {
                    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
                    onRegionPointerMove(event, rect);
                  }}
                  onPointerUp={endDrag}
                  onPointerLeave={endDrag}
                >
                  {/* Resize handles — corners */}
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("nw", e)}
                    className="absolute -left-1.5 -top-1.5 h-3 w-3 cursor-nwse-resize rounded-sm bg-white/80 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("ne", e)}
                    className="absolute -right-1.5 -top-1.5 h-3 w-3 cursor-nesw-resize rounded-sm bg-white/80 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("se", e)}
                    className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm bg-white/80 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("sw", e)}
                    className="absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-nesw-resize rounded-sm bg-white/80 hover:bg-white"
                  />
                  {/* Resize handles — edges */}
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("n", e)}
                    className="absolute left-1/2 top-0 h-1.5 w-8 -translate-x-1/2 cursor-ns-resize rounded-sm bg-white/60 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("s", e)}
                    className="absolute bottom-0 left-1/2 h-1.5 w-8 -translate-x-1/2 cursor-ns-resize rounded-sm bg-white/60 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("w", e)}
                    className="absolute left-0 top-1/2 h-8 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-sm bg-white/60 hover:bg-white"
                  />
                  <span
                    data-resize-handle
                    onPointerDown={(e) => onResizePointerDown("e", e)}
                    className="absolute right-0 top-1/2 h-8 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-sm bg-white/60 hover:bg-white"
                  />
                  <span className="pointer-events-none absolute -top-7 left-0 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Sharp region
                  </span>
                </div>
              ) : null}
            </div>

            {source ? (
              <p className="mt-2 text-xs text-slate-500">
                {source.naturalWidth}×{source.naturalHeight} ·{" "}
                {mode === "region"
                  ? "blurred everywhere except the box"
                  : "entire image blurred"}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hidden canvas used for rendering */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <HowToUse
        title="How to use Blur Image"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}