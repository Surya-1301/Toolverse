import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "ToolverseX - Free Online Tools for Developers and Creators",
  description:
    "Use free online tools like JSON Formatter, QR Generator, Image Compressor, Paste, URL Shortener, Image Host, and File Share.",
};

export default function Home() {
  return (
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
          ToolverseX gives developers, creators, and everyday users clean tools
          for formatting, generating, compressing, hosting, sharing, and
          shortening.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/tools"
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
          >
            Explore tools
          </Link>

        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">Browser-first</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Many tools run locally on your device.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">No signup needed</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Open a tool and start using it instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">Made for speed</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Lightweight utilities with clean UI.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}