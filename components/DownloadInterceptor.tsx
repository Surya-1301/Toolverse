"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { saveBlobNative } from "@/lib/capacitor";

export function DownloadInterceptor() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

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

      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        await saveBlobNative(blob, fileName);
      } catch (error) {
        console.error("Native file download failed:", error);
      }
    }

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
