import fs from "fs/promises";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

export function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (!extension) {
    return "";
  }

  return extension.slice(0, 20);
}

export function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = path.basename(fileName, extension);

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
  const safeName = sanitizeFileName(file.name);
  const extension = getFileExtension(safeName);
  const storedName = `${id}${extension}`;

  const folderPath = path.join(uploadsDir, folder);
  await fs.mkdir(folderPath, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = path.join(folderPath, storedName);
  await fs.writeFile(filePath, buffer);

  return {
    storedName,
    safeName,
    filePath,
  };
}

export function getUploadedFilePath(
  folder: "images" | "files",
  storedName: string
) {
  return path.join(uploadsDir, folder, storedName);
}

export async function deleteUploadedFile(
  folder: "images" | "files",
  storedName: string
) {
  try {
    const filePath = getUploadedFilePath(folder, storedName);
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files during cleanup.
  }
}