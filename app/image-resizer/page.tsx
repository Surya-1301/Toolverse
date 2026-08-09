"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  ImageDown,
  ImagePlus,
  Maximize2,
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

function getImageExtension(file: File) {
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
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

const howToUseSteps = [
  {
    title: "Upload images",
    description: "Choose one or multiple PNG, JPG, or WebP images.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Set width",
    description: "Enter the target width for your resized image.",
    icon: <Maximize2 className="h-5 w-5" />,
  },
  {
    title: "Set height",
    description: "Enter a custom height or keep aspect ratio enabled.",
    icon: <ImagePlus className="h-5 w-5" />,
  },
  {
    title: "Keep ratio",
    description: "Keep the original image proportions while resizing.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Set quality",
    description: "Use the quality slider to control output size and clarity.",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Preview and save the resized image to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Image Resizer
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

export default function ImageResizerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("");
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [quality, setQuality] = useState(0.9);

  const [outputPreview, setOutputPreview] = useState("");
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);

  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const firstFile = files[0] || null;

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFiles(selectedFiles);
    setOutputPreview("");
    setResizedBlob(null);
    setError("");

    event.target.value = "";
  }

  async function resizeOneImage(file: File) {
    const image = new Image();
    image.src = URL.createObjectURL(file);

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    const targetWidth = Number(width) || originalWidth;
    const targetHeight = keepAspectRatio
      ? Math.round(targetWidth * (originalHeight / originalWidth))
      : Number(height) || originalHeight;

    if (targetWidth <= 0 || targetHeight <= 0) {
      throw new Error("Width and height must be greater than 0.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not prepare image canvas.");
    }

    if (file.type.includes("jpeg") || file.type.includes("jpg")) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not resize image."));
            return;
          }

          resolve(blob);
        },
        file.type || "image/jpeg",
        quality,
      );
    });
  }

  async function resizeImages() {
    if (!files.length) {
      setError("Upload one or more images first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setResizedBlob(null);

      if (outputPreview) {
        URL.revokeObjectURL(outputPreview);
        setOutputPreview("");
      }

      const firstResizedBlob = await resizeOneImage(files[0]);
      const previewUrl = URL.createObjectURL(firstResizedBlob);

      setResizedBlob(firstResizedBlob);
      setOutputPreview(previewUrl);

      if (files.length > 1) {
        for (const file of files.slice(1)) {
          const resizedBlob = await resizeOneImage(file);
          const extension = getImageExtension(file);

          downloadBlob(resizedBlob, `${baseName(file)}-resized.${extension}`);
        }
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not resize images. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadResizedImage() {
    if (!resizedBlob || !firstFile) return;

    const extension = getImageExtension(firstFile);
    downloadBlob(resizedBlob, `${baseName(firstFile)}-resized.${extension}`);
  }

  function clearAll() {
    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFiles([]);
    setWidth("800");
    setHeight("");
    setKeepAspectRatio(true);
    setQuality(0.9);
    setOutputPreview("");
    setResizedBlob(null);
    setError("");
    setIsProcessing(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Resizer
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Resize one or many images with width, height, aspect ratio, and
          compression quality controls.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Upload images
          </h2>

          <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-9 w-9 text-violet-300" />

            <span className="font-semibold text-white">
              Click to choose images
            </span>

            <span className="mt-2 text-sm leading-6 text-slate-500">
              Allowed: PNG, JPG, or WebP. Batch resize supported.
            </span>

            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={handleFiles}
              className="hidden"
            />
          </label>

          <p className="mt-4 text-sm text-slate-500">
            {files.length} image{files.length === 1 ? "" : "s"} selected
          </p>

          {firstFile ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Selected:</span>{" "}
                {firstFile.name}
              </p>

              {files.length > 1 ? (
                <p className="mt-1">
                  Batch mode: {files.length - 1} extra image
                  {files.length - 1 === 1 ? "" : "s"} will download
                  automatically.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Width
              </label>

              <input
                type="number"
                min="1"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                placeholder="Width"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Height
              </label>

              <input
                type="number"
                min="1"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                placeholder="Auto"
                disabled={keepAspectRatio}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={keepAspectRatio}
                onChange={(event) => setKeepAspectRatio(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Keep ratio
            </label>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Quality: {Math.round(quality * 100)}%
              </label>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
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
              onClick={resizeImages}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Download className="h-4 w-4" />
              {isProcessing ? "Processing..." : "Resize image"}
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
              {outputPreview ? "Preview ready" : "Waiting"}
            </span>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center">
            {outputPreview ? (
              <img
                src={outputPreview}
                alt="Resized output preview"
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your resized image preview appears here after processing.
              </p>
            )}
          </div>

          {resizedBlob && firstFile ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Output:</span>{" "}
                {baseName(firstFile)}-resized.{getImageExtension(firstFile)}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Size:</span>{" "}
                {width || "Original"} ×{" "}
                {keepAspectRatio ? "auto" : height || "Original"}
              </p>
            </div>
          ) : null}

          <button
            onClick={downloadResizedImage}
            disabled={!resizedBlob}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Download className="h-4 w-4" />
            Download resized image
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}