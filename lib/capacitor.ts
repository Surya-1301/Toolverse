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
  return Capacitor.isNativePlatform();
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

function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    apk: "application/vnd.android.package-archive",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
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

export async function saveBlobNative(blob: Blob, filename: string) {
  const safeName = sanitizeFilename(filename);
  const type = blob.type || guessMime(safeName);
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
    await showDownloadNotification("Download complete", safeName);
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
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    onProgress?.(10);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const blob = await res.blob();
    onProgress?.(60);
    const out = await saveBlobNative(blob, safeName);
    onProgress?.(100);
    return out;
  }
  try {
    const result = await ToolverseDownload.downloadUrl({
      url,
      filename: safeName,
      mimeType: guessMime(safeName),
    });
    onProgress?.(100);
    await showDownloadNotification("Download started", safeName);
    return { path: safeName, id: result.id, downloaded: true };
  } catch (err) {
    console.warn("DownloadManager unavailable, fallback:", err);
    const response = await fetch(url);
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
