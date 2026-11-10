"use client";

import { BackButton } from "@/components/BackButton";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Download,
  Eraser,
  Film,
  Image as ImageIcon,
  Link2,
  Loader2,
  Music,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { PRIVATE_YT_BACKEND, PRIVATE_YT_KEY } from "@/lib/downloadServers";
import { apiFetch, downloadFile, isNative, readTextNative } from "@/lib/capacitor";

const IG_COOKIES_KEY = "ig-visitor-cookies";

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
  isImage?: boolean;
};

type MediaDetails = {
  title: string;
  thumbnail: string | null;
  uploader: string | null;
};

function sanitizeForFilename(title: string): string {
  return (title || "instagram_media")
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function looksLikeInstagramUrl(input: string): boolean {
  const s = input.trim();
  return (
    (s.includes("instagram.com/") || s.includes("instagr.am/")) &&
    /(?:reel|reels|p|tv|stories|share\/(?:reel|p))\/([A-Za-z0-9_.-]+)/i.test(s)
  );
}

export default function InstagramReelsDownloaderPage() {
  const [url, setUrl] = useState("");
  const serverUrl = PRIVATE_YT_BACKEND;
  const ytKey = PRIVATE_YT_KEY;

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [serverResources, setServerResources] = useState<ServerResource[] | null>(
    null
  );
  const [cookiesText, setCookiesText] = useState("");
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(IG_COOKIES_KEY);
      if (saved) setCookiesText(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Auto prefill from searchParams, sessionStorage, or clipboard in native app
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const prefill =
        params.get("url") ||
        sessionStorage.getItem("toolverse_prefill_url") ||
        sessionStorage.getItem("toolverse_prefill_input");
      if (prefill && looksLikeInstagramUrl(prefill)) {
        setUrl(prefill);
        sessionStorage.removeItem("toolverse_prefill_url");
        sessionStorage.removeItem("toolverse_prefill_input");
        return;
      }
    } catch {
      // storage unavailable
    }

    // In native mobile APK, check if clipboard contains an Instagram URL
    if (isNative() && !url) {
      readTextNative()
        .then((text) => {
          if (text && looksLikeInstagramUrl(text)) {
            setUrl(text.trim());
          }
        })
        .catch(() => {});
    }
  }, []);

  // Split resources into Videos, Photos, and Audio
  const videoResources = useMemo(() => {
    return (serverResources || []).filter(
      (r) => !r.audioOnly && !r.isImage && r.ext !== "jpg" && r.ext !== "png"
    );
  }, [serverResources]);

  const photoResources = useMemo(() => {
    return (serverResources || []).filter(
      (r) => r.isImage || r.ext === "jpg" || r.ext === "png" || r.ext === "webp"
    );
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
      setError("Please enter a valid Instagram reel, video, post, photo, or story link.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setLoadingStatus("Connecting to downloader server…");
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
        /(?:reel|reels|p|tv|stories|share\/(?:reel|p))\/([A-Za-z0-9_.-]+)/i
      );
      let normalizedUrl = clean;
      if (m) {
        if (clean.includes("/stories/")) {
          normalizedUrl = clean.split("?")[0];
        } else if (clean.includes("/p/")) {
          normalizedUrl = `https://www.instagram.com/p/${m[1]}/`;
        } else if (clean.includes("/tv/")) {
          normalizedUrl = `https://www.instagram.com/tv/${m[1]}/`;
        } else {
          normalizedUrl = `https://www.instagram.com/reel/${m[1]}/`;
        }
      }

      const cookies = cookiesText.trim();
      if (cookies) {
        try {
          localStorage.setItem(IG_COOKIES_KEY, cookies);
        } catch {
          /* storage unavailable */
        }
      }

      let data: any = null;
      let lastErr: Error | null = null;

      // Make request with automatic retry if cold server is waking up
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          if (attempt === 2) {
            setLoadingStatus("Server is waking up, retrying connection…");
            await new Promise((r) => setTimeout(r, 2000));
          }

          const res = await apiFetch(`${base}/api/info`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              url: normalizedUrl,
              ...(cookies ? { cookies } : {}),
            }),
            signal: controller.signal,
          });

          data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || data?.detail || `Server returned ${res.status}`);
          }
          lastErr = null;
          break;
        } catch (fetchErr: any) {
          lastErr = fetchErr;
          if (fetchErr?.name === "AbortError") throw fetchErr;
          const msg = (fetchErr?.message || "").toLowerCase();
          const isConnectionError =
            msg.includes("failed to fetch") ||
            msg.includes("network") ||
            msg.includes("timeout") ||
            msg.includes("connection") ||
            msg.includes("502") ||
            msg.includes("503") ||
            msg.includes("504");
          if (!isConnectionError || attempt >= 2) {
            break;
          }
        }
      }

      if (lastErr) {
        throw lastErr;
      }

      setDetails({
        title: data?.title || "Instagram Post",
        thumbnail: data?.thumbnail || null,
        uploader: data?.uploader || null,
      });
      setServerResources(data?.resources || []);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        const msg = (e as Error).message || "";
        const isStory = /stories\//i.test(clean);
        if (/failed to fetch|network|timeout|connection/i.test(msg)) {
          setError(
            "Connection issue (server may be waking up from sleep). Please wait a few seconds and try again."
          );
        } else if (msg && !/\[yt-dlp|\[instagram|status\s*\d+/i.test(msg)) {
          setError(msg);
        } else if (isStory) {
          setError(
            "Could not fetch this story. It may have expired (stories expire after 24 hours), be from a private account, or be restricted by Instagram."
          );
        } else {
          setError(
            "Could not fetch Instagram media. The post or reel may be private, restricted, or expired."
          );
        }
      }
    } finally {
      setLoading(false);
      setLoadingStatus(null);
    }
  }

  function getResourceFilename(r: ServerResource): string {
    const isPhoto = r.isImage || r.ext === "jpg" || r.ext === "png";
    const defaultName = isPhoto
      ? "instagram_photo"
      : r.audioOnly
      ? "instagram_audio"
      : "instagram_video";
    const safeTitle = sanitizeForFilename(details?.title || defaultName);
    const ext = r.ext || (r.audioOnly ? "mp3" : isPhoto ? "jpg" : "mp4");
    if (r.audioOnly) return `${safeTitle}.mp3`;
    if (isPhoto) return `${safeTitle}.${ext}`;
    return `${safeTitle}-${r.quality || "hd"}p.${ext}`;
  }

  function serverDownloadHref(r: ServerResource): string {
    const params = new URLSearchParams({
      url: url.trim(),
      format_id: r.id,
      audio: r.audioOnly ? "1" : "0",
    });
    if (ytKey) params.set("api_key", ytKey);
    const cookies = cookiesText.trim();
    if (cookies) {
      params.set("cookies", btoa(unescape(encodeURIComponent(cookies))));
    }
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
      const text = await readTextNative();
      if (text && text.trim()) {
        setUrl(text.trim());
        setError(null);
        setClipboardFeedback("Pasted!");
        setTimeout(() => setClipboardFeedback(null), 2000);
      } else {
        setClipboardFeedback("Empty");
        setTimeout(() => setClipboardFeedback(null), 1500);
      }
    } catch {
      setClipboardFeedback("Unavailable");
      setTimeout(() => setClipboardFeedback(null), 1500);
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
      <div className="mb-8">
        <BackButton fallbackHref="/tools/download-tools" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Instagram Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Download Instagram reels, videos, posts, photos, carousels, and stories in full HD quality.
          Fast, free, and watermark-free.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white shadow-xl">
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
              placeholder="https://www.instagram.com/reel/... or /p/... or /stories/..."
              className={inputClass}
              inputMode="url"
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white light:border-slate-900/15 light:text-slate-600 light:hover:text-slate-900"
            >
              {clipboardFeedback === "Pasted!" ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <ClipboardPaste className="h-5 w-5" />
              )}
              {clipboardFeedback ? (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-slate-900/90 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-emerald-300 shadow-md border border-white/10 whitespace-nowrap">
                  {clipboardFeedback}
                </span>
              ) : null}
            </button>
          </div>
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchInfo}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-pink-500/20"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            {loading ? (loadingStatus || "Fetching Media…") : "Download"}
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
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200 light:text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{error}</span>
            {error.includes("Connection issue") || error.includes("waking up") ? (
              <button
                type="button"
                onClick={fetchInfo}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-red-600/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600/60 transition border border-red-400/40"
              >
                Retry now
              </button>
            ) : null}
          </div>
        ) : null}

        {details ? (
          <div className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 sm:p-5 light:border-purple-200 light:bg-purple-50/50">
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
                <p className="flex items-center gap-2 text-sm font-semibold text-pink-200 light:text-pink-700">
                  <Check className="h-4 w-4 shrink-0 text-pink-400" />
                  <span className="truncate">{details.title}</span>
                </p>
                {details.uploader ? (
                  <p className="mt-1 text-xs font-medium text-slate-300 light:text-slate-600">
                    @{details.uploader}
                  </p>
                ) : null}
              </div>
            </div>

            {/* 1. Video / Reel Downloads */}
            {videoResources.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-pink-400" /> Video & Reel Downloads
                </p>
                <div className="mt-2 space-y-2">
                  {videoResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 p-3.5 sm:px-4 sm:py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-pink-600/20 text-sm font-bold text-pink-300 light:bg-pink-100 light:text-pink-700">
                          {r.quality ? `${r.quality}p` : "HD"}
                        </span>
                        <p className="text-xs text-slate-300 light:text-slate-600 font-medium">
                          {[
                            r.sizeLabel,
                            r.hasAudio ? "with audio" : "video only",
                            r.fps ? `${r.fps}fps` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "MP4 Video"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex min-h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === r.id ? "Downloading…" : "Download MP4"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 2. Photo & Carousel Downloads */}
            {photoResources.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-sky-400" /> Photo & Image Downloads
                </p>
                <div className="mt-2 space-y-2">
                  {photoResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 p-3.5 sm:px-4 sm:py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-sky-600/20 text-sm font-bold text-sky-300 light:bg-sky-100 light:text-sky-700">
                          <ImageIcon className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-300 light:text-slate-600 font-medium">
                          {[r.sizeLabel, "JPG Image"].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex min-h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === r.id ? "Downloading…" : "Download Photo"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 3. Audio Only Downloads */}
            {audioResources.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-purple-400" /> Audio Only
                </p>
                <div className="mt-2 space-y-2">
                  {audioResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 p-3.5 sm:px-4 sm:py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-sm font-bold text-purple-300 light:bg-purple-100 light:text-purple-700">
                          <Music className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-300 light:text-slate-600 font-medium">
                          {[r.sizeLabel, "MP3 Audio"].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex min-h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90 disabled:opacity-50"
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
          title="How to use Instagram Downloader"
          subtitle=""
          steps={[
            {
              title: "Find the content",
              description:
                "Open Instagram and find the reel, post, video, carousel photo, or story you want to save.",
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
                "Paste the copied link into the field above — or tap the clipboard button to paste automatically.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Get download links",
              description:
                "Click Get download links to fetch high definition video, full-res photos, or MP3 audio.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Pick quality or audio",
              description:
                "Select your preferred HD video resolution, choose individual carousel photos, or extract audio as MP3.",
              icon: <Music className="h-5 w-5" />,
            },
            {
              title: "Save to your device",
              description:
                "Choose your preferred video quality or photo and tap Download to save it immediately to your gallery.",
              icon: <Check className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
