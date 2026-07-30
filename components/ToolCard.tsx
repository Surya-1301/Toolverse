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

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-200",
        isLive &&
          "hover:-translate-y-1 hover:border-violet-500/60 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-violet-950/30"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
          {icon}
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs",
            isLive
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-amber-500/10 text-amber-300"
          )}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div
        className={cn(
          "mt-5 flex items-center gap-2 text-sm font-medium",
          isLive ? "text-violet-300" : "text-slate-500"
        )}
      >
        {isLive ? "Open tool" : "Launching soon"}
        <ArrowRight
          className={cn(
            "h-4 w-4 transition",
            isLive && "group-hover:translate-x-1"
          )}
        />
      </div>
    </div>
  );

  if (!isLive) {
    return <div className="cursor-not-allowed opacity-70">{content}</div>;
  }

  return <Link href={href}>{content}</Link>;
}