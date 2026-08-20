import type { Metadata } from "next";
import Link from "next/link";
import {
  FileUp,
  Gauge,
  Hash,
  ImageDown,
  KeyRound,
  LockKeyhole,
  MonitorSmartphone,
  QrCode,
  Type,
} from "lucide-react";

import { Container } from "@/components/Container";
import SmartInput from "@/components/SmartInput";

export const metadata: Metadata = {
  title: "Toolverse - All-in-one online utility tools",
  description:
    "Use free online tools like JSON Formatter, QR Generator, Image Compressor, Paste, URL Shortener, Image Host, and File Share.",
};

/* ==========================================================================
   FEATURED CARDS
========================================================================== */

const features = [
  {
    title: "Browser-first tools",
    description:
      "Use fast utilities designed to work instantly with a clean, focused interface.",
    icon: MonitorSmartphone,
  },
  {
    title: "No account required",
    description:
      "Open any tool and start working right away without signup or unnecessary steps.",
    icon: LockKeyhole,
  },
  {
    title: "Built for speed",
    description:
      "Lightweight workflows help you format, compress, upload, and share faster.",
    icon: Gauge,
  },
];

/* ==========================================================================
   POPULAR TOOLS (Static for SEO crawlability)
========================================================================== */

const popularTools = [
  {
    title: "JSON Formatter",
    description: "Format, validate, and beautify JSON data instantly.",
    href: "/json-formatter",
    icon: Type,
  },
  {
    title: "QR Generator",
    description: "Create downloadable QR codes for links, text, and files.",
    href: "/qr-generator",
    icon: QrCode,
  },
  {
    title: "Image Compressor",
    description: "Compress images in your browser with quality controls.",
    href: "/image-compressor",
    icon: ImageDown,
  },
  {
    title: "File Share",
    description: "Upload images or files and get temporary shareable links.",
    href: "/file-share",
    icon: FileUp,
  },
  {
    title: "Password Generator",
    description: "Generate strong, secure passwords instantly.",
    href: "/password-generator",
    icon: KeyRound,
  },
  {
    title: "Hash Generator",
    description: "Create MD5, SHA-1, SHA-256 hashes from any text.",
    href: "/hash-generator",
    icon: Hash,
  },
];

/* ==========================================================================
   HOME PAGE
========================================================================== */

export default function Home() {
  return (
    <section className="relative overflow-hidden">
      {/* ====================================================================
          BACKGROUND GLOW
      ==================================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          -z-0
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-violet-600/30
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-32
          -z-0
          h-72
          w-72
          rounded-full
          bg-fuchsia-600/10
          blur-3xl
        "
      />

      <Container
        className="
          relative
          py-16
          text-center
          sm:py-20
          lg:py-24
        "
      >
        {/* ==================================================================
            BADGE
        ================================================================== */}

        <p
          className="
            mx-auto
            inline-flex
            rounded-full
            border
            border-violet-400/30
            bg-violet-500/10
            px-4
            py-1.5
            text-sm
            font-medium
            text-violet-200
          "
        >
          Fast, free, privacy-friendly online tools
        </p>

        {/* ==================================================================
            HERO TITLE
        ================================================================== */}

        <h1
          className="
            mx-auto
            mt-6
            max-w-5xl
            text-4xl
            font-bold
            leading-[1.05]
            tracking-tight
            text-white
            sm:mt-7
            sm:text-6xl
            lg:text-7xl
          "
        >
          Your everyday utility toolkit for the web.
        </h1>

        {/* ==================================================================
            HERO DESCRIPTION
        ================================================================== */}

        <p
          className="
            mx-auto
            mt-6
            max-w-3xl
            text-base
            leading-7
            text-slate-300
            sm:text-lg
            sm:leading-8
          "
        >
          Toolverse gives developers, creators, and everyday users clean tools
          for formatting, generating, compressing, hosting, sharing, and
          shortening.
        </p>

        {/* ==================================================================
            SMART INPUT
            Primary hero interaction
        ================================================================== */}

        <div className="mx-auto mt-8 w-full max-w-3xl sm:mt-9">
          <SmartInput />
        </div>

        {/* ==================================================================
            POPULAR TOOLS (Static for SEO crawlability)
        ================================================================== */}

        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Popular tools
          </h2>
          <p className="mt-3 text-base text-slate-400">
            The most used free online tools — all browser-based, no signup required.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-violet-500/50 hover:bg-white/[0.05]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition group-hover:bg-violet-500">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ==================================================================
            EXPLORE ALL TOOLS
        ================================================================== */}

        <div className="mt-10 flex justify-center">
          <Link
            href="/tools"
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              bg-violet-600
              px-7
              py-3.5
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-violet-600/20
              transition-all
              duration-200
              hover:bg-violet-500
              hover:shadow-violet-500/30
              focus:outline-none
              focus:ring-2
              focus:ring-violet-400/50
              focus:ring-offset-2
              focus:ring-offset-slate-950
            "
          >
            Explore all tools
          </Link>
        </div>

        {/* ==================================================================
            FEATURED CARDS
        ================================================================== */}

        <div
          className="
            mx-auto
            mt-14
            grid
            max-w-5xl
            gap-5
            md:grid-cols-3
          "
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/10
                  bg-gradient-to-b
                  from-white/[0.06]
                  to-white/[0.025]
                  p-6
                  text-left
                  shadow-2xl
                  shadow-black/10
                  transition
                  hover:-translate-y-1
                  hover:border-violet-400/40
                  max-sm:rounded-[28px]
                  max-sm:p-5
                "
              >
                {/* ==========================================================
                    CARD BACKGROUND GLOW
                ========================================================== */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    -top-10
                    h-28
                    w-28
                    rounded-full
                    bg-violet-500/10
                    blur-2xl
                    transition
                    group-hover:bg-violet-500/20
                  "
                />

                {/* ==========================================================
                    DESKTOP VERSION
                ========================================================== */}

                <div className="relative hidden sm:block">
                  {/* Icon */}

                  <div
                    className="
                      mb-5
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-violet-600/15
                      text-violet-300
                      ring-1
                      ring-violet-400/20
                      transition
                      group-hover:scale-105
                      group-hover:bg-violet-600/25
                      group-hover:text-violet-200
                    "
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Title */}

                  <h3 className="text-base font-semibold text-white">
                    {feature.title}
                  </h3>

                  {/* Description */}

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </div>

                {/* ==========================================================
                    MOBILE VERSION
                ========================================================== */}

                <div
                  className="
                    relative
                    flex
                    items-start
                    gap-4
                    sm:hidden
                  "
                >
                  {/* Mobile Icon */}

                  <div
                    className="
                      flex
                      h-[76px]
                      w-[76px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-[23px]
                      bg-violet-600/20
                      text-violet-300
                      ring-1
                      ring-violet-400/20
                      transition
                      group-hover:scale-105
                      group-hover:bg-violet-600/25
                      group-hover:text-violet-200
                    "
                  >
                    <Icon className="h-9 w-9" />
                  </div>

                  {/* Mobile Content */}

                  <div
                    className="
                      min-w-0
                      flex-1
                      pt-1
                    "
                  >
                    <h3
                      className="
                        text-[20px]
                        font-bold
                        leading-[1.3]
                        tracking-tight
                        text-white
                      "
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="
                        mt-3
                        text-[16px]
                        leading-7
                        text-slate-400
                      "
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
} 