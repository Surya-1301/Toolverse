"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  CornerDownLeft,
  X,
  ExternalLink,
  Command,
} from "lucide-react";
import { COMMAND_ITEMS, CommandItem } from "@/lib/commandItems";

const RECENT_KEY = "toolverse_recent_tools";
const MAX_RECENTS = 5;

// Popular tools displayed when query is empty
const POPULAR_IDS = [
  "json-formatter",
  "image-compressor",
  "qr-generator",
  "base64-encoder-decoder",
  "uuid-generator",
  "youtube-downloader",
  "file-share",
  "text-counter",
];

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent tools from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentIds(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [isOpen]);

  // Save selected tool to recent list
  const recordRecent = (id: string) => {
    try {
      const updated = [id, ...recentIds.filter((item) => item !== id)].slice(
        0,
        MAX_RECENTS
      );
      setRecentIds(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Quick slash "/" to open (unless already typing in an input)
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
        if (!isEditable) {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleToggleEvent = () => setIsOpen((prev) => !prev);
    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggleEvent);
    window.addEventListener("open-command-palette", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggleEvent);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, [isOpen]);

  // Lock body scroll and auto-focus when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Filtered results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // When empty: return recents followed by popular
      const recents = recentIds
        .map((id) => COMMAND_ITEMS.find((item) => item.id === id))
        .filter(Boolean) as CommandItem[];

      const popular = POPULAR_IDS.map((id) =>
        COMMAND_ITEMS.find((item) => item.id === id)
      ).filter(
        (item): item is CommandItem =>
          Boolean(item) && !recentIds.includes(item!.id)
      );

      return [...recents, ...popular];
    }

    return COMMAND_ITEMS.map((item) => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const catLower = item.category.toLowerCase();

      // Exact matches
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 60;
      else if (titleLower.includes(q)) score += 40;

      // Category matches
      if (catLower.includes(q)) score += 30;

      // Keywords match
      for (const kw of item.keywords) {
        if (kw === q) score += 50;
        else if (kw.includes(q)) score += 25;
      }

      // Description match
      if (descLower.includes(q)) score += 15;

      return { item, score };
    })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [query, recentIds]);

  // Reset selected index when query results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleSelect = (item: CommandItem) => {
    recordRecent(item.id);
    setIsOpen(false);

    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) handleSelect(current);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Dialog */}
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all light:border-slate-200 light:bg-white/95 light:ring-slate-900/5 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 px-4 py-3.5 light:border-slate-200">
          <Search className="h-5 w-5 shrink-0 text-slate-400 light:text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a tool name, format, or command (e.g. json, uuid, compress)..."
            className="w-full bg-transparent px-3 text-base text-white placeholder-slate-400 outline-none light:text-slate-900 light:placeholder-slate-400"
          />

          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="rounded-md p-1 text-slate-400 hover:text-white light:hover:text-slate-900"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-400 sm:inline-block light:border-slate-200 light:bg-slate-100 light:text-slate-500">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 light:text-slate-500">
              <p className="font-medium text-slate-300 light:text-slate-700">
                No tools found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs">
                Try searching for formatters, image tools, converters, or text utilities.
              </p>
            </div>
          ) : (
            <>
              {!query && recentIds.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Recent & Popular
                </div>
              )}

              {!query && recentIds.length === 0 && (
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" /> Popular Tools
                </div>
              )}

              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isRecent = !query && recentIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition ${
                      isSelected
                        ? "bg-sky-500/15 text-white ring-1 ring-sky-400/30 light:bg-sky-50 light:text-slate-900 light:ring-sky-200"
                        : "text-slate-300 hover:bg-white/[0.04] light:text-slate-700 light:hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? "border-sky-400/40 bg-sky-500/20 text-sky-300 light:border-sky-300 light:bg-sky-100 light:text-sky-700"
                            : "border-white/10 bg-white/[0.04] text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-500"
                        }`}
                      >
                        {isRecent ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {item.title}
                          </span>
                          {item.external && (
                            <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400 light:text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-slate-400 sm:inline-block light:border-slate-200 light:bg-slate-100 light:text-slate-500">
                        {item.category}
                      </span>
                      {isSelected ? (
                        <CornerDownLeft className="h-4 w-4 text-sky-400 light:text-sky-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] light:border-slate-200 light:bg-white">
                ↑
              </kbd>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] light:border-slate-200 light:bg-white">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] light:border-slate-200 light:bg-white">
                ↵
              </kbd>
              <span>to select</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] light:border-slate-200 light:bg-white">
                esc
              </kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <Command className="h-3 w-3" />
            <span>Toolverse Quick Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
