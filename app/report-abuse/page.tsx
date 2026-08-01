import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  Bug,
  Copyright,
  Eye,
  FileWarning,
  Flag,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Report Abuse | Toolverse",
  description:
    "Report abuse, harmful content, phishing, malware, illegal files, copyright concerns, or exposed private information on Toolverse.",
};

const reportTypes = [
  {
    title: "Phishing or scams",
    description:
      "Links or files pretending to be another service, stealing credentials, or misleading users.",
    icon: ShieldAlert,
  },
  {
    title: "Malware or harmful files",
    description:
      "Downloads, scripts, documents, or links that may harm devices, systems, or users.",
    icon: Bug,
  },
  {
    title: "Illegal or harmful content",
    description:
      "Content that appears illegal, dangerous, abusive, exploitative, or otherwise harmful.",
    icon: Ban,
  },
  {
    title: "Private information",
    description:
      "Content exposing personal data, credentials, private documents, or sensitive information.",
    icon: LockKeyhole,
  },
  {
    title: "Copyright or ownership",
    description:
      "Content that appears to infringe copyrights, trademarks, or ownership rights.",
    icon: Copyright,
  },
  {
    title: "Impersonation or deception",
    description:
      "Content misrepresenting identity, affiliation, source, or intent.",
    icon: Eye,
  },
];

const requiredDetails = [
  {
    title: "The Toolverse link",
    description:
      "Include the full URL or file ID for the paste, upload, hosted file, image, or shortened link.",
    icon: FileWarning,
  },
  {
    title: "Reason for the report",
    description:
      "Explain what is wrong, why it is harmful, and whether immediate action is needed.",
    icon: AlertTriangle,
  },
  {
    title: "Supporting context",
    description:
      "Include screenshots, ownership details, legal context, or other evidence when available.",
    icon: ShieldCheck,
  },
];

export default function ReportAbusePage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-500/[0.08] to-white/[0.025] p-6 shadow-2xl shadow-black/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-200">
                Safety
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Report Abuse
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
                Use this page to report harmful, illegal, deceptive, abusive, or
                unsafe content hosted or shared through Toolverse.
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400 lg:max-w-sm">
              If someone is in immediate danger, contact local emergency
              services or the appropriate authorities first.
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-red-400/20 bg-slate-950/50 p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300 ring-1 ring-red-400/20">
                <Siren className="h-5 w-5" />
              </div>

              <h2 className="text-sm font-semibold text-white">
                Urgent reports
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Flag phishing, malware, exposed private data, or illegal
                content as clearly as possible.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                <Flag className="h-5 w-5" />
              </div>

              <h2 className="text-sm font-semibold text-white">
                Include the link
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Reports are easier to review when they include the exact
                Toolverse URL or content ID.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h2 className="text-sm font-semibold text-white">
                Reviewed carefully
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                We may review reported links, metadata, and technical signals to
                protect users and the service.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-red-300 ring-1 ring-white/10">
              <Flag className="h-5 w-5" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-white">
              What you can report
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
              <FileWarning className="h-5 w-5" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-white">
              What to include
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {requiredDetails.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm leading-6 text-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

            <div>
              <p className="font-semibold text-white">Important</p>
              <p className="mt-2 text-red-100/80">
                Report Abuse is for harmful, unsafe, illegal, or policy-violating
                content. For general questions or product feedback, use the
                Contact page instead.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300/20 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/10"
                >
                  <Mail className="h-4 w-4" />
                  Contact support
                </Link>

                <a
                href="mailto:suppport.toolveree@gmail.com?subject=Toolversee%20Abuse%20Report"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
               >
              <Flag className="h-4 w-4" />
                Email abuse report
               </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}