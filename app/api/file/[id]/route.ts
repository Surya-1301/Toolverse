import fs from "fs/promises";
import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getFiles, saveFiles } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function removeStoredFile(filePath?: string) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing file cleanup errors
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const files = await getFiles();
  const fileRecord = files.find((item) => item.id === id);

  if (!fileRecord) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (isExpired(fileRecord.expiresAt)) {
    const activeFiles = files.filter((item) => item.id !== id);
    await saveFiles(activeFiles);
    await removeStoredFile(fileRecord.filePath);

    return NextResponse.json({ error: "File has expired." }, { status: 410 });
  }

  return NextResponse.json(
    {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
      expiresAt: fileRecord.expiresAt,
      downloads: fileRecord.downloads,
      downloadUrl:
        fileRecord.downloadUrl || `/api/file/${fileRecord.id}/download`,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}