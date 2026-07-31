import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Terms of Use | Toolverse",
  description:
    "Read the Toolverse Terms of Use for browser-first tools, uploads, shared links, acceptable use, and service limitations.",
};

const lastUpdated = "July 31, 2026";

const highlights = [
  {
    title: "Use tools responsibly",
    description:
      "Toolverse tools are provided for lawful, safe, and respectful use.",
    icon: UserCheck,
  },
  {
    title: "Shared links are public",
    description:
      "If you create a public link, anyone with that link may be able to access the shared content.",
    icon: Globe,
  },
  {
    title: "No misuse or abuse",
    description:
      "Do not use Toolverse for malware, phishing, spam, illegal content, or harmful activity.",
    icon: ShieldCheck,
  },
];

const sections = [
  {
    title: "1. Acceptance of these terms",
    icon: CheckCircle2,
    content: [
      "These Terms of Use govern your access to and use of Toolverse, including our browser-based tools, upload features, sharing links, hosted content pages, and related services.",
      "By using Toolverse, you agree to these Terms. If you do not agree, you should not use the service.",
      "You are responsible for ensuring that your use of Toolverse complies with applicable laws and these Terms.",
    ],
  },
  {
    title: "2. Description of the service",
    icon: FileText,
    content: [
      "Toolverse provides lightweight utilities for tasks such as formatting JSON, generating QR codes, compressing images or PDFs, creating pastes, shortening URLs, uploading files, and sharing content.",
      "Some tools may operate directly in your browser, while others may require server processing or storage to provide features such as public links or downloadable files.",
      "We may add, change, limit, suspend, or remove tools or features at any time.",
    ],
  },
  {
    title: "3. Browser-first and local tools",
    icon: LockKeyhole,
    content: [
      "Some Toolverse tools are designed to process data locally in your browser. Local processing can reduce the need to upload content to our servers.",
      "Browser-first functionality may depend on your device, browser, file size, and available system resources.",
      "Even where local processing is used, you are responsible for reviewing outputs before relying on them.",
    ],
  },
  {
    title: "4. Uploaded and shared content",
    icon: UploadCloud,
    content: [
      "When you upload files, images, PDFs, text, URLs, or other content to create a shareable link, Toolverse may store that content so the link can work.",
      "You must have the necessary rights and permissions to upload, share, or distribute any content you submit.",
      "Public links may be accessible by anyone who has the link. Do not upload sensitive, confidential, private, regulated, or restricted content unless you understand and accept the sharing behavior of the tool.",
    ],
  },
  {
    title: "5. Acceptable use",
    icon: ShieldCheck,
    content: [
      "You agree not to use Toolverse to upload, host, share, generate, distribute, or link to content that is illegal, abusive, threatening, harmful, defamatory, infringing, deceptive, or otherwise objectionable.",
      "You may not use Toolverse to distribute malware, phishing material, spam, scams, credential theft pages, harmful scripts, or content designed to compromise systems or users.",
      "You may not attempt to bypass limits, disrupt the service, scrape aggressively, overload infrastructure, reverse engineer protected systems, or interfere with other users.",
    ],
  },
  {
    title: "6. Content moderation and removal",
    icon: Ban,
    content: [
      "We may remove, restrict, disable, or block access to content or activity that appears to violate these Terms, creates risk, receives abuse reports, or may harm Toolverse or its users.",
      "We may investigate reported content using technical signals, metadata, logs, user reports, and other available information.",
      "We are not obligated to monitor all content, but we reserve the right to act when needed to operate, secure, or protect the service.",
    ],
  },
  {
    title: "7. Expiry, deletion, and availability",
    icon: Clock,
    content: [
      "Some tools may provide expiry settings or temporary links. Expired content may become unavailable or be deleted.",
      "We may delete inactive, expired, unsupported, abusive, illegal, or high-risk content at any time.",
      "We do not guarantee that any uploaded file, paste, shortened URL, generated link, or hosted page will remain available permanently.",
    ],
  },
  {
    title: "8. Intellectual property",
    icon: Scale,
    content: [
      "You retain ownership of content you submit, subject to the rights needed for Toolverse to provide the requested functionality.",
      "By submitting content, you grant Toolverse a limited right to store, process, display, transmit, and make that content available as necessary to operate the tool or shared link you requested.",
      "Toolverse, including its branding, interface, design, and software, is protected by applicable intellectual property laws.",
    ],
  },
  {
    title: "9. No professional advice",
    icon: AlertTriangle,
    content: [
      "Toolverse provides general-purpose utilities and does not provide legal, financial, medical, security, or professional advice.",
      "You are responsible for validating outputs, generated content, compressed files, formatted data, shortened links, and any other results before relying on them.",
      "Use Toolverse at your own discretion and risk.",
    ],
  },
  {
    title: "10. Disclaimers and limitations",
    icon: AlertTriangle,
    content: [
      "Toolverse is provided on an “as is” and “as available” basis without warranties of any kind, to the fullest extent permitted by law.",
      "We do not guarantee uninterrupted availability, error-free operation, permanent storage, perfect accuracy, compatibility with every file, or recovery of lost content.",
      "To the fullest extent permitted by law, Toolverse will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of data, revenue, profits, goodwill, or business opportunities.",
    ],
  },
  {
    title: "11. Changes to these terms",
    icon: FileText,
    content: [
      "We may update these Terms from time to time to reflect changes to our tools, legal requirements, or operational practices.",
      "When we make updates, we will revise the “Last updated” date on this page.",
      "Your continued use of Toolverse after changes are posted means you accept the updated Terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-6 shadow-2xl shadow-black/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
                Legal
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Terms of Use
              </h1>

              <p className="mt-4 text-base text-slate-400">
                Last updated: {lastUpdated}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400 lg:max-w-sm">
              These terms explain how Toolverse may be used, what content is
              allowed, and how shared links, uploads, and hosted files are
              handled.
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h2 className="text-sm font-semibold text-white">
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

        <div className="mt-8 space-y-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h2 className="text-xl font-semibold tracking-tight text-white">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3 text-base leading-8 text-slate-300">
                  {section.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6 text-sm leading-6 text-violet-100">
          <p className="font-semibold text-white">Plain-language summary</p>
          <p className="mt-2 text-violet-100/80">
            Use Toolverse responsibly. If you create public links or upload
            files, people with those links may access the content. Do not use
            the service for illegal, harmful, abusive, or infringing activity.
          </p>

          <Link
            href="/report-abuse"
            className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Report abuse
          </Link>
        </div>
      </div>
    </Container>
  );
}