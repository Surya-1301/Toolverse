import fs from "fs/promises";
import path from "path";
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
    return NextResponse.json({ error: "File has expired." }, { status: 410 });
  }

  const possiblePaths = [
    file.filePath,

    path.join(process.cwd(), "data", "uploads", "files", file.id),
    path.join(process.cwd(), "public", "uploads", "files", file.id),
    path.join(process.cwd(), "data", "files", file.id),
    path.join(process.cwd(), "public", "uploads", file.id),
  ].filter(Boolean) as string[];

  for (const filePath of possiblePaths) {
    try {
      const fileBuffer = await fs.readFile(filePath);

      file.downloads += 1;
      await saveFiles(files);

      const encodedName = encodeURIComponent(file.originalName).replace(
        /['()]/g,
        escape
      );

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // Try next path
    }
  }

  return NextResponse.json(
    {
      error: "File could not be loaded.",
      checkedPaths: possiblePaths,
    },
    { status: 404 }
  );
}