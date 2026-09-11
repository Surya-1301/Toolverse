"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Container } from "./Container";

const mainLinks = [
  { href: "https://pdfverse.pages.dev/", label: "PDF" },
  { href: "/file-share", label: "Upload" },
  { href: "/image-compressor", label: "Compress" },
  { href: "/paste", label: "Paste" },
  { href: "/qr-generator", label: "QR" },
  { href: "/url-shortener", label: "Shorten" },
  { href: "/blog", label: "Blog" },
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
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-violet-400/50
            focus-visible:ring-offset-2
            focus-visible:ring-offset-slate-950
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
            DESKTOP NAVIGATION
        ================================================================ */}

        <nav
          aria-label="Primary navigation"
          className="
            hidden
            items-center
            gap-2
            text-sm
            text-slate-300
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
            MOBILE MENU BUTTON
        ================================================================ */}

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
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-violet-400/50
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
                "
              >
                {link.label}
              </Link>
            ))}
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
