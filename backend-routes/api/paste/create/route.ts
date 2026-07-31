import { NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { verifyEditPassword } from "../../../../lib/password";
import { validatePasteAlias, validatePasteContent } from "@/lib/validators";
import { getPastes, savePastes, PasteRecord } from "@/lib/localDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const content = String(body.content || "");
    const language = String(body.language || "plain_text");
    const expiry = String(body.expiry || "never");
    const customAlias = String(body.customAlias || "")
      .trim()
      .toLowerCase();

    const contentError = validatePasteContent(content);

    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    const aliasError = validatePasteAlias(customAlias);

    if (aliasError) {
      return NextResponse.json({ error: aliasError }, { status: 400 });
    }

    const expiryResult = getExpiresAt(expiry);

    if (expiryResult.error) {
      return NextResponse.json(
        { error: expiryResult.error },
        { status: 400 }
      );
    }

    const pastes = await getPastes();

    let id = customAlias || createId(8);

    while (pastes.some((paste) => paste.id === id)) {
      if (customAlias) {
        return NextResponse.json(
          { error: "This alias is already taken." },
          { status: 409 }
        );
      }

      id = createId(8);
    }

    const paste: PasteRecord = {
      id,
      content,
      language,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      views: 0,
    };

    pastes.unshift(paste);

    await savePastes(pastes);

    return NextResponse.json(
      {
        id: paste.id,
        url: `/paste/${paste.id}`,
        rawUrl: `/raw/${paste.id}`,
        expiresAt: paste.expiresAt,
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
      { error: "Could not create paste." },
      { status: 500 }
    );
  }
}