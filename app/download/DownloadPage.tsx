"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Smartphone, ExternalLink } from "lucide-react";
import {
  downloadFile,
  openInBrowser,
  requestNotificationPermission,
  showDownloadNotification,
  isNative,
} from "@/lib/capacitor";

export function DownloadPage() {
  const [url, setUrl] = useState(
    "https://github.com/Surya-1301/ToolverseX/releases/latest/download/toolverse.apk",
  );
  const [filename, setFilename] = useState("toolverse.apk");
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [notifPerm, setNotifPerm] = useState(false);

  const isNativePlatform = isNative();

  useEffect(() => {
    requestNotificationPermission().then(() => setNotifPerm(true));
  }, []);

  const handleDownload = useCallback(async () => {
    setError("");
    setProgress(0);
    setDownloading(true);
    setDownloaded(false);

    try {
      await downloadFile(url, filename, (p) => setProgress(p));
      setDownloaded(true);
      setDownloading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Download failed. Check the URL.",
      );
      setDownloading(false);
    }
  }, [url, filename]);

  const handleOpenBrowser = useCallback(() => {
    openInBrowser(url);
  }, [url]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 lg:p-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="h-6 w-6 text-violet-400" />
          <h1 className="text-2xl font-bold tracking-tight">
            Download Toolverse APK
          </h1>
        </div>

        <p className="mt-2 text-slate-400 text-sm">
          {isNativePlatform
            ? "Running in the Capacitor Android WebView — files save to the device Downloads folder with a status bar notification."
            : "Running in browser — download uses the browser's native save dialog."}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/10">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                APK download URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="https://example.com/app.apk"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Save as filename
              </label>
              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="toolverse.apk"
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || !url.trim()}
              className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Download className="h-5 w-5 animate-spin" />
                  <span>Downloading… {progress}%</span>
                </>
              ) : downloaded ? (
                <>
                  <Download className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400">Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Download APK</span>
                </>
              )}
            </button>

            {downloaded && notifPerm && (
              <p className="text-xs text-emerald-400">
                Saved to device Downloads &amp; status bar notification shown.
              </p>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold">Open any link in default browser</h2>
          </div>
          <p className="mt-2 text-slate-400 text-sm">
            Links open in the system browser instead of the in-app WebView.
          </p>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              URL to open externally
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <button
              onClick={handleOpenBrowser}
              disabled={!url.trim()}
              className="mt-3 w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4" />
              Open in default browser
            </button>
          </div>
        </div>

        {!isNativePlatform && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-500">
            Capacitor native features (download to device storage, status bar
            notifications, external browser) only work when built as an Android
            APK. In the browser, downloads use the native save dialog.
          </div>
        )}
      </div>
    </div>
  );
}
