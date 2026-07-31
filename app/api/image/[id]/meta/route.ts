import { NextResponse } from "next/server";
import { getImages, saveImages } from "@/lib/localDb";
import { isExpired } from "@/lib/expiry";

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

    return NextResponse.json({ error: "Image has expired." }, { status: 410 });
  }

  image.views += 1;
  await saveImages(images);

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

      // Important fix:
      // Always return a valid direct image endpoint.
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