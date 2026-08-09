"use client";

import {
  ArrowRight,
  Code2,
  FileCode2,
  FilePenLine,
  FileUp,
  ImageDown,
  ImagePlus,
  Link2,
  QrCode,
  Text,
} from "lucide-react";
import Link from "next/link";
import { Container } from "../../components/Container";
import { ToolCard } from "../../components/ToolCard";

const popularTools = [
  {
    title: "PDF Editor",
    description:
      "Merge, split, extract, remove, scan, edit, convert, compress, and secure PDFs in one place.",
    href: "https://pdfverse.pages.dev/",
    icon: <FilePenLine className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Upload & Share",
    description: "Upload images or files and get temporary shareable links.",
    href: "/file-share",
    icon: <FileUp className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Image & PDF Compressor",
    description: "Compress images and PDF files with simple quality controls.",
    href: "/image-compressor",
    icon: <ImageDown className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Paste",
    description: "Share text and code snippets with quick, clean links.",
    href: "/paste",
    icon: <Text className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "URL Shortener",
    description: "Turn long URLs into short, memorable links.",
    href: "/url-shortener",
    icon: <Link2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "QR Generator",
    description: "Create downloadable QR codes for links, text, and files.",
    href: "/qr-generator",
    icon: <QrCode className="h-6 w-6" />,
    status: "live" as const,
  },
];

const categoryCards = [
  {
    title: "Conversion Tools",
    description:
      "Convert Markdown, HTML, YAML, JSON, CSV, and Excel-compatible files.",
    href: "/tools/conversion-tools",
    icon: <FileCode2 className="h-6 w-6" />,
     status: "live" as const,
  },
  {
    title: "Formatter & Minifier",
    description:
      "Format, validate, minify, clean, and copy developer-friendly code outputs.",
    href: "/tools/formatter-tools",
    icon: <Code2 className="h-6 w-6" />,
     status: "live" as const,
  },
  {
    title: "Image Tools",
    description:
      "Convert, resize, crop, watermark, and remove backgrounds from images.",
    href: "/tools/image-tools",
    icon: <ImagePlus className="h-6 w-6" />,
     status: "live" as const,
  },
  {
  title: "Text & Developer Tools",
  description:
    "Generate UUIDs, passwords, hashes, Base64, JWTs, regex matches, timestamps, URLs, and colors.",
  href: "/tools/text-developer-tools",
  icon: <Code2 className="h-6 w-6" />,
},
];

function CategoryToolCard({
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
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/25 text-violet-200 ring-1 ring-violet-400/25">
          {icon}
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
          Live
        </span>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>

      <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
        View tools
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
export default function ToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Explore all tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Browse all available Toolverse tools for formatting, generating,
          compressing, organizing, editing, converting, securing, hosting,
          sharing, and shortening.
        </p>
      </div>

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Popular tools
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Tool categories
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {categoryCards.map((category) => (
            <CategoryToolCard key={category.title} {...category} />
          ))}
        </div>
      </section>
    </Container>
  );
}