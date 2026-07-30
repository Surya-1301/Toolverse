import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { deleteUploadedFile } from "@/lib/upload";
import { getFiles, saveFiles } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const files = await getFiles();
  const file = files.find((item) => item.id === id);

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (isExpired(file.expiresAt)) {
    const activeFiles = files.filter((item) => item.id !== id);
    await saveFiles(activeFiles);
    await deleteUploadedFile("files", file.storedName);

    return NextResponse.json({ error: "File has expired." }, { status: 410 });
  }

  return NextResponse.json(file, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}