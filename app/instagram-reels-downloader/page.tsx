"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardPaste,
  Download,
  Eraser,
  ExternalLink,
  Film,
  Link2,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { PRIVATE_YT_BACKEND, PRIVATE_YT_KEY } from "@/lib/downloadServers";
import { downloadFile, isNative } from "@/lib/capacitor";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/download-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-pink-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

type InstagramResult = {
  shortcode: string;
  title: string;
  uploader: string | null;
  thumbnail: string | null;
  videoUrl: string;
  filename: string;
  streamUrl: string;
};

export default function InstagramReelsDownloaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstagramResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function looksLikeInstagramUrl(input: string): boolean {
    const s = input.trim();
    return (
      (s.includes("instagram.com/") || s.includes("instagr.am/")) &&
      /(?:reel|reels|p|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i.test(s)
    );
  }

  async function fetchDownload() {
    const clean = url.trim();
    if (!clean) {
      setError("Please paste an Instagram Reel or Post link.");
      return;
    }
    if (!looksLikeInstagramUrl(clean)) {
      setError("Please provide a valid Instagram link (e.g. instagram.com/reel/...).");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base = PRIVATE_YT_BACKEND.trim().replace(/\/+$/, "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (PRIVATE_YT_KEY) headers["x-api-key"] = PRIVATE_YT_KEY;

      const res = await fetch(`${base}/api/instagram`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: clean }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Download failed with HTTP ${res.status}`);
      }

      setResult(data);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        setError(
          (e as Error).message ||
            "Could not fetch reel. The video may be private or restricted.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadClick() {
    if (!result) return;
    const base = PRIVATE_YT_BACKEND.trim().replace(/\/+$/, "");
    const downloadUrl = `${base}${result.streamUrl}`;
    const filename = `${result.filename || "instagram_reel"}.mp4`;

    if (isNative()) {
      setDownloading(true);
      try {
        await downloadFile(downloadUrl, filename);
      } catch (err: unknown) {
        setError((err as Error).message || "Native file download failed.");
      } finally {
        setDownloading(false);
      }
    } else {
      // Browser environment: trigger file download via anchor
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      /* clipboard unavailable */
    }
  }

  function reset() {
    abortRef.current?.abort();
    setUrl("");
    setError(null);
    setResult(null);
    setLoading(false);
    setDownloading(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Instagram Reels Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Paste an Instagram reel, video, or post link to download in HD MP4.
          Fast, free, and no watermark.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
            Instagram URL
          </span>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDownload()}
              placeholder="https://www.instagram.com/reel/..."
              className={inputClass}
              inputMode="url"
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white light:border-slate-900/15 light:text-slate-600 light:hover:text-slate-900"
            >
              <ClipboardPaste className="h-5 w-5" />
            </button>
          </div>
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchDownload}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            {loading ? "Fetching Reel…" : "Get download link"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200 light:text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {result.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="h-28 w-28 shrink-0 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-pink-600/20 text-pink-300">
                  <Film className="h-10 w-10" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200 light:text-emerald-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="truncate">{result.title}</span>
                </p>
                {result.uploader ? (
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    {result.uploader}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={downloading}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloading ? "Downloading…" : "Download Reel (HD MP4)"}
                  </button>
                  <a
                    href={result.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open direct video
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to download Instagram reels"
          subtitle=""
          steps={[
            {
              title: "Find the reel or video",
              description:
                "Open the Instagram app and navigate to the reel, post or video you want to save.",
              icon: <Film className="h-5 w-5" />,
            },
            {
              title: "Copy the link",
              description:
                "Tap the Share icon on the post, then choose Copy link to copy the URL to your clipboard.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste the URL",
              description:
                "Paste the copied link into the input field above — or tap the clipboard button to paste it automatically.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Download your video",
              description:
                "Click Get download link, preview the reel, and click Download Reel (HD MP4) to save it directly to your device.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Watch offline anytime",
              description:
                "The video saves directly to your device — watch it anytime without internet, or share it with friends.",
              icon: <Check className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
