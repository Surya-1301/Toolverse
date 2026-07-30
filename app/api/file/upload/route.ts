import { NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { saveUploadedFile } from "@/lib/upload";
import { validateFileUpload } from "@/lib/uploadValidators";
import { FileRecord, getFiles, saveFiles } from "@/lib/localDb";

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

    const validationError = validateFileUpload(file);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const expiryResult = getExpiresAt(expiry);

    if (expiryResult.error) {
      return NextResponse.json(
        { error: expiryResult.error },
        { status: 400 }
      );
    }

    const files = await getFiles();

    let id = createId(8);

    while (files.some((item) => item.id === id)) {
      id = createId(8);
    }

    const savedFile = await saveUploadedFile(file, "files", id);

    const record: FileRecord = {
      id,
      originalName: file.name,
      storedName: savedFile.storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      downloads: 0,
    };

    files.unshift(record);
    await saveFiles(files);

    return NextResponse.json(
  {
    id: record.id,
    url: `/f/${record.id}`,
    downloadUrl: `/api/file/${record.id}`,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    downloads: record.downloads,
    expiresAt: record.expiresAt,
  },
  {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  }
);
  } catch {
    return NextResponse.json(
      { error: "Could not upload file." },
      { status: 500 }
    );
  }
}