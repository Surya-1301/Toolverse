"use client";

import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CaseSensitive,
  GitCompare,
  GitMerge,
  Hash,
  TextQuote,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "Lorem Ipsum Generator",
    description:
      "Generate classic placeholder text as paragraphs, sentences, or words with optional HTML tags.",
    href: "/lorem-ipsum-generator",
    icon: <TextQuote className="h-6 w-6" />,
  },
  {
    title: "Text Counter",
    description:
      "Count words, characters, letters, numbers, spaces, punctuation, sentences, paragraphs, lines, and reading time — all in one place.",
    href: "/text-counter",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    title: "Case Converter",
    description:
      "Convert text to uppercase, lowercase, title case, sentence case, camelCase, snake_case.",
    href: "/case-converter",
    icon: <CaseSensitive className="h-6 w-6" />,
  },
  {
    title: "Duplicate Line Remover",
    description:
      "Remove duplicate or blank lines from text and copy the cleaned result.",
    href: "/duplicate-line-remover",
    icon: <GitMerge className="h-6 w-6" />,
  },
  {
    title: "Text to Speech",
    description:
      "Turn text into spoken audio using your browser's built-in voice engine.",
    href: "/text-to-speech",
    icon: <AudioLines className="h-6 w-6" />,
  },
  {
    title: "Text Compare / Diff",
    description:
      "Compare two blocks of text side by side and see added, removed, and unchanged lines.",
    href: "/text-compare",
    icon: <GitCompare className="h-6 w-6" />,
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
      className="apple-glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white light:text-slate-900">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TextToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Text Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Count, transform, compare, and convert text — all in your browser.
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

