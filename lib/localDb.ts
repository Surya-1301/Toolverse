import fs from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export type PasteRecord = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  editPasswordHash?: string | null;
};

export type ImageRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  directUrl?: string;
  filePath?: string;
};

export type FileRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  downloads: number;
  downloadUrl?: string;
  filePath?: string;
};

export type LinkRecord = {
  id?: string;
  slug: string;
  url?: string;
  originalUrl?: string;
  destinationUrl?: string;
  createdAt: string;
  expiresAt: string | null;
  clicks?: number;
  visits?: number;
  [key: string]: unknown;
};

type CollectionName = "pastes" | "images" | "files" | "links";

async function ensureDataDir() {
  await fs.mkdir(dataDir, {
    recursive: true,
  });
}

function getCollectionPath(name: CollectionName) {
  return path.join(dataDir, `${name}.json`);
}

async function readCollection<T>(name: CollectionName): Promise<T[]> {
  await ensureDataDir();

  const filePath = getCollectionPath(name);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeCollection<T>(name: CollectionName, items: T[]) {
  await ensureDataDir();

  const filePath = getCollectionPath(name);

  await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
}

export async function getPastes() {
  return readCollection<PasteRecord>("pastes");
}

export async function savePastes(pastes: PasteRecord[]) {
  return writeCollection("pastes", pastes);
}

export async function getImages() {
  return readCollection<ImageRecord>("images");
}

export async function saveImages(images: ImageRecord[]) {
  return writeCollection("images", images);
}

export async function getFiles() {
  return readCollection<FileRecord>("files");
}

export async function saveFiles(files: FileRecord[]) {
  return writeCollection("files", files);
}

export async function getLinks() {
  return readCollection<LinkRecord>("links");
}

export async function saveLinks(links: LinkRecord[]) {
  return writeCollection("links", links);
}