"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = "/",
  label,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined") {
      // 1. Next.js App Router client-side history:
      // When a user navigates client-side, window.history.state.idx > 0.
      const hasClientHistory =
        Boolean(window.history.state) &&
        typeof window.history.state.idx === "number" &&
        window.history.state.idx > 0;

      // 2. Same-origin referrer (e.g. navigation via full reload from within Toolverse):
      const hasInternalReferrer =
        typeof document !== "undefined" &&
        Boolean(document.referrer) &&
        document.referrer.startsWith(window.location.origin);

      if (hasClientHistory || hasInternalReferrer) {
        router.back();
        return;
      }

      // 3. Fallback for environments with history stack (e.g. Capacitor native app):
      if (
        window.history.length > 1 &&
        typeof document !== "undefined" &&
        !document.referrer
      ) {
        router.back();
        return;
      }
    }

    // Fallback navigation when there is no internal history
    router.push(fallbackHref);
  }

  const displayLabel =
    label ?? (fallbackHref.includes("tools") ? "Back to tools" : "Back");

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={displayLabel}
      className={`group inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-sky-400/30 hover:bg-white/[0.08] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a14] light:border-slate-900/10 light:bg-white light:text-slate-700 light:hover:text-slate-950 ${className}`.trim()}
    >
      <ArrowLeft
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
      />
      <span>{displayLabel}</span>
    </button>
  );
}

export function BackToToolsLink({
  fallbackHref = "/tools",
  label,
  className = "mb-8",
}: BackButtonProps) {
  return (
    <div className={className}>
      <BackButton fallbackHref={fallbackHref} label={label} />
    </div>
  );
}
