"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  ArrowLeft,
  Download,
  Eraser,
  FileText,
  ImageDown,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { fetchPdfApi } from "@/lib/apiBase";

function BackToToolsLink() {
  return (
    <Link
      href="/tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

type Mode = "image" | "pdf";

function targetBytesFromInput(value: string, unit: "KB" | "MB") {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return unit === "MB" ? parsed * 1024 * 1024 : parsed * 1024;
}

function formatTargetSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function ImageCompressorPage() {
  const [mode, setMode] = useState<Mode>("image");

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState("");

  const [originalPreview, setOriginalPreview] = useState("");
  const [compressedPreview, setCompressedPreview] = useState("");

  const [targetSizeValue, setTargetSizeValue] = useState("");
  const [targetSizeUnit, setTargetSizeUnit] = useState<"KB" | "MB">("KB");
  const [targetSizeHit, setTargetSizeHit] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "warning" | "error"; message: string } | null
  >(null);

  const reductionPercentage = useMemo(() => {
    if (!originalFile || !compressedFile) return 0;

    const reduced = originalFile.size - compressedFile.size;
    const percentage = (reduced / originalFile.size) * 100;

    return Math.max(0, Math.round(percentage));
  }, [originalFile, compressedFile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setFeedback(null);
    setCompressedFile(null);
    setOutputFileName("");
    setCompressedPreview("");

    if (!file) return;

    if (mode === "image" && !file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Please upload a valid image file.",
      });
      setOriginalFile(null);
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      setOriginalPreview("");
      return;
    }

    if (mode === "pdf" && file.type !== "application/pdf") {
      setFeedback({
        type: "error",
        message: "Please upload a valid PDF file.",
      });
      setOriginalFile(null);
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      setOriginalPreview("");
      return;
    }

    setOriginalFile(file);
    setPreviewUrl(setOriginalPreview, originalPreview, file);
  }

  async function compressImage(file: File, targetBytes: number) {
    let smallest: File | null = null;

    // Sweep quality AND max dimensions so the target is actually reachable.
    const dimensionSteps = [1920, 1600, 1280, 1024, 768, 512];
    const qualitySteps = [1.0, 0.8, 0.6, 0.4, 0.2, 0.1];

    for (const maxWidthOrHeight of dimensionSteps) {
      for (const attemptQuality of qualitySteps) {
        const options = {
          maxSizeMB: targetBytes / (1024 * 1024),
          maxWidthOrHeight,
          useWebWorker: true,
          initialQuality: attemptQuality,
        };

        const compressed = await imageCompression(file, options);

        if (!smallest || compressed.size < smallest.size) {
          smallest = compressed;
        }

        if (compressed.size <= targetBytes) return compressed;
      }
    }

    return smallest ?? file;
  }

  async function compressPdf(file: File, targetBytes: number) {
    let bestBlob: Blob | null = null;

    const qualities = [0.6, 0.35, 0.1];

    for (const attemptQuality of qualities) {
      try {
        const { blob } = await requestPdfCompression(file, attemptQuality);

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }

        if (blob.size <= targetBytes) {
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!bestBlob) {
      throw new Error(
        "Could not compress PDF. Please check the PDF compression backend.",
      );
    }

    return buildCompressedPdfFile(file, bestBlob);
  }

  async function requestPdfCompression(file: File, pdfQuality: number) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", String(pdfQuality));

    let response: Response;

    try {
      response = await fetchPdfApi("/api/pdf/compress", {
        method: "POST",
        body: formData,
      });
    } catch (caughtError) {
      throw new Error(
        caughtError instanceof Error
          ? `Could not reach PDF backend: ${caughtError.message}`
          : "Could not reach PDF backend.",
      );
    }

    if (!response.ok) {
      const responseText = await response.text();
      let data: { error?: string } | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      throw new Error(
        data?.error ||
          responseText ||
          "Could not compress PDF. Please check the PDF compression backend.",
      );
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("Compressed PDF is empty. Please try another PDF.");
    }

    return { blob };
  }

  function buildCompressedPdfFile(file: File, blob: Blob) {
    return new File(
      [blob],
      file.name.replace(/\.pdf$/i, "") + "-compressed.pdf",
      {
        type: "application/pdf",
      },
    );
  }

  async function compressFile() {
    if (!originalFile) {
      setFeedback({
        type: "error",
        message:
          mode === "image"
            ? "Please upload an image first."
            : "Please upload a PDF first.",
      });
      return;
    }

    if (!targetSizeValue.trim()) {
      setFeedback({
        type: "error",
        message: "Enter a target file size in KB or MB.",
      });
      return;
    }

    const targetBytes = targetBytesFromInput(targetSizeValue, targetSizeUnit);

    if (targetBytes === null) {
      setFeedback({
        type: "error",
        message: "Enter a valid target size greater than 0.",
      });
      return;
    }

    // Already under target — compression isn't needed.
    if (originalFile.size <= targetBytes) {
      setCompressedFile(originalFile);
      setOutputFileName(
        originalFile.name.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, ""),
      );
      setPreviewUrl(setCompressedPreview, compressedPreview, originalFile);
      setTargetSizeHit(true);
      setFeedback(null);
      return;
    }

    try {
      setFeedback(null);
      setIsCompressing(true);
      setTargetSizeHit(false);

      const compressed =
        mode === "image"
          ? await compressImage(originalFile, targetBytes)
          : await compressPdf(originalFile, targetBytes);

      setCompressedFile(compressed);
      setOutputFileName(
        compressed.name.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, ""),
      );

      setPreviewUrl(setCompressedPreview, compressedPreview, compressed);

      if (compressed.size > targetBytes) {
        setTargetSizeHit(false);
        setFeedback({
          type: "warning",
          message: `Couldn't quite reach ${formatTargetSize(targetBytes)} — smallest result is ${formatFileSize(compressed.size)}. Try a larger target size.`,
        });
      } else {
        setTargetSizeHit(true);

        if (compressed.size >= originalFile.size) {
          setFeedback({
            type: "warning",
            message:
              mode === "pdf"
                ? "This PDF could not be reduced much. It may already be optimized."
                : "This image could not be reduced much. Try a larger target size.",
          });
        }
      }
    } catch (caughtError) {
      setFeedback({
        type: "error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : mode === "image"
              ? "Could not compress this image. Please try another image."
              : "Could not compress this PDF. Please try another PDF.",
      });

      setCompressedFile(null);
      setCompressedPreview("");
    } finally {
      setIsCompressing(false);
    }
  }

  function downloadCompressedFile() {
    if (!compressedFile) return;

    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement("a");

    const originalName =
      originalFile?.name || (mode === "image" ? "image" : "document");

    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const selectedBaseName = outputFileName.trim()
      ? outputFileName.trim()
      : `${baseName}-compressed`;

    let extension = "jpg";

    if (mode === "pdf") {
      extension = "pdf";
    } else if (compressedFile.type.includes("png")) {
      extension = "png";
    } else if (compressedFile.type.includes("webp")) {
      extension = "webp";
    }

    link.href = url;
    link.download = `${selectedBaseName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);

    setOriginalFile(null);
    setCompressedFile(null);
    setOriginalPreview("");
    setCompressedPreview("");
    setFeedback(null);
    setIsCompressing(false);
    setTargetSizeValue("");
    setTargetSizeUnit("KB");
    setTargetSizeHit(false);
  }

  function setPreviewUrl(
    setter: Dispatch<SetStateAction<string>>,
    previousUrl: string,
    file: File,
  ) {
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    setter(URL.createObjectURL(file));
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    clearAll();
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image & PDF Compressor
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Compress images in your browser and PDFs.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => switchMode("image")}
          className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            mode === "image"
              ? "bg-violet-600 text-white"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          Image
        </button>

        <button
          type="button"
          onClick={() => switchMode("pdf")}
          className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            mode === "pdf"
              ? "bg-violet-600 text-white"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          PDF
        </button>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Upload {mode === "image" ? "image" : "PDF"}
            </label>

            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
              <Upload className="mb-3 h-8 w-8 text-violet-300" />

              <span className="font-medium text-white">
                Click to upload {mode === "image" ? "image" : "PDF"}
              </span>

              <span className="mt-2 text-sm text-slate-500">
                {mode === "image"
                  ? "JPG, PNG, WebP supported"
                  : "PDF files supported"}
              </span>

              <input
                type="file"
                accept={mode === "image" ? "image/*" : "application/pdf"}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {originalFile ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="break-all text-sm font-medium text-white">
                  {originalFile.name}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Original size: {formatFileSize(originalFile.size)}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Type: {originalFile.type || "Unknown"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Target file size
              </label>

              <div className="flex items-stretch gap-2">
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  inputMode="decimal"
                  value={targetSizeValue}
                  onChange={(event) => {
                    setTargetSizeValue(event.target.value);
                    setTargetSizeHit(false);
                  }}
                  placeholder={targetSizeUnit === "MB" ? "e.g. 1" : "e.g. 500"}
                  className="min-h-10 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                />

                <select
                  value={targetSizeUnit}
                  onChange={(event) => {
                    setTargetSizeUnit(event.target.value as "KB" | "MB");
                    setTargetSizeHit(false);
                  }}
                  className="min-h-10 shrink-0 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-violet-500"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </div>

            {feedback ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : feedback.type === "warning"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={compressFile}
                disabled={
                  !originalFile ||
                  isCompressing ||
                  !targetSizeValue.trim() ||
                  targetBytesFromInput(targetSizeValue, targetSizeUnit) === null
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCompressing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "image" ? (
                  <ImageDown className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                {isCompressing
                  ? "Compressing..."
                  : `Compress ${mode === "image" ? "image" : "PDF"}`}
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

            </div>
          </div>

          <div className="min-w-0">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Original</h2>

                {originalFile ? (
                  <span className="text-xs text-slate-400">
                    {formatFileSize(originalFile.size)}
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
                {mode === "image" && originalPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={originalPreview}
                    alt="Original preview"
                    className="max-h-[240px] w-full object-contain"
                  />
                ) : mode === "pdf" && originalPreview ? (
                  <iframe
                    src={originalPreview}
                    title="Original PDF preview"
                    className="h-[240px] w-full bg-white"
                  />
                ) : originalFile ? (
                  <div className="break-all px-4 text-center text-sm text-slate-500">
                    {mode === "pdf" ? (
                      <FileText className="mx-auto mb-2 h-8 w-8" />
                    ) : (
                      <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    )}

                    {originalFile.name}
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    No file selected
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Compressed</h2>

                {compressedFile ? (
                  <span className="text-xs text-emerald-300">
                    {formatFileSize(compressedFile.size)}
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
                {mode === "image" && compressedPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={compressedPreview}
                    alt="Compressed preview"
                    className="max-h-[240px] w-full object-contain"
                  />
                ) : mode === "pdf" && compressedPreview ? (
                  <iframe
                    src={compressedPreview}
                    title="Compressed PDF preview"
                    className="h-[240px] w-full bg-white"
                  />
                ) : compressedFile ? (
                  <div className="text-center text-sm text-slate-500">
                    {mode === "pdf" ? (
                      <FileText className="mx-auto mb-2 h-8 w-8" />
                    ) : (
                      <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    )}
                    Ready to download
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    Compressed file appears here
                  </div>
                )}
              </div>

            </div>

          </div>

          {compressedFile ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5 sm:p-6">
              <label
                htmlFor="compressed-output-name"
                className="mb-3 block text-base font-semibold text-slate-300"
              >
                File name
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <input
                  id="compressed-output-name"
                  type="text"
                  value={outputFileName}
                  onChange={(event) => setOutputFileName(event.target.value)}
                  className="min-h-12 w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 text-base text-white outline-none transition focus:border-violet-400/50"
                  aria-describedby="compressed-output-file-size"
                />

                <button
                  type="button"
                  onClick={downloadCompressedFile}
                  className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>

              <p
                id="compressed-output-file-size"
                className="mt-2 text-sm font-semibold text-slate-400"
              >
                {formatFileSize(compressedFile.size)}.{
                  mode === "pdf"
                    ? "pdf"
                    : compressedFile.type.includes("png")
                      ? "png"
                      : compressedFile.type.includes("webp")
                        ? "webp"
                        : "jpg"
                }
              </p>

             </div>
               ) : null}
          </div>
            </div>
         </div>

      {/* Desktop/tablet: keep the existing HowToUse component unchanged. */}
      <div className="hidden md:block">
        <HowToUse
          title="How to use Image & PDF Compressor"
          subtitle=""
          steps={[
            {
              title: "Choose mode",
              description: "Select Image or PDF compression.",
              icon: <ImageDown className="h-5 w-5" />,
            },
            {
              title: "Upload file",
              description: "Choose an image or PDF from your device.",
              icon: <Upload className="h-5 w-5" />,
            },
            {
              title: "Set target size",
              description:
                "Optionally set a target file size in KB or MB.",
              icon: <ImageIcon className="h-5 w-5" />,
            },
            {
              title: "Compress",
              description:
                "Images compress in-browser. PDFs compress through the Ghostscript backend.",
              icon: <Loader2 className="h-5 w-5" />,
            },
            {
              title: "Compare size",
              description: "Review original and compressed file sizes.",
              icon: <FileText className="h-5 w-5" />,
            },
            {
              title: "Download",
              description: "Save the optimized file to your device.",
              icon: <Download className="h-5 w-5" />,
            },
          ]}
        />
      </div>

      {/* Mobile only: icon on the left, with title and description on the right. */}
      <section
        className="mt-10 md:hidden"
        aria-labelledby="mobile-how-to-use-title"
      >
        <div className="mx-auto max-w-xl">
          <h2
            id="mobile-how-to-use-title"
            className="text-center text-2xl font-bold tracking-tight text-white"
          >
            How to use Image & PDF Compressor
          </h2>

          <div className="mt-6 space-y-3">
            {[
              {
                title: "Choose mode",
                description: "Select Image or PDF compression.",
                icon: <ImageDown className="h-5 w-5" />,
              },
              {
                title: "Upload file",
                description: "Choose an image or PDF from your device.",
                icon: <Upload className="h-5 w-5" />,
              },
              {
                title: "Set target size",
                description:
                  "Optionally set a target file size in KB or MB.",
                icon: <ImageIcon className="h-5 w-5" />,
              },
              {
                title: "Compress",
                description:
                  "Images compress in-browser. PDFs compress through the Ghostscript backend.",
                icon: <Loader2 className="h-5 w-5" />,
              },
              {
                title: "Compare size",
                description: "Review original and compressed file sizes.",
                icon: <FileText className="h-5 w-5" />,
              },
              {
                title: "Download",
                description: "Save the optimized file to your device.",
                icon: <Download className="h-5 w-5" />,
              },
            ].map((step) => (
              <div
                key={step.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                  {step.icon}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Container>
  );
}