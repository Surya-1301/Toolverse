import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";

type ToolverseDownloadPlugin = {
  downloadUrl(options: {
    url: string;
    filename: string;
    mimeType?: string;
  }): Promise<{ id: number; filename: string }>;
  saveBase64(options: {
    data: string;
    filename: string;
    mimeType?: string;
  }): Promise<{ path: string; filename: string }>;
};

const ToolverseDownload =
  registerPlugin<ToolverseDownloadPlugin>("ToolverseDownload");

export function isNative() {
  if (typeof window === "undefined") return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
    const win = window as any;
    if (win?.Capacitor?.isNativePlatform?.()) return true;
    if (win?.Capacitor?.getPlatform?.() && win.Capacitor.getPlatform() !== "web") return true;
    if (win?.ToolverseBlobDownloader != null || win?.PDFVerseBlobDownloader != null) return true;
    if (typeof navigator !== "undefined" && navigator.userAgent && /Android.*wv/i.test(navigator.userAgent)) {
      return true;
    }
  } catch {}
  return false;
}

export function getFrontendOrigin() {
  return isNative() ? "https://toolversee.pages.dev" : window.location.origin;
}

export async function openInBrowser(url: string) {
  if (isNative()) {
    window.open(url, "_blank", "system=yes");
  } else {
    window.open(url, "_blank");
  }
}

export async function requestNotificationPermission() {
  if (!isNative()) return;
  try {
    await LocalNotifications.requestPermissions();
  } catch {
    // ignore — notifications are best-effort
  }
}

export async function showDownloadNotification(title: string, body: string) {
  if (!isNative()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483647),
          title,
          body,
          smallIcon: "ic_launcher",
        },
      ],
    });
  } catch {
    // ignore — permission may not be granted
  }
}

function sanitizeFilename(name: string): string {
  const clean = (name || "download")
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .pop()!
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 120)
    .trim();
  return clean || "download";
}

export function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    apk: "application/vnd.android.package-archive",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    webm: "video/webm",
    mkv: "video/x-matroska",
    json: "application/json",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    txt: "text/plain",
    html: "text/html",
    xml: "application/xml",
    zip: "application/zip",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] || "application/octet-stream";
}

async function blobToBase64(blob: Blob): Promise<string> {
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

/**
 * Copy text on web AND in the APK WebView.
 * navigator.clipboard requires a secure context + focus — both can be
 * missing on device — so fall back to execCommand and finally the native
 * Share sheet (which always lets the user copy the text).
 * Returns true if the text is on the clipboard (or was handed to Share).
 */
export async function copyTextNative(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy + native fallbacks
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) return true;
  } catch {
    // fall through
  }
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: "Copy text",
        text,
        dialogTitle: "Copy text",
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Read text from the clipboard (paste buttons). Null when unavailable. */
export async function readTextNative(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // clipboard read blocked — caller shows a manual-paste hint
  }
  return null;
}

/**
 * Save a canvas / preview data URL (image-blur, upscaler, resizer
 * previews, favicon generator…) to device Downloads in the APK.
 */
export async function saveDataUrlNative(dataUrl: string, filename: string) {
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error("Could not read the generated image.");
  const blob = await res.blob();
  return saveBlobNative(blob, filename);
}

export async function saveBlobNative(blob: Blob, filename: string) {
  const safeName = sanitizeFilename(filename);
  const type = blob.type || guessMime(safeName);

  const win = typeof window !== "undefined" ? (window as any) : null;
  const downloader = win?.ToolverseBlobDownloader || win?.PDFVerseBlobDownloader;
  if (downloader && typeof downloader.processBlobData === "function") {
    try {
      downloader?.markDownloadIntent?.();
      const base64 = await blobToBase64(blob);
      downloader.processBlobData(base64, safeName, type);
      return { path: safeName, downloaded: true };
    } catch (bridgeErr) {
      console.warn("Native BlobDownloader failed, trying plugin fallback:", bridgeErr);
    }
  }

  if (!isNative()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { path: safeName, downloaded: true };
  }

  const base64 = await blobToBase64(blob);
  try {
    const result = await ToolverseDownload.saveBase64({
      data: base64,
      filename: safeName,
      mimeType: type,
    });
    return { path: result.path, downloaded: true };
  } catch (pluginErr) {
    // Installed APK predates the native plugin (or WebView bridge
    // hiccup) — fall back to Filesystem cache + Share sheet so the
    // user can still save / send the file somewhere.
    console.warn("ToolverseDownload plugin missing, fallback:", pluginErr);
    const saved = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    });
    await showDownloadNotification("Download complete", safeName);
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: safeName,
        text: `Save ${safeName} to your device`,
        url: saved.uri,
        dialogTitle: `Save ${safeName}`,
      });
    } catch {
      // Share sheet dismissed or unavailable — file is still in cache.
    }
    return { path: saved.uri ?? safeName, downloaded: true };
  }
}

export async function downloadFile(
  url: string,
  filename: string,
  onProgress?: (percent: number) => void,
) {
  const safeName = sanitizeFilename(filename);
  if (!isNative()) {
    const link = document.createElement("a");
    link.href = url;
    link.download = safeName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { path: safeName, downloaded: true };
  }

  // Ensure relative URLs are resolved against the deployed frontend in APK
  const fullUrl =
    url.startsWith("/") && typeof window !== "undefined"
      ? `${getFrontendOrigin()}${url}`
      : url;

  if (fullUrl.startsWith("blob:") || fullUrl.startsWith("data:")) {
    onProgress?.(10);
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const blob = await res.blob();
    onProgress?.(60);
    const out = await saveBlobNative(blob, safeName);
    onProgress?.(100);
    return out;
  }
  try {
    const result = await ToolverseDownload.downloadUrl({
      url: fullUrl,
      filename: safeName,
      mimeType: guessMime(safeName),
    });
    onProgress?.(100);
    await showDownloadNotification("Download started", safeName);
    return { path: safeName, id: result.id, downloaded: true };
  } catch (err) {
    console.warn("DownloadManager unavailable, fallback:", err);
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    const blob = await response.blob();
    onProgress?.(80);
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    });
    onProgress?.(100);
    await showDownloadNotification("Download complete", safeName);
    return { path: saved.uri ?? safeName, downloaded: true };
  }
}
