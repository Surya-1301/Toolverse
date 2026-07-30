import type { Metadata } from "next";
import { Mail, MessageSquare, Sparkles } from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Toolverse for support, feedback, bug reports, or tool suggestions.",
};

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
          <Mail className="h-7 w-7" />
        </div>

        <p className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          Contact
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Get in touch
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Have feedback, found a bug, or want to suggest a new tool? Send us a
          message.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        <a
          href="mailto:support@toolverse.dev"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/60 hover:bg-white/[0.06]"
        >
          <Mail className="h-6 w-6 text-violet-300" />
          <h2 className="mt-4 font-semibold">Support</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Need help using Toolverse?
          </p>
          <p className="mt-3 text-sm text-violet-300">
            support@toolverse.dev
          </p>
        </a>

        <a
          href="mailto:feedback@toolverse.dev"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/60 hover:bg-white/[0.06]"
        >
          <MessageSquare className="h-6 w-6 text-violet-300" />
          <h2 className="mt-4 font-semibold">Feedback</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Suggest improvements or report issues.
          </p>
          <p className="mt-3 text-sm text-violet-300">
            feedback@toolverse.dev
          </p>
        </a>

        <a
          href="mailto:hello@toolverse.dev"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/60 hover:bg-white/[0.06]"
        >
          <Sparkles className="h-6 w-6 text-violet-300" />
          <h2 className="mt-4 font-semibold">General</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Questions, ideas, or partnerships.
          </p>
          <p className="mt-3 text-sm text-violet-300">
            hello@toolverse.dev
          </p>
        </a>
      </div>
    </Container>
  );
}