import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Report Abuse",
  description: "Report abuse, harmful content, or policy issues on Toolverse.",
};

export default function ReportAbusePage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-300 ring-1 ring-red-400/20">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <p className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1.5 text-sm text-red-200">
          Safety
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Report abuse
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          If you find harmful, illegal, malicious, or abusive content hosted on
          Toolverse, please report it.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">
          What to include
        </h2>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-400">
          <li>The Toolverse URL you are reporting.</li>
          <li>A short explanation of the issue.</li>
          <li>Any relevant context that helps us review the report.</li>
        </ul>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-5">
          <p className="text-sm text-slate-400">
            Email reports to:
          </p>

          <a
            href="mailto:abuse@toolverse.dev"
            className="mt-2 inline-flex text-lg font-semibold text-violet-300 hover:text-violet-200"
          >
            abuse@toolverse.dev
          </a>
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          For urgent legal or safety matters, include “Urgent” in the email
          subject.
        </p>
      </div>
    </Container>
  );
}