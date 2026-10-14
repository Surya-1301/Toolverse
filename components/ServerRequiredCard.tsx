"use client";

import { KeyRound, Server } from "lucide-react";

const inputClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

export function ServerRequiredCard({
  apiBase,
  apiKey,
  onApiBaseChange,
  onApiKeyChange,
  onRetry,
}: {
  apiBase: string;
  apiKey: string;
  onApiBaseChange: (v: string) => void;
  onApiKeyChange: (v: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200 light:text-amber-700">
        <Server className="h-4 w-4 shrink-0" />
        This public server needs a sign-in that only works on its own site
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-600">
        Connect your own free download server instead — it takes a few minutes,
        has no human checks, and works with all your tools. Paste its URL
        below (and API key if you set one).
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400 light:text-slate-600">
            <Server className="h-3.5 w-3.5" />
            Server URL
          </span>
          <input
            type="url"
            value={apiBase}
            onChange={(e) => onApiBaseChange(e.target.value)}
            placeholder="https://your-server.com/"
            className={inputClass}
            inputMode="url"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400 light:text-slate-600">
            <KeyRound className="h-3.5 w-3.5" />
            API key (if your server needs one)
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Optional"
            className={inputClass}
            autoComplete="off"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={!apiBase.trim()}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Save &amp; try again
      </button>
    </div>
  );
}
