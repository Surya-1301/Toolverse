"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync with what the inline <head> script set before hydration.
  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [theme]);

  function toggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        inline-flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-full
        border
        border-white/[0.10]
        bg-white/[0.03]
        text-slate-200
        transition-all
        duration-150
        hover:bg-white/[0.08]
        hover:border-white/[0.18]
        hover:text-white
        active:scale-95
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-sky-400/50
        light:border-slate-900/10
        light:bg-slate-900/[0.04]
        light:text-slate-700
        light:hover:bg-slate-900/10
        light:hover:text-slate-950
      "
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5" />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}