import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getLinks, saveLinks, type ClickLog } from "@/lib/localDb";

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
    return NextResponse.json({ error: "Short link not found." }, { status: 404 });
  }

  if (isExpired(link.expiresAt)) {
    const activeLinks = links.filter((item) => item.slug !== slug);
    await saveLinks(activeLinks);

    return NextResponse.json({ error: "Short link has expired." }, { status: 410 });
  }

  const destination =
    (typeof link.destinationUrl === "string" && link.destinationUrl) ||
    (typeof link.originalUrl === "string" && link.originalUrl) ||
    (typeof link.url === "string" && link.url);

  if (!destination) {
    return NextResponse.json({ error: "Destination URL is missing." }, { status: 500 });
  }

  link.clicks = (link.clicks ?? 0) + 1;

  const clickLog: ClickLog = {
    timestamp: new Date().toISOString(),
    referer: request.headers.get("referer") || request.headers.get("referrer") || null,
    userAgent: request.headers.get("user-agent") || null,
    ip: request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || null,
  };

  if (!Array.isArray(link.clickLogs)) {
    link.clickLogs = [];
  }
  link.clickLogs.push(clickLog);

  if (link.clickLogs.length > 500) {
    link.clickLogs = link.clickLogs.slice(-500);
  }

  await saveLinks(links);

  return NextResponse.redirect(destination);
}