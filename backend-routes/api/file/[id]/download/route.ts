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

  const response = await fetch(`${API_BASE}/api/file/${id}/download`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.body) {
    return NextResponse.json(
      { error: "Could not download file." },
      { status: response.status || 500 },
    );
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition":
        response.headers.get("Content-Disposition") ||
        'attachment; filename="encrypted-file.enc"',
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}