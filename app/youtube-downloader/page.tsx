"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clapperboard,
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
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

type VideoDetails = {
  title: string;
  thumbnail: string | null;
  duration: string | null;
  uploader: string | null;
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

function fmtDuration(sec: unknown): string | null {
  const s = Number(sec);
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function sanitizeForFilename(title: string): string {
  return (title || "video")
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** localStorage key for the visitor's own cookies — their device only. */
const YT_COOKIES_KEY = "yt-visitor-cookies";

export default function YoutubeDownloaderPage() {
  const [url, setUrl] = useState("");
  // Private server, baked in and hidden from the UI.
  const serverUrl = PRIVATE_YT_BACKEND;
  const ytKey = PRIVATE_YT_KEY;
  const [activeServer, setActiveServer] = useState(serverUrl);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [serverResources, setServerResources] = useState<ServerResource[] | null>(
    null,
  );
  // Visitor's own YouTube cookies (optional): pasted by the visitor, sent
  // with their requests only, never stored on backend.
  const [cookiesText, setCookiesText] = useState("");
  const [showCookies, setShowCookies] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(YT_COOKIES_KEY);
      if (saved) setCookiesText(saved);
    } catch {
      /* storage unavailable (private mode etc.) */
    }
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const videoResources = useMemo(() => {
    return (serverResources || []).filter((r) => !r.audioOnly);
  }, [serverResources]);

  const audioResources = useMemo(() => {
    return (serverResources || []).filter((r) => r.audioOnly);
  }, [serverResources]);

  const bestVideo = useMemo(() => {
    if (!videoResources.length) return null;
    return [...videoResources].sort((a, b) => b.quality - a.quality)[0];
  }, [videoResources]);

  const bestAudio = useMemo(() => {
    return audioResources.length ? audioResources[0] : null;
  }, [audioResources]);

  const cookieStatus = useMemo(() => {
    const text = cookiesText.trim();
    if (!text) return null;
    const hasAuth =
      /(__Secure-3PSID|__Secure-1PSID|\bSID\b|\bLOGIN_INFO\b|\bSAPISID\b)/i.test(
        text,
      );
    if (hasAuth) {
      return {
        valid: true,
        message: "Authenticated YouTube login cookies detected.",
      };
    }
    return {
      valid: false,
      message:
        "These cookies appear to be from a logged-out guest session (only GPS/visitor cookies detected). YouTube blocks datacenter servers unless cookies are exported while logged into YouTube (with SID, LOGIN_INFO, or __Secure-3PSID). Please sign into youtube.com in your browser, then re-export.",
    };
  }, [cookiesText]);

  async function fetchViaServer(videoUrl: string, base: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ytKey) headers["x-api-key"] = ytKey;
    const cookies = cookiesText.trim();
    if (cookies) {
      try {
        localStorage.setItem(YT_COOKIES_KEY, cookies);
      } catch {
        /* storage unavailable */
      }
    }
    const res = await fetch(`${base}/api/info`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: videoUrl,
        ...(cookies ? { cookies } : {}),
      }),
      signal: abortRef.current?.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      const detail =
        data?.detail || data?.error || `Server error ${res.status}`;
      if (/bot|sign in|login_required|timed out/i.test(detail)) {
        setShowCookies(true);
      }
      throw new Error(
        cookies
          ? `${detail} (your cookies were sent but YouTube rejected them — try freshly exported cookies)`
          : `${detail}${/bot|sign in|timed out/i.test(detail) ? ". YouTube blocks cloud servers without login — use the 'Blocked? Use your own YouTube cookies' option below." : ""}`,
      );
    }
    setDetails({
      title: data?.title || "video",
      thumbnail: data?.thumbnail || null,
      duration: fmtDuration(data?.duration),
      uploader: data?.uploader || null,
    });
    setServerResources(data?.resources || []);
  }

  async function fetchInfo() {
    const clean = url.trim();
    const vid = getVideoId(clean);
    if (!vid) {
      setError("Paste a valid YouTube link or video ID first.");
      return;
    }
    const normalizedUrl = `https://www.youtube.com/watch?v=${vid}`;
    const base = serverUrl.trim().replace(/\/+$/, "");
    const yeBase = PRIVATE_YE_BACKEND.trim().replace(/\/+$/, "");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDetails(null);
    setServerResources(null);

    try {
      setActiveServer(base);
      await fetchViaServer(normalizedUrl, base);
    } catch (e1) {
      if (yeBase && yeBase !== base && (e1 as Error).name !== "AbortError") {
        try {
          setActiveServer(yeBase);
          await fetchViaServer(normalizedUrl, yeBase);
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

  function getResourceFilename(r: ServerResource): string {
    const safeTitle = sanitizeForFilename(details?.title || "video");
    const ext = r.ext || (r.audioOnly ? "mp3" : "mp4");
    return r.audioOnly ? `${safeTitle}.${ext}` : `${safeTitle}-${r.quality}p.${ext}`;
  }

  function serverDownloadHref(r: ServerResource): string {
    const vid = getVideoId(url.trim());
    const targetUrl = vid ? `https://www.youtube.com/watch?v=${vid}` : url.trim();
    const params = new URLSearchParams({
      url: targetUrl,
      format_id: r.id,
      audio: r.audioOnly ? "1" : "0",
    });
    if (ytKey) params.set("api_key", ytKey);
    const cookies = cookiesText.trim();
    if (cookies) {
      // Base64: raw cookies.txt (tabs/newlines) does not belong in a URL.
      params.set("cookies", btoa(unescape(encodeURIComponent(cookies))));
    }
    return `${activeServer.trim().replace(/\/+$/, "")}/api/download?${params.toString()}`;
  }

  async function handleDownload(r: ServerResource) {
    const href = serverDownloadHref(r);
    const filename = getResourceFilename(r);
    setDownloadingId(r.id);

    try {
      if (isNative()) {
        await downloadFile(href, filename);
      } else {
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Download request failed.",
      );
    } finally {
      setTimeout(() => setDownloadingId(null), 4000);
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
          YouTube Video Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Paste a YouTube link and get every available video quality plus
          audio-only options. Free, fast and private.
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
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
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

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCookies((v) => !v)}
            className="text-xs font-medium text-slate-400 underline-offset-4 hover:underline light:text-slate-600"
          >
            {showCookies
              ? "Hide your-cookies option"
              : "Blocked? Use your own YouTube cookies (optional)"}
          </button>
          {showCookies ? (
            <div className="mt-3 rounded-2xl border border-white/10 p-4 light:border-slate-900/10">
              <p className="text-xs leading-5 text-slate-400 light:text-slate-600">
                If fetching fails with a sign-in error, paste your own
                exported YouTube cookies here (browser extension “Get
                cookies.txt LOCALLY”, while logged into YouTube) or drop
                the cookies.txt file below. They are sent with your
                requests only, never stored on the server, and never
                shared with anyone. Paste once — they are remembered in
                this browser so you don&apos;t paste again.
              </p>
              <textarea
                value={cookiesText}
                onChange={(e) => setCookiesText(e.target.value)}
                placeholder="Paste your cookies.txt content here…"
                rows={4}
                spellCheck={false}
                className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
              />
              {cookieStatus ? (
                <div
                  className={`mt-2 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${
                    cookieStatus.valid
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 light:text-emerald-800"
                      : "border border-amber-500/30 bg-amber-500/10 text-amber-200 light:text-amber-800"
                  }`}
                >
                  {cookieStatus.valid ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <span>{cookieStatus.message}</span>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white light:border-slate-900/15 light:text-slate-600 light:hover:text-slate-900">
                  Drop cookies.txt file
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      f.text()
                        .then((t) => setCookiesText(t))
                        .catch(() => {});
                      e.target.value = "";
                    }}
                  />
                </label>
                {cookiesText.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCookiesText("");
                      try {
                        localStorage.removeItem(YT_COOKIES_KEY);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="text-xs font-medium text-slate-400 underline-offset-4 hover:underline light:text-slate-600"
                  >
                    Forget saved cookies
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
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

            {/* Quick Action Buttons: Best Video & Best Audio */}
            {bestVideo || bestAudio ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {bestVideo ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(bestVideo)}
                    disabled={downloadingId === bestVideo.id}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                  >
                    {downloadingId === bestVideo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloadingId === bestVideo.id
                      ? "Starting download…"
                      : `Best video (${bestVideo.quality}p)`}
                  </button>
                ) : null}
                {bestAudio ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(bestAudio)}
                    disabled={downloadingId === bestAudio.id}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 light:bg-slate-900/5 light:text-slate-900 light:hover:bg-slate-900/10 disabled:opacity-60"
                  >
                    {downloadingId === bestAudio.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Music className="h-4 w-4" />
                    )}
                    {downloadingId === bestAudio.id
                      ? "Starting download…"
                      : "Best audio (MP3)"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Video Qualities List */}
            {videoResources.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Video qualities
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 light:border-slate-900/10">
                  {videoResources.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 light:border-slate-900/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white light:bg-slate-900/5 light:text-slate-900">
                          {v.quality}p
                        </span>
                        <p className="text-xs text-slate-500">
                          {[
                            v.sizeLabel,
                            v.hasAudio ? "with audio" : null,
                            v.fps ? `${v.fps}fps` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(v)}
                        disabled={downloadingId === v.id}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {downloadingId === v.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === v.id ? "Preparing…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Audio Only List */}
            {audioResources.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audio only
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 light:border-slate-900/10">
                  {audioResources.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 light:border-slate-900/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white light:bg-slate-900/5 light:text-slate-900">
                          <Music className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-500">
                          {[a.sizeLabel, "MP3 audio"]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(a)}
                        disabled={downloadingId === a.id}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {downloadingId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingId === a.id ? "Preparing…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the YouTube Downloader"
          subtitle="Download any YouTube video or Short in six quick steps."
          steps={[
            {
              title: "Find your video",
              description:
                "Open YouTube and navigate to the video, Short or music track you want to download.",
              icon: <Clapperboard className="h-5 w-5" />,
            },
            {
              title: "Copy the link",
              description:
                "Tap Share under the video, then choose Copy link to copy the URL to your clipboard.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste the URL",
              description:
                "Paste the copied link into the input field above — or tap the clipboard button to paste automatically.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Fetch the video",
              description:
                "Click Fetch video and wait a few seconds while the title, thumbnail and all available qualities load.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Pick quality or audio",
              description:
                "Choose a video quality from the list — up to 4K where available — or grab an audio-only MP3 instead.",
              icon: <Music className="h-5 w-5" />,
            },
            {
              title: "Watch offline anytime",
              description:
                "The file saves directly to your device — watch it anytime without internet or share it with friends.",
              icon: <Check className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
