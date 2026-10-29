"use client";

import {
  ArrowRight,
  Code2,
  Download,
  FileCode2,
  FilePenLine,
  FileUp,
  ImageDown,
  ImagePlus,
  Images,
  Link2,
  MapPin,
  QrCode,
  Text,
  Type,
  Wrench,
  Sparkles,
  Clapperboard,
} from "lucide-react";
import Link from "next/link";

import { Container } from "../../components/Container";
import { ToolCard } from "../../components/ToolCard";

/* ==========================================================================
   POPULAR TOOLS
   ========================================================================== */

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
    description:
      "Upload images or files and get temporary shareable links.",
    href: "/file-share",
    icon: <FileUp className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Image & PDF Compressor",
    description:
      "Compress images and PDF files with simple quality controls.",
    href: "/image-compressor",
    icon: <ImageDown className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Paste",
    description:
      "Share text and code snippets with quick, clean links.",
    href: "/paste",
    icon: <Text className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "URL Shortener",
    description:
      "Turn long URLs into short, memorable links.",
    href: "/url-shortener",
    icon: <Link2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Background Remover",
    description:
      "Remove image backgrounds and download transparent PNG files.",
    href: "/background-remover",
    icon: <ImagePlus className="h-6 w-6" />,
    status: "live" as const,
  },
{
    title: "YouTube Downloader",
    description:
      "Download YouTube videos and audio in multiple resolutions and formats.",
    href: "/youtube-downloader",
    icon: <Clapperboard className="h-6 w-6" />,
  },
  {
    title: "Fake Address Generator",
    description:
      "Generate realistic fake addresses with user profiles (name, email, phone) for testing.",
    href: "/fake-address-generator",
    icon: <MapPin className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "QR Generator",
    description:
      "Create downloadable QR codes for links, text, and files.",
    href: "/qr-generator",
    icon: <QrCode className="h-6 w-6" />,
    status: "live" as const,
  },
];

/* ==========================================================================
   TOOL CATEGORIES
   ========================================================================== */

const categoryCards = [

  {
    title: "Download Tools",
    description:
      "Download YouTube videos, music, Instagram reels, and convert audio — all from your browser.",
    href: "/tools/download-tools",
    icon: <Download className="h-7 w-7" />,
    status: "live" as const,
  },
  {
    title: "Image Tools",
    description:
      "Convert, resize, crop, watermark, blur, upscale, and remove image backgrounds.",
    href: "/tools/image-tools",
    icon: <Images className="h-7 w-7" />,
    status: "live" as const,
  },

  {
    title: "Conversion Tools",
    description:
      "Convert Markdown, HTML, YAML, JSON, CSV, and Excel-compatible files.",
    href: "/tools/conversion-tools",
    icon: <FileCode2 className="h-7 w-7" />,
    status: "live" as const,
  },

  {
    title: "Formatter & Minifier",
    description:
      "Format, validate, minify, clean, and copy developer-friendly code outputs.",
    href: "/tools/formatter-tools",
    icon: <Sparkles className="h-7 w-7" />,
    status: "live" as const,
  },

  {
    title: "Text Tools",
    description:
      "Count, transform, compare, convert, and generate placeholder text with ease.",
    href: "/tools/text-tools",
    icon: <Type className="h-7 w-7" />,
    status: "live" as const,
  },

  {
    title: "Developer Tools",
    description:
      "Generate UUIDs, passwords, hashes, Base64, JWTs, validate data, test APIs, and more.",
    href: "/tools/developer-tools",
    icon: <Wrench className="h-7 w-7" />,
    status: "live" as const,
  },
];

/* ==========================================================================
   CATEGORY CARD
   ========================================================================== */

