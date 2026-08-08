"use client";

import { useState } from "react";
import {
  Braces,
  Code2,
  FileCode2,
  FilePenLine,
  FileUp,
  ImageDown,
  Link2,
  QrCode,
  Table2,
  Text,
} from "lucide-react";
import { Container } from "../../components/Container";
import { ToolCard } from "../../components/ToolCard";

const conversionTools = [
  {
    title: "Markdown to PDF",
    description: "Write Markdown with live preview and download it as a PDF.",
    href: "/markdown-to-pdf",
    icon: <FilePenLine className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Markdown to HTML",
    description: "Convert Markdown into clean HTML instantly in your browser.",
    href: "/markdown-to-html",
    icon: <FileCode2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "YAML ↔ JSON Converter",
    description: "Convert YAML to JSON or JSON to YAML with validation errors.",
    href: "/yaml-json-converter",
    icon: <Braces className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "CSV ↔ JSON Converter",
    description: "Convert CSV to JSON or JSON to CSV with upload/download.",
    href: "/csv-json-converter",
    icon: <Table2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Excel to CSV / CSV to Excel",
    description: "Convert CSV into Excel-compatible files and download results.",
    href: "/excel-csv-converter",
    icon: <Table2 className="h-6 w-6" />,
    status: "live" as const,
  },
];

const formatterTools = [
  {
    title: "HTML Formatter / Minifier",
    description: "Format, minify, validate tags, and copy HTML output.",
    href: "/html-formatter",
    icon: <FileCode2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "CSS Formatter / Minifier",
    description: "Format CSS, minify styles, remove comments, and copy output.",
    href: "/css-formatter",
    icon: <Code2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "JavaScript Formatter / Minifier",
    description: "Beautify, format, minify, and copy JavaScript code.",
    href: "/javascript-formatter",
    icon: <Code2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON instantly in your browser.",
    href: "/json-formatter",
    icon: <Braces className="h-6 w-6" />,
    status: "live" as const,
  },
];

const otherTools = [
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

type ToolTab = "conversion" | "formatter";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("conversion");

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

      {/* Main: Other tools (heading removed) */}
      <div className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>

      {/* Tabs: Conversion / Formatter (title/subtitle removed) */}
      <div className="mt-12">
        <div className="mb-5 flex justify-center sm:justify-end">
          <div className="inline-flex w-full rounded-2xl border border-white/10 bg-white/[0.03] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("conversion")}
              className={[
                "w-1/2 rounded-xl px-4 py-2 text-sm font-semibold transition sm:w-auto",
                activeTab === "conversion"
                  ? "bg-violet-600 text-white"
                  : "text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              Conversion
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("formatter")}
              className={[
                "w-1/2 rounded-xl px-4 py-2 text-sm font-semibold transition sm:w-auto",
                activeTab === "formatter"
                  ? "bg-violet-600 text-white"
                  : "text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              Formatter & minifier
            </button>
          </div>
        </div>

        {activeTab === "conversion" ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {conversionTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {formatterTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}