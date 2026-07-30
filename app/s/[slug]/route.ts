import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getLinks, saveLinks } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const links = await getLinks();
  const link = links.find((item) => item.slug === slug);

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isExpired(link.expiresAt)) {
    const activeLinks = links.filter((item) => item.slug !== slug);
    await saveLinks(activeLinks);

    return NextResponse.redirect(
      new URL("/url-shortener?error=expired", request.url)
    );
  }

  link.clicks += 1;
  await saveLinks(links);

  return NextResponse.redirect(link.longUrl);
}