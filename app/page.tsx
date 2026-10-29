import type { Metadata } from "next";
import Link from "next/link";
import {
  Gauge,
  LockKeyhole,
  MonitorSmartphone,
} from "lucide-react";

import { Container } from "@/components/Container";
import SmartInput from "@/components/SmartInput";

export const metadata: Metadata = {
  title: "Toolverse - All-in-one online utility tools.",
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
      {/* ====================================================================
          BACKGROUND GLOW (Apple Aurora Ambient Lighting)
      ==================================================================== */}

      <div
        className="pointer-events-none absolute left-1/2 -top-24 -z-0 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-sky-500/15 blur-[120px]"
      />

      <div
        className="pointer-events-none absolute right-0 top-36 -z-0 h-[360px] w-[460px] rounded-full bg-cyan-500/10 blur-[130px]"
      />

      <Container
        className="relative py-16 text-center sm:py-20 lg:py-24"
      >
        {/* ==================================================================
            BADGE
        ================================================================== */}

        <p
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-md shadow-sm light:border-sky-600/20 light:bg-sky-500/10 light:text-sky-700"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          Fast, free, privacy-friendly online tools
        </p>

        {/* ==================================================================
            HERO TITLE
        ================================================================== */}

        <h1
          className="mx-auto mt-6 max-w-5xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:mt-7 sm:text-6xl lg:text-7xl light:text-slate-900"
        >
          Your everyday utility toolkit for the web.
        </h1>

        {/* ==================================================================
            HERO DESCRIPTION
        ================================================================== */}

        <p
          className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 light:text-slate-700"
        >
          Toolverse gives developers, creators, and everyday users clean tools
          for formatting, generating, compressing, hosting, sharing, and
          shortening.
        </p>

        {/* ==================================================================
            SMART INPUT
            PRIMARY ACTION
        ================================================================== */}

        <div className="mx-auto mt-8 w-full max-w-3xl">
          <SmartInput />
        </div>

        {/* ==================================================================
            EXPLORE ALL TOOLS
            SECONDARY ACTION
        ================================================================== */}

        <div className="mt-6 flex justify-center">
          <Link
            href="/tools"
            className="apple-pill-btn inline-flex min-h-11 items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all duration-200 active:scale-[0.98]"
          >
            Explore all tools
          </Link>
        </div>

        {/* ==================================================================
            FEATURED CARDS
        ================================================================== */}

        <div
          className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="apple-glass group relative overflow-hidden rounded-3xl p-6 text-left shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/40 max-sm:p-5 light:shadow-slate-900/5"
              >
                {/* Specular Top Reflection Line */}
                <div className="apple-specular" />

                {/* ==========================================================
                    CARD BACKGROUND GLOW
                ========================================================== */}

                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl transition group-hover:bg-sky-500/20"
                />

                {/* ==========================================================
                    DESKTOP VERSION
                ========================================================== */}

                <div className="relative hidden sm:block">
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-6 w-6"
                    />
                  </div>

                  <h2 className="text-base font-semibold text-white light:text-slate-900">
                    {feature.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600">
                    {feature.description}
                  </p>
                </div>

                {/* ==========================================================
                    MOBILE VERSION
                ========================================================== */}

                <div
                  className="relative flex items-start gap-4 sm:hidden"
                >
                  <div
                    className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-9 w-9"
                    />
                  </div>

                  <div
                    className="min-w-0 flex-1 pt-1"
                  >
                    <h2
                      className="text-[20px] font-bold leading-[1.3] tracking-tight text-white light:text-slate-900"
                    >
                      {feature.title}
                    </h2>

                    <p
                      className="mt-3 text-[16px] leading-7 text-slate-400 light:text-slate-600"
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

