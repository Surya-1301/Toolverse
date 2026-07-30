import { isExpired } from "@/lib/expiry";
import { deleteUploadedFile } from "@/lib/upload";
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

export async function cleanupExpiredItems() {
  const pastes = await getPastes();
  const links = await getLinks();
  const images = await getImages();
  const files = await getFiles();

  const expiredImages = images.filter((image) => isExpired(image.expiresAt));
  const expiredFiles = files.filter((file) => isExpired(file.expiresAt));

  const activePastes = pastes.filter((paste) => !isExpired(paste.expiresAt));
  const activeLinks = links.filter((link) => !isExpired(link.expiresAt));
  const activeImages = images.filter((image) => !isExpired(image.expiresAt));
  const activeFiles = files.filter((file) => !isExpired(file.expiresAt));

  await Promise.all([
    ...expiredImages.map((image) =>
      deleteUploadedFile("images", image.storedName)
    ),
    ...expiredFiles.map((file) =>
      deleteUploadedFile("files", file.storedName)
    ),
  ]);

  await savePastes(activePastes);
  await saveLinks(activeLinks);
  await saveImages(activeImages);
  await saveFiles(activeFiles);

  return {
    removedPastes: pastes.length - activePastes.length,
    removedLinks: links.length - activeLinks.length,
    removedImages: images.length - activeImages.length,
    removedFiles: files.length - activeFiles.length,
    activePastes: activePastes.length,
    activeLinks: activeLinks.length,
    activeImages: activeImages.length,
    activeFiles: activeFiles.length,
  };
}