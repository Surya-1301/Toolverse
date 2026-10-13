"use client";

import { useRef, useState } from "react";
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

type OutputFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/image-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

/* ==========================================================================
   HOW TO USE
========================================================================== */

const howToUseSteps = [
  {
    title: "Upload image",
    description:
      "Choose a PNG, JPG, WebP, HEIC, HEIF, or supported image file.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Choose format",
    description:
      "Select PNG, JPG, or WebP as your output format.",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    title: "Set quality",
    description:
      "Use the quality slider to control output size and clarity.",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Convert",
    description:
      "Click convert image to generate the new output file.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Preview output",
    description:
      "Review the converted image in the output preview panel.",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Download",
    description:
      "Save the converted PNG, JPG, or WebP file to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

/* ==========================================================================
   HOW TO USE SECTION
========================================================================== */


/* ==========================================================================
   PAGE
========================================================================== */

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputPreview, setOutputPreview] = useState("");
  const [convertedBlob, setConvertedBlob] =
    useState<Blob | null>(null);

  const [format, setFormat] =
    useState<OutputFormat>("image/png");

  const [quality, setQuality] = useState(0.9);

  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] =
    useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  /* ------------------------------------------------------------------------
     OUTPUT EXTENSION
  ------------------------------------------------------------------------ */

  function getOutputExtension() {
    if (format === "image/png") return "png";
    if (format === "image/webp") return "webp";

    return "jpg";
  }

  /* ------------------------------------------------------------------------
     HEIC CHECK
  ------------------------------------------------------------------------ */

  function isHeicFile(inputFile: File) {
    const fileName = inputFile.name.toLowerCase();

    return (
      inputFile.type === "image/heic" ||
      inputFile.type === "image/heif" ||
      fileName.endsWith(".heic") ||
      fileName.endsWith(".heif")
    );
  }

  /* ------------------------------------------------------------------------
     FILE HANDLER
  ------------------------------------------------------------------------ */

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextFile =
      event.target.files?.[0] || null;

    setError("");
    setConvertedBlob(null);

    if (outputPreview) {
      URL.revokeObjectURL(outputPreview);
    }

    setOutputPreview("");

    /*
     * Reset input value so the same file can be selected
     * again after clearing.
     */
    event.target.value = "";

    if (!nextFile) {
      setFile(null);
      return;
    }

    // Snapshot the file bytes NOW. In the Capacitor WebView, a File
    // picked via <input type="file"> can become unreadable by the time
    // the user taps Convert ("permission problems that have occurred
    // after a reference to a file was acquired") — so copy the bytes
    // while the reference is fresh and work only with this in-memory File.
    try {
      const buffer = await nextFile.arrayBuffer();
      setFile(
        new File([buffer], nextFile.name, { type: nextFile.type }),
      );
    } catch {
      setError("Could not read this file. Please pick it again.");
      setFile(null);
    }
  }

  /* ------------------------------------------------------------------------
     HEIC CONTENT CHECK
     A HEIC photo saved with a .jpg extension (common for phone photos)
     is not detected by name/type, and the WebView cannot decode HEIC at
     all — so sniff the ftyp box in the file header.
  ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------
     IMAGE DECODING
     Tries three decode paths in order, collecting each failure — the final
     error names every path so a failure can actually be diagnosed.
     1. createImageBitmap decodes the Blob directly (no object URL).
     2. <img> + blob URL.
     3. <img> + data URL (most compatible; no blob URL involved).
  ------------------------------------------------------------------------ */

  async function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(reader.error ?? new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  }

  async function loadImageFromUrl(
    url: string,
    label: string,
  ): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error(`Image could not be loaded (${label})`));
    });
    return image;
  }

  async function loadImageBitmap(
    source: Blob,
  ): Promise<ImageBitmap | HTMLImageElement> {
    const failures: string[] = [];

    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(source);
      } catch (error) {
        failures.push(
          `createImageBitmap: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    try {
      const url = URL.createObjectURL(source);
      try {
        return await loadImageFromUrl(url, "blob URL");
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      failures.push(
        `blob URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const dataUrl = await blobToDataURL(source);
      return await loadImageFromUrl(dataUrl, "data URL");
    } catch (error) {
      failures.push(
        `data URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    throw new Error(
      `Image could not be decoded (${failures.join("; ")})`,
    );
  }

  /* ------------------------------------------------------------------------
     IMAGE CONVERSION
  ------------------------------------------------------------------------ */

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
       *
       * IMPORTANT:
       * heic2any is dynamically imported here instead of being imported
       * at the top of the file. This prevents the package from being
       * evaluated during Next.js server-side prerendering.
       */
      if (isHeicFile(file) || (await isHeicByContent(file))) {
        try {
          const { default: heic2any } =
            await import("heic2any");

          const converted = await heic2any({
            blob: file,
            toType: "image/png",
            quality: 1,
          });

          sourceBlob = Array.isArray(converted)
            ? converted[0]
            : converted;
        } catch (heicError) {
          console.error(
            "HEIC conversion error:",
            heicError,
          );

          setError(
            "Could not read this HEIC/HEIF image. Please make sure the file is valid and try again.",
          );

          setIsProcessing(false);
          return;
        }
      }

      /* --------------------------------------------------------------------
         LOAD SOURCE IMAGE
      -------------------------------------------------------------------- */

      const bitmap = await loadImageBitmap(sourceBlob);
      const sourceWidth =
        "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
      const sourceHeight =
        "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;

      /* --------------------------------------------------------------------
         CANVAS
      -------------------------------------------------------------------- */

      const canvas =
        document.createElement("canvas");

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        setError(
          "Could not prepare image canvas.",
        );

        setIsProcessing(false);
        return;
      }

      /*
       * JPEG does not support transparency.
       * Fill transparent areas with white.
       */
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }

      ctx.drawImage(bitmap, 0, 0);
      if ("close" in bitmap) bitmap.close();

      /* --------------------------------------------------------------------
         CREATE OUTPUT
      -------------------------------------------------------------------- */

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError(
              "Could not convert image.",
            );

            setIsProcessing(false);
            return;
          }

          const nextPreview =
            URL.createObjectURL(blob);

          setConvertedBlob(blob);
          setOutputPreview(nextPreview);
          setIsProcessing(false);
        },
        format,
        quality,
      );
    } catch (conversionError) {
      console.error(
        "Image conversion error:",
        conversionError,
      );

      setError(
        `Could not convert this image. ${
          conversionError instanceof Error
            ? conversionError.message
            : "Please make sure the file is valid and try again."
        }`,
      );

      setIsProcessing(false);
    }
  }

  /* ------------------------------------------------------------------------
     DOWNLOAD
  ------------------------------------------------------------------------ */

  function downloadConvertedImage() {
    if (!convertedBlob || !file) {
      return;
    }

    downloadBlob(
      convertedBlob,
      `${baseName(file)}-converted.${getOutputExtension()}`,
    );
  }

  /* ------------------------------------------------------------------------
     CLEAR
  ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------
     UI
  ------------------------------------------------------------------------ */

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      {/* ====================================================================
          HEADER
      ==================================================================== */}

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Image Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Convert PNG, JPG, WebP, HEIC, and HEIF images
          directly in your browser.
        </p>
      </div>

      {/* ====================================================================
          MAIN TOOL
      ==================================================================== */}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* ================================================================
            UPLOAD / SETTINGS
        ================================================================ */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 light:border-slate-900/10 light:bg-white">
          <h2 className="mb-4 text-lg font-semibold text-white light:text-slate-900">
            Upload image
          </h2>

          {/* Upload */}

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
            className="
              flex
              min-h-[230px]
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-white/15
              bg-slate-950
              p-6
              text-center
              transition
              hover:border-violet-500/60
              hover:bg-white/[0.03]
            light:border-slate-900/15 light:bg-white light:hover:bg-slate-50"
          >
            <Upload className="mb-3 h-9 w-9 text-violet-300" />

            <span className="font-semibold text-white light:text-slate-900">
              Click to choose image
            </span>

            <span className="mt-2 text-sm leading-6 text-slate-500 light:text-slate-500">
              Allowed: PNG, JPG, WebP, HEIC, or HEIF.
            </span>

            <input
              ref={inputRef}
              type="file"
              accept="
                image/png,
                image/jpeg,
                image/webp,
                image/heic,
                image/heif,
                .png,
                .jpg,
                .jpeg,
                .webp,
                .heic,
                .heif
              "
              onChange={handleFile}
              className="sr-only"
            />
          </div>

          {/* Selected file */}

          {file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400 light:border-slate-900/10 light:bg-white light:text-slate-600">
              <p>
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Selected:
                </span>{" "}
                {file.name}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Type:
                </span>{" "}
                {file.type || "Unknown"}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Size:
                </span>{" "}
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : null}

          {/* Settings */}

          <div className="mt-5 grid grid-cols-2 gap-4">
            {/* Output format */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300 light:text-slate-700">
                Output format
              </label>

              <select
                value={format}
                onChange={(event) =>
                  setFormat(
                    event.target.value as OutputFormat,
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950
                  px-4
                  py-3
                  text-white
                  outline-none
                  transition
                  focus:border-violet-500
                light:border-slate-900/10 light:bg-white light:text-slate-900"
              >
                <option value="image/png">
                  PNG
                </option>

                <option value="image/jpeg">
                  JPG
                </option>

                <option value="image/webp">
                  WebP
                </option>
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300 light:text-slate-700">
                Quality: {Math.round(quality * 100)}%
              </label>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(event) =>
                  setQuality(
                    Number(event.target.value),
                  )
                }
                className="mt-4 w-full accent-violet-500"
              />
            </div>
          </div>

          {/* Error */}
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {/* Buttons */}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={convertImage}
              disabled={isProcessing || !file}
              className="
                inline-flex
                min-h-11
                flex-1
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-xl
                bg-violet-600
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-violet-500
                disabled:cursor-not-allowed
                disabled:bg-slate-700
                disabled:text-slate-400
                sm:px-4
                sm:text-sm
              light:disabled:bg-slate-200"
            >
              <Wand2 className="h-4 w-4" />

              {isProcessing
                ? "Converting..."
                : "Convert image"}
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="
                inline-flex
                min-h-11
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-red-500/30
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-300
                transition
                hover:bg-red-500/10

              "
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        {/* ================================================================
            OUTPUT
        ================================================================ */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 light:border-slate-900/10 light:bg-white">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white light:text-slate-900">
              Converted output
            </h2>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400 light:bg-slate-200 light:text-slate-600">
              {outputPreview
                ? "Preview ready"
                : "Waiting"}
            </span>
          </div>

          {/* Preview */}

          <div
            className="
              flex
              min-h-[420px]
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-white/15
              bg-slate-950
              p-6
              text-center
            light:border-slate-900/15 light:bg-white"
          >
            {outputPreview ? (
              <img
                src={outputPreview}
                alt="Converted output preview"
                className="
                  max-h-[380px]
                  max-w-full
                  rounded-xl
                  object-contain
                "
              />
            ) : (
              <p className="text-sm leading-6 text-slate-500 light:text-slate-500">
                Your converted image preview appears
                here after conversion.
              </p>
            )}
          </div>

          {/* Output details */}

          {convertedBlob && file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400 light:border-slate-900/10 light:bg-white light:text-slate-600">
              <p>
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Output:
                </span>{" "}
                {baseName(file)}-converted.
                {getOutputExtension()}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Format:
                </span>{" "}
                {getOutputExtension().toUpperCase()}
              </p>

              <p className="mt-1">
                <span className="font-semibold text-slate-300 light:text-slate-700">
                  Size:
                </span>{" "}
                {(convertedBlob.size / 1024).toFixed(
                  1,
                )}{" "}
                KB
              </p>
            </div>
          ) : null}

          {/* Download */}

          <button
            type="button"
            onClick={downloadConvertedImage}
            disabled={!convertedBlob}
            className="
              mt-5
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-violet-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-violet-500
              disabled:cursor-not-allowed
              disabled:bg-slate-700
              disabled:text-slate-400
            light:disabled:bg-slate-200"
          >
            <Download className="h-4 w-4" />
            Download converted image
          </button>
        </div>
      </div>

      {/* ====================================================================
          HOW TO USE
      ==================================================================== */}
      <HowToUse
        title="How to use Image Converter"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}