"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eraser,
  FileImage,
  ImageDown,
  SlidersHorizontal,
  Upload,
  Wand2,
} from "lucide-react";
import heic2any from "heic2any";
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

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

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
    title: "Upload image",
    description: "Choose a PNG, JPG, WebP, HEIC, HEIF, or supported image file.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Choose format",
    description: "Select PNG, JPG, or WebP as your output format.",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    title: "Set quality",
    description: "Use the quality slider to control output size and clarity.",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Convert",
    description: "Click convert image to generate the new output file.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Preview output",
    description: "Review the converted image in the output preview panel.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Save the converted PNG, JPG, or WebP file to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Image Converter
      </h2>

      {/* Desktop / tablet layout */}
      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>

            <h3 className="text-sm font-semibold text-white">
              {step.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile-only cyan layout */}
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

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputPreview, setOutputPreview] = useState("");
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(0.9);

  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function getOutputExtension() {
    if (format === "image/png") return "png";
    if (format === "image/webp") return "webp";
    return "jpg";
  }

  function isHeicFile(inputFile: File) {
    const fileName = inputFile.name.toLowerCase();

    return (
      inputFile.type === "image/heic" ||
      inputFile.type === "image/heif" ||
      fileName.endsWith(".heic") ||
      fileName.endsWith(".heif")
    );
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;

    setError("");
    setFile(nextFile);
    setConvertedBlob(null);

    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setOutputPreview("");

    event.target.value = "";
  }

  async function convertImage() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setConvertedBlob(null);

      if (outputPreview) {
        URL.revokeObjectURL(outputPreview);
        setOutputPreview("");
      }

      let sourceBlob: Blob = file;

      /*
       * HEIC / HEIF files are not natively supported by most browsers.
       * Convert them to PNG in the browser first using heic2any.
       */
      if (isHeicFile(file)) {
        try {
          const converted = await heic2any({
            blob: file,
            toType: "image/png",
            quality: 1,
          });

          sourceBlob = Array.isArray(converted)
            ? converted[0]
            : converted;
        } catch (heicError) {
          console.error("HEIC conversion error:", heicError);

          setError(
            "Could not read this HEIC/HEIF image. Please make sure the file is valid and try again.",
          );
          setIsProcessing(false);
          return;
        }
      }

      const sourceUrl = URL.createObjectURL(sourceBlob);
      const image = new Image();

      image.src = sourceUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image could not be loaded"));
      });

      URL.revokeObjectURL(sourceUrl);

      const canvas = document.createElement("canvas");

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Could not prepare image canvas.");
        setIsProcessing(false);
        return;
      }

      /*
       * JPEG does not support transparency.
       * Fill transparent areas with white before converting.
       */
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(image, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Could not convert image.");
            setIsProcessing(false);
            return;
          }

          const nextPreview = URL.createObjectURL(blob);

          setConvertedBlob(blob);
          setOutputPreview(nextPreview);
          setIsProcessing(false);
        },
        format,
        quality,
      );
    } catch (conversionError) {
      console.error("Image conversion error:", conversionError);

      setError(
        "Could not convert this image. Please make sure the file is valid and try again.",
      );

      setIsProcessing(false);
    }
  }

  function downloadConvertedImage() {
    if (!convertedBlob || !file) return;

    downloadBlob(
      convertedBlob,
      `${baseName(file)}-converted.${getOutputExtension()}`,
    );
  }

  function clearAll() {
    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFile(null);
    setOutputPreview("");
    setConvertedBlob(null);
    setFormat("image/png");
    setQuality(0.9);
    setError("");
    setIsProcessing(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert PNG, JPG, WebP, HEIC, and HEIF images directly in your
          browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Upload / Settings */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Upload image
          </h2>

          <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-9 w-9 text-violet-300" />

            <span className="font-semibold text-white">
              Click to choose image
            </span>

            <span className="mt-2 text-sm leading-6 text-slate-500">
              Allowed: PNG, JPG, WebP, HEIC, or HEIF.
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.heic,.heif"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">
                  Selected:
                </span>{" "}
                {file.name}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Type:</span>{" "}
                {file.type || "Unknown"}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Output format
              </label>

              <select
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as OutputFormat)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>

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
              onClick={convertImage}
              disabled={isProcessing || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Wand2 className="h-4 w-4" />
              {isProcessing ? "Converting..." : "Convert image"}
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

        {/* Output */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Converted output
            </h2>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {outputPreview ? "Preview ready" : "Waiting"}
            </span>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center">
            {outputPreview ? (
              <img
                src={outputPreview}
                alt="Converted output preview"
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your converted image preview appears here after conversion.
              </p>
            )}
          </div>

          {convertedBlob && file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Output:</span>{" "}
                {baseName(file)}-converted.{getOutputExtension()}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Format:</span>{" "}
                {getOutputExtension().toUpperCase()}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Size:</span>{" "}
                {(convertedBlob.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : null}

          <button
            onClick={downloadConvertedImage}
            disabled={!convertedBlob}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Download className="h-4 w-4" />
            Download converted image
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}