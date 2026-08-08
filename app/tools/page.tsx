"use client";

import {
  Braces,
  Code2,
  FileCode2,
  FilePenLine,
  FileUp,
  ImageDown,
  ImagePlus,
  Link2,
  QrCode,
  Table2,
  Text,
} from "lucide-react";
import Link from "next/link";
import { Container } from "../../components/Container";
import { ToolCard } from "../../components/ToolCard";

const mainTools = [
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

const conversionTools = [
  {
    title: "Markdown to PDF",
    description: "Write Markdown with live preview and download it as a PDF.",
    href: "/markdown-to-pdf",
    icon: <FilePenLine className="h-5 w-5" />,
  },
  {
    title: "Markdown to HTML",
    description: "Convert Markdown into clean HTML instantly in your browser.",
    href: "/markdown-to-html",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "YAML ↔ JSON Converter",
    description: "Convert YAML to JSON or JSON to YAML with validation errors.",
    href: "/yaml-json-converter",
    icon: <Braces className="h-5 w-5" />,
  },
  {
    title: "CSV ↔ JSON Converter",
    description: "Convert CSV to JSON or JSON to CSV with upload/download.",
    href: "/csv-json-converter",
    icon: <Table2 className="h-5 w-5" />,
  },
  {
    title: "Excel to CSV / CSV to Excel",
    description: "Convert CSV into Excel-compatible files and download results.",
    href: "/excel-csv-converter",
    icon: <Table2 className="h-5 w-5" />,
  },
];

const formatterTools = [
  {
    title: "HTML Formatter / Minifier",
    description: "Format, minify, validate tags, and copy HTML output.",
    href: "/html-formatter",
    icon: <FileCode2 className="h-5 w-5" />,
  },
  {
    title: "CSS Formatter / Minifier",
    description: "Format CSS, minify styles, remove comments, and copy output.",
    href: "/css-formatter",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "JavaScript Formatter / Minifier",
    description: "Beautify, format, minify, and copy JavaScript code.",
    href: "/javascript-formatter",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON instantly in your browser.",
    href: "/json-formatter",
    icon: <Braces className="h-5 w-5" />,
  },
];

const imageTools = [
  {
    title: "Image Converter",
    description: "Convert PNG, JPG, and WebP images directly in your browser.",
    href: "/image-converter",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Image Resizer",
    description:
      "Resize single or multiple images with aspect ratio and quality controls.",
    href: "/image-resizer",
    icon: <ImageDown className="h-5 w-5" />,
  },
  {
    title: "Image Cropper",
    description: "Crop images by coordinates and download the cropped result.",
    href: "/image-cropper",
    icon: <ImagePlus className="h-5 w-5" />,
  },
  {
    title: "Image Watermark",
    description:
      "Add text or logo watermarks to images with position, opacity, and batch support.",
    href: "/image-watermark-tool",
    icon: <ImagePlus className="h-5 w-5" />,
  },
  {
    title: "Background Remover",
    description: "Remove image backgrounds and download transparent PNG files.",
    href: "/background-remover",
    icon: <ImagePlus className="h-5 w-5" />,
  },
];

const toolCategories = [
  {
    title: "Conversion tools",
    description:
      "Convert Markdown, HTML, YAML, JSON, CSV, and Excel-compatible files.",
    icon: <FileCode2 className="h-7 w-7" />,
    gradient: "from-violet-500/20 to-fuchsia-500/10",
    tools: conversionTools,
  },
  {
    title: "Formatter & minifier",
    description:
      "Clean, format, minify, validate, and copy developer-friendly outputs.",
    icon: <Code2 className="h-7 w-7" />,
    gradient: "from-cyan-500/20 to-blue-500/10",
    tools: formatterTools,
  },
  {
    title: "Image tools",
    description:
      "Convert, resize, crop, watermark, and remove backgrounds from images.",
    icon: <ImagePlus className="h-7 w-7" />,
    gradient: "from-purple-500/20 to-pink-500/10",
    tools: imageTools,
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
      className="group rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.04]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition group-hover:bg-violet-500/20">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ToolCategorySection({
  title,
  description,
  icon,
  gradient,
  tools,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  tools: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
  }>;
}) {
  return (
    <section
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6",
        "shadow-[0_24px_80px_rgba(0,0,0,0.22)]",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start gap-4">
        <div
          className={[
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-violet-200 ring-1 ring-white/10",
            gradient,
          ].join(" ")}
        >
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {tools.map((tool) => (
          <CategoryToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </section>
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

      {/* Main tools */}
      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Popular tools
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Quick access to your most used utilities.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mainTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      {/* Category cards */}
      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Tool categories
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Related tools are grouped inside clean category cards.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {toolCategories.map((category) => (
            <ToolCategorySection key={category.title} {...category} />
          ))}
        </div>
      </section>
    </Container>
  );
}