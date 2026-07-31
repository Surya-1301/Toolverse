"use client";

import { useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import {
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

type Mode = "image" | "pdf";

export default function ImageCompressorPage() {
  const [mode, setMode] = useState<Mode>("image");

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  const [originalPreview, setOriginalPreview] = useState("");
  const [compressedPreview, setCompressedPreview] = useState("");

  const [quality, setQuality] = useState(0.7);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState("");

  const reductionPercentage = useMemo(() => {
    if (!originalFile || !compressedFile) return 0;

    const reduced = originalFile.size - compressedFile.size;
    const percentage = (reduced / originalFile.size) * 100;

    return Math.max(0, Math.round(percentage));
  }, [originalFile, compressedFile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setCompressedFile(null);
    setCompressedPreview("");

    if (!file) return;

    if (mode === "image" && !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      setOriginalFile(null);
      setOriginalPreview("");
      return;
    }

    if (mode === "pdf" && file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      setOriginalFile(null);
      setOriginalPreview("");
      return;
    }

    setOriginalFile(file);

    if (mode === "image") {
      setOriginalPreview(URL.createObjectURL(file));
    } else {
      setOriginalPreview("");
    }
  }

  async function compressImage(file: File) {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: quality,
    };

    return imageCompression(file, options);
  }

  async function compressPdfClientSide(file: File) {
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return new File(
      [compressedBytes as BlobPart],
      file.name.replace(/\.pdf$/i, "") + "-compressed.pdf",
      {
        type: "application/pdf",
      },
    );
  }

  async function compressFile() {
    if (!originalFile) {
      setError(
        mode === "image"
          ? "Please upload an image first."
          : "Please upload a PDF first.",
      );
      return;
    }

    try {
      setError("");
      setIsCompressing(true);

      const compressed =
        mode === "image"
          ? await compressImage(originalFile)
          : await compressPdfClientSide(originalFile);

      setCompressedFile(compressed);

      if (mode === "image") {
        setCompressedPreview(URL.createObjectURL(compressed));
      } else {
        setCompressedPreview("");
      }

      if (compressed.size >= originalFile.size) {
        setError(
          mode === "pdf"
            ? "This PDF could not be reduced much. Some PDFs are already optimized or contain scanned images that cannot be compressed further in the browser."
            : "This image could not be reduced much. Try lowering the quality.",
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : mode === "image"
            ? "Could not compress this image. Please try another image."
            : "Could not compress this PDF. Please try another PDF.",
      );
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

    let extension = "jpg";

    if (mode === "pdf") {
      extension = "pdf";
    } else if (compressedFile.type.includes("png")) {
      extension = "png";
    } else if (compressedFile.type.includes("webp")) {
      extension = "webp";
    }

    link.href = url;
    link.download = `${baseName}-compressed.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setOriginalFile(null);
    setCompressedFile(null);
    setOriginalPreview("");
    setCompressedPreview("");
    setError("");
    setIsCompressing(false);
    setQuality(0.7);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    clearAll();
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image & PDF Compressor
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Compress images and PDF files directly in your browser with simple
          quality controls.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <button
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

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-300">
                  Quality
                </label>

                <span className="rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="mt-3 w-full accent-violet-500"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Lower quality usually creates a smaller file. For PDFs, browser
                compression rewrites and optimizes the PDF structure, but
                scanned/image-heavy PDFs may not shrink much.
              </p>
            </div>

            {error ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  compressedFile
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-red-500/30 bg-red-500/10 text-red-200"
                }`}
              >
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={compressFile}
                disabled={!originalFile || isCompressing}
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
                onClick={clearAll}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

              {compressedFile ? (
                <button
                  onClick={downloadCompressedFile}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              ) : null}
            </div>
          </div>

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

            {compressedFile && originalFile ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <p className="text-sm font-semibold text-emerald-200">
                  File size reduced by {reductionPercentage}%
                </p>

                <p className="mt-1 text-sm text-emerald-100/80">
                  {formatFileSize(originalFile.size)} →{" "}
                  {formatFileSize(compressedFile.size)}
                </p>

                {mode === "pdf" && reductionPercentage === 0 ? (
                  <p className="mt-2 text-xs leading-5 text-emerald-100/70">
                    This PDF may already be optimized. Browser PDF compression
                    cannot strongly compress scanned/image-heavy PDFs.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
            title: "Set quality",
            description: "Use the quality slider to control output size.",
            icon: <ImageIcon className="h-5 w-5" />,
          },
          {
            title: "Compress",
            description: "Run compression directly in your browser.",
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
    </Container>
  );
}