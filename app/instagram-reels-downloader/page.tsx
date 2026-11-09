"use client";

import { BackButton } from "@/components/BackButton";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Download,
  Eraser,
  Film,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Loader2,
  Music,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { PRIVATE_YT_BACKEND, PRIVATE_YT_KEY } from "@/lib/downloadServers";
import { downloadFile, isNative } from "@/lib/capacitor";

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [serverResources, setServerResources] = useState<ServerResource[] | null>(
    null
  );
  // Visitor's own Instagram cookies (required for Stories and private content)
  const [cookiesText, setCookiesText] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(IG_COOKIES_KEY);
      if (saved) setCookiesText(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Auto prefill from searchParams or sessionStorage (e.g. from SmartInput)
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
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const cookieStatus = useMemo(() => {
    const text = cookiesText.trim();
    if (!text) return null;
    const hasAuth = /(sessionid|ds_user_id|csrftoken)/i.test(text);
    if (hasAuth || (text.length > 20 && !text.includes(" "))) {
      return {
        valid: true,
        message: "Instagram session detected (sessionid / credentials active).",
      };
    }
    return {
      valid: false,
      message:
        "No sessionid or ds_user_id found. If downloading Stories or private posts, paste your cookies.txt or sessionid.",
    };
  }, [cookiesText]);

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

      const res = await fetch(`${base}/api/info`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: normalizedUrl,
          ...(cookies ? { cookies } : {}),
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.needsCookies || clean.includes("/stories/")) {
          setShowCookies(true);
        }
        throw new Error(data?.detail || data?.error || `Server returned ${res.status}`);
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
        if (isStory && !cookiesText.trim()) {
          setShowCookies(true);
          setError(
            "Instagram Stories require an active Instagram session because Meta blocks unauthenticated access to stories. Please paste your Instagram cookies (or sessionid) below to download this story."
          );
        } else if (/failed to fetch/i.test(msg)) {
          setError(
            "Connection issue (server may be waking up from sleep). Please wait a few seconds and try again."
          );
        } else {
          if (/login|cookie|auth|session|story|stories|private/i.test(msg)) {
            setShowCookies(true);
          }
          setError(
            msg ||
              "Could not fetch Instagram info. The post/story may be private, restricted, or expired. Try adding cookies below."
          );
        }
      }
    } finally {
      setLoading(false);
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white light:border-slate-900/15 light:text-slate-600 light:hover:text-slate-900"
            >
              <ClipboardPaste className="h-5 w-5" />
            </button>
          </div>
          {url.includes("/stories/") ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 p-2.5 text-xs text-pink-200 light:text-pink-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
              <span>
                <strong>Instagram Story Link:</strong> Active 24-hour stories are restricted by Meta to logged-in accounts. If this story is from a private account or requires login, expand <strong>&quot;Instagram Cookies / Session&quot;</strong> below.
              </span>
            </div>
          ) : null}
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
            {loading ? "Fetching Media…" : "Get download links"}
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

        {/* Visitor's own Instagram cookies accordion */}
        <div className="mt-4 border-t border-white/10 pt-3 light:border-slate-900/10">
          <button
            type="button"
            onClick={() => setShowCookies((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 underline-offset-4 hover:underline hover:text-pink-400 light:text-slate-600 light:hover:text-pink-600 transition"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {showCookies
              ? "Hide Instagram Cookies / Session"
              : "Downloading Stories or Private posts? Add your Instagram session (optional)"}
          </button>
          {showCookies ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 light:border-slate-900/10 light:bg-slate-50">
              <div className="text-xs leading-5 text-slate-300 light:text-slate-700">
                <p className="font-semibold text-white light:text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-pink-400" /> How to download Stories and private content:
                </p>
                <p className="mt-1 text-slate-400 light:text-slate-600">
                  Meta strictly gates Instagram Stories and private posts so only logged-in sessions can view them. You can easily authenticate by providing your browser&apos;s session:
                </p>
                <ol className="mt-2.5 space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-[11px] font-bold text-pink-400">
                      1
                    </span>
                    <span>
                      <strong>Option A (Easiest - Single Session ID):</strong> Open{" "}
                      <a
                        href="https://www.instagram.com"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-300"
                      >
                        instagram.com
                      </a>{" "}
                      logged in &rarr; Press <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">F12</kbd> (or Right-click &rarr; Inspect) &rarr; Go to <strong>Application</strong> &rarr; <strong>Cookies</strong> &rarr; Copy the <strong>sessionid</strong> cookie value and paste it below.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-[11px] font-bold text-pink-400">
                      2
                    </span>
                    <span>
                      <strong>Option B (Full cookies.txt):</strong> Install the browser extension{" "}
                      <a
                        href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline decoration-pink-400/40 underline-offset-2 hover:text-pink-300"
                      >
                        Get cookies.txt LOCALLY
                      </a>
                      , open instagram.com, click &quot;Export&quot;, and drop the file below.
                    </span>
                  </li>
                </ol>
                <p className="mt-3 border-t border-white/5 pt-2 text-[11px] text-slate-400 light:border-slate-900/5 light:text-slate-500">
                  🔒 <strong>Privacy note:</strong> Cookies are stored only in your local browser and sent exclusively to fetch your requested media. They are never saved to any database.
                </p>
              </div>

              <textarea
                value={cookiesText}
                onChange={(e) => setCookiesText(e.target.value)}
                placeholder="Paste your Instagram sessionid or cookies.txt content here…"
                rows={4}
                spellCheck={false}
                className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-pink-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
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
                      const file = e.target.files?.[0];
                      if (!file) return;
                      file
                        .text()
                        .then((text) => setCookiesText(text))
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
                        localStorage.removeItem(IG_COOKIES_KEY);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="text-xs font-medium text-slate-400 underline-offset-4 hover:underline hover:text-red-400 light:text-slate-600"
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-pink-600/20 text-sm font-bold text-pink-300 light:bg-pink-100 light:text-pink-700">
                          {r.quality ? `${r.quality}p` : "HD"}
                        </span>
                        <p className="text-xs text-slate-400 light:text-slate-600 truncate">
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
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-sky-600/20 text-sm font-bold text-sky-300 light:bg-sky-100 light:text-sky-700">
                          <ImageIcon className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-400 light:text-slate-600 truncate">
                          {[r.sizeLabel, "JPG Image"].filter(Boolean).join(" • ")}
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 light:border-slate-900/10 light:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-sm font-bold text-purple-300 light:bg-purple-100 light:text-purple-700">
                          <Music className="h-4 w-4" />
                        </span>
                        <p className="text-xs text-slate-400 light:text-slate-600">
                          {[r.sizeLabel, "MP3 Audio"].filter(Boolean).join(" • ")}
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
          title="How to download Instagram reels, videos, photos & stories"
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
              title: "Save to your device",
              description:
                "Choose your preferred video quality or photo and tap Download to save it immediately.",
              icon: <Check className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
