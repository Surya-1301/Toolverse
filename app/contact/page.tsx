"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bug,
  Clock,
  FileQuestion,
  Flag,
  LifeBuoy,
  Mail,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/Container";

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

const SUPPORT_EMAIL = "support.toolversee@gmail.com";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Contact | Toolverse";
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name || !email || !subject || !message) {
      setError("Please complete all fields before continuing.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const body = [
      "TOOLVERSE CONTACT REQUEST",
      "========================================",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
      "",
      "========================================",
      "Sent from the Toolverse Contact page.",
    ].join("\n");

    const mailto =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(`[Toolverse Contact] ${subject}`)}` +
      `&body=${encodeURIComponent(body)}`;

    setStatus("Your email application is opening. Review the message and click Send to complete delivery.");
    window.location.href = mailto;
  }

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
                support.toolversee@gmail.com
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

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Clicking Send opens your email app with the message prepared.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {status && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <span className="mt-0.5">✓</span>
              <span>{status}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-slate-200">
                  Name
                </label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-slate-200">
                Subject
              </label>
              <input
                id="contact-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-slate-200">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={7}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                placeholder="Describe your question, feedback, or issue..."
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Mail className="h-4 w-4" />
              Open Email to Send
            </button>
          </form>
        </section>

        <div className="mt-8 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6 text-sm leading-6 text-violet-100">
          <p className="font-semibold text-white">Need to report abuse?</p>
          <p className="mt-2 text-violet-100/80">
            If your message involves harmful content, phishing, malware,
            impersonation, copyright concerns, or private information exposed in
            a public link, use the abuse report flow.
          </p>

          <Link
            href="/report-abuse"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Flag className="h-4 w-4" />
            Report abuse
          </Link>
        </div>
      </div>
    </Container>
  );
}
