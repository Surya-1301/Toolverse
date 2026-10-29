"use client";

import { BackButton } from "@/components/BackButton";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/Container";

export default function PasswordStrengthCheckerPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools/developer-tools" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Password Strength Checker
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          This tool has been merged into the <strong>Password Generator</strong>.
        </p>

        <div className="mt-8 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6">
          <div className="flex items-center gap-3 text-sky-300">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-lg font-semibold text-white light:text-slate-900">
                All strength analysis is now in the Password Generator
              </p>
              <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                Generate a password and see entropy, crack times, requirements, and suggestions instantly.
              </p>
            </div>
          </div>

          <Link
            href="/password-generator"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Open Password Generator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Container>
  );
}