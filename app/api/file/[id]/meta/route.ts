import { NextResponse } from "next/server";
import { getFiles, saveFiles } from "@/lib/localDb";
import { isExpired } from "@/lib/expiry";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const files = await getFiles();
  const file = files.find((item) => item.id === id);

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (isExpired(file.expiresAt)) {
    const activeFiles = files.filter((item) => item.id !== id);
    await saveFiles(activeFiles);

    return NextResponse.json({ error: "File has expired." }, { status: 410 });
  }

  return NextResponse.json(
    {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      downloads: file.downloads,
      downloadUrl: file.downloadUrl || `/api/file/${file.id}/download`,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}