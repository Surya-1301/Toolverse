import {
  Braces,
  FilePenLine,
  FileUp,
  ImageDown,
  Link2,
  QrCode,
  Text,
} from "lucide-react";
import { Container } from "../../components/Container";
import { ToolCard } from "../../components/ToolCard";

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
    description: "Create downloadable QR codes for links, text, and files.",
    href: "/qr-generator",
    icon: <QrCode className="h-6 w-6" />,
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
    title: "PDF Editor",
    description:
      "Merge, split, extract, remove, scan, edit, convert, compress, and secure PDFs in one place.",
    href: "/pdf-editor",
    icon: <FilePenLine className="h-6 w-6" />,
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
    title: "Upload & Share",
    description: "Upload images or files and get temporary shareable links.",
    href: "/file-share",
    icon: <FileUp className="h-6 w-6" />,
    status: "live" as const,
  },
  {
    title: "URL Shortener",
    description: "Turn long URLs into short, memorable links.",
    href: "/url-shortener",
    icon: <Link2 className="h-6 w-6" />,
    status: "live" as const,
  },
];

export default function ToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          Toolverse utilities
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Explore all tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Browse all available Toolverse tools for formatting, generating,
          compressing, organizing, editing, converting, securing, hosting,
          sharing, and shortening.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </Container>
  );
}