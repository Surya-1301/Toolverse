import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { getFiles, saveFiles, FileRecord } from "@/lib/localDb";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File is too large. Max size is 100 MB." },
        { status: 400 }
      );
    }

    const expiryResult = getExpiresAt(expiry);

    if (expiryResult.error) {
      return NextResponse.json(
        { error: expiryResult.error },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const files = await getFiles();

    let id = createId(8);

    while (files.some((item) => item.id === id)) {
      id = createId(8);
    }

    const uploadDir = path.join(process.cwd(), "data", "uploads", "files");

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const filePath = path.join(uploadDir, id);

    await fs.writeFile(filePath, buffer);

    const record: FileRecord = {
      id,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      downloads: 0,
      filePath,
      downloadUrl: `/api/file/${id}/download`,
    };

    files.unshift(record);

    await saveFiles(files);

    return NextResponse.json(
      {
        id: record.id,
        url: `/f/${record.id}`,
        downloadUrl: record.downloadUrl,
        originalName: record.originalName,
        mimeType: record.mimeType,
        size: record.size,
        expiresAt: record.expiresAt,
        downloads: record.downloads,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not upload file." },
      { status: 500 }
    );
  }
}