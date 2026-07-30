import type { Metadata } from "next";
import {
  Braces,
  FileUp,
  Image,
  ImageDown,
  Link2,
  QrCode,
  ScanText,
  Text,
} from "lucide-react";
import { Container } from "@/components/Container";
import { ToolCard } from "@/components/ToolCard";

export const metadata: Metadata = {
  title: "Toolverse - Free Online Tools for Developers and Creators",
  description:
    "Use free online tools like JSON Formatter, QR Generator, Image Compressor, Paste, URL Shortener, OCR, Image Host, and File Share.",
};

const tools = [
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON instantly in your browser.",
    href: "/json-formatter",
    icon: <Braces className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "QR Generator",
    description: "Create downloadable QR codes for links, text, and more.",
    href: "/qr-generator",
    icon: <QrCode className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "Image Compressor",
    description: "Compress images locally and reduce file size quickly.",
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
    title: "Image Host",
    description: "Upload images and get direct shareable links.",
    href: "/image-host",
    icon: <Image className="h-6 w-6" />,
    status: "soon" as const,
  },
  {
    title: "URL Shortener",
    description: "Turn long URLs into short, memorable links.",
    href: "/url-shortener",
    icon: <Link2 className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "OCR",
    description: "Extract text from screenshots, photos, and scanned images.",
    href: "/ocr",
    icon: <ScanText className="h-6 w-6" />,
    status: "soon" as const,
  },
  {
    title: "File Share",
    description: "Upload files and share temporary download links.",
    href: "/file-share",
    icon: <FileUp className="h-6 w-6" />,
    status: "soon" as const,
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute right-0 top-32 -z-0 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />

        <Container className="relative py-20 text-center sm:py-28">
          <p className="mx-auto mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
            Fast, free, privacy-friendly online tools
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Your everyday utility toolkit for the web.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Toolverse gives developers, creators, and everyday users clean tools
            for formatting, generating, compressing, sharing, and converting.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
            >
              Explore tools
            </a>

            <a
              href="/json-formatter"
              className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Try JSON Formatter
            </a>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Browser-first</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Many tools run locally on your device.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">
                No signup needed
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Open a tool and start using it instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">
                Made for speed
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Lightweight utilities with clean UI.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section id="tools" className="pb-20">
        <Container>
          <div className="mb-8">
            <h2 className="text-2xl font-bold sm:text-3xl">Tools</h2>
            <p className="mt-2 text-slate-400">
              Start with our live tools, with more utilities launching soon.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}