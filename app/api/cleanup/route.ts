import { NextResponse } from "next/server";
import { isExpired } from "@/lib/expiry";
import { getLinks, getPastes, saveLinks, savePastes } from "@/lib/localDb";

export async function POST() {
  try {
    const pastes = await getPastes();
    const links = await getLinks();

    const activePastes = pastes.filter((paste) => !isExpired(paste.expiresAt));
    const activeLinks = links.filter((link) => !isExpired(link.expiresAt));

    await savePastes(activePastes);
    await saveLinks(activeLinks);

    return NextResponse.json({
      removedPastes: pastes.length - activePastes.length,
      removedLinks: links.length - activeLinks.length,
      activePastes: activePastes.length,
      activeLinks: activeLinks.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Cleanup failed." },
      { status: 500 }
    );
  }
}