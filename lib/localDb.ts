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
};

export type LinkRecord = {
  slug: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDataDir();

  const filePath = path.join(dataDir, fileName);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJsonFile<T>(fileName: string, data: T) {
  await ensureDataDir();

  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getPastes() {
  return readJsonFile<PasteRecord[]>("pastes.json", []);
}

export async function savePastes(pastes: PasteRecord[]) {
  return writeJsonFile("pastes.json", pastes);
}

export async function getLinks() {
  return readJsonFile<LinkRecord[]>("links.json", []);
}

export async function saveLinks(links: LinkRecord[]) {
  return writeJsonFile("links.json", links);
}