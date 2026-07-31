import { getCloudflareContext } from "@opennextjs/cloudflare";

type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
};

type CloudflareEnvLike = {
  FILES_BUCKET: R2BucketLike;
};

function getBucket(): R2BucketLike {
  const { env } = getCloudflareContext();
  const cfEnv = env as unknown as CloudflareEnvLike;

  if (!cfEnv?.FILES_BUCKET) {
    throw new Error("Missing Cloudflare R2 binding 'FILES_BUCKET'.");
  }

  return cfEnv.FILES_BUCKET;
}

export function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase().slice(0, 20);
}

export function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;

  const safeBaseName =
    baseName
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";

  return `${safeBaseName}${extension}`;
}

export async function saveUploadedFile(
  file: File,
  folder: "images" | "files",
  id: string
) {
  const bucket = getBucket();

  const safeName = sanitizeFileName(file.name);
  const extension = getFileExtension(safeName);
  const storedName = `${id}${extension}`;
  const key = `${folder}/${storedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await bucket.put(key, buffer, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  return {
    storedName,
    safeName,
    filePath: key,
    r2Key: key,
  };
}

export function getUploadedFilePath(
  folder: "images" | "files",
  storedName: string
) {
  return `${folder}/${storedName}`;
}

export async function deleteUploadedFile(
  folder: "images" | "files",
  storedName: string
) {
  try {
    const bucket = getBucket();
    const key = getUploadedFilePath(folder, storedName);
    await bucket.delete(key);
  } catch {
    // Ignore cleanup errors.
  }
}