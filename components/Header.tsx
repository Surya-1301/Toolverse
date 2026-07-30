import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg">Toolverse</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-slate-300 sm:flex">
          <Link
            href="/json-formatter"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            JSON
          </Link>

          <Link
            href="/qr-generator"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            QR
          </Link>

          <Link
            href="/image-compressor"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            Compress
          </Link>

          <Link
            href="/paste"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            Paste
          </Link>

          <Link
            href="/url-shortener"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            Shorten
          </Link>
        </nav>

        <nav className="flex items-center gap-1 text-xs text-slate-300 sm:hidden">
          <Link
            href="/json-formatter"
            className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white"
          >
            JSON
          </Link>

          <Link
            href="/qr-generator"
            className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white"
          >
            QR
          </Link>

          <Link
            href="/paste"
            className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white"
          >
            Paste
          </Link>

          <Link
            href="/url-shortener"
            className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white"
          >
            Shorten
          </Link>
        </nav>
      </Container>
    </header>
  );
}