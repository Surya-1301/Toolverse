import type { Metadata } from "next";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  EyeOff,
  FileText,
  Globe,
  LockKeyhole,
  Mail,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Privacy Policy | Toolverse",
  description:
    "Read the Toolverse Privacy Policy to understand how our browser-first tools, uploads, logs, and shared content are handled.",
};

const lastUpdated = "July 31, 2026";

const highlights = [
  {
    title: "Browser-first by design",
    description:
      "Where possible, tools process your input locally in your browser instead of sending it to our servers.",
    icon: ShieldCheck,
  },
  {
    title: "No account required",
    description:
      "Most tools can be used without creating an account or providing personal details.",
    icon: LockKeyhole,
  },
  {
    title: "Shared content is intentional",
    description:
      "Uploads, pastes, shortened links, and shared files may be stored only when needed to provide a shareable link.",
    icon: Globe,
  },
];

const sections = [
  {
    title: "1. Overview",
    icon: FileText,
    content: [
      "Toolverse provides lightweight online utilities for formatting, generating, compressing, uploading, sharing, and shortening content.",
      "This Privacy Policy explains what information may be processed when you use Toolverse, how that information is used, and the choices you have.",
      "By using Toolverse, you agree to the practices described in this policy.",
    ],
  },
  {
    title: "2. Browser-first tools",
    icon: ShieldCheck,
    content: [
      "Many Toolverse tools are designed to work directly in your browser. Examples may include JSON formatting, QR generation, image compression, and similar utilities.",
      "When a tool runs locally, your input is processed on your device and is not uploaded to our servers for that processing.",
      "Some features require server processing or storage to work, such as creating public links, hosting images, sharing files, saving pastes, or shortening URLs.",
    ],
  },
  {
    title: "3. Information you provide",
    icon: Database,
    content: [
      "You may provide content when using features such as Paste, Upload & Share, Image Host, File Share, URL Shortener, or similar tools.",
      "Depending on the feature, submitted content may include text, URLs, images, PDFs, files, metadata such as file names and file sizes, and related technical details.",
      "We use this information only to provide the requested tool functionality, such as generating a shareable page, storing a temporary file, or serving a download link.",
    ],
  },
  {
    title: "4. Uploaded and shared content",
    icon: Server,
    content: [
      "When you upload or share content, that content may be stored so Toolverse can make it available through the generated link.",
      "Anyone with a public share link may be able to view or download the content, depending on the tool used.",
      "You should avoid uploading sensitive, confidential, private, or legally restricted content unless you are comfortable with the access model shown by the tool.",
    ],
  },
  {
    title: "5. Logs and analytics",
    icon: BarChart3,
    content: [
      "We may collect basic technical information to operate, secure, and improve Toolverse.",
      "This may include browser type, device type, referring page, approximate location derived from network information, pages visited, timestamps, error logs, and performance data.",
      "We use this information to monitor reliability, troubleshoot issues, understand usage patterns, prevent abuse, and improve the service.",
    ],
  },
  {
    title: "6. Cookies and local storage",
    icon: EyeOff,
    content: [
      "Toolverse may use cookies, local storage, or similar browser technologies to remember preferences, support tool functionality, improve performance, or maintain basic session behavior.",
      "You can usually control cookies and local storage through your browser settings.",
      "Disabling these technologies may affect how some tools work.",
    ],
  },
  {
    title: "7. Retention and expiry",
    icon: Clock,
    content: [
      "Some shared content may include an expiry option. When content expires, Toolverse may remove it or make it unavailable.",
      "We may also delete inactive, expired, abusive, illegal, or unsupported content at any time.",
      "Local browser-first tool inputs are generally not retained by us unless a feature explicitly requires upload, storage, or link generation.",
    ],
  },
  {
    title: "8. Security",
    icon: LockKeyhole,
    content: [
      "We use reasonable technical and organizational measures to protect Toolverse and the data needed to operate it.",
      "No online service can guarantee absolute security, so you should use caution when uploading or sharing content.",
      "If you believe you found a security issue or abusive content, please report it using the Report Abuse or Contact links.",
    ],
  },
  {
    title: "9. Abuse prevention",
    icon: AlertTriangle,
    content: [
      "We may review, restrict, remove, or block content or activity that appears abusive, harmful, illegal, spammy, malicious, or in violation of our terms.",
      "We may use technical signals, reports, and logs to investigate abuse and protect the service and its users.",
      "Public sharing tools should not be used to distribute malware, phishing pages, illegal material, private data without permission, or harmful content.",
    ],
  },
  {
    title: "10. Your choices",
    icon: Trash2,
    content: [
      "You can choose not to use tools that require uploading or storing content.",
      "Where expiry settings are available, you can choose a shorter retention period.",
      "If you need help with content removal or privacy-related questions, contact us using the contact information below.",
    ],
  },
  {
    title: "11. Changes to this policy",
    icon: FileText,
    content: [
      "We may update this Privacy Policy from time to time to reflect changes in our tools, practices, legal requirements, or operational needs.",
      "When we make changes, we will update the “Last updated” date on this page.",
      "Your continued use of Toolverse after changes are posted means you accept the updated policy.",
    ],
  },
  {
    title: "12. Contact",
    icon: Mail,
    content: [
      "If you have questions about this Privacy Policy, want to report an issue, or need help with content removal, please contact Toolverse through the Contact or Report Abuse pages.",
    ],
  },
];

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>

              <p className="mt-4 text-base text-slate-400">
                Last updated: {lastUpdated}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400 lg:max-w-sm">
              Toolverse is built around simple, fast, privacy-conscious tools.
              This policy explains when data stays in your browser and when it
              may be stored to power sharing features.
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
      </div>
    </Container>
  );
}