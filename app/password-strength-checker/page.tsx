"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/Container";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

export default function PasswordStrengthCheckerPage() {
  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Password Strength Checker
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          This tool has been merged into the <strong>Password Generator</strong>.
        </p>

        <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
          <div className="flex items-center gap-3 text-violet-300">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-lg font-semibold text-white">
                All strength analysis is now in the Password Generator
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Generate a password and see entropy, crack times, requirements, and suggestions instantly.
              </p>
            </div>
          </div>

          <Link
            href="/password-generator"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Open Password Generator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Container>
  );
}