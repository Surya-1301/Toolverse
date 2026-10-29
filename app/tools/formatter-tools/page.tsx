"use client";

import { BackButton } from "@/components/BackButton";

import { ArrowRight, Braces, Code2, Database, FileCode2, FileType2 } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "HTML Formatter",
    description: "Format, minify, validate tags, and copy HTML output.",
    href: "/html-formatter",
    icon: <FileCode2 className="h-6 w-6" />,
  },
  {
    title: "CSS Formatter",
    description: "Format CSS, minify styles, remove comments, and copy output.",
    href: "/css-formatter",
    icon: <Code2 className="h-6 w-6" />,
  },
  {
    title: "JavaScript Formatter",
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
  {
    title: "SQL Formatter",
    description: "Format, beautify, and minify SQL queries with proper indentation.",
    href: "/sql-formatter",
    icon: <Database className="h-6 w-6" />,
  },
  {
    title: "TypeScript Formatter",
    description: "Beautify, format, and minify TypeScript code and type definitions.",
    href: "/typescript-formatter",
    icon: <FileType2 className="h-6 w-6" />,
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
      className="apple-glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15 max-sm:rounded-[22px] max-sm:p-4.5"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4 max-sm:gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20 max-sm:h-[54px] max-sm:w-[54px] max-sm:rounded-[18px] max-sm:[&>svg]:h-6 max-sm:[&>svg]:w-6">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white light:text-slate-900 max-sm:text-[17px] max-sm:leading-snug">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600 max-sm:mt-1.5 max-sm:text-[13.5px] max-sm:leading-relaxed max-sm:line-clamp-2">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 max-sm:mt-4 max-sm:text-[13.5px]">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 max-sm:h-4 max-sm:w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FormatterToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools" />
      </div>

      <div className="mx-auto mt-8 max-w-3xl text-center">

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Formatter & Minifier Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Format, validate, minify, clean, and copy developer-friendly HTML,
          CSS, JavaScript, JSON, SQL, and TypeScript outputs.
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