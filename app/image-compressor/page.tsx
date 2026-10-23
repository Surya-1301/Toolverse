"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { UniversalPreview } from "@/components/UniversalPreview";
import { formatFileSize } from "@/lib/formatFileSize";
import { Capacitor } from "@capacitor/core";

function getImageApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_IMAGE_API_BASE_URL;

  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, "");
  }

  // Local web dev only. Inside the native app the origin is also
  // https://localhost, but http://localhost:10000 doesn't exist on the
  // phone (and would be blocked as mixed content) — so never use it there.
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    !Capacitor.isNativePlatform()
  ) {
    return "http://localhost:10000";
  }

  return "";
}

function formatApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "msg" in entry) {
          const msg = (entry as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length) return messages.join(" ");
  }

  return "";
}

function getImageApiErrorMessage(
  data: { error?: string; detail?: unknown } | null,
  responseText: string,
) {
  if (data?.error) return data.error;

  const detailMessage = formatApiDetail(data?.detail);
  if (detailMessage) return detailMessage;

  return responseText.trim();
}

function BackToToolsLink() {
  return (
    <Link
      href="/tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
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

/*
 * EXACT-SIZE PADDING — after compression reaches (or beats) the target,
 * pad the file up to EXACTLY the target byte count, so the output always
 * matches what the user typed. The padding is format-safe (decoders
 * ignore it):
 * - JPEG: decoders stop at the EOI marker; trailing bytes are ignored.
 * - PNG: a valid tEXt ancillary chunk is inserted before IEND.
 * - WebP / GIF / PDF: trailing bytes after the logical end are ignored.
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function padPngToSize(
  bytes: Uint8Array,
  targetBytes: number,
): Uint8Array<ArrayBuffer> {
  const out: Uint8Array<ArrayBuffer> = new Uint8Array(targetBytes);
  const padNeeded = targetBytes - bytes.length;
  // tEXt chunk layout: length(4 BE) + "tEXt"(4) + keyword + 0x00 + data + crc(4 BE)
  const keyword = [80, 97, 100, 100, 105, 110, 103]; // "Padding"
  const overhead = 4 + 4 + keyword.length + 1 + 4;

  if (padNeeded > overhead) {
    const dataLen = padNeeded - overhead;
    const chunk = new Uint8Array(overhead + dataLen);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, keyword.length + 1 + dataLen);
    chunk.set([0x74, 0x45, 0x58, 0x74], 4); // "tEXt"
    chunk.set(keyword, 8);
    chunk[8 + keyword.length] = 0; // null separator (data stays zero-filled)
    const crc = crc32(chunk.subarray(4, 8 + keyword.length + 1 + dataLen));
    view.setUint32(8 + keyword.length + 1 + dataLen, crc);

    // Insert before IEND (last 12 bytes); fall back to trailing append.
    let insertAt = bytes.length;
    if (
      bytes.length >= 12 &&
      bytes[bytes.length - 12] === 0 &&
      bytes[bytes.length - 11] === 0 &&
      bytes[bytes.length - 10] === 0 &&
      bytes[bytes.length - 9] === 0 &&
      bytes[bytes.length - 8] === 0x49 && // I
      bytes[bytes.length - 7] === 0x45 && // E
      bytes[bytes.length - 6] === 0x4e && // N
      bytes[bytes.length - 5] === 0x44 // D
    ) {
      insertAt = bytes.length - 12;
    }

    out.set(bytes.subarray(0, insertAt), 0);
    out.set(chunk, insertAt);
    out.set(bytes.subarray(insertAt), insertAt + chunk.length);
    return out;
  }

  // Tiny pad: trailing zeros after IEND are ignored by decoders.
  out.set(bytes, 0);
  return out;
}

async function padFileToExactSize(
  file: File,
  targetBytes: number,
): Promise<File> {
  if (file.size >= targetBytes) return file;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const padded =
    file.type === "image/png"
      ? padPngToSize(bytes, targetBytes)
      : (() => {
          const out = new Uint8Array(targetBytes);
          out.set(bytes);
          return out;
        })();
  return new File([padded], file.name, { type: file.type });
}

/*
 * HEIC CONTENT CHECK — a HEIC photo saved with a .jpg extension (common
 * for phone photos) is not detected by name/type, and the WebView cannot
 * decode HEIC at all — so sniff the ftyp box in the file header.
 */
async function isHeicByContent(inputFile: Blob) {
  try {
    const header = new Uint8Array(
      await inputFile.slice(0, 12).arrayBuffer(),
    );
    if (header.length < 12) return false;
    const ftyp = String.fromCharCode(...header.subarray(4, 8));
    if (ftyp !== "ftyp") return false;
    const brand = String.fromCharCode(...header.subarray(8, 12));
    return [
      "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs",
      "mif1", "msf1",
    ].includes(brand);
  } catch {
    return false;
  }
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

  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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

    // Snapshot the file bytes NOW. In the Capacitor WebView, a File
    // picked via <input type="file"> can become unreadable by the time
    // the user taps Compress ("permission problems that have occurred
    // after a reference to a file was acquired") — so copy the bytes
    // while the reference is fresh and work only with this in-memory File.
    try {
      const buffer = await file.arrayBuffer();
      const fresh = new File([buffer], file.name, { type: file.type });
      setOriginalFile(fresh);
      setPreviewUrl(setOriginalPreview, originalPreview, fresh);
    } catch {
      setFeedback({
        type: "error",
        message: "Could not read this file. Please pick it again.",
      });
      setOriginalFile(null);
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      setOriginalPreview("");
    }
  }

  async function compressImage(inputFile: File, targetBytes: number) {
    let file = inputFile;

    // HEIC photos saved with a .jpg extension (common for phone photos)
    // cannot be decoded by the WebView — convert to PNG first.
    if (await isHeicByContent(file)) {
      const { default: heic2any } = await import("heic2any");
      const converted = await heic2any({
        blob: file,
        toType: "image/png",
        quality: 1,
      });
      const pngBlob = Array.isArray(converted) ? converted[0] : converted;
      file = new File(
        [pngBlob],
        file.name.replace(/\.[^/.]+$/, "") + ".png",
        { type: "image/png" },
      );
    }

    let libraryError: unknown = null;
    try {
      const fromLibrary = await compressWithLibrary(file, targetBytes);
      if (fromLibrary.size <= targetBytes) return fromLibrary;
    } catch (error) {
      libraryError = error;
    }

    try {
      return await forceImageToTarget(file, targetBytes);
    } catch {
      throw libraryError ?? new Error("Could not compress this image.");
    }
  }

  // Decode via a data URL (no blob URL, no worker) — the most compatible
  // path inside the Capacitor Android WebView.
  async function decodeImageElement(file: File): Promise<HTMLImageElement> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(reader.error ?? new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("Image could not be decoded (data URL)"));
    });
    return img;
  }

  async function encodeJpegAt(
    img: HTMLImageElement,
    file: File,
    scale: number,
    quality: number,
  ): Promise<File | null> {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return null;
    return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  }

  async function forceImageToTarget(
    file: File,
    targetBytes: number,
  ): Promise<File> {
    const img = await decodeImageElement(file);
    let smallest: File | null = null;

    for (const scale of [1, 0.75, 0.5, 0.35, 0.25, 0.18, 0.12, 0.08, 0.05]) {
      let low = 0.02;
      let high = 0.95;
      let hit: File | null = null;

      for (let i = 0; i < 7; i++) {
        const quality = (low + high) / 2;
        const out = await encodeJpegAt(img, file, scale, quality);
        if (!out) break;
        if (!smallest || out.size < smallest.size) smallest = out;
        if (out.size <= targetBytes) {
          hit = out;
          low = quality; // fits — try a higher quality
        } else {
          high = quality; // too big — go lower
        }
      }

      if (hit) return hit;
    }

    if (!smallest) throw new Error("Could not encode this image.");
    return smallest;
  }

  async function compressWithLibrary(file: File, targetBytes: number) {
    let smallest: File | null = null;

    // Sweep quality AND max dimensions so the target is actually reachable.
    const dimensionSteps = [1920, 1600, 1280, 1024, 768, 512];
    const qualitySteps = [1.0, 0.8, 0.6, 0.4, 0.2, 0.1];

    for (const maxWidthOrHeight of dimensionSteps) {
      for (const attemptQuality of qualitySteps) {
        const options = {
          maxSizeMB: targetBytes / (1024 * 1024),
          maxWidthOrHeight,
          // Web Workers created from blob URLs fail inside the Capacitor
          // Android WebView — run on the main thread instead.
          useWebWorker: false,
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
    // 1. Try the server-side Ghostscript compression first.
    let serverBlob: Blob | null = null;

    try {
      const result = await requestPdfCompression(file, 0.6, targetBytes);
      serverBlob = result.blob;
    } catch {
      // Backend unavailable — go straight to client-side rasterisation.
    }

    if (serverBlob && serverBlob.size <= targetBytes) {
      return buildCompressedPdfFile(file, serverBlob);
    }

    const rasterised = await rasterisePdfToTarget(file, targetBytes);

    if (rasterised.size <= targetBytes) {
      return buildCompressedPdfFile(file, rasterised);
    }

    // 3. Pick whichever is smallest between backend and rasterised result.
    const bestBlob =
      serverBlob && serverBlob.size < rasterised.size
        ? serverBlob
        : rasterised;

    return buildCompressedPdfFile(file, bestBlob);
  }

  async function rasterisePdfToTarget(
    file: File,
    targetBytes: number,
  ): Promise<Blob> {
    type PdfJsLib = typeof import("pdfjs-dist");
    const pdfjsLib: PdfJsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@" +
      pdfjsLib.version +
      "/build/pdf.worker.min.mjs";

    const { PDFDocument } = await import("pdf-lib");

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdfDoc.numPages;

    // Budget per page (rough estimate) — each page gets an equal share
    // minus ~800 bytes overhead for the PDF structure per page.
    const perPageBudget = Math.max(
      1024,
      Math.floor((targetBytes - 1024) / pageCount),
    );

    // Sweep scale × quality combos from high to low.
    const scales = [2, 1.5, 1, 0.75, 0.5, 0.35, 0.25, 0.18, 0.12];
    const qualities = [0.7, 0.5, 0.3, 0.2, 0.1, 0.05];

    let smallest: Blob | null = null;

    for (const scale of scales) {
      for (const quality of qualities) {
        // Quick budget check: render page 1 and see if per-page bytes
        // are in the ballpark before rendering every page.
        const testJpeg = await renderPageToJpeg(
          pdfDoc,
          1,
          scale,
          quality,
        );

        if (testJpeg.bytes.length > perPageBudget && smallest) {
          // This combo is too large and we already have a candidate — skip.
          continue;
        }

        // Render all pages.
        const pages: Array<{
          bytes: Uint8Array;
          width: number;
          height: number;
        }> = [testJpeg];

        for (let p = 2; p <= pageCount; p++) {
          pages.push(await renderPageToJpeg(pdfDoc, p, scale, quality));
        }

        // Rebuild the PDF with pdf-lib.
        const newPdf = await PDFDocument.create();

        for (const pg of pages) {
          const img = await newPdf.embedJpg(pg.bytes);
          const page = newPdf.addPage([pg.width, pg.height]);
          page.drawImage(img, {
            x: 0,
            y: 0,
            width: pg.width,
            height: pg.height,
          });
        }

        const pdfBytes = await newPdf.save();
        const blob = new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });

        if (!smallest || blob.size < smallest.size) {
          smallest = blob;
        }

        if (blob.size <= targetBytes) {
          return blob;
        }
      }
    }

    return smallest ?? new Blob([arrayBuffer], { type: "application/pdf" });
  }

  async function renderPageToJpeg(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfDoc: any,
    pageNum: number,
    scale: number,
    quality: number,
  ): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context.");

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        quality,
      );
    });

    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Use the original page dimensions (in points) so the rebuilt PDF
    // keeps the same page size regardless of the render scale.
    const originalViewport = page.getViewport({ scale: 1 });

    return {
      bytes,
      width: originalViewport.width,
      height: originalViewport.height,
    };
  }

  async function requestPdfCompression(
    file: File,
    pdfQuality: number,
    targetBytes: number,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", String(pdfQuality));
    formData.append("target_size", String(targetBytes));

    const imageApiBaseUrl = getImageApiBaseUrl();

    if (!imageApiBaseUrl) {
      throw new Error(
        "Image API URL is missing. Add NEXT_PUBLIC_IMAGE_API_BASE_URL and redeploy.",
      );
    }

    let response: Response;

    try {
      response = await fetch(`${imageApiBaseUrl}/api/pdf/compress`, {
        method: "POST",
        body: formData,
      });
    } catch (caughtError) {
      throw new Error(
        caughtError instanceof Error
          ? `Could not reach image backend: ${caughtError.message}`
          : "Could not reach image backend.",
      );
    }

    if (!response.ok) {
      const responseText = await response.text();
      let data: { error?: string; detail?: unknown } | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      throw new Error(
        getImageApiErrorMessage(data, responseText) ||
          "Could not compress PDF. Please check the image compression backend.",
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
      setFeedback({
        type: "success",
        message: `Already under ${formatTargetSize(targetBytes)} — no compression needed.`,
      });
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

      // Force the exact value the user typed: pad up to the target byte
      // count with format-safe padding (decoders ignore it).
      const exactSized =
        compressed.size < targetBytes
          ? await padFileToExactSize(compressed, targetBytes)
          : compressed;

      setCompressedFile(exactSized);
      setOutputFileName(
        exactSized.name.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, ""),
      );

      setPreviewUrl(setCompressedPreview, compressedPreview, exactSized);

      if (exactSized.size > targetBytes) {
        setTargetSizeHit(false);
        setFeedback({
          type: "warning",
          message: `Couldn't quite reach ${formatTargetSize(targetBytes)} — smallest result is ${formatFileSize(exactSized.size)}. Try a larger target size.`,
        });
      } else {
        setTargetSizeHit(true);
        setFeedback(null);
      }
    } catch (caughtError) {
      setFeedback({
        type: "error",
        message:
          caughtError instanceof Error || caughtError instanceof DOMException
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

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Compress images in your browser and PDFs.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-1 light:border-slate-900/10 light:bg-white">
        <button
          type="button"
          onClick={() => switchMode("image")}
          className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            mode === "image"
              ? "bg-violet-600 text-white"
              : "text-slate-400 hover:bg-white/10 hover:text-white light:text-slate-600 light:hover:bg-slate-900/5 light:hover:text-slate-900"
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
              : "text-slate-400 hover:bg-white/10 hover:text-white light:text-slate-600 light:hover:bg-slate-900/5 light:hover:text-slate-900"
          }`}
        >
          PDF
        </button>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300 light:text-slate-700">
              Upload {mode === "image" ? "image" : "PDF"}
            </label>

            {/* Upload — the input is opened with an explicit click() call:
                a <label> wrapping a display:none input does not reliably
                open the file chooser inside the Capacitor Android WebView. */}
            <div
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPicker();
                }
              }}
              className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center transition hover:border-violet-500/60 hover:bg-white/[0.03] light:border-slate-900/15 light:bg-white light:hover:bg-slate-50"
            >
              <Upload className="mb-3 h-8 w-8 text-violet-300" />

              <span className="font-medium text-white light:text-slate-900">
                Click to upload {mode === "image" ? "image" : "PDF"}
              </span>

              <span className="mt-2 text-sm text-slate-500 light:text-slate-500">
                {mode === "image"
                  ? "JPG, PNG, WebP supported"
                  : "PDF files supported"}
              </span>

              <input
                ref={inputRef}
                type="file"
                accept={mode === "image" ? "image/*" : "application/pdf"}
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>

            {originalFile ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-white">
                <p className="break-all text-sm font-medium text-white light:text-slate-900">
                  {originalFile.name}
                </p>

                <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                  Original size: {formatFileSize(originalFile.size)}
                </p>

                <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                  Type: {originalFile.type || "Unknown"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-white">
              <label className="mb-2 block text-sm font-medium text-slate-300 light:text-slate-700">
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
                  className="min-h-10 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
                />

                <select
                  value={targetSizeUnit}
                  onChange={(event) => {
                    setTargetSizeUnit(event.target.value as "KB" | "MB");
                    setTargetSizeHit(false);
                  }}
                  className="min-h-10 shrink-0 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900"
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
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCompressing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "image" ? (
                  <ImageDown className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                <span className="whitespace-nowrap sm:whitespace-normal">
                  {isCompressing
                    ? "Compressing..."
                    : `Compress ${mode === "image" ? "image" : "PDF"}`}
                </span>
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

            </div>
          </div>

          <div className="min-w-0">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-white">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Original</h2>

                {originalFile ? (
                  <span className="text-xs text-slate-400 light:text-slate-600">
                    {formatFileSize(originalFile.size)}
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-white/[0.03] light:bg-white">
                {originalFile || originalPreview ? (
                  <UniversalPreview
                    file={originalFile}
                    url={originalPreview}
                    name={originalFile?.name || "Original file"}
                    type={originalFile?.type || (mode === "pdf" ? "application/pdf" : "image/jpeg")}
                    height={240}
                    showControls={mode === "pdf"}
                  />
                ) : (
                  <div className="text-center text-sm text-slate-500 light:text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    No file selected
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-white">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Compressed</h2>

                {compressedFile ? (
                  <span className="text-xs text-emerald-300">
                    {formatFileSize(compressedFile.size)}
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-white/[0.03] light:bg-white">
                {compressedFile || compressedPreview ? (
                  <UniversalPreview
                    file={compressedFile}
                    url={compressedPreview}
                    name={compressedFile?.name || "Compressed file"}
                    type={compressedFile?.type || (mode === "pdf" ? "application/pdf" : "image/jpeg")}
                    height={240}
                    showControls={mode === "pdf"}
                  />
                ) : (
                  <div className="text-center text-sm text-slate-500 light:text-slate-500">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    Compressed file appears here
                  </div>
                )}
              </div>

            </div>

          </div>

          {compressedFile ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5 sm:p-6 light:border-slate-900/10 light:bg-slate-100">
              <label
                htmlFor="compressed-output-name"
                className="mb-3 block text-base font-semibold text-slate-300 light:text-slate-700"
              >
                File name
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <input
                  id="compressed-output-name"
                  type="text"
                  value={outputFileName}
                  onChange={(event) => setOutputFileName(event.target.value)}
                  className="min-h-12 w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 text-base text-white outline-none transition focus:border-violet-400/50 light:border-slate-900/10 light:bg-white light:text-slate-900"
                  aria-describedby="compressed-output-file-size"
                />

                <button
                  type="button"
                  onClick={downloadCompressedFile}
                  className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-7 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto light:focus-visible:ring-offset-slate-100 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>

              <p
                id="compressed-output-file-size"
                className="mt-2 text-sm font-semibold text-slate-400 light:text-slate-600"
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
                "Set a target file size in KB or MB — the output is forced to exactly that size.",
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
            className="text-center text-2xl font-bold tracking-tight text-white light:text-slate-900"
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
                  "Set a target file size in KB or MB — the output is forced to exactly that size.",
                icon: <ImageIcon className="h-5 w-5" />,
              },
              {
                title: "Compress & download",
                description:
                  "Compress your file instantly and save the optimized result to your device.",
                icon: <Download className="h-5 w-5" />,
              },
            ].map((step) => (
              <div
                key={step.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 light:border-slate-900/10 light:bg-white"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                  {step.icon}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-semibold text-white light:text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400 light:text-slate-600">
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