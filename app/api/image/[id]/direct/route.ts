import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getImages } from "@/lib/localDb";
import { isExpired } from "@/lib/expiry";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/svg+xml") return ".svg";
  return "";
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const images = await getImages();
  const image = images.find((item) => item.id === id);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  if (isExpired(image.expiresAt)) {
    return NextResponse.json({ error: "Image has expired." }, { status: 410 });
  }

  const extension = getExtensionFromMimeType(image.mimeType);

  const possiblePaths = [
    image.filePath,

    path.join(
      process.cwd(),
      "public",
      "uploads",
      "images",
      `${image.id}${extension}`
    ),

    path.join(process.cwd(), "public", "uploads", `${image.id}${extension}`),

    path.join(process.cwd(), "data", "uploads", "images", `${image.id}${extension}`),

    path.join(process.cwd(), "data", "images", `${image.id}${extension}`),

    path.join(process.cwd(), "public", "uploads", "images", image.id),

    path.join(process.cwd(), "data", "uploads", "images", image.id),

    path.join(process.cwd(), "data", "images", image.id),
  ].filter(Boolean) as string[];

  for (const filePath of possiblePaths) {
    try {
      const fileBuffer = await fs.readFile(filePath);

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": image.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try next path
    }
  }

  return NextResponse.json(
    {
      error: "Image file could not be loaded.",
      checkedPaths: possiblePaths,
    },
    { status: 404 }
  );
}