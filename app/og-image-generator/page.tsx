"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  FileImage,
  ImageUp,
  Loader2,
  Palette,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import UploadZone from "@/components/UploadZone";

const WIDTH = 1200;
const HEIGHT = 630;

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
    title: "Write your title",
    description: "Add the main headline that appears on the card.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "Add a subtitle",
    description: "Include a short description or site name.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "Pick colors",
    description: "Choose a background and text color for your brand.",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    title: "Upload a logo",
    description: "Optionally add a logo image to the corner.",
    icon: <ImageUp className="h-5 w-5" />,
  },
  {
    title: "Render the card",
    description: "Generate the social share image at 1200×630.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Download PNG",
    description: "Save the image to use on Twitter, Facebook, or Slack.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use OG Image Generator
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-[#071522] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-[#092B40] text-[#63E5F7] shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold leading-5 text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export default function OgImageGeneratorPage() {
  const [title, setTitle] = useState(
    "Build faster with Toolverse",
  );
  const [subtitle, setSubtitle] = useState("Free online tools for developers & creators");
  const [siteName, setSiteName] = useState("Toolverse");
  const [bgStart, setBgStart] = useState("#7c3aed");
  const [bgEnd, setBgEnd] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [logoName, setLogoName] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preview = useMemo(
    () => (
      <div
        className="relative flex aspect-[1200/630] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${bgStart}, ${bgEnd})` }}
      >
        <div className="p-10 text-center">
          {siteName ? (
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              {siteName}
            </p>
          ) : null}
          <p
            className="max-w-xl text-2xl font-extrabold leading-tight sm:text-3xl"
            style={{ color: textColor }}
          >
            {truncate(title || "Your title", 60)}
          </p>
          {subtitle ? (
            <p
              className="mx-auto mt-3 max-w-md text-sm text-white/85"
              style={{ color: textColor }}
            >
              {truncate(subtitle, 90)}
            </p>
          ) : null}
        </div>
      </div>
    ),
    [title, subtitle, siteName, bgStart, bgEnd, textColor],
  );

  function loadLogo(file: File) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogo(img);
      setLogoName(file.name);
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsRendering(true);

    setTimeout(() => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      gradient.addColorStop(0, bgStart);
      gradient.addColorStop(1, bgEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Decorative glow circles
      ctx.globalAlpha = 0.12;
      const glow = ctx.createRadialGradient(WIDTH * 0.85, HEIGHT * 0.15, 0, WIDTH * 0.85, HEIGHT * 0.15, 400);
      glow.addColorStop(0, "#ffffff");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;

      const centerX = WIDTH / 2;

      // Logo
      if (logo) {
        const logoSize = 96;
        ctx.drawImage(logo, centerX - logoSize / 2, 96, logoSize, logoSize);
      }

      // Site name kicker
      if (siteName.trim()) {
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.7;
        ctx.font = "600 34px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(siteName.trim().toUpperCase(), centerX, logo ? 260 : 210);
        ctx.globalAlpha = 1;
      }

      // Main title (wrapped)
      const titleText = truncate(title.trim() || "Your title here", 70);
      ctx.fillStyle = textColor;
      ctx.font = "800 72px system-ui, -apple-system, sans-serif";
      const titleLines = wrapText(ctx, titleText, WIDTH - 200);
      const titleLineHeight = 88;
      const blockTop = logo ? 320 : 280;
      const blockHeight = titleLines.length * titleLineHeight;

      titleLines.forEach((line, index) => {
        ctx.fillText(line, centerX, blockTop + index * titleLineHeight);
      });

      // Subtitle
      if (subtitle.trim()) {
        const subText = truncate(subtitle.trim(), 110);
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.85;
        ctx.font = "400 34px system-ui, -apple-system, sans-serif";
        const subLines = wrapText(ctx, subText, WIDTH - 320);
        const subTop = blockTop + blockHeight + 36;

        subLines.forEach((line, index) => {
          ctx.fillText(line, centerX, subTop + index * 46);
        });
        ctx.globalAlpha = 1;

        setPreviewUrl(canvas.toDataURL("image/png"));
        setIsRendering(false);
        return;
      }

      setPreviewUrl(canvas.toDataURL("image/png"));
      setIsRendering(false);
    }, 30);
  }

  function download() {
    if (!previewUrl) return;

    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = "og-image.png";
    anchor.click();
  }

  function clearAll() {
    setTitle("");
    setSubtitle("");
    setPreviewUrl("");
    setLogo(null);
    setLogoName("");
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          OG Image Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Create 1200×630 social share cards with custom text, colors, and
          logo — ready to attach to your social posts or metadata.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ================================================================
              LEFT: CONTROLS
          ================================================================ */}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Title
              </label>
              <textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                rows={2}
                placeholder="Your headline here"
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Subtitle
              </label>
              <input
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder="Short description or tagline"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Site / brand name
              </label>
              <input
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
                placeholder="YourSite"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Start color
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5">
                  <input
                    type="color"
                    value={bgStart}
                    onChange={(event) => setBgStart(event.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent"
                  />
                  <span className="text-xs text-slate-400">{bgStart}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  End color
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5">
                  <input
                    type="color"
                    value={bgEnd}
                    onChange={(event) => setBgEnd(event.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent"
                  />
                  <span className="text-xs text-slate-400">{bgEnd}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Text color
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent"
                  />
                  <span className="text-xs text-slate-400">{textColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Logo{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <UploadZone
                onFile={loadLogo}
                fileName={logoName || null}
                allowedLabel="PNG, JPG, WebP, HEIC, or HEIF"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={render}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                {isRendering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isRendering ? "Rendering..." : "Render image"}
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
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* ================================================================
              RIGHT: PREVIEW
          ================================================================ */}

          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <Palette className="h-4 w-4" />
                Live preview
                <span className="ml-auto rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                  1200×630
                </span>
              </p>
              {preview}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <FileImage className="h-4 w-4" />
                Rendered output
              </p>
              <div className="flex aspect-[1200/630] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                {previewUrl ? (
                  // Use an img pointing at the hidden canvas data URL
                  <img
                    src={previewUrl}
                    alt="Rendered OG image"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-8 text-center">
                    <Sparkles className="h-8 w-8 text-slate-600" />
                    <p className="text-sm leading-6 text-slate-500">
                      Click &quot;Render image&quot; to generate the final PNG.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden off-screen canvas used for precise rendering */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="hidden"
        aria-hidden="true"
      />

      <HowToUseSection />
    </Container>
  );
}
