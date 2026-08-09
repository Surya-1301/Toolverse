"use client";

import { ArrowLeft, ArrowRight, Braces, Code2, FileCode2 } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "HTML Formatter / Minifier",
    description: "Format, minify, validate tags, and copy HTML output.",
    href: "/html-formatter",
    icon: <FileCode2 className="h-6 w-6" />,
  },
  {
    title: "CSS Formatter / Minifier",
    description: "Format CSS, minify styles, remove comments, and copy output.",
    href: "/css-formatter",
    icon: <Code2 className="h-6 w-6" />,
  },
  {
    title: "JavaScript Formatter / Minifier",
    description: "Beautify, format, minify, and copy JavaScript code.",
    href: "/javascript-formatter",
    icon: <Code2 className="h-6 w-6" />,
  },
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON instantly in your browser.",
    href: "/json-formatter",
    icon: <Braces className="h-6 w-6" />,
  },
];

function RelatedToolCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FormatterToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto mt-8 max-w-3xl text-center">

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Formatter & Minifier
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format, validate, minify, clean, and copy developer-friendly HTML,
          CSS, JavaScript, and JSON outputs.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <RelatedToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </Container>
  );
}