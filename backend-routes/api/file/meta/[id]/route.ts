import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://toolversex-api.jethalalmirror.workers.dev";

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const response = await fetch(`${API_BASE}/api/file/${id}/meta`, {
    method: "GET",
    cache: "no-store",
  });

  const responseText = await response.text();

  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}