"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eraser,
  ImageUp,
  Loader2,
  Maximize2,
  Sparkles,
  Wand2,
  ZoomIn,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import UploadZone from "@/components/UploadZone";

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

const SCALES = [
  { factor: 2, label: "2×" },
  { factor: 4, label: "4×" },
  { factor: 8, label: "8×" },
] as const;

/* Safety caps. getImageData allocates width*height*4 bytes (plus a duplicate
   copy in the sharpener), so unrestricted upscaling can exhaust browser memory.
   We clamp every dimension and the total pixel count to stay well within limits. */
const MAX_DIMENSION = 8192; // per side, in px
const MAX_PIXELS = 16_000_000; // ~16MP total — safe ImageData double-buffer

/* Reduce the requested factor so the output stays within the safety caps. */
function clampFactor(srcW: number, srcH: number, requested: number) {
  let factor = requested;
  const byWidth = MAX_DIMENSION / srcW;
  const byHeight = MAX_DIMENSION / srcH;
  const byPixels = Math.sqrt(MAX_PIXELS / (srcW * srcH));
  if (factor > byWidth) factor = byWidth;
  if (factor > byHeight) factor = byHeight;
  if (factor > byPixels) factor = byPixels;
  return Math.max(1, factor);
}

/* Step-based bicubic-ish upscaler: repeatedly scale in even steps with
   sharpening, which produces noticeably better results than a single
   nearest-neighbor pass. Scales by a fixed step each pass so the final
   dimensions land exactly on the (clamped) target. */
function upscaleCanvas(source: HTMLImageElement, factor: number, sharpen: number) {
  const srcW = source.naturalWidth;
  const srcH = source.naturalHeight;
  const targetW = Math.max(1, Math.round(srcW * factor));
  const targetH = Math.max(1, Math.round(srcH * factor));

  const output = document.createElement("canvas");
  output.width = srcW;
  output.height = srcH;
  const outCtx = output.getContext("2d")!;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(source, 0, 0);

  const passes = Math.max(1, Math.ceil(Math.log2(factor)));
  const step = Math.pow(factor, 1 / passes);

  let width = srcW;
  let height = srcH;

  for (let p = 1; p <= passes; p++) {
    const last = p === passes;
    const nextW = last ? targetW : Math.max(1, Math.round(width * step));
    const nextH = last ? targetH : Math.max(1, Math.round(height * step));

    const next = document.createElement("canvas");
    next.width = nextW;
    next.height = nextH;
    const ctx = next.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(output, 0, 0, nextW, nextH);

    // Only sharpen when the buffer is comfortably within memory limits.
    if (sharpen > 0 && nextW * nextH <= MAX_PIXELS) {
      const image = ctx.getImageData(0, 0, nextW, nextH);
      const sharpened = applyUnsharpMask(image, sharpen);
      ctx.putImageData(sharpened, 0, 0);
    }

    output.width = nextW;
    output.height = nextH;
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";
    outCtx.drawImage(next, 0, 0);

    width = nextW;
    height = nextH;
  }

  return output;
}

function applyUnsharpMask(
  image: ImageData,
  strength: number,
): ImageData {
  const { data, width, height } = image;
  const out = new Uint8ClampedArray(data);

  const kernel = [1, 2, 1, 2, -16, 2, 1, 2, 1];
  const amount = strength / 50; // 0..1-ish, tuned to the slider scale

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * width + x) * 4 + c;
        let lap = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            lap += data[kIdx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        out[idx] = data[idx] - amount * 0.05 * lap;
      }
    }
  }

  return new ImageData(out, width, height);
}

