import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolCategoryCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status?: "live" | "soon";
};

export function ToolCategoryCard({
  title,
  description,
  href,
  icon,
  status = "live",
}: ToolCategoryCardProps) {
  const isLive = status === "live";

  return (
    <Link
      href={href}
      className={cn(
        // ============================================================
        // DESKTOP — KEEP CATEGORY CARD COMPACT
        // ============================================================
        "group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-200",

        // ============================================================
        // MOBILE ONLY
        // ============================================================
        "max-sm:rounded-[28px] max-sm:p-5",

        isLive &&
          "hover:-translate-y-1 hover:border-violet-500/60 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-violet-950/30",
      )}
    >
      {/* ============================================================
          TOP GRADIENT
      ============================================================ */}

      <div
        className="
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-violet-400/60
          to-transparent
          opacity-0
          transition
          group-hover:opacity-100
        "
      />

      {/* ============================================================
          ICON + TITLE/DESCRIPTION + STATUS
      ============================================================ */}

      <div
        className="
          relative
          flex
          items-start
          gap-5
        "
      >
        {/* ==========================================================
            ICON
        ========================================================== */}

        <div
          className="
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-600/20
            text-violet-300
            ring-1
            ring-violet-400/20

            max-sm:h-[76px]
            max-sm:w-[76px]
            max-sm:rounded-[23px]
          "
        >
          {icon}
        </div>

        {/* ==========================================================
            TITLE + DESCRIPTION
        ========================================================== */}

        <div
          className="
            min-w-0
            flex-1
            pr-14
          "
        >
          {/* ========================================================
              TITLE
          ======================================================== */}

          <h3
            className="
              text-lg
              font-semibold
              leading-7
              tracking-tight
              text-white

              max-sm:text-[21px]
              max-sm:font-bold
              max-sm:leading-[1.25]
            "
          >
            {title}
          </h3>

          {/* ========================================================
              DESCRIPTION
          ======================================================== */}

          <p
            className="
              mt-2
              min-h-12
              text-sm
              leading-6
              text-slate-400

              max-sm:mt-3
              max-sm:min-h-0
              max-sm:text-[16px]
              max-sm:leading-7
            "
          >
            {description}
          </p>
        </div>

        {/* ==========================================================
            STATUS
        ========================================================== */}

        <span
          className={cn(
            "absolute right-0 top-0 rounded-full px-2.5 py-1 text-xs font-semibold",

            // Mobile size
            "max-sm:right-0",
            "max-sm:top-0",
            "max-sm:px-3",
            "max-sm:py-1.5",
            "max-sm:text-sm",

            isLive
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-amber-500/10 text-amber-300",
          )}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>

      {/* ============================================================
          ACTION
      ============================================================ */}

      <div
        className={cn(
          "mt-5 flex items-center gap-2 text-sm font-medium",

          // Mobile
          "max-sm:mt-7",
          "max-sm:text-[16px]",
          "max-sm:font-semibold",

          isLive
            ? "text-violet-300"
            : "text-slate-600",
        )}
      >
        {isLive ? "View tools" : "Launching soon"}

        <ArrowRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",

            "max-sm:h-5",
            "max-sm:w-5",

            isLive && "group-hover:translate-x-1",
          )}
        />
      </div>
    </Link>
  );
}