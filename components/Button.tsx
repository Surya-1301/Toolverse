import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-40";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-violet-600 text-white hover:bg-violet-500",
    secondary:
      "border border-white/10 bg-white/[0.02] text-white hover:bg-white/10",
    danger:
      "border border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10",
    ghost: "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}