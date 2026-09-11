"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crop,
  Download,
  Eraser,
  Frame,
  ImageDown,
  ImagePlus,
  Maximize2,
  MousePointer2,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

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

type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16";
type Mode = "resize" | "crop";

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
    description:
      "Choose one or multiple PNG, JPG, or WebP images for resizing or cropping.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Pick a mode",
    description: "Switch between Resize and Crop tabs at the top.",
    icon: <Frame className="h-5 w-5" />,
  },
  {
    title: "Set dimensions",
    description:
      "Enter width/height (resize) or X/Y coordinates (crop) for the output.",
    icon: <Maximize2 className="h-5 w-5" />,
  },
  {
    title: "Use ratios",
    description:
      "Quickly apply common aspect ratios like 1:1, 4:3, or 16:9 while cropping.",
    icon: <Crop className="h-5 w-5" />,
  },
  {
    title: "Process",
    description:
      "Click Resize image or Crop image to generate the output preview.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Save the processed image to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

export default function ImageResizerCropperPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Shared state
  const [mode, setMode] = useState<Mode>("resize");
  const [file, setFile] = useState<File | null>(null);
  const [outputPreview, setOutputPreview] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize state
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("");
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [quality, setQuality] = useState(0.9);

  // Crop state
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");

  function revokePreview() {
    if (outputPreview) URL.revokeObjectURL(outputPreview);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;

    revokePreview();
    setFile(nextFile);
    setResultBlob(null);
    setOutputPreview("");
    setError("");

    event.target.value = "";
  }

  /* ============================================================
     RESIZE
  ============================================================ */

  async function resizeOneImage(target: File) {
    const image = new Image();
    image.src = URL.createObjectURL(target);

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

    if (target.type.includes("jpeg") || target.type.includes("jpg")) {
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
        target.type || "image/jpeg",
        quality,
      );
    });
  }

  async function resizeImage() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setResultBlob(null);

      revokePreview();
      setOutputPreview("");

      const resizedBlob = await resizeOneImage(file);
      const previewUrl = URL.createObjectURL(resizedBlob);

      setResultBlob(resizedBlob);
      setOutputPreview(previewUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not resize image. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadResized() {
    if (!resultBlob || !file) return;

    const extension = getImageExtension(file);
    downloadBlob(resultBlob, `${baseName(file)}-resized.${extension}`);
  }

  /* ============================================================
     CROP
  ============================================================ */

  async function cropImage() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setResultBlob(null);

      revokePreview();
      setOutputPreview("");

      const image = new Image();
      image.src = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const cropX = Number(x) || 0;
      const cropY = Number(y) || 0;
      const cropWidth = Number(width) || image.naturalWidth;
      const cropHeight = Number(height) || image.naturalHeight;

      if (cropWidth <= 0 || cropHeight <= 0) {
        setError("Crop width and height must be greater than 0.");
        setIsProcessing(false);
        return;
      }

      if (cropX >= image.naturalWidth || cropY >= image.naturalHeight) {
        setError("Crop X/Y position is outside the image size.");
        setIsProcessing(false);
        return;
      }

      const safeCropWidth = Math.min(cropWidth, image.naturalWidth - cropX);
      const safeCropHeight = Math.min(cropHeight, image.naturalHeight - cropY);

      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = safeCropWidth;
      canvas.height = safeCropHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Could not prepare image canvas.");
        setIsProcessing(false);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        cropX,
        cropY,
        safeCropWidth,
        safeCropHeight,
        0,
        0,
        safeCropWidth,
        safeCropHeight,
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Could not crop image.");
          setIsProcessing(false);
          return;
        }

        const previewUrl = URL.createObjectURL(blob);

        setResultBlob(blob);
        setOutputPreview(previewUrl);
        setIsProcessing(false);
      }, "image/png");
    } catch {
      setError("Could not crop this image. Please try another file.");
      setIsProcessing(false);
    }
  }

  function downloadCropped() {
    if (!resultBlob || !file) return;

    downloadBlob(resultBlob, `${baseName(file)}-cropped.png`);
  }

  function applyAspectRatio(ratio: AspectRatio) {
    const currentWidth = Number(width) || 500;

    if (ratio === "1:1") {
      setHeight(String(currentWidth));
      return;
    }

    if (ratio === "4:3") {
      setHeight(String(Math.round((currentWidth * 3) / 4)));
      return;
    }

    if (ratio === "16:9") {
      setHeight(String(Math.round((currentWidth * 9) / 16)));
      return;
    }

    setHeight(String(Math.round((currentWidth * 16) / 9)));
  }

  /* ============================================================
     SHARED HELPERS
  ============================================================ */

  function process() {
    if (mode === "resize") {
      resizeImage();
    } else {
      cropImage();
    }
  }

  function download() {
    if (mode === "resize") {
      downloadResized();
    } else {
      downloadCropped();
    }
  }

  function clearAll() {
    revokePreview();
    setFile(null);
    setResultBlob(null);
    setOutputPreview("");
    setError("");
    setIsProcessing(false);
    setWidth("800");
    setHeight("");
    setKeepAspectRatio(true);
    setQuality(0.9);
    setX("0");
    setY("0");
  }

  const outputLabel =
    mode === "resize" ? "Resized preview" : "Cropped preview";
  const outputName =
    mode === "resize" ? "resized" : "cropped";
  const fileTag = file || null;

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Resizer & Cropper
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Resize or crop images with custom dimensions, coordinates, aspect ratios, and compression quality.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="mx-auto mt-8 flex max-w-md gap-2">
        {(
          [
            {
              key: "resize" as const,
              label: "Resize",
              icon: <Maximize2 className="h-4 w-4" />,
            },
            {
              key: "crop" as const,
              label: "Crop",
              icon: <Crop className="h-4 w-4" />,
            },
          ]
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setMode(item.key);
              revokePreview();
              setResultBlob(null);
              setOutputPreview("");
              setError("");
            }}
            className={[
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              mode === item.key
                ? "border-violet-500 bg-violet-600/20 text-white"
                : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
            ].join(" ")}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Upload image
          </h2>

          <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
            <Upload className="mb-3 h-9 w-9 text-violet-300" />

            <span className="font-semibold text-white">
              Click to choose image
            </span>

            <span className="mt-2 text-sm leading-6 text-slate-500">
              Allowed: PNG, JPG, or WebP.
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {fileTag ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Selected:</span>{" "}
                {fileTag.name}
              </p>

              {mode === "resize" ? (
                <p className="mt-1">
                  <span className="font-semibold text-slate-300">Size:</span>{" "}
                  {width || "Original"} ×{" "}
                  {keepAspectRatio ? "auto" : height || "Original"}
                </p>
              ) : (
                <p className="mt-1">
                  <span className="font-semibold text-slate-300">Crop:</span> X{" "}
                  {x}, Y {y}, {width} × {height}
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                {mode === "resize" ? "Width" : "X"}
              </label>

              <input
                type="number"
                min={mode === "resize" ? 1 : 0}
                value={mode === "resize" ? width : x}
                onChange={(event) =>
                  mode === "resize"
                    ? setWidth(event.target.value)
                    : setX(event.target.value)
                }
                placeholder={mode === "resize" ? "Width" : "0"}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                {mode === "resize" ? "Height" : "Y"}
              </label>

              <input
                type="number"
                min={mode === "resize" ? 1 : 0}
                value={mode === "resize" ? height : y}
                onChange={(event) =>
                  mode === "resize"
                    ? setHeight(event.target.value)
                    : setY(event.target.value)
                }
                placeholder={mode === "resize" ? "Auto" : "0"}
                disabled={mode === "resize" && keepAspectRatio}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {mode === "resize" ? (
              <>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={keepAspectRatio}
                    onChange={(event) =>
                      setKeepAspectRatio(event.target.checked)
                    }
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
                    onChange={(event) =>
                      setQuality(Number(event.target.value))
                    }
                    className="mt-1.5 w-full accent-violet-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Width
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
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
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                  />
                </div>
              </>
            )}
          </div>

          {mode === "crop" ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {(["1:1", "4:3", "16:9", "9:16"] as AspectRatio[]).map(
                (ratio) => (
                  <button
                    key={ratio}
                    onClick={() => applyAspectRatio(ratio)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {ratio}
                  </button>
                ),
              )}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={process}
              disabled={isProcessing || !file}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:px-4 sm:text-sm"
            >
              {isProcessing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : mode === "resize" ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Crop className="h-4 w-4" />
              )}
              {isProcessing
                ? mode === "resize"
                  ? "Resizing..."
                  : "Cropping..."
                : mode === "resize"
                  ? "Resize image"
                  : "Crop image"}
            </button>

            <button
              onClick={clearAll}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 sm:px-4 sm:text-sm"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {outputLabel}
            </h2>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {outputPreview ? "Preview ready" : "Waiting"}
            </span>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center">
            {outputPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={outputPreview}
                alt={outputLabel}
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your processed image preview appears here.
              </p>
            )}
          </div>

          {resultBlob && file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Output:</span>{" "}
                {baseName(file)}-{outputName}.
                {mode === "resize" ? getImageExtension(file) : "png"}
              </p>

              {mode === "crop" ? (
                <p className="mt-1">
                  <span className="font-semibold text-slate-300">Crop:</span> X{" "}
                  {x}, Y {y}, {width} × {height}
                </p>
              ) : null}
            </div>
          ) : null}

          {outputPreview ? (
            <button
              onClick={download}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Download className="h-4 w-4" />
              Download {outputName} image
            </button>
          ) : null}
        </div>
      </div>

      <HowToUse
        title="How to use Image Resizer & Cropper"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}