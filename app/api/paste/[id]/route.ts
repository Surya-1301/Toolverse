import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getPastes, savePastes } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const pastes = await getPastes();
  const paste = pastes.find((item) => item.id === id);

  if (!paste) {
    return NextResponse.json({ error: "Paste not found." }, { status: 404 });
  }

  if (isExpired(paste.expiresAt)) {
    const activePastes = pastes.filter((item) => item.id !== id);
    await savePastes(activePastes);

    return NextResponse.json({ error: "Paste has expired." }, { status: 410 });
  }

  paste.views += 1;
  await savePastes(pastes);

  return NextResponse.json(paste, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}