export default function ImageUpscalerPage() {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [factor, setFactor] = useState<(typeof SCALES)[number]["factor"]>(2);
  const [sharpen, setSharpen] = useState(40);
  const [resultUrl, setResultUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedFactor, setAppliedFactor] = useState<number | null>(null);

  function loadImage(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSource(img);
      setImageName(file.name.replace(/\.[^.]+$/, "") || "image");
      setResultUrl("");
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }

  function process() {
    if (!source) return;
    setIsProcessing(true);

    setTimeout(() => {
      const used = clampFactor(source.naturalWidth, source.naturalHeight, factor);
      setAppliedFactor(used);
      const upscaled = upscaleCanvas(source, used, sharpen);
      setResultUrl(upscaled.toDataURL("image/png"));
      setIsProcessing(false);
    }, 30);
  }

  function download() {
    if (!resultUrl) return;
    const used = appliedFactor ?? factor;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = `${imageName || "image"}-${used.toFixed(1).replace(/\.0$/, "")}x-upscaled.png`;
    anchor.click();
  }

  function clearAll() {
    setSource(null);
    setImageName("");
    setResultUrl("");
    setAppliedFactor(null);
  }

  const outWidth = source ? source.naturalWidth * (appliedFactor ?? factor) : 0;
  const outHeight = source ? source.naturalHeight * (appliedFactor ?? factor) : 0;
  const isClamped = appliedFactor !== null && appliedFactor < factor - 0.001;

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Upscaler
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Enlarge images up to 8× with smart interpolation and sharpening —
          great for upscaling photos, logos, and screenshots.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: upload + options */}
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Scale factor
              </label>
              <div className="flex gap-2">
                {SCALES.map((option) => (
                  <button
                    key={option.factor}
                    type="button"
                    onClick={() => setFactor(option.factor)}
                    className={[
                      "inline-flex min-w-16 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                      factor === option.factor
                        ? "border-violet-500 bg-violet-600/20 text-white"
                        : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <Maximize2 className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Sharpen: {sharpen}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sharpen}
                onChange={(event) => setSharpen(Number(event.target.value))}
                className="w-full accent-violet-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                Sharpening restores edge detail after upscaling. 0 disables it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
                {isProcessing ? "Upscaling..." : "Upscale image"}
              </button>

              <button
                onClick={download}
                disabled={!resultUrl}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                <Download className="h-4 w-4" />
                Download PNG
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

          {/* RIGHT: preview */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">Result</p>
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
              style={{ aspectRatio: source ? `${source.naturalWidth}/${source.naturalHeight}` : "4/3" }}
            >
              {resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resultUrl}
                  alt="Upscaled result"
                  className="h-full w-full object-contain"
                />
              ) : source ? (
                <div className="flex flex-col items-center gap-3 px-8 text-center">
                  <ZoomIn className="h-8 w-8 text-slate-600" />
                  <p className="text-sm leading-6 text-slate-500">
                    Click &quot;Upscale image&quot; to preview the result here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-8 text-center">
                  <ImageUp className="h-8 w-8 text-slate-600" />
                  <p className="text-sm leading-6 text-slate-500">
                    Upload an image to upscale it.
                  </p>
                </div>
              )}
            </div>

            {source ? (
              <div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
                  <span className="text-slate-400">
                    {source.naturalWidth}×{source.naturalHeight}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold text-white">
                    {outWidth}×{outHeight}
                  </span>
                </div>

                {isClamped ? (
                  <p className="mt-2 text-xs leading-5 text-amber-400/90">
                    Output was capped to keep the image within your browser&apos;s
                    memory limits. Use a smaller source image or lower scale for
                    the full {factor}×.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use Image Upscaler"
          subtitle=""
          steps={[
            {
              title: "Upload an image",
              description: "Choose a PNG, JPG, or WebP from your device.",
              icon: <ImageUp className="h-5 w-5" />,
            },
            {
              title: "Pick a scale",
              description: "Choose 2×, 4×, or 8× upscaling.",
              icon: <Maximize2 className="h-5 w-5" />,
            },
            {
              title: "Tune sharpening",
              description: "Increase or decrease edge detail to your liking.",
              icon: <Wand2 className="h-5 w-5" />,
            },
            {
              title: "Upscale",
              description: "Render the enlarged image in your browser.",
              icon: <Sparkles className="h-5 w-5" />,
            },
            {
              title: "Download PNG",
              description: "Save the upscaled image to your device.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Stays private",
              description: "No uploads — processing happens entirely locally.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
