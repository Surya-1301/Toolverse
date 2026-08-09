"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  ImageDown,
  ImagePlus,
  Layers,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function baseName(file: File | null) {
  return (file?.name || "image").replace(/\.[^/.]+$/, "");
}

type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-right";

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
    title: "Upload images",
    description: "Choose one or multiple images for watermarking.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Choose watermark",
    description: "Use a text watermark or upload your logo image.",
    icon: <ImagePlus className="h-5 w-5" />,
  },
  {
    title: "Set position",
    description: "Place the watermark at top, bottom, center, left, or right.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Adjust opacity",
    description: "Use the opacity slider to make the watermark subtle or bold.",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Preview output",
    description: "Review the watermarked preview before downloading.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Save the watermarked image or process images in batch.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Image Watermark
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}

export default function ImageWatermarkToolPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [watermarkText, setWatermarkText] = useState("Toolverse");
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [opacity, setOpacity] = useState(0.45);
  const [useLogo, setUseLogo] = useState(false);

  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const firstFile = files[0] || null;

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    setFiles(selectedFiles);
    setPreviewUrl("");
    setError("");

    event.target.value = "";
  }

  function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedLogo = event.target.files?.[0] || null;

    setLogoFile(selectedLogo);
    setError("");

    event.target.value = "";
  }

  function getPosition(
    canvasWidth: number,
    canvasHeight: number,
    contentWidth: number,
    contentHeight: number,
  ) {
    const margin = 32;

    if (position === "top-left") {
      return {
        x: margin,
        y: margin + contentHeight,
      };
    }

    if (position === "top-right") {
      return {
        x: canvasWidth - contentWidth - margin,
        y: margin + contentHeight,
      };
    }

    if (position === "center") {
      return {
        x: (canvasWidth - contentWidth) / 2,
        y: (canvasHeight + contentHeight) / 2,
      };
    }

    if (position === "bottom-left") {
      return {
        x: margin,
        y: canvasHeight - margin,
      };
    }

    return {
      x: canvasWidth - contentWidth - margin,
      y: canvasHeight - margin,
    };
  }

  async function loadImageFromFile(file: File) {
    const image = new Image();

    image.src = URL.createObjectURL(file);

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    return image;
  }

  async function watermarkOneImage(file: File) {
    const image = await loadImageFromFile(file);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not prepare image canvas.");
    }

    ctx.drawImage(image, 0, 0);

    ctx.globalAlpha = opacity;

    if (useLogo) {
      if (!logoFile) {
        throw new Error("Upload a logo image first.");
      }

      const logo = await loadImageFromFile(logoFile);

      const logoWidth = Math.max(80, Math.round(canvas.width * 0.18));
      const logoHeight = Math.round(
        logoWidth * (logo.naturalHeight / logo.naturalWidth),
      );

      const logoPosition = getPosition(
        canvas.width,
        canvas.height,
        logoWidth,
        logoHeight,
      );

      ctx.drawImage(
        logo,
        logoPosition.x,
        logoPosition.y - logoHeight,
        logoWidth,
        logoHeight,
      );
    } else {
      const fontSize = Math.max(28, Math.round(canvas.width / 18));

      ctx.font = `700 ${fontSize}px Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
      ctx.lineWidth = Math.max(2, Math.round(fontSize / 12));

      const metrics = ctx.measureText(watermarkText);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      const textPosition = getPosition(
        canvas.width,
        canvas.height,
        textWidth,
        textHeight,
      );

      ctx.strokeText(watermarkText, textPosition.x, textPosition.y);
      ctx.fillText(watermarkText, textPosition.x, textPosition.y);
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not export watermarked image."));
            return;
          }

          resolve(blob);
        },
        file.type || "image/png",
        0.92,
      );
    });
  }

  async function generatePreview() {
    if (!firstFile) {
      setPreviewUrl("");
      return;
    }

    if (useLogo && !logoFile) {
      setPreviewUrl(URL.createObjectURL(firstFile));
      return;
    }

    if (!useLogo && !watermarkText.trim()) {
      setPreviewUrl(URL.createObjectURL(firstFile));
      return;
    }

    try {
      const blob = await watermarkOneImage(firstFile);
      const nextPreviewUrl = URL.createObjectURL(blob);

      setPreviewUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return nextPreviewUrl;
      });
    } catch {
      setPreviewUrl(URL.createObjectURL(firstFile));
    }
  }

  useEffect(() => {
    generatePreview();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, logoFile, watermarkText, position, opacity, useLogo]);

  async function watermarkImages() {
    if (!files.length) {
      setError("Upload one or more images first.");
      return;
    }

    if (!useLogo && !watermarkText.trim()) {
      setError("Enter watermark text first.");
      return;
    }

    if (useLogo && !logoFile) {
      setError("Upload a logo image first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);

      for (const file of files) {
        const blob = await watermarkOneImage(file);

        downloadBlob(blob, `${baseName(file)}-watermarked.png`);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not watermark images.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function clearAll() {
    setFiles([]);
    setLogoFile(null);
    setWatermarkText("Toolverse");
    setPosition("bottom-right");
    setOpacity(0.45);
    setUseLogo(false);
    setPreviewUrl("");
    setError("");
    setIsProcessing(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Watermark
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Add text or logo watermarks to one or more images with position and
          opacity controls.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Upload image, logo, or batch
          </h2>

          <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-9 w-9 text-violet-300" />

            <span className="font-semibold text-white">
              Click to choose images
            </span>

            <span className="mt-2 text-sm leading-6 text-slate-500">
              Allowed: PNG, JPG, or WebP. Batch watermark supported.
            </span>

            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={handleImages}
              className="hidden"
            />
          </label>

          <p className="mt-4 text-sm text-slate-500">
            {files.length} image{files.length === 1 ? "" : "s"} selected
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={useLogo}
                onChange={(event) => setUseLogo(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Use logo watermark
            </label>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <Upload className="h-4 w-4" />
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={handleLogo}
                className="hidden"
              />
            </label>
          </div>

          {logoFile ? (
            <p className="mt-3 text-sm text-slate-500">
              Logo selected: {logoFile.name}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Text watermark
              </label>

              <input
                value={watermarkText}
                onChange={(event) => setWatermarkText(event.target.value)}
                disabled={useLogo}
                placeholder="CONFIDENTIAL"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Position
              </label>

              <select
                value={position}
                onChange={(event) =>
                  setPosition(event.target.value as WatermarkPosition)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
                <option value="center">Center</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Opacity: {Math.round(opacity * 100)}%
              </label>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(event) => setOpacity(Number(event.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={watermarkImages}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Download className="h-4 w-4" />
              {isProcessing ? "Processing..." : "Watermark & download"}
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Upload output</h2>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {previewUrl ? "Preview ready" : "Waiting"}
            </span>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Watermark preview"
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your watermarked image preview appears here after upload.
              </p>
            )}
          </div>

          {firstFile ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">File:</span>{" "}
                {firstFile.name}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Mode:</span>{" "}
                {useLogo ? "Logo watermark" : "Text watermark"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}