"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clapperboard,
  ClipboardPaste,
  Download,
  Eraser,
  KeyRound,
  Link2,
  Loader2,
  Music,
  Server,
  Settings2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

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
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

/** Free RapidAPI service that returns all formats — no cookies, no server. */
const RAPID_HOST = "youtube-media-downloader.p.rapidapi.com";

type ApiVideo = {
  label: string;
  quality: number;
  url: string;
  size: number;
  sizeLabel: string | null;
  hasAudio: boolean;
  mimeType: string;
  container: string;
  codec: string | null;
};

type ApiAudio = {
  label: string;
  url: string;
  size: number;
  sizeLabel: string | null;
  mimeType: string;
  container: string;
  codec: string | null;
};

type VideoDetails = {
  title: string;
  thumbnail: string | null;
  duration: string | null;
  uploader: string | null;
  videos: ApiVideo[];
  audios: ApiAudio[];
};

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

function getVideoId(url: string): string | null {
  const s = String(url || "").trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[m.length - 1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
}

function fmtBytes(n: unknown): string | null {
  const v = Number(n);
  if (!v || v <= 0) return null;
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(x >= 100 ? 0 : 1)} ${u[i]}`;
}

function fmtDuration(sec: unknown): string | null {
  const s = Number(sec);
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function parseMime(mime: string): { container: string; codec: string | null } {
  const m = String(mime || "");
  const container = /webm/i.test(m) ? "WebM" : /mp4/i.test(m) ? "MP4" : m.split("/")[1]?.split(";")[0]?.toUpperCase() || "?";
  const cm = m.match(/codecs="([^"]+)"/);
  const codec = cm ? cm[1].split(",")[0].trim().split(".")[0] : null;
  return { container, codec };
}

function pickThumbnail(d: any): string | null {
  const t = d?.thumbnails;
  if (Array.isArray(t) && t.length) {
    const sorted = [...t].sort(
      (a, b) => (b?.width || 0) - (a?.width || 0),
    );
    return sorted[0]?.url || null;
  }
  return d?.thumbnail || d?.thumbnailUrl || null;
}

function qualityNum(label: string): number {
  return parseInt(String(label || "0").replace(/\D/g, ""), 10) || 0;
}

export default function YoutubeDownloaderPage() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("tv_rapidapi_key") || "",
  );
  const [serverUrl, setServerUrl] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("tv_yt_server") || "",
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [serverResources, setServerResources] = useState<ServerResource[] | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);

  function saveApiKey(v: string) {
    setApiKey(v);
    try {
      localStorage.setItem("tv_rapidapi_key", v);
    } catch {
      /* ignore */
    }
  }

  function saveServerUrl(v: string) {
    setServerUrl(v);
    try {
      localStorage.setItem("tv_yt_server", v);
    } catch {
      /* ignore */
    }
  }

  async function fetchViaRapidApi(videoId: string, key: string) {
    const res = await fetch(
      `https://${RAPID_HOST}/v2/video/details?videoId=${videoId}`,
      {
        headers: {
          "x-rapidapi-key": key.trim(),
          "x-rapidapi-host": RAPID_HOST,
        },
        signal: abortRef.current?.signal,
      },
    );
    if (res.status === 401 || res.status === 403) {
      throw new Error("API key rejected — check the key in Advanced settings.");
    }
    if (res.status === 429) {
      throw new Error(
        "Free quota used up (100 lookups/month). It resets next month, or use your own download server below.",
      );
    }
    const data = await res.json();
    if (!res.ok || data?.errorId) {
      throw new Error(
        data?.message || `Lookup failed (HTTP ${res.status}).`,
      );
    }

    const videos: ApiVideo[] = (data?.videos?.items || [])
      .filter((v: any) => v?.url)
      .map((v: any) => {
        const { container, codec } = parseMime(v.mimeType);
        return {
          label: String(v.quality || v.qualityLabel || "?"),
          quality: qualityNum(v.quality || v.qualityLabel),
          url: v.url,
          size: Number(v.size) || 0,
          sizeLabel: fmtBytes(v.size),
          hasAudio: !!v.hasAudio,
          mimeType: String(v.mimeType || ""),
          container,
          codec,
        };
      })
      .sort((a: ApiVideo, b: ApiVideo) => a.quality - b.quality);

    const audios: ApiAudio[] = (data?.audios?.items || [])
      .filter((a: any) => a?.url)
      .map((a: any) => {
        const { container, codec } = parseMime(a.mimeType || a.extension);
        return {
          label: String(
            a.quality || a.audioQuality || a.bitrate || "Audio",
          ),
          url: a.url,
          size: Number(a.size) || 0,
          sizeLabel: fmtBytes(a.size),
          mimeType: String(a.mimeType || a.extension || ""),
          container,
          codec,
        };
      })
      .sort((a: ApiAudio, b: ApiAudio) => b.size - a.size);

    if (!videos.length && !audios.length) {
      throw new Error("No downloadable formats found for this video.");
    }

    setDetails({
      title: data?.title || "video",
      thumbnail: pickThumbnail(data),
      duration: fmtDuration(data?.duration || data?.lengthSeconds),
      uploader:
        data?.channelTitle || data?.author || data?.channel?.name || null,
      videos,
      audios,
    });
    setServerResources(null);
  }

  async function fetchViaServer(videoUrl: string, base: string) {
    const res = await fetch(`${base}/api/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
      signal: abortRef.current?.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || data?.error || `Server error ${res.status}`);
    }
    setDetails({
      title: data?.title || "video",
      thumbnail: data?.thumbnail || null,
      duration: fmtDuration(data?.duration),
      uploader: data?.uploader || null,
      videos: [],
      audios: [],
    });
    setServerResources(data?.resources || []);
  }

  async function fetchInfo() {
    const clean = url.trim();
    const videoId = getVideoId(clean);
    if (!videoId) {
      setError("Paste a valid YouTube link first.");
      return;
    }
    const key = apiKey.trim();
    const base = serverUrl.trim().replace(/\/+$/, "");
    if (!key && !base) {
      setError("Add your free API key in Advanced settings first — no server, no cookies needed.");
      setShowAdvanced(true);
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
      if (key) await fetchViaRapidApi(videoId, key);
      else await fetchViaServer(clean, base);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message || "Lookup failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  function serverDownloadHref(r: ServerResource): string {
    const params = new URLSearchParams({
      url: url.trim(),
      format_id: r.id,
      audio: r.audioOnly ? "1" : "0",
    });
    return `${serverUrl.trim().replace(/\/+$/, "")}/api/download?${params.toString()}`;
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
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          YouTube Video Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Paste a YouTube link and get every available video quality plus
          audio-only options. Free, no signup, no cookies, no server to run.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
            YouTube URL
          </span>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
              placeholder="https://www.youtube.com/watch?v=..."
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

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchInfo}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            {loading ? "Fetching…" : "Fetch video"}
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
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex gap-3">
              {details.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={details.thumbnail}
                  alt=""
                  className="h-20 w-36 shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0">
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

            {details.videos.length || details.audios.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {details.videos.length ? (
                  <a
                    href={details.videos[details.videos.length - 1].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500"
                  >
                    <Download className="h-4 w-4" />
                    Best video ({details.videos[details.videos.length - 1].label})
                  </a>
                ) : null}
                {details.audios.length ? (
                  <a
                    href={details.audios[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 light:bg-slate-900/5 light:text-slate-900 light:hover:bg-slate-900/10"
                  >
                    <Music className="h-4 w-4" />
                    Best audio
                  </a>
                ) : null}
              </div>
            ) : null}

            {details.videos.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Video qualities
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 light:border-slate-900/10">
                  {details.videos.map((v, i) => (
                    <div
                      key={`${v.label}-${i}`}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 light:border-slate-900/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white light:bg-slate-900/5 light:text-slate-900">
                          {v.label}
                        </span>
                        <p className="text-xs text-slate-500">
                          {[
                            v.sizeLabel,
                            v.hasAudio ? "with audio" : "video only",
                            v.container,
                            v.codec,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {details.audios.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audio only
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 light:border-slate-900/10">
                  {details.audios.map((a, i) => (
                    <div
                      key={`${a.label}-${i}`}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 light:border-slate-900/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white light:bg-slate-900/5 light:text-slate-900">
                          <Music className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-500">
                          {[a.label, a.sizeLabel, a.container, a.codec]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {serverResources && serverResources.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Choose quality
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 light:border-slate-900/10">
                  {serverResources.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 light:border-slate-900/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white light:bg-slate-900/5 light:text-slate-900">
                          {r.audioOnly ? "MP3" : `${r.quality}p`}
                        </span>
                        <p className="text-xs text-slate-500">
                          {[
                            r.sizeLabel,
                            r.hasAudio && !r.audioOnly ? "with audio" : null,
                            r.fps ? `${r.fps}fps` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </p>
                      </div>
                      <a
                        href={serverDownloadHref(r)}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-300"
        >
          <Settings2 className="h-4 w-4" />
          Advanced settings
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>
        {showAdvanced ? (
          <div className="mt-3 space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300 light:text-slate-700">
                <KeyRound className="h-4 w-4" />
                RapidAPI key (free)
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="paste your RapidAPI key"
                className={inputClass}
                autoComplete="off"
              />
            </label>
            <p className="-mt-2 text-xs leading-5 text-slate-500">
              Get one free at{" "}
              <a
                href="https://rapidapi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-300"
              >
                rapidapi.com
              </a>{" "}
              → search “YouTube Media Downloader” → subscribe to the free plan
              (100 lookups/month, no credit card) → copy the key. It stays in
              your browser only.
            </p>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300 light:text-slate-700">
                <Server className="h-4 w-4" />
                Your own download server (optional)
              </span>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => saveServerUrl(e.target.value)}
                placeholder="https://your-yt-backend.onrender.com"
                className={inputClass}
                inputMode="url"
              />
            </label>
            <p className="-mt-2 text-xs leading-5 text-slate-500">
              Only needed if you run out of free API lookups — the yt-backend
              from the Toolverse download-server pack works as a fallback
              (no cookies needed).
            </p>
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500 light:text-slate-500">
          Only download videos you own or have permission to download. Respect
          creators&apos; rights and YouTube&apos;s terms.
        </p>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the YouTube Downloader"
          subtitle=""
          steps={[
            {
              title: "Get a free API key",
              description:
                "Sign up free at rapidapi.com, subscribe to “YouTube Media Downloader” (free plan), and paste the key in Advanced settings.",
              icon: <KeyRound className="h-5 w-5" />,
            },
            {
              title: "Copy the video link",
              description: "Copy the URL of any YouTube video or Short.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste it above",
              description: "Paste the link into the URL field — or tap the paste button.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Fetch the video",
              description: "Hit Fetch video to load every available quality and audio option.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Pick quality or audio",
              description: "Choose a video quality row, or grab an audio-only track.",
              icon: <Clapperboard className="h-5 w-5" />,
            },
            {
              title: "Respect creators",
              description: "Only download content you own or are allowed to keep offline.",
              icon: <Music className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
