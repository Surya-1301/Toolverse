"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

const mainLinks = [
  { href: "https://pdfverse.pages.dev/", label: "PDF" },
  { href: "/file-share", label: "Upload" },
  { href: "/image-compressor", label: "Compress" },
  { href: "/paste", label: "Paste" },
  { href: "/qr-generator", label: "QR" },
  { href: "/url-shortener", label: "Shorten" },
];

const toolLinks = [
  { href: "/tools/image-tools", label: "Image tools" },
  { href: "/tools/conversion-tools", label: "Conversion tools" },
  { href: "/tools/formatter-tools", label: "Formatter tools" },
  { href: "/tools/text-developer-tools", label: "Developer tools" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);
const [isToolsOpen, setIsToolsOpen] =
  useState(false);

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-white/10
        bg-slate-950/75
        backdrop-blur-xl
        light:border-slate-900/10
        light:bg-white/80
      "
    >
      <Container
        className="
          flex
          h-16
          items-center
          justify-between
          gap-3
        "
      >
        {/* ================================================================
            LOGO
        ================================================================ */}

        <Link
          href="/"
          className="
            flex
            min-w-0
            items-center
            gap-2
            font-bold
            text-white
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-violet-400/50
            focus-visible:ring-offset-2
            focus-visible:ring-offset-slate-950
            light:text-slate-900
            light:focus-visible:ring-offset-white
            sm:gap-3
          "
          onClick={() => setIsMenuOpen(false)}
        >
          <span
            className="
              relative
              h-10
              w-10
              overflow-hidden
              rounded-xl
              bg-white
            "
          >
            <Image
              src="/favicon.ico"
              alt="Toolversee logo"
              fill
              className="object-contain p-1"
              priority
              sizes="40px"
            />
          </span>

          <span
            className="
              truncate
              text-base
              sm:text-lg
            "
          >
            Toolverse
          </span>
        </Link>

        {/* ================================================================
            DESKTOP NAVIGATION + THEME TOGGLE (right-aligned group)
        ================================================================ */}

        <div className="flex items-center justify-end gap-1 md:gap-2">
        <nav
          aria-label="Primary navigation"
          className="
            hidden
            items-center
            gap-2
            text-sm
            text-slate-300
            light:text-slate-700
            md:flex
          "
        >
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                rounded-lg
                px-3.5
                py-2
                transition
                hover:bg-white/10
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/50
                focus-visible:ring-offset-1
                focus-visible:ring-offset-slate-950
                light:hover:bg-slate-900/5
                light:hover:text-slate-900
                light:focus-visible:ring-offset-white
              "
            >
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsToolsOpen((open) => !open)}
              className="
                flex
                items-center
                gap-1
                rounded-lg
                px-3.5
                py-2
                transition
                hover:bg-white/10
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/50
                focus-visible:ring-offset-1
                focus-visible:ring-offset-slate-950
                light:hover:bg-slate-900/5
                light:hover:text-slate-900
                light:focus-visible:ring-offset-white
              "
              aria-expanded={isToolsOpen}
              aria-haspopup="true"
            >
              Tools
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isToolsOpen ? (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  z-50
                  mt-2
                  w-48
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-900/95
                  p-2
                  text-sm
                  text-slate-200
                  shadow-2xl
                  shadow-black/20
                  light:border-slate-900/10
                  light:bg-white
                  light:text-slate-700
                  light:shadow-slate-900/10
                "
                role="menu"
              >
                {toolLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsToolsOpen(false)}
                    className="
                      block
                      rounded-lg
                      px-3
                      py-2
                      transition
                      hover:bg-white/10
                      hover:text-white
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-violet-400/50
                      light:text-slate-700
                      light:hover:bg-slate-900/5
                      light:hover:text-slate-900
                    "
                    role="menuitem"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        {/* ================================================================
            THEME TOGGLE + MOBILE MENU BUTTON
        ================================================================ */}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() =>
              setIsMenuOpen((open) => !open)
            }
            className="
              inline-flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/[0.03]
              text-slate-200
              transition
              hover:bg-white/10
              hover:text-white
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-violet-400/50
              light:border-slate-900/10
              light:bg-slate-900/[0.04]
              light:text-slate-700
              light:hover:bg-slate-900/10
              light:hover:text-slate-950
              md:hidden
            "
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
          >
          {isMenuOpen ? (
            <X
              aria-hidden="true"
              className="h-5 w-5"
            />
          ) : (
            <Menu
              aria-hidden="true"
              className="h-5 w-5"
            />
          )}
          </button>
        </div>
        </div>
      </Container>

      {/* ================================================================
          MOBILE NAVIGATION
      ================================================================ */}

      {isMenuOpen ? (
        <Container className="pb-4 md:hidden">
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="
              grid
              grid-cols-2
              gap-2
              rounded-2xl
              border
              border-white/10
              bg-slate-900/95
              p-2
              text-sm
              text-slate-200
              shadow-2xl
              shadow-black/20
              light:border-slate-900/10
              light:bg-white
              light:text-slate-700
              light:shadow-slate-900/10
            "
          >
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="
                  rounded-xl
                  px-3
                  py-3
                  text-center
                  font-medium
                  transition
                  hover:bg-white/10
                  hover:text-white
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-violet-400/50
                  light:text-slate-700
                  light:hover:bg-slate-900/5
                  light:hover:text-slate-900
                "
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/blog"
              onClick={() => setIsMenuOpen(false)}
              className="
                rounded-xl
                px-3
                py-3
                text-center
                font-medium
                transition
                hover:bg-white/10
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/50
                light:text-slate-700
                light:hover:bg-slate-900/5
                light:hover:text-slate-900
              "
            >
              Blog
            </Link>
            <button
              type="button"
              onClick={() => setIsToolsOpen((open) => !open)}
              className="
                flex
                items-center
                justify-center
                gap-1
                rounded-xl
                px-3
                py-3
                font-medium
                transition
                hover:bg-white/10
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/50
                light:text-slate-700
                light:hover:bg-slate-900/5
                light:hover:text-slate-900
              "
              aria-expanded={isToolsOpen}
              aria-haspopup="true"
            >
              Tools
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isToolsOpen
              ? toolLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setIsToolsOpen(false);
                      setIsMenuOpen(false);
                    }}
                    className="
                      rounded-xl
                      px-3
                      py-3
                      text-center
                      font-medium
                      transition
                      hover:bg-white/10
                      hover:text-white
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-violet-400/50
                      light:text-slate-700
                      light:hover:bg-slate-900/5
                      light:hover:text-slate-900
                    "
                    role="menuitem"
                  >
                    {link.label}
                  </Link>
                ))
              : null}
          </nav>
        </Container>
      ) : null}
    </header>
  );
}
