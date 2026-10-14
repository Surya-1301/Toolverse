"use client";

import { useRef, useState } from "react";
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
  Settings2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import {
  cobaltErrorMessage,
  looksLikeUrl,
  type CobaltPickerItem,
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
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-pink-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

export default function InstagramReelsDownloaderPage() {
  const [url, setUrl] = useState("");
  // Private server, baked in and hidden from the UI.
  const apiBase = PRIVATE_COBALT_API;
  const apiKey = PRIVATE_COBALT_KEY;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CobaltPickerItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const cobalt = useCobaltDownloader(apiBase, apiKey);

  function handleResult(res: CobaltResponse) {
    if (res.status === "error") {
      setError(cobaltErrorMessage(res.error.code));
    } else if (res.status === "picker") {
      const found = res.picker.filter((p) => p.url);
      if (found.length) setItems(found);
      else setError("No downloadable media found at that link.");
    } else if (res.status === "local-processing") {
      setError(
        "This file needs local processing, which isn't supported here. Try another API instance below.",
      );
    } else {
      setItems([{ url: res.url }]);
    }
  }

  async function fetchDownload() {
    const clean = url.trim();
    if (!looksLikeUrl(clean)) {
      setError("Paste a valid Instagram link first.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const res = await cobalt.download(
        { url: clean, videoQuality: "max", filenameStyle: "pretty" },
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
    setItems([]);
    setLoading(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-pink-600/30">
          <Film className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Instagram Reels Downloader
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Paste an Instagram reel, post or story link and download the video
          in HD. Works with reels, posts and carousels. Free, no signup.
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
            {loading ? "Fetching…" : "Get download link"}
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

        {items.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200 light:text-emerald-700">
              <Check className="h-4 w-4" />
              {items.length === 1
                ? "Ready to download"
                : `${items.length} items found — download each one`}
            </p>
            {items.map((item, i) => (
              <div
                key={item.url}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-3 light:border-slate-900/10 light:bg-slate-50"
              >
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt={`Item ${i + 1}`}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pink-600/20 text-pink-300">
                    <Film className="h-6 w-6" />
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-slate-400">
                  {item.type ? `${item.type} ` : ""}Item {i + 1}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              If it opens in a new tab instead of downloading, use your
              browser&apos;s save option there.
            </p>
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500 light:text-slate-500">
          Only download reels you own or have permission to save. Private
          accounts and stories that require login may not work.
        </p>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the Reels Downloader"
          subtitle=""
          steps={[
            {
              title: "Copy the reel link",
              description: "Tap Share → Copy link on any public reel, post or video.",
              icon: <Link2 className="h-5 w-5" />,
            },
            {
              title: "Paste it above",
              description: "Paste the Instagram URL into the field — or tap the paste button.",
              icon: <ClipboardPaste className="h-5 w-5" />,
            },
            {
              title: "Get the download link",
              description: "Hit the button and wait a few seconds while the video is fetched.",
              icon: <Download className="h-5 w-5" />,
            },
            {
              title: "Pass the human check",
              description: "Complete the quick verification if the server asks for it.",
              icon: <Check className="h-5 w-5" />,
            },
            {
              title: "Download in HD",
              description: "Tap Download — carousels show one button per item.",
              icon: <Film className="h-5 w-5" />,
            },
            {
              title: "Respect creators",
              description: "Only save content you own or are allowed to download.",
              icon: <Settings2 className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
