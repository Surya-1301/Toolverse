import type { Metadata } from "next";
import Link from "next/link";
import {
  Gauge,
  LockKeyhole,
  MonitorSmartphone,
} from "lucide-react";

import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Toolverse - Free Online Tools for Developers and Creators",
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
   HOME PAGE
   ========================================================================== */

export default function Home() {
  return (
    <section className="relative overflow-hidden">

      {/* ================================================================
          BACKGROUND GLOW
      ================================================================= */}

      <div
        className="
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
          py-20
          text-center
          sm:py-28
        "
      >

        {/* ================================================================
            BADGE
        ================================================================= */}

        <p
          className="
            mx-auto
            mb-4
            inline-flex
            rounded-full
            border
            border-violet-400/30
            bg-violet-500/10
            px-4
            py-1.5
            text-sm
            text-violet-200
          "
        >
          Fast, free, privacy-friendly online tools
        </p>

        {/* ================================================================
            HERO TITLE
        ================================================================= */}

        <h1
          className="
            mx-auto
            max-w-4xl
            text-4xl
            font-bold
            tracking-tight
            sm:text-6xl
          "
        >
          Your everyday utility toolkit for the web.
        </h1>

        {/* ================================================================
            HERO DESCRIPTION
        ================================================================= */}

        <p
          className="
            mx-auto
            mt-6
            max-w-2xl
            text-base
            leading-8
            text-slate-300
            sm:text-lg
          "
        >
          Toolverse gives developers, creators, and everyday users clean
          tools for formatting, generating, compressing, hosting, sharing,
          and shortening.
        </p>

        {/* ================================================================
            HERO BUTTON
        ================================================================= */}

        <div
          className="
            mt-8
            flex
            flex-col
            justify-center
            gap-3
            sm:flex-row
          "
        >
          <Link
            href="/tools"
            className="
              rounded-xl
              bg-violet-600
              px-6
              py-3
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-violet-600/20
              transition
              hover:bg-violet-500
            "
          >
            Explore tools
          </Link>
        </div>

        {/* ================================================================
            FEATURED CARDS
        ================================================================= */}

        <div
          className="
            mx-auto
            mt-12
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

                {/* ========================================================
                    BACKGROUND GLOW
                ======================================================== */}

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

                {/* ========================================================
                    DESKTOP VERSION

                    Existing desktop layout:
                    ICON
                    TITLE
                    DESCRIPTION
                ======================================================== */}

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

                  <h3
                    className="
                      text-base
                      font-semibold
                      text-white
                    "
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-400
                    "
                  >
                    {feature.description}
                  </p>
                </div>

                {/* ========================================================
                    MOBILE VERSION

                    EXACTLY:

                    ┌────────────────────────────────────┐
                    │                                    │
                    │  ┌─────────┐                      │
                    │  │         │  Browser-first tools │
                    │  │  ICON   │                      │
                    │  │         │  Use fast utilities  │
                    │  └─────────┘  designed to work    │
                    │               instantly with a     │
                    │               clean, focused       │
                    │               interface.           │
                    │                                    │
                    └────────────────────────────────────┘
                ======================================================== */}

                <div
                  className="
                    relative
                    flex
                    items-start
                    gap-4
                    sm:hidden
                  "
                >

                  {/* ======================================================
                      MOBILE ICON
                  ====================================================== */}

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

                  {/* ======================================================
                      MOBILE TITLE + DESCRIPTION
                  ====================================================== */}

                  <div
                    className="
                      min-w-0
                      flex-1
                      pt-1
                    "
                  >

                    {/* Title */}

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

                    {/* Description */}

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