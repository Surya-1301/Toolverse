"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileCode2,
  FileImage,
  FileUp,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/conversion-tools"
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
    description: "Choose an image file to convert into a Base64 data URL.",
    icon: <FileUp className="h-5 w-5" />,
  },
  {
    title: "Convert instantly",
    description: "The image is converted to Base64 in your browser instantly.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Preview image",
    description: "See a preview of the uploaded image before converting.",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    title: "Decode Base64",
    description: "Paste a Base64 string to preview and convert it back to an image file.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the Base64 string to your clipboard instantly.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Download image",
    description: "Convert Base64 back into a downloadable image file.",
    icon: <Download className="h-5 w-5" />,
  },
];

export default function ImageToBase64Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("image");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function fileToBase64(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF, WebP, SVG).");
      setOutput("");
      setImagePreview("");
      event.target.value = "";
      return;
    }

    setError("");
    setCopied(false);
    setFileName(file.name.split(".")[0] || "image");

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setImagePreview(dataUrl);
      setOutput(dataUrl);
    };

    reader.onerror = () => {
      setOutput("");
      setImagePreview("");
      setError("Could not read this image file.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function base64ToImage() {
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setImagePreview("");
        setError("Please enter a Base64 string first.");
        return;
      }

      const source = input.trim();

      // If it's already a data URL, just use it directly
      if (source.startsWith("data:image/")) {
        setOutput(source);
        setImagePreview(source);
        return;
      }

      // Otherwise wrap as a generic data URL
      const wrapped = `data:image/png;base64,${source}`;
      setOutput(source);
      setImagePreview(wrapped);
    } catch {
      setError("Invalid Base64 string.");
    }
  }

  function downloadImage() {
    try {
      setError("");

      const source = output || input;

      if (!source.trim()) {
        setError("Generate or enter Base64 first.");
        return;
      }

      const mimeMatch = source.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch?.[1] || "image/png";
      const base64Data = source.includes(",") ? source.split(",")[1] : source;

      const byteCharacters = atob(base64Data.trim());
      const byteNumbers = Array.from(byteCharacters).map((char) =>
        char.charCodeAt(0),
      );
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const extension = mimeType.split("/")[1]?.split("+")[0] || "png";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${fileName || "image"}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      setError("Could not convert Base64 to an image. Check that the data is valid.");
    }
  }

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setImagePreview("");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image to Base64 Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert images to Base64 strings and decode Base64 back into images
          instantly in your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Upload image
          </label>

          <label
            className="
              flex
              min-h-[200px]
              cursor-pointer
              flex-col
              items-center
              justify-center
              gap-3
              rounded-2xl
              border
              border-dashed
              border-white/15
              bg-slate-950/50
              p-6
              text-center
              transition
              hover:border-violet-400/40
              hover:bg-white/[0.03]
            "
          >
            <FileImage className="h-10 w-10 text-slate-500" />

            <span className="text-sm font-medium text-slate-300">
              Click to upload an image
            </span>

            <span className="text-xs text-slate-500">
              PNG, JPG, GIF, WebP, SVG supported
            </span>

            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={fileToBase64}
            />
          </label>

          {imagePreview ? (
            <div className="mt-4">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Uploaded image preview"
                  className="mx-auto max-h-56 object-contain"
                />
              </div>
              <p className="mt-2 truncate text-center text-xs text-slate-500">
                {fileName}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Or paste Base64
            </label>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste Base64 image data here..."
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Base64 Output
            </label>

            <button
              onClick={copyOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Base64 output will appear here..."
            rows={12}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none"
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
          onClick={base64ToImage}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Decode Base64
        </button>

        <button
          onClick={downloadImage}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          <span className="sm:hidden">Image</span>
          <span className="hidden sm:inline">Download Image</span>
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      <HowToUse
        title="How to use Image to Base64 Converter"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
