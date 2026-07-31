import sharp from "sharp";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { getImages, saveImages, ImageRecord } from "@/lib/localDb";

type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<unknown>;
};

type CloudflareEnvLike = {
  FILES_BUCKET: R2BucketLike;
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

export async function POST(request: Request) {
  try {
    const { env } = getCloudflareContext();
    const cfEnv = env as unknown as CloudflareEnvLike;

    if (!cfEnv?.FILES_BUCKET) {
      return NextResponse.json(
        { error: "Missing Cloudflare R2 binding 'FILES_BUCKET'." },
        { status: 500 }
      );
    }

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
    const buffer = new Uint8Array(arrayBuffer);

    let width: number | null = null;
    let height: number | null = null;

    try {
      const metadata = await sharp(Buffer.from(arrayBuffer)).metadata();
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

    const extension = getExtensionFromMimeType(file.type) || ".img";
    const key = `images/${id}${extension}`;

    await cfEnv.FILES_BUCKET.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

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
      directUrl: `/api/image/${id}/direct`,
      r2Key: key,
    };

    images.unshift(image);
    await saveImages(images);

    return NextResponse.json(
      {
        id: image.id,
        url: `/i/${image.id}`,
        directUrl: image.directUrl,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        expiresAt: image.expiresAt,
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
      { error: "Could not upload image." },
      { status: 500 }
    );
  }
}