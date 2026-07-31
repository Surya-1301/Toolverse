import { isExpired } from "@/lib/expiry";
import { getPastes, savePastes } from "@/lib/localDb";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const noIndexHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const pastes = await getPastes();
  const paste = pastes.find((item) => item.id === id);

  if (!paste) {
    return new Response("Paste not found.", {
      status: 404,
      headers: noIndexHeaders,
    });
  }

  if (isExpired(paste.expiresAt)) {
    const activePastes = pastes.filter((item) => item.id !== id);
    await savePastes(activePastes);

    return new Response("Paste has expired.", {
      status: 410,
      headers: noIndexHeaders,
    });
  }

  return new Response(paste.content, {
    status: 200,
    headers: noIndexHeaders,
  });
}