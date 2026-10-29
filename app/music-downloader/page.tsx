"use client";

import { BackButton } from "@/components/BackButton";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  Check,
  ClipboardPaste,
  Download,
  Eraser,
  Link2,
  Loader2,
  Music,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import {
  PRIVATE_YT_BACKEND,
  PRIVATE_YE_BACKEND,
  PRIVATE_YT_KEY,
} from "@/lib/downloadServers";

function isYouTube(u: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(u);
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

const selectClass =
  "min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900";

type MediaDetails = {
  title: string;
  thumbnail: string | null;
  duration: string | null;
  uploader: string | null;
};

function fmtDuration(sec: unknown): string | null {
  const s = Number(sec);
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function MusicDownloaderPage() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const ytKey = PRIVATE_YT_KEY;
  const [activeServer, setActiveServer] = useState(PRIVATE_YT_BACKEND);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchViaServer(mediaUrl: string, base: string, signal: AbortSignal) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ytKey) headers["x-api-key"] = ytKey;
    const res = await fetch(`${base}/api/info`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: mediaUrl }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || data?.error || `Server error ${res.status}`);
    }
    return data;
  }

  async function fetchInfo() {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setError("Paste a valid link first (YouTube, SoundCloud, TikTok…).");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDetails(null);

    const isYt = isYouTube(clean);
    const primaryBase = PRIVATE_YT_BACKEND.trim().replace(/\/+$/, "");
    const fallbackBase = PRIVATE_YE_BACKEND.trim().replace(/\/+$/, "");

    try {
      setActiveServer(primaryBase);
      const data = await fetchViaServer(clean, primaryBase, controller.signal);
      setDetails({
        title: data?.title || "audio",
        thumbnail: data?.thumbnail || null,
        duration: fmtDuration(data?.duration),
        uploader: data?.uploader || null,
      });
    } catch (e1) {
      if (fallbackBase && fallbackBase !== primaryBase && (e1 as Error).name !== "AbortError") {
        try {
          setActiveServer(fallbackBase);
          const data = await fetchViaServer(clean, fallbackBase, controller.signal);
          setDetails({
            title: data?.title || "audio",
            thumbnail: data?.thumbnail || null,
            duration: fmtDuration(data?.duration),
            uploader: data?.uploader || null,
          });
          return;
        } catch {
          /* fallback also errored, surface primary error */
        }
      }
      if ((e1 as Error).name !== "AbortError") {
        setError((e1 as Error).message || "Lookup failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  function downloadHref(): string {
    const params = new URLSearchParams({
      url: url.trim(),
      audio: "1",
      audio_format: format,
    });
    if (ytKey) params.set("api_key", ytKey);
    return `${activeServer.trim().replace(/\/+$/, "")}/api/download?${params.toString()}`;
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
    setDetails(null);
    setLoading(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools/download-tools" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Audio Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Paste a link and extract the audio as MP3, OGG, WAV or OPUS. Works
          with YouTube, SoundCloud, TikTok and more. Free, no signup.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
            Media URL
          </span>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
              placeholder="https://www.youtube.com/watch?v=... or soundcloud.com/..."
              className={inputClass}
              inputMode="url"
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-500 transition"
            >
              <ClipboardPaste className="h-5 w-5" />
            </button>
          </div>
        </label>

        <div className="mt-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
              Audio format
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="mp3">MP3 — universal</option>
              <option value="ogg">OGG — open</option>
              <option value="opus">OPUS — efficient</option>
              <option value="wav">WAV — lossless</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchInfo}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <AudioLines className="h-5 w-5" />
            )}
            {loading ? "Fetching…" : "Get audio"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-500 px-4 text-sm transition"
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

        {details ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex gap-3">
              {details.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={details.thumbnail}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                  <Music className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200 light:text-emerald-700">
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="truncate">{details.title}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {[details.uploader, details.duration]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
            </div>
            <a
              href={downloadHref()}
              download={`${(details?.title || "music").replace(/[/\\?%*:|"<>#]/g, "-").slice(0, 80)}.${format}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Download className="h-5 w-5" />
              Download {format.toUpperCase()}
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the Audio Downloader"
          subtitle=""
          steps={[
            {
              title: "Find your track",
              description:
                "Open YouTube, SoundCloud, TikTok or Instagram and find the video, song or reel you want as audio.",
              icon: <Music className="h-5 w-5" />,
            },
            {
              title: "Copy the link",
              description:
                "Tap the Share button on the video or track, then choose Copy link.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste the URL",
              description:
                "Paste the copied link into the input field above — or tap the clipboard button to paste automatically.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Choose audio format",
              description:
                "Pick MP3 for universal compatibility, OGG or OPUS for smaller files, or WAV for lossless quality.",
              icon: <AudioLines className="h-5 w-5" />,
            },
            {
              title: "Fetch and download",
              description:
                "Click Get audio to load the title and thumbnail, then tap Download to save the audio file directly to your device.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Listen anywhere",
              description:
                "The audio file saves to your device — play it in any music app, even offline.",
              icon: <Check className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
