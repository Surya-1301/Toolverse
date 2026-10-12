"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function sanitizeFilename(name: string): string {
  const clean = (name || "download").replace(/[\\/:*?"<>|]/g, "_").slice(0, 120).trim();
  return clean || "download";
}

async function nativeShareFile(blob: Blob, filename: string): Promise<void> {
  const base64 = await blobToBase64(blob);
  const safeName = sanitizeFilename(filename);
  const saved = await Filesystem.writeFile({
    path: safeName,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({
    title: safeName,
    text: safeName,
    files: [saved.uri],
    dialogTitle: "Save or share file",
  });
}

export function DownloadInterceptor() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Keep blobs reachable by URL: tools revoke the object URL right
    // after click(), but the native share reads it asynchronously.
    const blobRegistry = new Map<string, Blob>();
    const originalCreate = URL.createObjectURL.bind(URL);
    const originalRevoke = URL.revokeObjectURL.bind(URL);

    URL.createObjectURL = ((obj: Blob | MediaSource) => {
      const url = originalCreate(obj as Blob);
      if (obj instanceof Blob) blobRegistry.set(url, obj);
      return url;
    }) as typeof URL.createObjectURL;

    URL.revokeObjectURL = (url: string) => {
      setTimeout(() => {
        blobRegistry.delete(url);
        try {
          originalRevoke(url);
        } catch {
          /* already revoked */
        }
      }, 10000);
    };

    async function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[download]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("blob:") && !href.startsWith("data:")) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        let blob = blobRegistry.get(href);
        if (!blob) {
          const response = await fetch(href);
          blob = await response.blob();
        }
        await nativeShareFile(blob, anchor.download || "download");
      } catch (error) {
        console.error("Native file download failed:", error);
      }
    }

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    };
  }, []);

  return null;
}
