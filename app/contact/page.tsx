import type { Metadata } from "next";
import Link from "next/link";
import {
  Bug,
  Clock,
  FileQuestion,
  Flag,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Contact | Toolverse",
  description:
    "Contact Toolverse for support, feedback, bug reports, partnerships, or content-related questions.",
};

const contactOptions = [
  {
    title: "General support",
    description:
      "Questions about using tools, creating links, uploads, downloads, or basic troubleshooting.",
    icon: LifeBuoy,
  },
  {
    title: "Bug reports",
    description:
      "Report broken pages, upload issues, incorrect tool output, or unexpected errors.",
    icon: Bug,
  },
  {
    title: "Product feedback",
    description:
      "Share suggestions for improving Toolverse or request new utilities.",
    icon: Sparkles,
  },
  {
    title: "Policy questions",
    description:
      "Ask about privacy, terms, content removal, or how sharing tools work.",
    icon: FileQuestion,
  },
];

const responseNotes = [
  {
    title: "Include relevant details",
    description:
      "Add the tool name, page URL, error message, browser, device, and steps to reproduce the issue.",
    icon: MessageSquare,
  },
  {
    title: "Security or abuse reports",
    description:
      "For harmful content, phishing, malware, or privacy concerns, use the Report Abuse page for faster triage.",
    icon: ShieldAlert,
  },
  {
    title: "Response times",
    description:
      "We review messages as quickly as possible, but response times may vary depending on volume and urgency.",
    icon: Clock,
  },
];

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-6 shadow-2xl shadow-black/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
                Support
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Contact Toolverse
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
                Need help, found a bug, or have feedback? Use this page to find
                the right way to contact us.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400 lg:max-w-sm">
              For abuse, malware, phishing, illegal content, or urgent safety
              issues, please use the dedicated Report Abuse page.
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {contactOptions.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h2 className="text-base font-semibold text-white">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
              <Mail className="h-5 w-5" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-white">
              Contact information
            </h2>
          </div>

          <div className="space-y-4 text-base leading-8 text-slate-300">
            <p>
              For general inquiries, support, feedback, or product questions,
              contact the Toolverse team using your preferred support channel.
            </p>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-500">Recommended email format</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-200">
                suppport.toolversee@gmail.com
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Replace this address with your real support email before
                publishing if needed.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {responseNotes.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
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

        <div className="mt-8 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6 text-sm leading-6 text-violet-100">
          <p className="font-semibold text-white">Need to report abuse?</p>
          <p className="mt-2 text-violet-100/80">
            If your message involves harmful content, phishing, malware,
            impersonation, copyright concerns, or private information exposed in
            a public link, use the abuse report flow.
          </p>

          <Link
            href="/report-abuse"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Flag className="h-4 w-4" />
            Report abuse
          </Link>
        </div>
      </div>
    </Container>
  );
}
