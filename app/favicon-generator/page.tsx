"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileCode2,
  ImageUp,
  Layers,
  Loader2,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import UploadZone from "@/components/UploadZone";

/* ==========================================================================
   GENERATION SIZES
   ========================================================================== */

const SIZES = [
  { size: 16, label: "16×16" },
  { size: 32, label: "32×32" },
  { size: 48, label: "48×48" },
  { size: 64, label: "64×64" },
  { size: 128, label: "128×128" },
  { size: 180, label: "180×180" },
  { size: 192, label: "192×192" },
  { size: 512, label: "512×512" },
];

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
    description: "Choose a PNG, JPG, or WebP image to use as your source.",
    icon: <ImageUp className="h-5 w-5" />,
  },
  {
    title: "Pick a background",
    description: "Keep transparency or fill a solid color behind the icon.",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    title: "Set padding",
    description: "Control the inner margin so the icon is framed nicely.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Generate sizes",
    description: "Create every standard favicon size at once.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Download files",
    description: "Save individual PNGs or grab a ready-to-use manifest.",
    icon: <Download className="h-5 w-5" />,
  },
  {
    title: "Copy the code",
    description: "Copy the HTML snippet and manifest to wire up your site.",
    icon: <FileCode2 className="h-5 w-5" />,
  },
];


function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function FaviconGeneratorPage() {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [background, setBackground] = useState("#7c3aed");
  const [padding, setPadding] = useState(10);
  const [generated, setGenerated] = useState<{ size: number; dataUrl: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  function loadImage(file: File) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setSource(img);
      setImageName(file.name.replace(/\.[^.]+$/, "") || "favicon");
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }

  const renderSize = useCallback(
    (size: number) => {
      if (!source) return "";

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      // Background fill
      if (backgroundEnabled) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
      }

      // Padding (as a fraction of the canvas)
      const pad = Math.round((padding / 100) * size);
      const sourceRatio = source.naturalWidth / (source.naturalHeight || 1);
      const targetRatio = 1;

      let drawWidth: number;
      let drawHeight: number;

      if (sourceRatio > targetRatio) {
        drawWidth = size - pad * 2;
        drawHeight = drawWidth / sourceRatio;
      } else {
        drawHeight = size - pad * 2;
        drawWidth = drawHeight * sourceRatio;
      }

      const x = (size - drawWidth) / 2;
      const y = (size - drawHeight) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, x, y, drawWidth, drawHeight);

      return canvas.toDataURL("image/png");
    },
    [source, backgroundEnabled, background, padding],
  );

  function generate() {
    if (!source) return;

    setIsGenerating(true);

    // Give the UI a tick before the sync canvas work.
    setTimeout(() => {
      const items = SIZES.map(({ size }) => ({
        size,
        dataUrl: renderSize(size),
      }));
      setGenerated(items);
      setIsGenerating(false);
    }, 30);
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  }

  function downloadManifest() {
    if (!generated.length) return;

    const icons = generated
      .filter(({ size }) => [192, 512].includes(size))
      .map(({ size, dataUrl }) => ({
        src: dataUrl,
        sizes: `${size}x${size}`,
        type: "image/png",
      }));

    const manifest = {
      name: imageName,
      icons,
      theme_color: backgroundEnabled ? background : "#7c3aed",
      background_color: backgroundEnabled ? background : "#0f172a",
      display: "standalone",
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "site.webmanifest";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function htmlSnippet() {
    if (!generated.length) return "";

    const internal = generated
      .filter(({ size }) => size === 32)
      .map(
        ({ dataUrl }) =>
          `<link rel="icon" type="image/png" sizes="32x32" href="${dataUrl}">`,
      )
      .join("");

    const apple = generated
      .filter(({ size }) => size === 180)
      .map(
        ({ dataUrl }) =>
          `<link rel="apple-touch-icon" sizes="180x180" href="${dataUrl}">`,
      )
      .join("");

    return [
      internal,
      apple,
      `<link rel="manifest" href="/site.webmanifest">`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function copyCode() {
    const code = htmlSnippet();
    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopiedCode(true);

    setTimeout(() => {
      setCopiedCode(false);
    }, 1500);
  }

  function clearAll() {
    setSource(null);
    setImageName("");
    setGenerated([]);
    setCopiedCode(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Favicon Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Turn any image into all the favicon sizes your site needs, with a
          ready-to-use manifest and copy-paste HTML.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ================================================================
              LEFT: SOURCE + OPTIONS
          ================================================================ */}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Source image
              </label>

              <UploadZone
                onFile={loadImage}
                fileName={imageName ? `${imageName}.png` : null}
                allowedLabel="PNG, JPG, WebP, HEIC, or HEIF"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Square images work best.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={backgroundEnabled}
                onChange={(event) => setBackgroundEnabled(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Fill background color
            </label>

            {backgroundEnabled ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                <input
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <div className="flex-1">
                  <span className="text-sm text-slate-300">{background}</span>
                  <span
                    className="ml-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-white"
                    style={{ backgroundColor: hexToRgba(background, 0.25) }}
                  >
                    <Palette className="h-3 w-3" />
                    Preview
                  </span>
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Padding: {padding}%
              </label>

              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={padding}
                onChange={(event) => setPadding(Number(event.target.value))}
                className="w-full accent-violet-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Inner margin used to frame the icon inside each square.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={generate}
                disabled={!source || isGenerating}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Generate favicons"}
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

          {/* ================================================================
              RIGHT: PREVIEW + DOWNLOADS
          ================================================================ */}

          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 sm:p-5">
            {source ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                    <img
                      src={renderSize(64)}
                      alt="Preview"
                      className="h-full w-full object-contain"
                      style={{
                        backgroundColor: backgroundEnabled
                          ? hexToRgba(background, 0.15)
                          : "transparent",
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-white">
                      {imageName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {source.naturalWidth}×{source.naturalHeight} source image
                    </p>
                  </div>
                </div>

                {generated.length ? (
                  <div>
                    <div className="mb-3 grid grid-cols-4 gap-3">
                      {generated.map(({ size, dataUrl }) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            downloadDataUrl(dataUrl, `${imageName}-${size}.png`)
                          }
                          title={`Download ${size}×${size}`}
                          className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2 transition hover:border-violet-400/40 hover:bg-white/[0.05]"
                        >
                          <span
                            className="flex w-full items-center justify-center overflow-hidden rounded-lg"
                            style={{
                              backgroundColor: backgroundEnabled
                                ? hexToRgba(background, 0.15)
                                : "rgba(255,255,255,0.05)",
                            }}
                          >
                            <img
                              src={dataUrl}
                              alt={`${size}×${size}`}
                              width={size}
                              height={size}
                              className="max-h-14 max-w-full object-contain"
                            />
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white">
                            {size}px
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full">
                      <button
                        onClick={downloadManifest}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                        Download manifest
                      </button>

                      <button
                        onClick={copyCode}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        {copiedCode ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedCode ? "Copied" : "Copy HTML"}
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-400">
                        HTML snippet (paste into {"<head>"})
                      </p>
                      <pre className="max-h-40 overflow-auto rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] leading-5 text-slate-300">
                        {htmlSnippet()}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
                    <p className="px-6 text-sm leading-6 text-slate-500">
                      Click &quot;Generate favicons&quot; to create every size.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
                <div className="flex flex-col items-center gap-3 px-8">
                  <Sparkles className="h-8 w-8 text-slate-600" />
                  <p className="text-sm leading-6 text-slate-500">
                    Upload an image to preview and generate your favicon set.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <HowToUse
        title="How to use Favicon Generator"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}
