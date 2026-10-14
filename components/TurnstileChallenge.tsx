"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("challenge script failed")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("challenge script failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Renders a Cloudflare Turnstile "verify you're human" widget.
 * Calls onSolved with the challenge response token when the user passes.
 */
export function TurnstileChallenge({
  sitekey,
  onSolved,
}: {
  sitekey: string;
  onSolved: (turnstileResponse: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const solvedRef = useRef(onSolved);
  solvedRef.current = onSolved;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme: "dark",
          callback: (token: string) => {
            if (!cancelled) solvedRef.current(token);
          },
          "expired-callback": () => {
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          "error-callback": () => {
            if (!cancelled) setFailed(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sitekey]);

  if (failed) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-medium text-amber-200 light:text-amber-700">
          The human check couldn&apos;t load on this site.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400 light:text-slate-600">
          The check is tied to the server owner&apos;s own domains (or blocked
          by an ad blocker). If this is your server, add this site&apos;s
          domain in your Cloudflare Turnstile widget settings — or use an API
          key instead.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-slate-50">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300 light:text-slate-700">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        One quick human check, then your download starts
      </p>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
