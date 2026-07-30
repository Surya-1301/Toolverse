import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
            <Image
              src="/logo.png"
              alt="ToolverseX logo"
              fill
              className="object-contain p-1"
              priority
            />
          </span>

          <span className="text-lg">ToolverseX</span>
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

          <Link
            href="/image-host"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            Images
          </Link>

          <Link
            href="/file-share"
            className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
          >
            Files
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
            href="/file-share"
            className="rounded-lg px-2 py-2 hover:bg-white/10 hover:text-white"
          >
            Files
          </Link>
        </nav>
      </Container>
    </header>
  );
}