import fs from "fs/promises";
import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { deleteUploadedFile, getUploadedFilePath } from "@/lib/upload";
import { getFiles, saveFiles } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape);
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
    await deleteUploadedFile("files", fileRecord.storedName);

    return NextResponse.json({ error: "File has expired." }, { status: 410 });
  }

  try {
    const filePath = getUploadedFilePath("files", fileRecord.storedName);
    const file = await fs.readFile(filePath);

    fileRecord.downloads += 1;
    await saveFiles(files);

    return new Response(file, {
      headers: {
        "Content-Type": fileRecord.mimeType || "application/octet-stream",
        "Content-Length": String(fileRecord.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(
          fileRecord.originalName
        )}`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File is missing." },
      { status: 404 }
    );
  }
}