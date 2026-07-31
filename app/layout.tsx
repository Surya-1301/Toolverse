import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Flag, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToolverseX",
  description: "Fast, free, privacy-friendly online tools.",
};

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
    label: "Abuse",
    href: "/report-abuse",
    icon: Flag,
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />

          <main className="flex-1">{children}</main>

          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href="/"
                    className="inline-flex text-base font-semibold tracking-tight text-white transition hover:text-violet-200"
                  >
                    ToolverseX
                  </Link>

                  <p className="mt-2 text-sm text-slate-500">
                    © {new Date().getFullYear()} ToolverseX. All rights
                    reserved.
                  </p>
                </div>

                <nav
                  aria-label="Footer navigation"
                  className="flex flex-wrap items-center gap-x-6 gap-y-3"
                >
                  {footerLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-300"
                      >
                        <Icon className="h-4 w-4 text-slate-600 transition group-hover:text-violet-300" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}