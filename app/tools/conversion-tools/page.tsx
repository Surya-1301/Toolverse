"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  FileCode2,
  FileImage,
  FilePenLine,
  FileSpreadsheet,
  FileType2,
  Palette,
  Regex,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "Markdown to PDF",
    description: "Write Markdown with live preview and download it as a PDF.",
    href: "/markdown-to-pdf",
    icon: <FilePenLine className="h-6 w-6" />,
  },
  {
    title: "Markdown to HTML",
    description: "Convert Markdown into clean HTML instantly in your browser.",
    href: "/markdown-to-html",
    icon: <FileCode2 className="h-6 w-6" />,
  },
  {
    title: "YAML ↔ JSON Converter",
    description: "Convert YAML to JSON or JSON to YAML with validation errors.",
    href: "/yaml-json-converter",
    icon: <Braces className="h-6 w-6" />,
  },
  {
    title: "CSV ↔ JSON Converter",
    description: "Convert CSV to JSON or JSON to CSV with upload/download.",
    href: "/csv-json-converter",
    icon: <Table2 className="h-6 w-6" />,
  },
  {
    title: "Excel to CSV / CSV to Excel",
    description: "Convert CSV into Excel-compatible files and download results.",
    href: "/excel-csv-converter",
    icon: <FileSpreadsheet className="h-6 w-6" />,
  },
  {
    title: "RGB ↔ HEX Converter",
    description: "Convert between HEX, RGB, and HSL color formats instantly.",
    href: "/color-converter",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    title: "Regex Tester",
    description:
      "Test regex patterns with flags, match highlighting, and match details.",
    href: "/regex-tester",
    icon: <Regex className="h-6 w-6" />,
  },
  {
    title: "JSON ↔ XML Converter",
    description: "Convert JSON to XML or XML to JSON with validation errors.",
    href: "/json-xml-converter",
    icon: <FileType2 className="h-6 w-6" />,
  },
  {
    title: "Image to Base64 Converter",
    description: "Convert images to Base64 strings and decode them back instantly.",
    href: "/image-to-base64",
    icon: <FileImage className="h-6 w-6" />,
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
      className="apple-glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15 max-sm:rounded-2xl max-sm:p-3.5"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4 max-sm:gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20 max-sm:h-11 max-sm:w-11 max-sm:rounded-xl max-sm:[&>svg]:h-5 max-sm:[&>svg]:w-5">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white light:text-slate-900 max-sm:text-[15px] max-sm:leading-snug">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600 max-sm:mt-1 max-sm:text-xs max-sm:leading-relaxed max-sm:line-clamp-2">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 max-sm:mt-3 max-sm:text-xs max-sm:font-medium">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 max-sm:h-3.5 max-sm:w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ConversionToolsPage() {
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
          Conversion Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Convert Markdown, HTML, YAML, JSON, CSV, Excel files, and color
          formats.
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