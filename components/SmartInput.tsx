"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  Braces,
  CaseSensitive,
  Check,
  Clapperboard,
  Clock,
  Code,
  Crop,
  Database,
  FileCode2,
  FileImage,
  FileText,
  Fingerprint,
  Globe2,
  Hash,
  ImageDown,
  KeyRound,
  Link2,
  Network,
  Palette,
  QrCode,
  RefreshCw,
  Scissors,
  Search,
  Send,
  Sparkles,
  Table,
  Type,
  Upload,
} from "lucide-react";

export type SmartAction = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
};

export type SmartDetection = {
  type: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  previewColor?: string;
  actions: SmartAction[];
};

function looksLikeJwt(value: string): boolean {
  const parts = value.trim().split(".");
  return (
    parts.length === 3 &&
    parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))
  );
}

function looksLikeBase64(value: string): boolean {
  const compact = value.trim().replace(/\s+/g, "");
  if (compact.length < 8 || compact.length % 4 === 1) return false;
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    compact
  );
}

function detectContent(value: string): SmartDetection {
  const trimmed = value.trim();
  const encoded = encodeURIComponent(trimmed.slice(0, 2000));

  // 1. YouTube Link
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|shorts\/|playlist\?|embed\/)|youtu\.be\/)([\w-]+)/i
  );
  if (ytMatch) {
    return {
      type: "youtube",
      label: "YouTube Link detected",
      badge: "Media",
      badgeColor: "bg-red-500/15 text-red-300 border-red-500/30",
      description:
        "Download high-res video, extract MP3 audio, inspect parameters, or create a short link.",
      icon: Clapperboard,
      iconColor: "text-red-400",
      iconBg: "bg-red-500/15 border-red-500/30",
      actions: [
        {
          label: "Download Video / MP3",
          href: `/youtube-downloader/?url=${encoded}`,
          icon: Clapperboard,
          primary: true,
        },
        {
          label: "Inspect & Clean URL",
          href: `/url-tools/?url=${encoded}`,
          icon: Link2,
        },
        {
          label: "Shorten Link",
          href: `/url-shortener/?url=${encoded}`,
          icon: Scissors,
        },
        {
          label: "Create QR Code",
          href: `/qr-generator/?text=${encoded}`,
          icon: QrCode,
        },
      ],
    };
  }

  // 2. Instagram Link
  const igMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/(?:p|reel|tv)\/)([\w-]+)/i
  );
  if (igMatch) {
    return {
      type: "instagram",
      label: "Instagram Link detected",
      badge: "Reel / Post",
      badgeColor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      description:
        "Download Instagram reels, carousels, or stories in HD, or generate a shortened link.",
      icon: Clapperboard,
      iconColor: "text-pink-400",
      iconBg: "bg-pink-500/15 border-pink-500/30",
      actions: [
        {
          label: "Download Reel / Post",
          href: `/instagram-reels-downloader/?url=${encoded}`,
          icon: Clapperboard,
          primary: true,
        },
        {
          label: "Shorten Link",
          href: `/url-shortener/?url=${encoded}`,
          icon: Scissors,
        },
        {
          label: "Create QR Code",
          href: `/qr-generator/?text=${encoded}`,
          icon: QrCode,
        },
      ],
    };
  }

  // 3. JSON Data
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      const isArr = Array.isArray(parsed);
      const count = isArr ? parsed.length : Object.keys(parsed).length;
      return {
        type: "json",
        label: "JSON Data detected",
        badge: isArr ? `${count} items` : `${count} keys`,
        badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        description:
          "Prettify, validate, minify, or convert JSON into YAML, CSV, or XML.",
        icon: Braces,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/15 border-amber-500/30",
        actions: [
          {
            label: "Format & Validate",
            href: "/json-formatter/",
            icon: Braces,
            primary: true,
          },
          {
            label: "Convert to YAML",
            href: "/yaml-json-converter/",
            icon: FileCode2,
          },
          {
            label: "Convert to CSV",
            href: "/csv-json-converter/",
            icon: Table,
          },
          {
            label: "Convert to XML",
            href: "/json-xml-converter/",
            icon: Code,
          },
        ],
      };
    } catch {
      // not valid JSON, proceed
    }
  }

  // 4. JWT Token
  if (looksLikeJwt(trimmed)) {
    return {
      type: "jwt",
      label: "JWT Token detected",
      badge: "Auth Token",
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      description:
        "Decode header and payload claims locally without exposing secrets over network.",
      icon: KeyRound,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15 border-indigo-500/30",
      actions: [
        {
          label: "Decode JWT",
          href: "/jwt-decoder/",
          icon: KeyRound,
          primary: true,
        },
        {
          label: "Test in API Client",
          href: "/http-request-tester/",
          icon: Send,
        },
        {
          label: "Decode Base64",
          href: "/base64-encoder-decoder/",
          icon: FileCode2,
        },
      ],
    };
  }

  // 5. Color Code
  const hexMatch = trimmed.match(
    /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
  );
  const rgbMatch = trimmed.match(/^(?:rgb|hsl)a?\s*\([^)]+\)$/i);
  if (hexMatch || rgbMatch) {
    const preview = hexMatch ? trimmed : undefined;
    return {
      type: "color",
      label: "Color Code detected",
      badge: "Color",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      description:
        "Convert color across HEX, RGB, HSL, HSV, and CMYK formats with live preview.",
      icon: Palette,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15 border-purple-500/30",
      previewColor: preview,
      actions: [
        {
          label: "Convert Color Formats",
          href: "/color-converter/",
          icon: Palette,
          primary: true,
        },
      ],
    };
  }

  // 6. Unix Timestamp
  if (/^\d{10}(?:\d{3})?$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length === 10 ? num * 1000 : num;
    if (ms > 946684800000 && ms < 3250368000000) {
      const dateStr = new Date(ms).toUTCString();
      return {
        type: "timestamp",
        label: "Unix Timestamp detected",
        badge: trimmed.length === 10 ? "Seconds" : "Milliseconds",
        badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        description: `Corresponds to: ${dateStr}. Convert to local timezone and custom formats.`,
        icon: Clock,
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-500/15 border-emerald-500/30",
        actions: [
          {
            label: "Convert to Date",
            href: "/timestamp-converter/",
            icon: Clock,
            primary: true,
          },
        ],
      };
    }
  }

  // 7. SQL Query
  if (
    /^(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|WITH)\b/i.test(
      trimmed
    )
  ) {
    return {
      type: "sql",
      label: "SQL Query detected",
      badge: "Database",
      badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      description:
        "Format, capitalize keywords, indent clauses, and clean up query structure.",
      icon: Database,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/15 border-sky-500/30",
      actions: [
        {
          label: "Format SQL Query",
          href: "/sql-formatter/",
          icon: Database,
          primary: true,
        },
        {
          label: "Word & Line Count",
          href: "/text-counter/",
          icon: Hash,
        },
        {
          label: "Share as Paste",
          href: "/paste/",
          icon: Send,
        },
      ],
    };
  }

  // 8. UUID / GUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed
    )
  ) {
    return {
      type: "uuid",
      label: "UUID / GUID detected",
      badge: "UUID v4",
      badgeColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
      description:
        "Valid UUID format. Generate batches, inspect version, or create new tokens.",
      icon: Hash,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/15 border-violet-500/30",
      actions: [
        {
          label: "Inspect & Generate UUIDs",
          href: "/uuid-generator/",
          icon: Hash,
          primary: true,
        },
        {
          label: "Encode to Base64",
          href: "/base64-encoder-decoder/",
          icon: FileCode2,
        },
      ],
    };
  }

  // 9. IP Address
  if (
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      trimmed
    )
  ) {
    return {
      type: "ip",
      label: "IP Address detected",
      badge: "IPv4",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      description:
        "Lookup geolocation, ISP, ASN, network, and timezone for this IP.",
      icon: Network,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/15 border-cyan-500/30",
      actions: [
        {
          label: "Lookup IP Info",
          href: "/ip-lookup/",
          icon: Network,
          primary: true,
        },
      ],
    };
  }

  // 10. Cryptographic Hash (MD5, SHA1, SHA256)
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return {
      type: "hash",
      label: "MD5 Hash detected",
      badge: "32 hex chars",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      description:
        "Valid 128-bit MD5 checksum. Generate matching hashes or inspect digests.",
      icon: Fingerprint,
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/15 border-teal-500/30",
      actions: [
        {
          label: "Hash Tools",
          href: "/hash-generator/",
          icon: Fingerprint,
          primary: true,
        },
      ],
    };
  }
  if (/^[0-9a-fA-F]{40}$/.test(trimmed)) {
    return {
      type: "hash",
      label: "SHA-1 Hash detected",
      badge: "40 hex chars",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      description:
        "Valid 160-bit SHA-1 checksum. Generate matching hashes or inspect digests.",
      icon: Fingerprint,
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/15 border-teal-500/30",
      actions: [
        {
          label: "Hash Tools",
          href: "/hash-generator/",
          icon: Fingerprint,
          primary: true,
        },
      ],
    };
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return {
      type: "hash",
      label: "SHA-256 Hash detected",
      badge: "64 hex chars",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      description:
        "Valid 256-bit SHA-256 checksum. Generate matching hashes or inspect digests.",
      icon: Fingerprint,
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/15 border-teal-500/30",
      actions: [
        {
          label: "Hash Tools",
          href: "/hash-generator/",
          icon: Fingerprint,
          primary: true,
        },
      ],
    };
  }

  // 11. Generic Web URL
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return {
        type: "url",
        label: "Web URL detected",
        badge: url.hostname,
        badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        description:
          "Parse query parameters, trace redirect hops, shorten link, or generate QR code.",
        icon: Link2,
        iconColor: "text-sky-400",
        iconBg: "bg-sky-500/15 border-sky-500/30",
        actions: [
          {
            label: "Parse & Inspect URL",
            href: `/url-tools/?url=${encoded}`,
            icon: Link2,
            primary: true,
          },
          {
            label: "Shorten Link",
            href: `/url-shortener/?url=${encoded}`,
            icon: Scissors,
          },
          {
            label: "Generate QR Code",
            href: `/qr-generator/?text=${encoded}`,
            icon: QrCode,
          },
        ],
      };
    }
  } catch {
    // not URL
  }

  // 12. Domain Name (e.g. google.com)
  if (
    /^(?!https?:\/\/)(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/.test(trimmed)
  ) {
    return {
      type: "domain",
      label: "Domain Name detected",
      badge: "DNS",
      badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      description:
        "Lookup DNS records (A, MX, TXT, CNAME) and WHOIS registrar details.",
      icon: Globe2,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/15 border-blue-500/30",
      actions: [
        {
          label: "DNS & WHOIS Lookup",
          href: "/domain-lookup/",
          icon: Globe2,
          primary: true,
        },
        {
          label: "Shorten Link",
          href: `/url-shortener/?url=${encodeURIComponent("https://" + trimmed)}`,
          icon: Scissors,
        },
      ],
    };
  }

  // 13. Base64
  if (looksLikeBase64(trimmed) && !/[\s{}<>]/.test(trimmed)) {
    return {
      type: "base64",
      label: "Base64 String detected",
      badge: "Encoded",
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      description:
        "Decode Base64 back to text, binary file, or inspect image data.",
      icon: FileCode2,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15 border-indigo-500/30",
      actions: [
        {
          label: "Decode to Text / File",
          href: "/base64-encoder-decoder/",
          icon: FileCode2,
          primary: true,
        },
        {
          label: "Image to Base64",
          href: "/image-to-base64/",
          icon: FileImage,
        },
      ],
    };
  }

  // 14. Markdown
  if (
    /^(?:#+\s|[-*+]\s|>\s|```)/m.test(trimmed) ||
    /\[.*\]\(https?:\/\/.*\)/.test(trimmed)
  ) {
    return {
      type: "markdown",
      label: "Markdown detected",
      badge: "Docs",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      description:
        "Convert Markdown to clean HTML with live preview, or generate printable PDF.",
      icon: FileText,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15 border-emerald-500/30",
      actions: [
        {
          label: "Markdown to HTML",
          href: "/markdown-to-html/",
          icon: FileCode2,
          primary: true,
        },
        {
          label: "Markdown to PDF",
          href: "/markdown-to-pdf/",
          icon: FileText,
        },
        {
          label: "Word Counter",
          href: "/text-counter/",
          icon: Hash,
        },
      ],
    };
  }

  // 15. General Text
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  return {
    type: "text",
    label: "Text Content detected",
    badge: `${words} words`,
    badgeColor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    description:
      "Count words & reading time, convert case, synthesize speech, or share an encrypted paste.",
    icon: Type,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/15 border-sky-500/30",
    actions: [
      {
        label: "Word & Char Count",
        href: "/text-counter/",
        icon: Hash,
        primary: true,
      },
      {
        label: "Case Converter",
        href: "/case-converter/",
        icon: CaseSensitive,
      },
      {
        label: "Text to Speech",
        href: "/text-to-speech/",
        icon: AudioLines,
      },
      {
        label: "Encrypted Paste",
        href: "/paste/",
        icon: Send,
      },
    ],
  };
}

const DEFAULT_PLACEHOLDER =
  "";

export default function SmartInput() {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [detection, setDetection] = useState<SmartDetection | null>(null);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function analyzeText(nextValue: string) {
    setValue(nextValue);
    setFileName("");
    setCopied(false);

    if (nextValue.trim()) {
      setDetection(detectContent(nextValue));
    } else {
      setDetection(null);
    }
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

    setDetection({
      type: "image",
      label: "Image File uploaded",
      badge: `${(file.size / 1024).toFixed(1)} KB`,
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      description:
        "Compress file size, remove backgrounds, convert formats, or crop & resize.",
      icon: FileImage,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/15 border-cyan-500/30",
      actions: [
        {
          label: "Compress Image",
          href: "/image-compressor/",
          icon: ImageDown,
          primary: true,
        },
        {
          label: "Remove Background",
          href: "/background-remover/",
          icon: Sparkles,
        },
        {
          label: "Convert Format",
          href: "/image-converter/",
          icon: RefreshCw,
        },
        {
          label: "Resize & Crop",
          href: "/image-resizer-cropper/",
          icon: Crop,
        },
      ],
    });
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
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleActionClick(action: SmartAction) {
    // Save input to sessionStorage so target tool can auto-fill
    try {
      if (value.trim()) {
        sessionStorage.setItem("toolverse_prefill_input", value.trim());
        sessionStorage.setItem("toolverse_prefill_url", value.trim());
      }
    } catch {
      // ignore storage errors
    }
    router.push(action.href);
  }

  const DetectionIcon = detection?.icon ?? Search;

  return (
    <section aria-label="Smart Toolverse input" className="mx-auto w-full max-w-3xl text-left">
      {/* ================================================================
          OUTER INPUT CARD (Apple Fluid Glass Capsule)
      ================================================================ */}
      <div className="apple-glass relative rounded-3xl p-2 sm:p-2.5 shadow-2xl shadow-black/40 overflow-hidden">
        <div className="apple-specular" />

        {/* ================================================================
            MAIN INPUT SURFACE
        ================================================================ */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-all duration-200 light:border-slate-900/10 light:bg-white focus-within:border-sky-400/40 focus-within:bg-white/[0.035] focus-within:shadow-[0_0_35px_rgba(56,189,248,0.12)] light:focus-within:border-sky-500/40 light:focus-within:bg-white">
          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-sky-500/[0.07] blur-3xl"
          />

          {/* Input Label (Only shown when empty and unfocused) */}
          {!value && !fileName && !isFocused ? (
            <div className="pointer-events-none absolute left-5 top-3.5 z-10 flex items-center gap-2.5">
              <Search
                aria-hidden="true"
                className="h-[18px] w-[18px] shrink-0 text-slate-500 light:text-slate-500"
              />
              <span className="text-xs font-medium tracking-wide text-slate-300 light:text-slate-700">
                Smart Toolverse input
              </span>
            </div>
          ) : null}

          {/* Textarea - Starts directly from the top when focused or when containing input */}
          <textarea
            value={value}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => analyzeText(event.target.value)}
            onPaste={handlePaste}
            placeholder={DEFAULT_PLACEHOLDER}
            rows={4}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            aria-label="Paste or enter content for Toolverse"
            className={`relative z-[1] block min-h-[135px] w-full resize-none border-0 bg-transparent px-5 pb-3 text-[15px] leading-7 text-slate-100 outline-none placeholder:text-slate-500/90 focus:outline-none sm:min-h-[145px] sm:text-base light:text-slate-900 transition-[padding] duration-150 ${
              value || fileName || isFocused ? "pt-3.5 sm:pt-4" : "pt-[42px]"
            }`}
          />

          {/* Dedicated Clean Bottom Toolbar */}
          <div className="relative z-10 flex min-h-[46px] items-center justify-between border-t border-white/[0.06] bg-black/[0.08] px-4 py-2 light:border-slate-200 light:bg-slate-50">
            <div className="flex items-center gap-2 min-w-0 text-xs text-slate-400 light:text-slate-500">
              {fileName ? (
                <span className="font-medium text-sky-400 light:text-sky-600 truncate max-w-[200px] sm:max-w-xs">
                  📎 {fileName}
                </span>
              ) : value ? (
                <span className="font-mono text-[11px] text-slate-400 light:text-slate-500">
                  {value.length} characters
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 light:text-slate-400">
                
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {value ? (
                <>
                  <button
                    type="button"
                    onClick={() => analyzeText("")}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-white light:text-slate-600 light:hover:bg-slate-200/60 light:hover:text-slate-900"
                    title="Clear input"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={copyInput}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-sky-400/30 hover:bg-white/[0.08] hover:text-white light:border-slate-300 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload an image"
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-sky-400/30 hover:bg-white/[0.08] hover:text-white light:border-slate-300 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
              >
                <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Drop image</span>
              </button>
            </div>
          </div>

          {/* Accessible File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Choose an image to upload"
            className="sr-only"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {/* ================================================================
            HELPER TEXT (When empty)
        ================================================================ */}
        {!detection ? (
          <div className="relative flex min-h-[50px] items-center justify-center px-3 py-2">
            <p className="text-center text-xs leading-5 text-slate-500 light:text-slate-500">
              Paste a link, code, text, or drop an image — Smart Input suggests the exact tools you need.
            </p>
          </div>
        ) : null}

        {/* ================================================================
            ADVANCED DETECTION RESULT WITH ACTION TAB BUTTONS
        ================================================================ */}
        {detection ? (
          <div className="mt-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl transition-all duration-200 light:border-slate-200 light:bg-slate-50/90 shadow-xl">
            {/* Top row: Detection info & Badge */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${detection.iconBg} ${detection.iconColor} shadow-md`}
                >
                  <DetectionIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white light:text-slate-900 truncate">
                      {detection.label}
                    </p>

                    {detection.previewColor ? (
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: detection.previewColor }}
                        title={detection.previewColor}
                      />
                    ) : null}

                    {detection.badge ? (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                          detection.badgeColor ||
                          "bg-sky-500/15 text-sky-300 border-sky-400/30"
                        }`}
                      >
                        {detection.badge}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-xs text-slate-400 light:text-slate-600 truncate">
                    {detection.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom row: Symmetrical Action Tab Buttons Grid */}
            <div className="mt-3 pt-3 border-t border-white/[0.07] light:border-slate-200">
              <div
                className={
                  detection.actions.length === 1
                    ? "flex justify-end"
                    : detection.actions.length === 2
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                    : detection.actions.length === 3
                    ? "grid grid-cols-1 sm:grid-cols-3 gap-2"
                    : "grid grid-cols-2 lg:grid-cols-4 gap-2"
                }
              >
                {detection.actions.map((action, idx) => {
                  const ActionIcon = action.icon;
                  const isPrimary = action.primary ?? idx === 0;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleActionClick(action)}
                      className={`group flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                        isPrimary
                          ? "apple-pill-btn bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110"
                          : "border border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-400/30 hover:bg-white/[0.08] hover:text-white light:border-slate-300 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
                      }`}
                    >
                      <ActionIcon className="h-3.5 w-3.5 shrink-0 opacity-80 group-hover:opacity-100" />
                      <span className="truncate">{action.label}</span>
                      {isPrimary && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
