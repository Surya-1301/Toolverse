"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eraser,
  FileUp,
  Loader2,
  QrCode,
  Upload,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { fetchApi } from "@/lib/apiBase";

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

const uploadExpiry = "never";

export default function QrGeneratorPage() {
  return (
    <Suspense fallback={<QrGeneratorLoading />}>
      <QrGeneratorContent />
    </Suspense>
  );
}

function QrGeneratorLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading QR Generator...
        </div>
      </div>
    </Container>
  );
}

function QrGeneratorContent() {
  const searchParams = useSearchParams();
  const initialText = searchParams.get("text") || "";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [text, setText] = useState(initialText);
  const [qrPng, setQrPng] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function generateQr(value: string) {
    try {
      setError("");

      if (!value.trim()) {
        setQrPng("");
        setQrSvg("");
        return;
      }

      const png = await QRCode.toDataURL(value, {
        width: 512,
        margin: 2,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      });

      const svg = await QRCode.toString(value, {
        type: "svg",
        width: 512,
        margin: 2,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      });

      setQrPng(png);
      setQrSvg(svg);
    } catch {
      setError("Could not generate QR code. Please try again.");
      setQrPng("");
      setQrSvg("");
    }
  }

  useEffect(() => {
    generateQr(text);
  }, [text]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setError("");

      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiry", uploadExpiry);

      const isImage = file.type.startsWith("image/");
      const endpoint = isImage ? "/api/image/upload" : "/api/file/upload";

      const response = await fetchApi(endpoint, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data: { id?: string; error?: string } | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            responseText ||
            `Could not upload this file. Backend returned ${response.status}.`,
        );
        return;
      }

      if (!data?.id) {
        setError("Upload succeeded but no file ID was returned.");
        return;
      }

      const frontendOrigin = window.location.origin;
      const fullUrl = isImage
        ? `${frontendOrigin}/share-image?id=${data.id}`
        : `${frontendOrigin}/share-file?id=${data.id}`;

      setText(fullUrl);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not upload this file: ${caughtError.message}`
          : "Could not upload this file. Please check your backend Worker URL.",
      );
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  async function copyText() {
    if (!text.trim()) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function downloadPng() {
    if (!qrPng) return;

    const link = document.createElement("a");
    link.href = qrPng;
    link.download = "ToolverseX-qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadSvg() {
    if (!qrSvg) return;

    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ToolverseX-qr-code.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setText("");
    setQrPng("");
    setQrSvg("");
    setError("");
    setCopied(false);
    setSelectedFileName("");
    setSelectedFileSize(null);
    setIsUploading(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          QR Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Create QR codes for URLs, text, PDFs, images, and files. Upload a file
          to generate a QR code for its shareable link.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Text, URL, PDF, image, or file
          </label>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Enter text or URL, or upload a file to generate QR code..."
            spellCheck={false}
            className="min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />

          {selectedFileName ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <FileUp className="mt-0.5 h-4 w-4 text-violet-300" />
                <div className="min-w-0">
                  <p className="break-all font-medium text-white">
                    {selectedFileName}
                  </p>
                  {selectedFileSize !== null ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(selectedFileSize)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={copyText}
              disabled={!text.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy text"}
            </button>

            <button
              onClick={openFilePicker}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload file"}
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Preview</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              Live
            </span>
          </div>

          <div className="mt-5 flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-4">
            {qrPng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPng}
                alt="Generated QR code"
                className="h-64 w-64"
              />
            ) : (
              <div className="text-center text-sm text-slate-500">
                <QrCode className="mx-auto mb-3 h-10 w-10" />
                Enter text or upload a file to generate a QR code.
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={downloadPng}
              disabled={!qrPng}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              PNG
            </button>

            <button
              onClick={downloadSvg}
              disabled={!qrSvg}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              SVG
            </button>
          </div>
        </div>
      </div>

      <HowToUse
        title="How to use QR Generator"
        subtitle=""
        steps={[
          {
            title: "Enter text",
            description: "Type any text, URL, or upload a file.",
            icon: <QrCode className="h-5 w-5" />,
          },
          {
            title: "Upload file",
            description: "Upload an image, PDF, or file to create a share QR.",
            icon: <Upload className="h-5 w-5" />,
          },
          {
            title: "Generate QR",
            description: "The QR code updates automatically.",
            icon: <QrCode className="h-5 w-5" />,
          },
          {
            title: "Copy text",
            description: "Copy the encoded text or share link.",
            icon: <Copy className="h-5 w-5" />,
          },
          {
            title: "Download PNG",
            description: "Save the QR code as a PNG image.",
            icon: <Download className="h-5 w-5" />,
          },
          {
            title: "Download SVG",
            description: "Save the QR code as a scalable SVG.",
            icon: <Download className="h-5 w-5" />,
          },
        ]}
      />
    </Container>
  );
}