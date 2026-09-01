"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Search,
  ServerCog,
} from "lucide-react";
import { Container } from "@/components/Container";
import { statusClasses, statusCodes } from "@/lib/httpStatusCodes";
import type { StatusClass } from "@/lib/httpStatusCodes";

function BackToToolsLink() {
  return (
    <Link
      href="/tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const classStyles: Record<StatusClass["code"], { badge: string; dot: string }> = {
  "1xx": { badge: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20", dot: "bg-cyan-400" },
  "2xx": { badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20", dot: "bg-emerald-400" },
  "3xx": { badge: "bg-amber-500/15 text-amber-300 ring-amber-400/20", dot: "bg-amber-400" },
  "4xx": { badge: "bg-red-500/15 text-red-300 ring-red-400/20", dot: "bg-red-400" },
  "5xx": { badge: "bg-rose-500/15 text-rose-300 ring-rose-400/20", dot: "bg-rose-400" },
};

export default function HttpStatusCodesPage() {
  const [query, setQuery] = useState("");
  const [activeClass, setActiveClass] = useState<StatusClass["code"] | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return statusCodes.filter((item) => {
      if (activeClass !== "all" && item.class !== activeClass) return false;

      if (q) {
        const haystack = `${item.code} ${item.title} ${item.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [query, activeClass]);

  const counts = useMemo(
    () =>
      statusCodes.reduce<Record<string, number>>((acc, item) => {
        acc[item.class] = (acc[item.class] || 0) + 1;
        return acc;
      }, {}),
    [],
  );

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          HTTP Status Codes
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Searchable reference for the HTTP status codes a server can return,
          grouped by response class.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        {/* Search + class filters */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
              <Search className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by code, name, or description..."
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              <BookOpen className="h-3.5 w-3.5" />
              {filtered.length} of {statusCodes.length} codes
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveClass("all")}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                activeClass === "all"
                  ? "border-violet-500 bg-violet-600/20 text-white"
                  : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
              ].join(" ")}
            >
              <ServerCog className="h-4 w-4" />
              All ({statusCodes.length})
            </button>

            {statusClasses.map((statusClass) => (
              <button
                key={statusClass.code}
                type="button"
                onClick={() => setActiveClass(statusClass.code)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  activeClass === statusClass.code
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                <span className={`h-2 w-2 rounded-full ${classStyles[statusClass.code].dot}`} />
                {statusClass.name} ({counts[statusClass.code] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Class explainers */}
        {activeClass === "all" ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statusClasses.map((statusClass) => (
              <div
                key={statusClass.code}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${classStyles[statusClass.code].dot}`} />
                  <h2 className="text-sm font-bold text-white">
                    {statusClass.code} · {statusClass.name}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {statusClass.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Codes list */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {filtered.length ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {filtered.map((item) => {
                const style = classStyles[item.class];
                return (
                  <div
                    key={item.code}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-bold tracking-tight text-white">
                          {item.code}
                        </p>
                        <h3 className="mt-0.5 text-sm font-bold text-slate-200">
                          {item.title}
                        </h3>
                      </div>
                      <span
                        className={[
                          "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                          style.badge,
                        ].join(" ")}
                      >
                        {item.class}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
              <p className="text-sm leading-6 text-slate-500">
                No status codes match your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}