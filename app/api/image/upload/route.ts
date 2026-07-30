import { NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { getImageDimensions } from "@/lib/imageMeta";
import { saveUploadedFile } from "@/lib/upload";
import { validateImageUpload } from "@/lib/uploadValidators";
import { getImages, ImageRecord, saveImages } from "@/lib/localDb";

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

    const validationError = validateImageUpload(file);

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

    const images = await getImages();

    let id = createId(8);

    while (images.some((image) => image.id === id)) {
      id = createId(8);
    }

    const dimensions = await getImageDimensions(file);
    const savedFile = await saveUploadedFile(file, "images", id);

    const image: ImageRecord = {
      id,
      originalName: file.name,
      storedName: savedFile.storedName,
      mimeType: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      views: 0,
    };

    images.unshift(image);
    await saveImages(images);

    return NextResponse.json(
  {
    id: image.id,
    url: `/i/${image.id}`,
    directUrl: `/api/image/${image.id}`,
    expiresAt: image.expiresAt,
    width: image.width,
    height: image.height,
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
      { error: "Could not upload image." },
      { status: 500 }
    );
  }
}