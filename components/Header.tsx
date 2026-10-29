"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  { href: "/tools/download-tools", label: "Download tools" },
  { href: "/tools/image-tools", label: "Image tools" },
  { href: "/tools/conversion-tools", label: "Conversion tools" },
  { href: "/tools/formatter-tools", label: "Formatter tools" },
  { href: "/tools/text-tools", label: "Text tools" },
  { href: "/tools/developer-tools", label: "Developer tools" },
];

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Automatically close all menus on page navigation or refresh
  useEffect(() => {
    setIsToolsOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  // Click outside and Escape key handler for both desktop and mobile menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      // Close desktop Tools dropdown when clicking outside its container
      if (
        toolsRef.current &&
        !toolsRef.current.contains(target)
      ) {
        setIsToolsOpen(false);
      }
      // Close mobile navigation menu when tapping outside the header
      if (
        headerRef.current &&
        !headerRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsToolsOpen(false);
        setIsMenuOpen(false);
      }
    }

    if (isToolsOpen || isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isToolsOpen, isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="
        sticky
        top-0
        z-50
        border-b
        border-white/[0.05]
        bg-[#070a14]/80
        backdrop-blur-xl
        light:border-slate-900/[0.05]
        light:bg-[#f1f5f9]/80
      "
    >
      <div className="apple-specular opacity-40" />
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
            focus-visible:ring-sky-400/50
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
              src="/logo.png"
              alt="Toolverse logo"
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
              onClick={() => setIsToolsOpen(false)}
              className="
                rounded-full
                px-3.5
                py-1.5
                transition-all
                duration-150
                hover:bg-white/[0.08]
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-sky-400/50
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
          <div ref={toolsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsToolsOpen((open) => !open)}
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-white/[0.08]
                bg-white/[0.03]
                px-3.5
                py-1.5
                transition-all
                duration-150
                hover:bg-white/[0.08]
                hover:border-white/[0.15]
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-sky-400/50
                focus-visible:ring-offset-1
                focus-visible:ring-offset-slate-950
                light:border-slate-900/10
                light:bg-white/60
                light:hover:bg-slate-900/5
                light:hover:text-slate-900
                light:focus-visible:ring-offset-white
              "
              aria-expanded={isToolsOpen}
              aria-haspopup="true"
            >
              Tools
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
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
                  z-[100]
                  mt-2.5
                  w-56
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/[0.12]
                  bg-[#070a14]/95
                  p-1.5
                  text-sm
                  text-slate-200
                  backdrop-blur-2xl
                  shadow-2xl
                  shadow-black/80
                  light:border-slate-900/10
                  light:bg-white/95
                  light:text-slate-700
                  light:shadow-slate-900/15
                "
                role="menu"
              >
                <div className="apple-specular opacity-40" />
                <div className="relative flex flex-col gap-0.5">
                  {toolLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsToolsOpen(false)}
                      className="
                        block
                        rounded-xl
                        px-3.5
                        py-2.5
                        font-medium
                        transition-all
                        duration-150
                        hover:bg-white/10
                        hover:text-white
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-sky-400/50
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
              focus-visible:ring-sky-400/50
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
              relative
              overflow-hidden
              grid
              grid-cols-2
              gap-2
              rounded-3xl
              border
              border-white/[0.12]
              bg-[#070a14]/95
              p-3
              text-sm
              text-slate-200
              backdrop-blur-2xl
              shadow-2xl
              shadow-black/80
              light:border-slate-900/10
              light:bg-white/95
              light:text-slate-700
              light:shadow-slate-900/15
            "
          >
            <div className="apple-specular opacity-40" />
            {mainLinks.map((link) => (
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
                  focus-visible:ring-sky-400/50
                  light:text-slate-700
                  light:hover:bg-slate-900/5
                  light:hover:text-slate-900
                "
              >
                {link.label}
              </Link>
            ))}
            <div className="col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md light:border-slate-900/10 light:bg-slate-900/[0.03]">
              <button
                type="button"
                onClick={() => setIsToolsOpen((open) => !open)}
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  px-4
                  py-3
                  font-medium
                  transition
                  hover:bg-white/[0.05]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-sky-400/50
                  light:text-slate-700
                  light:hover:bg-slate-900/5
                  light:hover:text-slate-900
                "
                aria-expanded={isToolsOpen}
                aria-haspopup="true"
              >
                <span>Tools</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isToolsOpen ? "rotate-180 text-sky-400" : ""
                  }`}
                />
              </button>
              {isToolsOpen ? (
                <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 p-2 light:border-slate-900/10">
                  {toolLinks.map((link) => (
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
                        py-2.5
                        text-center
                        text-xs
                        font-medium
                        text-slate-300
                        transition
                        hover:bg-white/10
                        hover:text-white
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-sky-400/50
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
        </Container>
      ) : null}
    </header>
  );
}
