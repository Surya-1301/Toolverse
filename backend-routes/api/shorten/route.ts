import { NextResponse } from "next/server";
import { createSlug } from "@/lib/id";
import { getExpiresAt } from "@/lib/expiry";
import { validateCustomSlug, validateShortUrl } from "@/lib/validators";
import { getLinks, saveLinks, LinkRecord } from "@/lib/localDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const longUrl = String(body.longUrl || "");
    const customSlug = String(body.customSlug || "")
      .trim()
      .toLowerCase();
    const expiry = String(body.expiry || "never");

    const urlError = validateShortUrl(longUrl);

    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 });
    }

    const slugError = validateCustomSlug(customSlug);

    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 400 });
    }

    const expiryResult = getExpiresAt(expiry);

    if (expiryResult.error) {
      return NextResponse.json(
        { error: expiryResult.error },
        { status: 400 }
      );
    }

    const links = await getLinks();

    let slug = customSlug || createSlug(6);

    while (links.some((link) => link.slug === slug)) {
      if (customSlug) {
        return NextResponse.json(
          { error: "This custom alias is already taken." },
          { status: 409 }
        );
      }

      slug = createSlug(6);
    }

    const link: LinkRecord = {
      slug,
      longUrl,
      createdAt: new Date().toISOString(),
      expiresAt: expiryResult.expiresAt,
      clicks: 0,
    };

    links.unshift(link);

    await saveLinks(links);

    return NextResponse.json({
      slug,
      url: `/s/${slug}`,
      longUrl: link.longUrl,
      clicks: link.clicks,
      expiresAt: link.expiresAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not shorten URL." },
      { status: 500 }
    );
  }
}