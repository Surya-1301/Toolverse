"use client";

import { useState } from "react";
import {
  Download,
  Eraser,
  ImageDown,
  ImagePlus,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

function getImageApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_IMAGE_API_BASE_URL;

  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:10000";
  }

  return "";
}

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

const howToUseSteps = [
  {
    title: "Upload image",
    description: "Choose a PNG, JPG, JPEG, or WebP image from your device.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Send to backend",
    description: "The image is securely sent to your background removal API.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Remove background",
    description: "The backend removes the background and returns a PNG file.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Preview output",
    description: "Review the transparent PNG in the output preview panel.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download PNG",
    description: "Save the image with removed background to your device.",
    icon: <Download className="h-5 w-5" />,
  },
  {
    title: "Clear & retry",
    description: "Clear the current image and process another file anytime.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Background Remover
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

export default function BackgroundRemoverPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputPreview, setOutputPreview] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;

    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFile(selectedFile);
    setOutputPreview("");
    setResultBlob(null);
    setError("");

    event.target.value = "";
  }

  async function removeBackground() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    const apiBaseUrl = getImageApiBaseUrl();

    if (!apiBaseUrl) {
      setError(
        "Image API URL is missing. Add NEXT_PUBLIC_IMAGE_API_BASE_URL in Cloudflare Pages and redeploy.",
      );
      return;
    }

    try {
      setError("");
      setIsProcessing(true);
      setResultBlob(null);

      if (outputPreview) {
        URL.revokeObjectURL(outputPreview);
        setOutputPreview("");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${apiBaseUrl}/api/image/remove-background`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        let message = "Background removal failed. Please try another image.";

        try {
          const data = await response.json();
          message = data?.detail || data?.error || message;
        } catch {
          try {
            const text = await response.text();
            message = text || message;
          } catch {
            // keep default message
          }
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The backend returned an empty image.");
      }

      const previewUrl = URL.createObjectURL(blob);

      setResultBlob(blob);
      setOutputPreview(previewUrl);
    } catch (caughtError) {
      setResultBlob(null);
      setOutputPreview("");

      const message =
        caughtError instanceof TypeError
          ? "Could not reach the image backend. Check Render URL, CORS, and Cloudflare NEXT_PUBLIC_IMAGE_API_BASE_URL."
          : caughtError instanceof Error
            ? caughtError.message
            : "Could not remove background. Please try again.";

      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadResult() {
    if (!resultBlob || !file) return;

    downloadBlob(resultBlob, `${baseName(file)}-no-bg.png`);
  }

  function clearAll() {
    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setFile(null);
    setOutputPreview("");
    setResultBlob(null);
    setError("");
    setIsProcessing(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Background Remover
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Upload an image, remove the background using your image backend, and
          download a transparent PNG.
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
              Allowed: PNG, JPG, JPEG, or WebP up to 25 MB.
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
                <span className="font-semibold text-slate-300">Type:</span>{" "}
                {file.type || "Unknown"}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={removeBackground}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Wand2 className="h-4 w-4" />
              {isProcessing ? "Removing..." : "Remove background"}
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
              {isProcessing
                ? "Processing"
                : outputPreview
                  ? "Preview ready"
                  : "Waiting"}
            </span>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center">
            {outputPreview ? (
              <img
                src={outputPreview}
                alt="Background removed preview"
                className="max-h-[380px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your transparent background image appears here after processing.
              </p>
            )}
          </div>

          {resultBlob && file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">Output:</span>{" "}
                {baseName(file)}-no-bg.png
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300">Format:</span>{" "}
                PNG with transparent background
              </p>
            </div>
          ) : null}

          <button
            onClick={downloadResult}
            disabled={!resultBlob}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Download className="h-4 w-4" />
            Download transparent PNG
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}