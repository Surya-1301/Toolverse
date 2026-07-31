import { NextResponse } from "next/server";
import { getExpiresAt, isExpired } from "@/lib/expiry";
import { verifyEditPassword } from "../../../../lib/password";
import { validatePasteContent } from "@/lib/validators";
import { getPastes, savePastes } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PasteRecordWithPassword = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  editPasswordHash?: string | null;
};

function publicPaste(paste: PasteRecordWithPassword) {
  return {
    id: paste.id,
    content: paste.content,
    language: paste.language,
    createdAt: paste.createdAt,
    expiresAt: paste.expiresAt,
    views: paste.views,
    hasEditPassword: Boolean(paste.editPasswordHash),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const pastes = await getPastes();
  const paste = pastes.find((item) => item.id === id) as
    | PasteRecordWithPassword
    | undefined;

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

  return NextResponse.json(publicPaste(paste), {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const content = String(body.content || "");
    const language = String(body.language || "plain_text");
    const expiry = String(body.expiry || "never");
    const editPassword = String(body.editPassword || "");

    const contentError = validatePasteContent(content);

    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    const expiryResult = getExpiresAt(expiry);

    if (expiryResult.error) {
      return NextResponse.json(
        { error: expiryResult.error },
        { status: 400 }
      );
    }

    const pastes = await getPastes();
    const paste = pastes.find((item) => item.id === id) as
      | PasteRecordWithPassword
      | undefined;

    if (!paste) {
      return NextResponse.json({ error: "Paste not found." }, { status: 404 });
    }

    if (isExpired(paste.expiresAt)) {
      const activePastes = pastes.filter((item) => item.id !== id);
      await savePastes(activePastes);

      return NextResponse.json({ error: "Paste has expired." }, { status: 410 });
    }

    if (!verifyEditPassword(editPassword, paste.editPasswordHash)) {
      return NextResponse.json(
        { error: "Invalid edit password." },
        { status: 401 }
      );
    }

    paste.content = content;
    paste.language = language;
    paste.expiresAt = expiryResult.expiresAt;

    await savePastes(pastes);

    return NextResponse.json(publicPaste(paste), {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not update paste." },
      { status: 500 }
    );
  }
}