function CategoryToolCard({
  title,
  description,
  href,
  icon,
  status = "live",
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status?: "live" | "soon";
}) {
  const isLive = status === "live";

  return (
    <Link
      href={href}
      className="apple-glass group relative block overflow-hidden rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15 max-sm:rounded-2xl"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* ================================================================
          DESKTOP VERSION
          Existing desktop design remains unchanged
      ================================================================= */}

      <div className="hidden p-5 sm:block">
        {/* Icon + Status */}

        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20">
            {icon}
          </div>

          <span
            className={
              isLive
                ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/25"
                : "rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/25"
            }
          >
            {isLive ? "Live" : "Coming soon"}
          </span>
        </div>

        {/* Title */}

        <h2 className="text-lg font-bold tracking-tight text-white light:text-slate-900">
          {title}
        </h2>

        {/* Description */}

        <p className="mt-3 min-h-[60px] text-sm leading-5 text-slate-400 light:text-slate-600">
          {description}
        </p>

        {/* Action */}

        <div
          className={
            isLive
              ? "mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300"
              : "mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
          }
        >
          {isLive ? "View tools" : "Launching soon"}

          <ArrowRight
            className={
              isLive
                ? "h-4 w-4 transition group-hover:translate-x-1"
                : "h-4 w-4"
            }
          />
        </div>
      </div>

      {/* ================================================================
          MOBILE VERSION
          
          EXACT STRUCTURE:
          
          ┌────────────────────────────────────┐
          │                                    │
          │  ┌─────────┐             Live      │
          │  │         │                       │
          │  │  ICON   │  Background Remover   │
          │  │         │                       │
          │  └─────────┘  Remove image         │
          │               backgrounds and      │
          │               download transparent │
          │               PNG files.           │
          │                                    │
          │  View tools  →                     │
          └────────────────────────────────────┘
      ================================================================= */}

      <div className="sm:hidden p-3.5">
        {/* ==============================================================
            TOP AREA
        ============================================================== */}

        <div className="relative flex items-start gap-3">
          {/* ============================================================
              ICON
          ============================================================ */}

          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 [&>svg]:h-5 [&>svg]:w-5"
          >
            {icon}
          </div>

          {/* ============================================================
              TITLE + DESCRIPTION
          ============================================================ */}

          <div
            className="min-w-0 flex-1 pr-14"
          >
            {/* Title */}

            <h2
              className="text-[15px] font-bold leading-snug tracking-tight text-white light:text-slate-900"
            >
              {title}
            </h2>

            {/* Description */}

            <p
              className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2 light:text-slate-600"
            >
              {description}
            </p>
          </div>

          {/* ============================================================
              LIVE STATUS
          ============================================================ */}

          <span
            className={
              isLive
                ? "absolute right-0 top-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/25"
                : "absolute right-0 top-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/25"
            }
          >
            {isLive ? "Live" : "Coming soon"}
          </span>
        </div>

        {/* ==============================================================
            MOBILE ACTION
        ============================================================== */}

        <div
          className={
            isLive
              ? "mt-3 flex items-center gap-1.5 text-xs font-medium text-sky-400"
              : "mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500"
          }
        >
          {isLive ? "View tools" : "Launching soon"}

          <ArrowRight
            className={
              isLive
                ? "h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                : "h-3.5 w-3.5"
            }
          />
        </div>
      </div>
    </Link>
  );
}

/* ==========================================================================
   TOOLS PAGE
   ========================================================================== */

export default function ToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Explore all tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Browse all available Toolverse tools for formatting, generating,
          compressing, organizing, editing, converting, securing, hosting,
          sharing, and shortening.
        </p>
      </div>

      {/* ================================================================
          POPULAR TOOLS
      ================================================================= */}

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white light:text-slate-900">
            Popular tools
          </h2>
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <ToolCard
              key={tool.title}
              {...tool}
            />
          ))}
        </div>
      </section>

      {/* ================================================================
          TOOL CATEGORIES
      ================================================================= */}

      <section className="mt-14">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white light:text-slate-900">
            Tool categories
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {categoryCards.map((category) => (
            <CategoryToolCard
              key={category.title}
              {...category}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}