"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Maximize2,
  Palette,
  RefreshCw,
  Shapes,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   SVG PLACEHOLDER GENERATOR
   ========================================================================== */

const PRESET_BG = [
  { bg: "#7c3aed", label: "Violet" },
  { bg: "#0ea5e9", label: "Sky" },
  { bg: "#10b981", label: "Emerald" },
  { bg: "#f59e0b", label: "Amber" },
  { bg: "#ef4444", label: "Red" },
  { bg: "#334155", label: "Slate" },
];

const PRESET_FG = [
  { fg: "#ffffff", label: "White" },
  { fg: "#0f172a", label: "Dark" },
];

const ASPECTS = [
  { w: 800, h: 600, label: "4:3" },
  { w: 640, h: 640, label: "1:1" },
  { w: 1200, h: 630, label: "16:9 OG" },
  { w: 192, h: 192, label: "1:1 small" },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvg({
  width,
  height,
  bg,
  fg,
  text,
  showText,
}: {
  width: number;
  height: number;
  bg: string;
  fg: string;
  text: string;
  showText: boolean;
}) {
  const label = showText
    ? text.trim() || `${width} × ${height}`
    : "";
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.06));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  ${
    label
      ? `<text x="50%" y="50%" fill="${fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>`
      : ""
  }
</svg>`.trim();
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function urlFromParams(params: { width: number; height: number; bg: string; fg: string; text: string }) {
  const { width, height, bg, fg, text } = params;
  const base = `https://placehold.co/${width}x${height}`;
  const first = `${bg.replace("#", "")}/${fg.replace("#", "")}`;
  const suffix = text ? `?text=${encodeURIComponent(text)}` : "";
  return `${base}/${first}${suffix}`;
}

/* Rasterize the SVG to a PNG/WebP data URL via canvas. */
function rasterize(svg: string, width: number, height: number, type: "image/png" | "image/webp"): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = svgToDataUrl(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(type));
    };
    img.onerror = () => reject(new Error("Could not rasterize"));
    img.src = url;
  });
}

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

export default function ImagePlaceholderPage() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bg, setBg] = useState("#7c3aed");
  const [fg, setFg] = useState("#ffffff");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRasterizing, setIsRasterizing] = useState<"png" | "webp" | null>(null);

  const svg = useMemo(
    () => buildSvg({ width, height, bg, fg, text, showText }),
    [width, height, bg, fg, text, showText],
  );

  const previewUrl = svgToDataUrl(svg);

  const externalUrl = urlFromParams({ width, height, bg, fg, text });

  function applyAspect(a: { w: number; h: number }) {
    setWidth(a.w);
    setHeight(a.h);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(externalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadRaster(kind: "png" | "webp") {
    setIsRasterizing(kind);
    try {
      const url = await rasterize(svg, width, height, kind === "png" ? "image/png" : "image/webp");
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `placeholder-${width}x${height}.${kind}`;
      anchor.click();
    } catch {
      // fall through
    } finally {
      setIsRasterizing(null);
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Placeholder
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
         Create custom placeholder images in any size, with your text and colors. Export as SVG, PNG, WebP, or a hosted URL.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* LEFT: controls */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Dimensions (px)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={width}
                  onChange={(event) => setWidth(Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500"
                />
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={height}
                  onChange={(event) => setHeight(Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ASPECTS.map((aspect) => (
                  <button
                    key={aspect.label}
                    type="button"
                    onClick={() => applyAspect(aspect)}
                    className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    {aspect.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg}
                  onChange={(event) => setBg(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <span className="font-mono text-xs text-slate-400">{bg}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_BG.map((preset) => (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => setBg(preset.bg)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Text color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fg}
                  onChange={(event) => setFg(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <span className="font-mono text-xs text-slate-400">{fg}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_FG.map((preset) => (
                  <button
                    key={preset.fg}
                    type="button"
                    onClick={() => setFg(preset.fg)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Text label
              </label>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Optional label"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
              <label className="mt-2 flex items-center gap-2.5 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(event) => setShowText(event.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
                Show label (falls back to &quot;W × H&quot;)
              </label>
            </div>
          </div>

          {/* RIGHT: preview + output */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">Preview</p>
            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`${width}x${height} placeholder`}
                className="max-h-64 w-full rounded-lg object-contain"
              />
            </div>

            <div className="mt-3">
              <p className="mb-2 text-sm font-semibold text-slate-300">Download</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={previewUrl}
                  download={`placeholder-${width}x${height}.svg`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </a>
                <button
                  onClick={() => downloadRaster("png")}
                  disabled={isRasterizing !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  {isRasterizing === "png" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  PNG
                </button>
                <button
                  onClick={() => downloadRaster("webp")}
                  disabled={isRasterizing !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  {isRasterizing === "webp" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  WebP
                </button>
                <button
                  onClick={copyUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use Image Placeholder"
          subtitle=""
          steps={[
            {
              title: "Set dimensions",
              description: "Type a custom size or tap a common aspect ratio.",
              icon: <Maximize2 className="h-5 w-5" />,
            },
            {
              title: "Pick colors",
              description: "Choose a background and text color, or use a preset.",
              icon: <Palette className="h-5 w-5" />,
            },
            {
              title: "Adjust the label",
              description: "Show your own text, or let it fall back to 'W × H'.",
              icon: <Wand2 className="h-5 w-5" />,
            },
            {
              title: "Preview live",
              description: "See exactly how the placeholder will look.",
              icon: <Shapes className="h-5 w-5" />,
            },
            {
              title: "Download",
              description: "Save as a scalable SVG or a PNG/WebP raster.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Stays private",
              description: "Generated locally — your content never leaves the browser.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
