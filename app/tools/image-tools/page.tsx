"use client";

import { ArrowLeft, ArrowRight, ImageDown, ImagePlus } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "Image Converter",
    description: "Convert PNG, JPG, and WebP images directly in your browser.",
    href: "/image-converter",
    icon: <ImageDown className="h-6 w-6" />,
  },
  {
    title: "Image Resizer",
    description:
      "Resize single or multiple images with aspect ratio and quality controls.",
    href: "/image-resizer",
    icon: <ImageDown className="h-6 w-6" />,
  },
  {
    title: "Image Cropper",
    description: "Crop images by coordinates and download the cropped result.",
    href: "/image-cropper",
    icon: <ImagePlus className="h-6 w-6" />,
  },
  {
    title: "Image Watermark",
    description:
      "Add text or logo watermarks with position, opacity, and batch support.",
    href: "/image-watermark-tool",
    icon: <ImagePlus className="h-6 w-6" />,
  },
  {
    title: "Background Remover",
    description: "Remove image backgrounds and download transparent PNG files.",
    href: "/background-remover",
    icon: <ImagePlus className="h-6 w-6" />,
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

export default function ImageToolsPage() {
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
          Image Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert, resize, crop, watermark, and remove backgrounds.
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