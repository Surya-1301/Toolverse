"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { saveBlobNative } from "@/lib/capacitor";

type PendingBlob = {
  blob: Blob;
  revoked: boolean;
  timer?: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingBlob>();
let patched = false;

function trackBlobUrl(url: string, blob: Blob) {
  const existing = pending.get(url);
  if (existing?.timer) clearTimeout(existing.timer);
  pending.set(url, { blob, revoked: false });
}

function markRevoked(url: string) {
  const entry = pending.get(url);
  if (!entry) return;
  // Tool pages call URL.revokeObjectURL() synchronously right after
  // link.click(). Defer the actual forget so our async save can still
  // use the blob — the native save doesn't need the URL itself.
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    entry.revoked = true;
    pending.delete(url);
  }, 8000);
}

function patchUrlApi() {
  if (patched) return;
  patched = true;
  try {
    const origCreate = URL.createObjectURL.bind(URL);
    const origRevoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = ((obj: Blob | MediaSource) => {
      const url = origCreate(obj as Blob);
      if (obj instanceof Blob) trackBlobUrl(url, obj);
      return url;
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((url: string) => {
      markRevoked(url);
      try {
        origRevoke(url);
      } catch {
        // ignore — WebView may already have dropped it
      }
    }) as typeof URL.revokeObjectURL;
  } catch {
    // ignore — patch is best-effort
  }
}

async function saveHref(href: string, fileName: string): Promise<boolean> {
  const name = fileName || "download";
  try {
    if (href.startsWith("blob:")) {
      const entry = pending.get(href);
      if (entry && !entry.revoked) {
        await saveBlobNative(entry.blob, name);
        return true;
      }
      // Fall through to fetch — still works if the URL is alive.
    }
    const response = await fetch(href);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    await saveBlobNative(blob, name);
    return true;
  } catch (error) {
    console.error("Native file download failed:", error);
    return false;
  }
}

export function DownloadInterceptor() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    patchUrlApi();

    // 1) Real user taps on <a download> links rendered in the DOM.
    async function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.(
        "a[download]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      event.preventDefault();
      event.stopPropagation();

      const fileName =
        anchor.download || href.split("/").pop() || "download";
      await saveHref(href, fileName);
    }

    // 2) Programmatic downloads: every tool page does
    //    const a = document.createElement("a"); a.click();
    //    which fires NO click event. Patch click() on anchor
    //    elements so those are caught too.
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (
      this: HTMLAnchorElement,
    ) {
      const href = this.getAttribute("href") || this.href || "";
      const dl = this.download;
      if (
        Capacitor.isNativePlatform() &&
        href &&
        (dl || href.startsWith("blob:") || href.startsWith("data:"))
      ) {
        void saveHref(href, dl || href.split("/").pop() || "download");
        return;
      }
      return origClick.call(this);
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      HTMLAnchorElement.prototype.click = origClick;
    };
  }, []);

  return null;
}
