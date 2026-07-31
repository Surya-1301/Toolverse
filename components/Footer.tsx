import Link from "next/link";
import { Mail, ShieldCheck, FileText, Flag } from "lucide-react";
import { Container } from "@/components/Container";

const footerLinks = [
  {
    label: "Privacy",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    label: "Terms",
    href: "/terms",
    icon: FileText,
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Mail,
  },
  {
    label: "Report abuse",
    href: "/report-abuse",
    icon: Flag,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <Container className="py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-white transition hover:text-violet-200"
            >
              ToolverseX
            </Link>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Fast, clean, privacy-friendly utilities for everyday web tasks.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-2"
          >
            {footerLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                >
                  <Icon className="h-4 w-4 text-slate-500 transition group-hover:text-violet-300" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ToolverseX. All rights reserved.</p>

          <p className="text-slate-600">
            Built for speed, simplicity, and everyday productivity.
          </p>
        </div>
      </Container>
    </footer>
  );
}