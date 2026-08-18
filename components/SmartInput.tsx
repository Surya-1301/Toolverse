"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Check,
  FileCode2,
  FileImage,
  KeyRound,
  Link2,
  Search,
  Type,
  Upload,
} from "lucide-react";

type Detection = {
  type: "json" | "url" | "jwt" | "base64" | "image" | "text";
  label: string;
  description: string;
  href: string;
};

const detectionMeta: Record<Detection["type"], Omit<Detection, "type">> = {
  json: {
    label: "JSON detected",
    description: "Format, validate, minify, or inspect this JSON.",
    href: "/json-formatter",
  },
  url: {
    label: "URL detected",
    description: "Parse, inspect, encode, or work with this URL.",
    href: "/url-parser",
  },
  jwt: {
    label: "JWT detected",
    description: "Decode and inspect the token payload and header.",
    href: "/jwt-decoder",
  },
  base64: {
    label: "Base64 detected",
    description: "Encode, decode, or inspect Base64 data.",
    href: "/base64-encoder-decoder",
  },
  image: {
    label: "Image detected",
    description: "Convert, resize, compress, crop, or optimize your image.",
    href: "/image-converter",
  },
  text: {
    label: "Text detected",
    description: "Work with text and developer utilities.",
    href: "/tools/text-developer-tools",
  },
};

function looksLikeJwt(value: string) {
  const parts = value.trim().split(".");
  return parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part));
}

function looksLikeBase64(value: string) {
  const compact = value.trim().replace(/\s+/g, "");
  if (compact.length < 8 || compact.length % 4 === 1) return false;
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact);
}

function detectText(value: string): Detection {
  const trimmed = value.trim();

  if (trimmed) {
    try {
      JSON.parse(trimmed);
      return { type: "json", ...detectionMeta.json };
    } catch {
      // Continue with other detectors.
    }

    if (looksLikeJwt(trimmed)) {
      return { type: "jwt", ...detectionMeta.jwt };
    }

    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { type: "url", ...detectionMeta.url };
      }
    } catch {
      // Not a URL.
    }

    if (looksLikeBase64(trimmed) && !/[\s{}<>]/.test(trimmed)) {
      return { type: "base64", ...detectionMeta.base64 };
    }
  }

  return { type: "text", ...detectionMeta.text };
}

export default function SmartInput() {
  const [value, setValue] = useState("");
  const [detection, setDetection] = useState<Detection | null>(null);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholder = useMemo(
    () =>
      "Paste JSON, URL, JWT, Base64, text, or drop an image...",
    [],
  );

  function analyzeText(nextValue: string) {
    setValue(nextValue);
    setFileName("");
    setCopied(false);
    setDetection(nextValue.trim() ? detectText(nextValue) : null);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValue("");
      setFileName("");
      setDetection(null);
      return;
    }

    setValue("");
    setFileName(file.name);
    setDetection({ type: "image", ...detectionMeta.image });
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedFiles = Array.from(event.clipboardData.files);
    const image = pastedFiles.find((file) => file.type.startsWith("image/"));

    if (image) {
      event.preventDefault();
      handleFile(image);
    }
  }

  async function copyInput() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const DetectionIcon = detection
    ? {
        json: Braces,
        url: Link2,
        jwt: KeyRound,
        base64: FileCode2,
        image: FileImage,
        text: Type,
      }[detection.type]
    : Search;

  return (
    <section className="mx-auto mt-10 w-full max-w-3xl text-left sm:mt-12">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl shadow-black/20 ring-1 ring-violet-400/5 backdrop-blur">
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.025]">
          <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-500" />

          <textarea
            value={value}
            onChange={(event) => analyzeText(event.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={3}
            aria-label="Smart Toolverse input"
            className="min-h-[118px] w-full resize-none bg-transparent px-12 pb-12 pt-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 sm:min-h-[126px] sm:text-base"
          />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Drop image
            </button>

            <div className="flex items-center gap-2">
              {value ? (
                <button
                  type="button"
                  onClick={copyInput}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              ) : null}

              {fileName ? (
                <span className="max-w-[150px] truncate text-xs text-slate-500">
                  {fileName}
                </span>
              ) : null}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {detection ? (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
                <DetectionIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {detection.label}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-400">
                  {detection.description}
                </p>
              </div>
            </div>

            <Link
              href={detection.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
            >
              Open tool
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <p className="px-2 pb-1 pt-3 text-center text-xs text-slate-600">
            Paste anything and Toolverse will suggest the right tool.
          </p>
        )}
      </div>
    </section>
  );
}
