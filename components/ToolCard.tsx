import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status?: "live" | "soon";
};

export function ToolCard({
  title,
  description,
  href,
  icon,
  status = "live",
}: ToolCardProps) {
  const isLive = status === "live";
  const isExternal = /^https?:\/\//i.test(href);

  const content = (
    <div
      className={cn(
        "apple-glass group relative overflow-hidden rounded-3xl p-5 transition-all duration-200",

        "max-sm:rounded-2xl max-sm:p-3.5",

        isLive &&
          "hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15",
      )}
    >
      {/* Apple Top Specular Line */}
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* ============================================================
          ICON + STATUS
      ============================================================ */}

      <div
        className="
          relative
          mb-5
          flex
          items-start
          justify-between
          gap-4

          max-sm:mb-0
          max-sm:gap-3
        "
      >
        {/* Icon Squircle */}

        <div
          className="
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-sky-500/20
            to-cyan-500/20
            text-sky-300
            border
            border-sky-400/20
            shadow-md
            shadow-sky-500/10
            transition
            group-hover:scale-105
            group-hover:text-sky-200
            light:text-sky-600
            light:border-sky-500/20

            max-sm:h-11
            max-sm:w-11
            max-sm:rounded-xl
            max-sm:[&>svg]:h-5
            max-sm:[&>svg]:w-5
          "
        >
          {icon}
        </div>

        {/* Mobile title + description */}

        <div
          className="
            hidden
            min-w-0
            flex-1
            max-sm:block
            max-sm:pr-14
          "
        >
          <h3
            className="
              text-[15px]
              font-bold
              leading-snug
              tracking-tight
              text-white
              light:text-slate-900
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-relaxed
              text-slate-400
              line-clamp-2
              light:text-slate-600
            "
          >
            {description}
          </p>
        </div>

        {/* Status */}

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs border font-medium",

            "max-sm:absolute",
            "max-sm:right-0",
            "max-sm:top-0",
            "max-sm:z-10",
            "max-sm:px-2",
            "max-sm:py-0.5",
            "max-sm:text-[11px]",
            "max-sm:font-semibold",

            isLive
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
              : "bg-amber-500/15 text-amber-300 border-amber-500/25",
          )}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>

      {/* ============================================================
          DESKTOP TITLE + DESCRIPTION
      ============================================================ */}

      <div className="max-sm:hidden">
        <h3 className="text-lg font-semibold text-white light:text-slate-900">
          {title}
        </h3>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400 light:text-slate-600">
          {description}
        </p>
      </div>

      {/* ============================================================
          ACTION
      ============================================================ */}

      <div
        className={cn(
          "mt-5 flex items-center gap-2 text-sm font-semibold",

          "max-sm:mt-3",
          "max-sm:text-xs",
          "max-sm:font-medium",

          isLive
            ? "text-sky-400 group-hover:text-sky-300"
            : "text-slate-600",
        )}
      >
        {isLive ? "Open tool" : "Launching soon"}

        <ArrowRight
          className={cn(
            "h-4 w-4 transition",

            "max-sm:h-3.5",
            "max-sm:w-3.5",

            isLive && "group-hover:translate-x-1",
          )}
        />
      </div>
    </div>
  );

  {/* ================================================================
      COMING SOON
  ================================================================= */}

  if (!isLive) {
    return (
      <div className="cursor-not-allowed opacity-70">
        {content}
      </div>
    );
  }

  {/* ================================================================
      EXTERNAL
  ================================================================= */}

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  {/* ================================================================
      INTERNAL
  ================================================================= */}

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}