import fs from "fs/promises";
import { isExpired } from "@/lib/expiry";
import {
  getFiles,
  getImages,
  getLinks,
  getPastes,
  saveFiles,
  saveImages,
  saveLinks,
  savePastes,
} from "@/lib/localDb";

async function removeStoredPath(filePath?: string) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing file cleanup errors
  }
}

export async function cleanupExpiredItems() {
  const pastes = await getPastes();
  const images = await getImages();
  const files = await getFiles();
  const links = await getLinks();

  const expiredPastes = pastes.filter((paste) => isExpired(paste.expiresAt));
  const expiredImages = images.filter((image) => isExpired(image.expiresAt));
  const expiredFiles = files.filter((file) => isExpired(file.expiresAt));
  const expiredLinks = links.filter((link) => isExpired(link.expiresAt));

  const activePastes = pastes.filter((paste) => !isExpired(paste.expiresAt));
  const activeImages = images.filter((image) => !isExpired(image.expiresAt));
  const activeFiles = files.filter((file) => !isExpired(file.expiresAt));
  const activeLinks = links.filter((link) => !isExpired(link.expiresAt));

  await Promise.all([
    savePastes(activePastes),
    saveImages(activeImages),
    saveFiles(activeFiles),
    saveLinks(activeLinks),
    ...expiredImages.map((image) => removeStoredPath(image.filePath)),
    ...expiredFiles.map((file) => removeStoredPath(file.filePath)),
  ]);

  return {
    removed: {
      pastes: expiredPastes.length,
      images: expiredImages.length,
      files: expiredFiles.length,
      links: expiredLinks.length,
    },
  };
}