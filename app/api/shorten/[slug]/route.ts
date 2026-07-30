import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getLinks, saveLinks } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const links = await getLinks();
  const link = links.find((item) => item.slug === slug);

  if (!link) {
    return NextResponse.json({ error: "Short URL not found." }, { status: 404 });
  }

  if (isExpired(link.expiresAt)) {
    const activeLinks = links.filter((item) => item.slug !== slug);
    await saveLinks(activeLinks);

    return NextResponse.json(
      { error: "Short URL has expired." },
      { status: 410 }
    );
  }

  return NextResponse.json({
    slug: link.slug,
    longUrl: link.longUrl,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    clicks: link.clicks,
  });
}