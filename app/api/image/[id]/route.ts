import fs from "fs/promises";
import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { deleteUploadedFile, getUploadedFilePath } from "@/lib/upload";
import { getImages, saveImages } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    await deleteUploadedFile("images", image.storedName);

    return NextResponse.json({ error: "Image has expired." }, { status: 410 });
  }

  try {
    const filePath = getUploadedFilePath("images", image.storedName);
    const file = await fs.readFile(filePath);

    image.views += 1;
    await saveImages(images);

    return new Response(file, {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image file is missing." },
      { status: 404 }
    );
  }
}