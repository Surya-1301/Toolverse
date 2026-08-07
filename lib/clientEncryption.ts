const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importAesKey(keyBase64Url: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    base64UrlToBytes(keyBase64Url),
    { name: "AES-GCM" },
    false,
    usage,
  );
}

export type EncryptedFilePayload = {
  encryptedFile: File;
  key: string;
  iv: string;
  metadataIv: string;
  encryptedMetadata: string;
  algorithm: "AES-GCM-256";
};

export function createRandomEncryptionKey() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function encryptFileWithRandomKey(
  file: File,
): Promise<EncryptedFilePayload> {
  const key = createRandomEncryptionKey();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const metadataIv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await importAesKey(key, ["encrypt"]);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    await file.arrayBuffer(),
  );

  const metadata = JSON.stringify({
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  });

  const encryptedMetadataBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: metadataIv },
    aesKey,
    encoder.encode(metadata),
  );

  return {
    encryptedFile: new File([encryptedBuffer], `${file.name}.enc`, {
      type: "application/octet-stream",
    }),
    key,
    iv: bytesToBase64Url(iv),
    metadataIv: bytesToBase64Url(metadataIv),
    encryptedMetadata: bytesToBase64Url(
      new Uint8Array(encryptedMetadataBuffer),
    ),
    algorithm: "AES-GCM-256",
  };
}

export function getEncryptionKeyFromHash() {
  if (typeof window === "undefined") return "";

  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);

  return params.get("key") || "";
}

export async function decryptEncryptedMetadataWithKey(
  encryptedMetadata: string,
  key: string,
  metadataIv: string,
) {
  const aesKey = await importAesKey(key, ["decrypt"]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(metadataIv) },
    aesKey,
    base64UrlToBytes(encryptedMetadata),
  );

  return JSON.parse(decoder.decode(decrypted)) as {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export async function decryptEncryptedFileWithKey(
  encryptedBlob: Blob,
  key: string,
  iv: string,
) {
  const aesKey = await importAesKey(key, ["decrypt"]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(iv) },
    aesKey,
    await encryptedBlob.arrayBuffer(),
  );

  return new Blob([decrypted]);
}