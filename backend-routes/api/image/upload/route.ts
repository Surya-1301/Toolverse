import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://toolversex-api.jethalalmirror.workers.dev";

export async function POST(request: Request) {
  const formData = await request.formData();

  const response = await fetch(`${API_BASE}/api/image/upload`, {
    method: "POST",
    body: formData,
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