"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Eraser,
  Link2,
  Loader2,
  QrCode,
  Type,
} from "lucide-react";
import { Container } from "@/components/Container";

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
  const initialText = searchParams.get("text") || "https://toolverse.dev";

  const [text, setText] = useState(initialText);
  const [qrPng, setQrPng] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
    link.download = "toolverse-qr-code.png";
    link.click();
  }

  function downloadSvg() {
    if (!qrSvg) return;

    const blob = new Blob([qrSvg], {
      type: "image/svg+xml",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "toolverse-qr-code.svg";
    link.click();

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setText("");
    setQrPng("");
    setQrSvg("");
    setError("");
    setCopied(false);
  }

  function useExampleUrl() {
    setText("https://toolverse.dev");
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300">
          <QrCode className="h-7 w-7" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          QR Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Create clean QR codes for URLs, text, contact info, Wi-Fi details, and
          more. Download your QR code as PNG or SVG.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Text or URL
          </label>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Enter text or URL to generate QR code..."
            spellCheck={false}
            className="min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

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
              onClick={useExampleUrl}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Link2 className="h-4 w-4" />
              Example URL
            </button>

            <button
              onClick={() => setText("Toolverse QR Generator")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Type className="h-4 w-4" />
              Example text
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Preview</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              Live
            </span>
          </div>

          <div className="mt-5 flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white p-6">
            {qrPng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPng}
                alt="Generated QR code"
                className="h-64 w-64"
              />
            ) : (
              <p className="text-center text-sm text-slate-500">
                Enter text to generate a QR code.
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">How to use</h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-400">
          <li>Enter a URL, text, or message in the input box.</li>
          <li>The QR code will generate automatically.</li>
          <li>Check the live preview on the right side.</li>
          <li>Download your QR code as PNG or SVG.</li>
        </ol>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">FAQ</h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Is this QR generator free?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yes. You can create and download QR codes for free.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Can I generate QR codes for URLs?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yes. Paste any URL and Toolverse will generate a scannable QR code
              instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold">Is my text uploaded?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              No. The QR code is generated in your browser and your text is not
              uploaded to a server.
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}