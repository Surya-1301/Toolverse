"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back to the previous page"
      className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-sky-400/30 hover:bg-white/[0.08] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a14] light:border-slate-900/10 light:bg-white light:text-slate-700 light:hover:text-slate-950"
    >
      <ArrowLeft
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
      />
      <span>Back</span>
    </button>
  );
}