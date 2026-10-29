"use client";

import { BackButton } from "@/components/BackButton";

import {
  ArrowRight,
  ImageDown,
  ImagePlus,
  RectangleHorizontal,
  Shapes,
  Sparkles,
  SquareDashedBottom,
  ZoomIn,
} from "lucide-react";
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
    title: "Image Resizer & Cropper",
    description:
      "Resize single or multiple images with aspect ratio and quality controls, or crop by coordinates and aspect ratios.",
    href: "/image-resizer-cropper",
    icon: <ImageDown className="h-6 w-6" />,
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
  {
    title: "Favicon Generator",
    description:
      "Turn any image into every favicon size plus a ready-to-use manifest and HTML.",
    href: "/favicon-generator",
    icon: <SquareDashedBottom className="h-6 w-6" />,
  },
  {
    title: "OG Image Generator",
    description:
      "Create 1200×630 social share cards with custom text, colors, and logo.",
    href: "/og-image-generator",
    icon: <RectangleHorizontal className="h-6 w-6" />,
  },
  {
    title: "Blur Image",
    description:
      "Blur an entire photo or just a region to hide faces and sensitive details.",
    href: "/image-blur",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    title: "Image Upscaler",
    description:
      "Enlarge images up to 8× with smart interpolation and sharpening.",
    href: "/image-upscaler",
    icon: <ZoomIn className="h-6 w-6" />,
  },
  {
    title: "Image Placeholder",
    description:
      "Generate crisp placeholder images of any size with text and colors.",
    href: "/image-placeholder",
    icon: <Shapes className="h-6 w-6" />,
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
      className="apple-glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15 max-sm:rounded-[22px] max-sm:p-4.5"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4 max-sm:gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20 max-sm:h-[54px] max-sm:w-[54px] max-sm:rounded-[18px] max-sm:[&>svg]:h-6 max-sm:[&>svg]:w-6">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white light:text-slate-900 max-sm:text-[17px] max-sm:leading-snug">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600 max-sm:mt-1.5 max-sm:text-[13.5px] max-sm:leading-relaxed max-sm:line-clamp-2">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 max-sm:mt-4 max-sm:text-[13.5px]">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 max-sm:h-4 max-sm:w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ImageToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools" />
      </div>

      <div className="mx-auto mt-8 max-w-3xl text-center">

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Image Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
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