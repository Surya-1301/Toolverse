"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import {
  cobaltErrorMessage,
  looksLikeUrl,
  type CobaltResponse,
} from "@/lib/cobalt";
import { useCobaltDownloader } from "@/lib/useCobalt";
import {
  PRIVATE_COBALT_API,
  PRIVATE_COBALT_KEY,
} from "@/lib/downloadServers";

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
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

const selectClass =
  "min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-violet-500 light:border-slate-900/10 light:bg-white light:text-slate-900";

export default function MusicDownloaderPage() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("128");
  // Private server, baked in and hidden from the UI.
  const apiBase = PRIVATE_COBALT_API;
  const apiKey = PRIVATE_COBALT_KEY;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cobalt = useCobaltDownloader(apiBase, apiKey);

  function handleResult(res: CobaltResponse) {
    if (res.status === "error") {
      setError(cobaltErrorMessage(res.error.code));
    } else if (res.status === "picker") {
      const first = res.picker[0];
      if (first?.url) setDownloadUrl(first.url);
      else setError("No downloadable audio found at that link.");
    } else if (res.status === "local-processing") {
      setError(
        "This file needs local processing, which isn't supported here. Try another API instance below.",
      );
    } else {
      setDownloadUrl(res.url);
      setFileName(res.filename ?? null);
    }
  }

  async function fetchDownload() {
    const clean = url.trim();
    if (!looksLikeUrl(clean)) {
      setError("Paste a valid link first (YouTube, SoundCloud, TikTok…).");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    setFileName(null);

    try {
      const res = await cobalt.download(
        {
          url: clean,
          downloadMode: "audio",
          audioFormat: format,
          audioBitrate: bitrate,
          filenameStyle: "pretty",
        },
        controller.signal,
      );
      if (res === "challenge") return; // widget shown below; on solve we retry
      handleResult(res);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(
          "Couldn't reach the download service. Check your connection or try another API instance below.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChallengeSolved(turnstileResponse: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await cobalt.solveChallenge(
        turnstileResponse,
        abortRef.current?.signal,
      );
      if (res === "challenge") return;
      handleResult(res);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
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
    cobalt.resetChallenge();
    setUrl("");
    setError(null);
    setDownloadUrl(null);
    setFileName(null);
    setLoading(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
          <Music className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Music Downloader
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
              onKeyDown={(e) => e.key === "Enter" && fetchDownload()}
              placeholder="https://www.youtube.com/watch?v=... or soundcloud.com/..."
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <option value="best">Best available</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
              Bitrate
            </span>
            <select
              value={bitrate}
              onChange={(e) => setBitrate(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="320">320 kbps — best</option>
              <option value="256">256 kbps</option>
              <option value="128">128 kbps — balanced</option>
              <option value="96">96 kbps — small file</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchDownload}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <AudioLines className="h-5 w-5" />
            )}
            {loading ? "Extracting…" : "Extract audio"}
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

        {cobalt.authState === "challenge" && cobalt.challengeSitekey ? (
          <div className="mt-4">
            <TurnstileChallenge
              sitekey={cobalt.challengeSitekey}
              onSolved={handleChallengeSolved}
            />
          </div>
        ) : null}

        {cobalt.authState === "key-error" ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200 light:text-red-700">
            The download server rejected the request. Please try again in a
            moment.
          </div>
        ) : null}

        {downloadUrl ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200 light:text-emerald-700">
              <Check className="h-4 w-4" />
              Ready to download
              {fileName ? <span className="font-normal"> — {fileName}</span> : null}
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              <Download className="h-5 w-5" />
              Download {format.toUpperCase()}
            </a>
            <p className="mt-2 text-xs text-slate-500">
              If it opens in a new tab instead of downloading, use your
              browser&apos;s save option there.
            </p>
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500 light:text-slate-500">
          Only download audio you own or have permission to keep. Respect
          artists&apos; rights.
        </p>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the Music Downloader"
          subtitle=""
          steps={[
            {
              title: "Copy the media link",
              description: "Copy the URL of a video or track from YouTube, SoundCloud or TikTok.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste it above",
              description: "Paste the link into the URL field — or tap the paste button.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Pick format & bitrate",
              description: "Choose MP3, OGG, OPUS or WAV, from 96 up to 320 kbps.",
              icon: <Music className="h-5 w-5" />,
            },
            {
              title: "Pass the human check",
              description: "Complete the quick verification if the server asks for it.",
              icon: <Check className="h-5 w-5" />,
            },
            {
              title: "Download the track",
              description: "Tap Download and the audio file saves to your device.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Respect artists",
              description: "Only download audio you own or are allowed to keep offline.",
              icon: <AudioLines className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
