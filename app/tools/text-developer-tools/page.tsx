"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Clock,
  Code2,
  Fingerprint,
  Hash,
  KeyRound,
  Link2,
  LockKeyhole,
  Palette,
  Regex,
  TextCursorInput,
  CaseSensitive,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "Word Counter",
    description: "Count words, characters, sentences, paragraphs, lines, and reading time instantly.",
    href: "/word-counter",
    icon: <TextCursorInput className="h-6 w-6" />,
  },
  {
    title: "Character Counter",
    description: "Count characters with and without spaces, plus letters, numbers, spaces, punctuation, and words.",
    href: "/character-counter",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    title: "Case Converter",
    description: "Convert text to uppercase, lowercase, title case, sentence case, camelCase, snake_case.",
    href: "/case-converter",
    icon: <CaseSensitive className="h-6 w-6" />,
  },
  {
    title: "UUID Generator",
    description: "Generate UUID v4 values in bulk and copy all results.",
    href: "/uuid-generator",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    title: "Password Generator",
    description:
      "Create secure passwords with length, symbols, ambiguity filtering, and strength checks.",
    href: "/password-generator",
    icon: <KeyRound className="h-6 w-6" />,
  },
  {
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text.",
    href: "/hash-generator",
    icon: <Fingerprint className="h-6 w-6" />,
  },
  {
    title: "Base64 Encoder / Decoder",
    description:
      "Convert text and files to Base64, or decode Base64 back to text and files.",
    href: "/base64-encoder-decoder",
    icon: <Braces className="h-6 w-6" />,
  },
  {
    title: "JWT Decoder",
    description:
      "Decode JWT header and payload locally, inspect expiry, and avoid server upload.",
    href: "/jwt-decoder",
    icon: <LockKeyhole className="h-6 w-6" />,
  },
  {
    title: "Regex Tester",
    description:
      "Test regex patterns with flags, match highlighting, and match details.",
    href: "/regex-tester",
    icon: <Regex className="h-6 w-6" />,
  },
  {
    title: "Timestamp Converter",
    description:
      "Convert Unix timestamps to dates, dates to Unix timestamps, and view timezones.",
    href: "/timestamp-converter",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    title: "URL Parser",
    description:
      "Parse protocol, domain, path, query params, hash, and copy formatted results.",
    href: "/url-parser",
    icon: <Link2 className="h-6 w-6" />,
  },
  {
    title: "Color Converter",
    description:
      "Convert HEX, RGB, and HSL colors with preview and palette generation.",
    href: "/color-converter",
    icon: <Palette className="h-6 w-6" />,
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

export default function TextDeveloperToolsPage() {
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
          Text and Developer Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Count and transform text, generate UUIDs and passwords, hash text, encode Base64, decode JWTs, test regex, convert timestamps, parse URLs, and convert colors.
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