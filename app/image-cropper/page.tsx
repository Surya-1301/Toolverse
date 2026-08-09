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
  MousePointer2,
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

type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16";

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
    description: "Choose the PNG, JPG, or WebP image you want to crop.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Set position",
    description: "Enter X and Y values to choose where the crop starts.",
    icon: <MousePointer2 className="h-5 w-5" />,
  },
  {
    title: "Set crop size",
    description: "Enter width and height for the final cropped area.",
    icon: <Frame className="h-5 w-5" />,
  },
  {
    title: "Use ratios",
    description: "Quickly apply common aspect ratios like 1:1, 4:3, or 16:9.",
    icon: <Crop className="h-5 w-5" />,
  },
  {
    title: "Crop image",
    description: "Click crop image to generate the cropped output preview.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download",
    description: "Save the cropped PNG image to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Image Cropper
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

export default function ImageCropperPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [outputPreview, setOutputPreview] = useState("");

  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [width, setWidth] = useState("500");
  const [height, setHeight] = useState("500");

  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;

    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFile(nextFile);
    setCroppedBlob(null);
    setOutputPreview("");
    setError("");

    event.target.value = "";
  }

  async function cropImage() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setCroppedBlob(null);

      if (outputPreview) {
        URL.revokeObjectURL(outputPreview);
        setOutputPreview("");
      }

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

        setCroppedBlob(blob);
        setOutputPreview(previewUrl);
        setIsProcessing(false);
      }, "image/png");
    } catch {
      setError("Could not crop this image. Please try another file.");
      setIsProcessing(false);
    }
  }

  function downloadCroppedImage() {
    if (!croppedBlob || !file) return;

    downloadBlob(croppedBlob, `${baseName(file)}-cropped.png`);
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

  function clearAll() {
    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFile(null);
    setCroppedBlob(null);
    setOutputPreview("");
    setError("");
    setIsProcessing(false);
    setX("0");
    setY("0");
    setWidth("500");
    setHeight("500");
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Cropper
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Crop images by setting crop coordinates, dimensions, and common aspect
          ratios, then preview and download the cropped image.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
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
              Allowed: PNG, JPG, or WebP.
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Selected:</span>{" "}
                {file.name}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Crop:</span> X{" "}
                {x}, Y {y}, {width} × {height}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                X
              </label>

              <input
                type="number"
                min="0"
                value={x}
                onChange={(event) => setX(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Y
              </label>

              <input
                type="number"
                min="0"
                value={y}
                onChange={(event) => setY(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
              />
            </div>

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
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => applyAspectRatio("1:1")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              1:1
            </button>

            <button
              onClick={() => applyAspectRatio("4:3")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              4:3
            </button>

            <button
              onClick={() => applyAspectRatio("16:9")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              16:9
            </button>

            <button
              onClick={() => applyAspectRatio("9:16")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              9:16
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={cropImage}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Download className="h-4 w-4" />
              {isProcessing ? "Cropping..." : "Crop image"}
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
                alt="Cropped output preview"
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your cropped image preview appears here after cropping.
              </p>
            )}
          </div>

          {croppedBlob && file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Output:</span>{" "}
                {baseName(file)}-cropped.png
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Crop:</span> X{" "}
                {x}, Y {y}, {width} × {height}
              </p>
            </div>
          ) : null}

          <button
            onClick={downloadCroppedImage}
            disabled={!croppedBlob}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Download className="h-4 w-4" />
            Download cropped image
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}