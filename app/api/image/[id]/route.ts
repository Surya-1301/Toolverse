import fs from "fs/promises";
import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getImages, saveImages } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function removeStoredImage(filePath?: string) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors for missing files
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const images = await getImages();
  const image = images.find((item) => item.id === id);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  if (isExpired(image.expiresAt)) {
    const activeImages = images.filter((item) => item.id !== id);
    await saveImages(activeImages);
    await removeStoredImage(image.filePath);

    return NextResponse.json({ error: "Image has expired." }, { status: 410 });
  }

  return NextResponse.json(
    {
      id: image.id,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      expiresAt: image.expiresAt,
      views: image.views,
      directUrl: image.directUrl || `/api/image/${image.id}/direct`,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}