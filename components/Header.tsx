"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Container } from "./Container";

const navLinks = [
    { href: "https://pdfverse.pages.dev/", label: "PDF" },
    { href: "/file-share", label: "Upload" },
    { href: "/image-compressor", label: "Compress" },
    { href: "/paste", label: "Paste" },
    { href: "/url-shortener", label: "Shorten" },
    { href: "/tools/conversion-tools", label: "Conversion tools" },
    { href: "/tools/image-tools", label: "Image tools" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-bold sm:gap-3"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
            <Image
              src="/favicon.ico"
              alt="Toolversee logo"
              fill
              className="object-contain p-1"
              priority
              sizes="40px"
            />
          </span>

          <span className="truncate text-base sm:text-lg">Toolverse</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-slate-300 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/10 md:hidden"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {isMenuOpen ? (
        <Container className="pb-4 md:hidden">
          <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-2 text-sm text-slate-200 shadow-2xl shadow-black/20">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-center font-medium transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      ) : null}
    </header>
  );
}