import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { getImages, saveImages, ImageRecord } from "@/lib/localDb";

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/svg+xml") return ".svg";
  return "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file." },
        { status: 400 }
      );
    }

    const maxSize = 25 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image is too large. Max size is 25 MB." },
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

    let width: number | null = null;
    let height: number | null = null;

    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
    } catch {
      width = null;
      height = null;
    }

    const images = await getImages();

    let id = createId(8);

    while (images.some((item) => item.id === id)) {
      id = createId(8);
    }

    const extension =
      getExtensionFromMimeType(file.type) ||
      path.extname(file.name).toLowerCase() ||
      ".img";

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "images"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const filePath = path.join(uploadDir, `${id}${extension}`);

    await fs.writeFile(filePath, buffer);

    const image: ImageRecord = {
      id,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      width,
      height,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      views: 0,
      filePath,
      directUrl: `/api/image/${id}/direct`,
    };

    images.unshift(image);

    await saveImages(images);

    return NextResponse.json({
      id: image.id,
      url: `/i/${image.id}`,
      directUrl: image.directUrl,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      expiresAt: image.expiresAt,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not upload image." },
      { status: 500 }
    );
  }
}