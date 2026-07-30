"use client";

import { useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  Download,
  Eraser,
  ImageDown,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";

export default function ImageCompressorPage() {
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

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      setOriginalFile(null);
      setOriginalPreview("");
      return;
    }

    setOriginalFile(file);
    setOriginalPreview(URL.createObjectURL(file));
  }

  async function compressImage() {
    if (!originalFile) {
      setError("Please upload an image first.");
      return;
    }

    try {
      setError("");
      setIsCompressing(true);

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
      };

      const compressed = await imageCompression(originalFile, options);

      setCompressedFile(compressed);
      setCompressedPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Could not compress this image. Please try another image.");
      setCompressedFile(null);
      setCompressedPreview("");
    } finally {
      setIsCompressing(false);
    }
  }

  function downloadCompressedImage() {
    if (!compressedFile) return;

    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement("a");

    const originalName = originalFile?.name || "image";
    const extension = compressedFile.type.includes("png") ? "png" : "jpg";
    const baseName = originalName.replace(/\.[^/.]+$/, "");

    link.href = url;
    link.download = `${baseName}-compressed.${extension}`;
    link.click();

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

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300">
          <ImageDown className="h-7 w-7" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image Compressor
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Compress JPG, PNG, and WebP images directly in your browser. Reduce
          image file size without uploading your files.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Upload image
            </label>

            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03]">
              <Upload className="mb-3 h-8 w-8 text-violet-300" />
              <span className="font-medium text-white">
                Click to upload image
              </span>
              <span className="mt-2 text-sm text-slate-500">
                JPG, PNG, WebP supported
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {originalFile ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm font-medium text-white">
                  {originalFile.name}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Original size: {formatFileSize(originalFile.size)}
                </p>
              </div>
            ) : null}

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Quality
                </label>
                <span className="text-sm text-violet-300">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="w-full accent-violet-600"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Lower quality creates smaller files. 70% is a good balance.
              </p>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={compressImage}
                disabled={!originalFile || isCompressing}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCompressing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageDown className="h-4 w-4" />
                )}
                {isCompressing ? "Compressing..." : "Compress"}
              </button>

              <button
                onClick={downloadCompressedImage}
                disabled={!compressedFile}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Download
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
                {originalPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={originalPreview}
                    alt="Original preview"
                    className="max-h-[240px] w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    No image selected
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
                {compressedPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={compressedPreview}
                    alt="Compressed preview"
                    className="max-h-[240px] w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    Compressed image appears here
                  </div>
                )}
              </div>
            </div>

            {compressedFile && originalFile ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <p className="text-sm font-semibold text-emerald-200">
                  Reduced by {reductionPercentage}%
                </p>
                <p className="mt-1 text-sm text-emerald-100/80">
                  {formatFileSize(originalFile.size)} →{" "}
                  {formatFileSize(compressedFile.size)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">How to use</h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-400">
          <li>Upload a JPG, PNG, or WebP image.</li>
          <li>Adjust the quality slider if needed.</li>
          <li>Click Compress to reduce image size.</li>
          <li>Preview the compressed image and download it.</li>
        </ol>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">FAQ</h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Are my images uploaded?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              No. Image compression happens directly in your browser, so your
              image stays on your device.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Which image formats are supported?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              JPG, PNG, and WebP images are supported by most modern browsers.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">What quality should I use?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              70% is a good balance between quality and file size. Use a lower
              value for smaller files.
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}