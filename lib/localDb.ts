import { getCloudflareContext } from "@opennextjs/cloudflare";

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
  r2Key?: string;
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
  r2Key?: string;
};

export type LinkRecord = {
  id?: string;
  slug: string;
  url?: string;
  longUrl?: string;
  originalUrl?: string;
  destinationUrl?: string;
  createdAt: string;
  expiresAt: string | null;
  clicks?: number;
  visits?: number;
  [key: string]: unknown;
};

type CollectionName = "pastes" | "images" | "files" | "links";

type D1Row<T = unknown> = T | null;

type D1StatementBound = {
  first<T = unknown>(): Promise<D1Row<T>>;
  run(): Promise<unknown>;
};

type D1Statement = {
  bind(...values: unknown[]): D1StatementBound;
};

type D1DatabaseLike = {
  prepare(query: string): D1Statement;
};

type AppCloudflareEnv = {
  DB: D1DatabaseLike;
};

function getDB(): D1DatabaseLike {
  const { env } = getCloudflareContext();
  const cfEnv = env as unknown as AppCloudflareEnv;

  if (!cfEnv?.DB) {
    throw new Error(
      "Missing Cloudflare D1 binding 'DB'. Add DB to wrangler.jsonc."
    );
  }

  return cfEnv.DB;
}

async function readCollection<T>(name: CollectionName): Promise<T[]> {
  const db = getDB();

  const row = await db
    .prepare("SELECT value FROM app_state WHERE collection = ?")
    .bind(name)
    .first<{ value: string }>();

  if (!row?.value) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch {
    return [];
  }
}

async function writeCollection<T>(name: CollectionName, items: T[]) {
  const db = getDB();

  await db
    .prepare(`
      INSERT INTO app_state (collection, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(collection)
      DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    .bind(name, JSON.stringify(items))
    .run();
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