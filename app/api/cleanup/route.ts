import { NextResponse } from "next/server";
import { cleanupExpiredItems } from "@/lib/cleanup";

export async function POST(request: Request) {
  try {
    const cleanupSecret = process.env.CLEANUP_SECRET;

    if (cleanupSecret) {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");

      if (token !== cleanupSecret) {
        return NextResponse.json(
          { error: "Unauthorized." },
          { status: 401 }
        );
      }
    }

    const result = await cleanupExpiredItems();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Cleanup failed." },
      { status: 500 }
    );
  }
}