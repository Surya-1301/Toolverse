import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";

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
  await LocalNotifications.requestPermissions();
}

export async function showDownloadNotification(title: string, body: string) {
  if (!isNative()) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title,
        body,
        smallIcon: "ic_launcher",
      },
    ],
  });
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

export async function downloadFile(
  url: string,
  filename: string,
  onProgress?: (percent: number) => void,
) {
  if (!isNative()) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { path: filename, downloaded: true };
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value.buffer);
    loaded += value.byteLength;
    if (total > 0 && onProgress) {
      onProgress(Math.round((loaded / total) * 100));
    }
  }

  const blob = new Blob(chunks);
  const dataUrl = await blobToBase64(blob);
  const base64 = dataUrl.split(",")[1];

  const directory = Directory.Documents;
  const path = `Download/${filename}`;

  await Filesystem.writeFile({
    path,
    data: base64,
    directory,
    encoding: Encoding.UTF8,
  });

  await showDownloadNotification("Download complete", filename);

  return { path, directory, downloaded: true };
}
