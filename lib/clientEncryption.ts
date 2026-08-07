const PBKDF2_ITERATIONS = 310_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  usage: KeyUsage[],
) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}

export type EncryptedFilePayload = {
  encryptedFile: File;
  salt: string;
  iv: string;
  metadataIv: string;
  encryptedMetadata: string;
  algorithm: "AES-GCM-256";
  kdf: "PBKDF2-SHA256";
  iterations: number;
};

export async function encryptFileForUpload(
  file: File,
  password: string,
): Promise<EncryptedFilePayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const metadataIv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt, ["encrypt"]);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    await file.arrayBuffer(),
  );

  const metadata = JSON.stringify({
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  });

  const encryptedMetadataBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: metadataIv as BufferSource },
    key,
    encoder.encode(metadata),
  );

  return {
    encryptedFile: new File([encryptedBuffer], `${file.name}.enc`, {
      type: "application/octet-stream",
    }),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    metadataIv: bytesToBase64(metadataIv),
    encryptedMetadata: bytesToBase64(new Uint8Array(encryptedMetadataBuffer)),
    algorithm: "AES-GCM-256",
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function decryptEncryptedMetadata(
  encryptedMetadata: string,
  password: string,
  saltBase64: string,
  metadataIvBase64: string,
) {
  const key = await deriveAesKey(password, base64ToBytes(saltBase64), [
    "decrypt",
  ]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(metadataIvBase64) as BufferSource },
    key,
    base64ToBytes(encryptedMetadata) as BufferSource,
  );

  return JSON.parse(decoder.decode(decrypted)) as {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export async function decryptEncryptedFile(
  encryptedBlob: Blob,
  password: string,
  saltBase64: string,
  ivBase64: string,
) {
  const key = await deriveAesKey(password, base64ToBytes(saltBase64), [
    "decrypt",
  ]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivBase64) as BufferSource },
    key,
    await encryptedBlob.arrayBuffer(),
  );

  return new Blob([decrypted]);
}