"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardPaste,
  Download,
  Eraser,
  Film,
  Link2,
  Loader2,
  Music,
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

type ServerResource = {
  id: string;
  quality: number;
  ext: string;
  size: number;
  sizeLabel: string | null;
  hasAudio: boolean;
  fps: number | null;
  audioOnly?: boolean;
};

type MediaDetails = {
  title: string;
  thumbnail: string | null;
  uploader: string | null;
};

function sanitizeForFilename(title: string): string {
  return (title || "instagram_reel")
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function looksLikeInstagramUrl(input: string): boolean {
  const s = input.trim();
  return (
    (s.includes("instagram.com/") || s.includes("instagr.am/")) &&
    /(?:reel|reels|p|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i.test(s)
  );
}

export default function InstagramReelsDownloaderPage() {
  const [url, setUrl] = useState("");
  const serverUrl = PRIVATE_YT_BACKEND;
  const ytKey = PRIVATE_YT_KEY;

  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [serverResources, setServerResources] = useState<ServerResource[] | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);

  const videoResources = useMemo(() => {
    return (serverResources || []).filter((r) => !r.audioOnly);
  }, [serverResources]);

  const audioResources = useMemo(() => {
    return (serverResources || []).filter((r) => r.audioOnly);
  }, [serverResources]);

  async function fetchInfo() {
    const clean = url.trim();
    if (!clean) {
      setError("Paste an Instagram link first.");
      return;
    }
    if (!looksLikeInstagramUrl(clean)) {
      setError("Please enter a valid Instagram reel or post link.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDetails(null);
    setServerResources(null);

    try {
      const base = serverUrl.trim().replace(/\/+$/, "");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ytKey) headers["x-api-key"] = ytKey;

      const m = clean.match(
        /(?:reel|reels|p|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i,
      );
      const normalizedUrl = m
        ? `https://www.instagram.com/reel/${m[1]}/`
        : clean;

      const res = await fetch(`${base}/api/info`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Server returned ${res.status}`);
      }

      setDetails({
        title: data?.title || "Instagram Reel",
        thumbnail: data?.thumbnail || null,
        uploader: data?.uploader || null,
      });
      setServerResources(data?.resources || []);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        const msg = (e as Error).message || "";
        if (/failed to fetch/i.test(msg)) {
          setError(
            "Connection issue (server may be waking up from sleep). Please wait a few seconds and try again.",
          );
        } else {
          setError(
            msg ||
              "Could not fetch reel info. The post may be private, restricted, or unavailable.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function getResourceFilename(r: ServerResource): string {
    const safeTitle = sanitizeForFilename(details?.title || "instagram_reel");
    const ext = r.ext || (r.audioOnly ? "mp3" : "mp4");
    return r.audioOnly ? `${safeTitle}.${ext}` : `${safeTitle}-${r.quality || "hd"}p.${ext}`;
  }

  function serverDownloadHref(r: ServerResource): string {
    const params = new URLSearchParams({
      url: url.trim(),
      format_id: r.id,
      audio: r.audioOnly ? "1" : "0",
    });
    if (ytKey) params.set("api_key", ytKey);
    return `${serverUrl.trim().replace(/\/+$/, "")}/api/download?${params.toString()}`;
  }

  async function handleDownload(r: ServerResource) {
    const href = serverDownloadHref(r);
    const filename = getResourceFilename(r);
    setDownloadingId(r.id);

    try {
      if (isNative()) {
        await downloadFile(href, filename);
      } else {
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Download failed.");
    } finally {
      setDownloadingId(null);
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
    setDetails(null);
    setServerResources(null);
    setLoading(false);
    setDownloadingId(null);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Instagram Reels Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Download Instagram reels, videos, and posts in high definition.
          Fast, free, and watermark-free.
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
              onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
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
            onClick={fetchInfo}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            {loading ? "Fetching Reel…" : "Get download links"}
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

        {details ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
            <div className="flex gap-4">
              {details.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={details.thumbnail}
                  alt={details.title}
                  className="h-24 w-24 shrink-0 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-pink-600/20 text-pink-300">
                  <Film className="h-10 w-10" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200 light:text-emerald-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="truncate">{details.title}</span>
                </p>
                {details.uploader ? (
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    @{details.uploader}
                  </p>
                ) : null}
              </div>
            </div>

            {videoResources.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Video Downloads
                </p>
                <div className="mt-2 space-y-2">
                  {videoResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 light:border-slate-900/5 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-pink-600/20 text-sm font-bold text-pink-300">
                          {r.quality ? `${r.quality}p` : "HD"}
                        </span>
                        <p className="text-xs text-slate-400">
                          {[
                            r.sizeLabel,
                            r.hasAudio ? "with audio" : "video only",
                            r.fps ? `${r.fps}fps` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "MP4"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === r.id ? "Downloading…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {audioResources.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Audio Only
                </p>
                <div className="mt-2 space-y-2">
                  {audioResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 light:border-slate-900/5 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-sm font-bold text-purple-300">
                          <Music className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-400">
                          {[r.sizeLabel, "MP3"].filter(Boolean).join(" • ") || "Audio"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === r.id ? "Downloading…" : "Download MP3"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
              title: "Fetch the reel",
              description:
                "Click Get download links and wait a moment while yt-dlp fetches the preview and qualities.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Download to device",
              description:
                "Choose your preferred video quality or MP3 and tap Download to save it directly to your device.",
              icon: <Check className="h-5 w-5" />,
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
