"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";

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

async function saveFileToDownloads(blob: Blob, filename: string): Promise<void> {
  const base64 = await blobToBase64(blob);
  const safeName = sanitizeFilename(filename);

  // Write to Documents root (avoids subdirectory creation issues)
  await Filesystem.writeFile({
    path: safeName,
    data: base64,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  // Notification is non-fatal — file is saved even if it fails
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: "Download complete",
          body: safeName,
          smallIcon: "ic_launcher",
        },
      ],
    });
  } catch {
    // Notification permission may not be granted — ignore.
  }
}

export function DownloadInterceptor() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

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
      if (!href) return;

      event.preventDefault();
      event.stopPropagation();

      // Confirm before downloading (native dialog)
      const fileName = anchor.download || "download";
      if (!window.confirm(`Download "${fileName}"?`)) return;

      try {
        let blob: Blob;

        if (href.startsWith("blob:") || href.startsWith("data:")) {
          blob = blobRegistry.get(href) as Blob;
          if (!blob) {
            const response = await fetch(href);
            blob = await response.blob();
          }
        } else {
          // http(s) URL — fetch and save
          const response = await fetch(href);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          blob = await response.blob();
        }

        await saveFileToDownloads(blob, anchor.download || "download");
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
