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
      className="
        group
        inline-flex
        min-h-10
        items-center
        gap-2
        rounded-xl
        border
        border-white/[0.10]
        bg-white/[0.025]
        px-3.5
        py-2
        text-sm
        font-medium
        text-slate-400
        transition-all
        duration-200
        hover:border-violet-400/25
        hover:bg-white/[0.055]
        hover:text-white
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-violet-400/60
        focus-visible:ring-offset-2
        focus-visible:ring-offset-slate-950
      "
    >
      <ArrowLeft
        aria-hidden="true"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
      />
      <span>Back</span>
    </button>
  );
}