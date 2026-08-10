import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gavel,
  Globe2,
  LockKeyhole,
  Mail,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Terms of Use | Toolverse",
  description:
    "Terms of Use for Toolverse explaining acceptable use, user responsibilities, uploaded content, intellectual property, service availability, security, and legal terms.",
};

const lastUpdated = "August 10, 2026";

const supportEmail = "support.toolversee@gmail.com";

/* ==========================================================================
   TERMS HIGHLIGHTS
   ========================================================================== */

const highlights = [
  {
    title: "Use Responsibly",
    description:
      "Use Toolverse only for lawful purposes and do not misuse the service, upload harmful content, or interfere with its operation.",
    icon: ShieldCheck,
  },
  {
    title: "Your Content",
    description:
      "You remain responsible for the files, documents, images, text, links, and other content that you upload, process, or share.",
    icon: FileCheck2,
  },
  {
    title: "Privacy & Security",
    description:
      "Toolverse is designed with privacy and reasonable security practices in mind. Some tools process content locally in your browser.",
    icon: LockKeyhole,
  },
];

/* ==========================================================================
   TERMS OF USE SECTIONS
   ========================================================================== */

const sections = [
  {
    number: "01",
    title: "Acceptance of These Terms",
    icon: FileText,
    content: [
      "These Terms of Use govern your access to and use of the Toolverse website, tools, features, and related services.",
      "By accessing or using Toolverse, you agree to comply with these Terms of Use and applicable laws.",
      "If you do not agree with these Terms, you should not use the relevant Toolverse service.",
      "Toolverse may update these Terms when necessary to reflect changes to the service, legal requirements, security practices, or other operational matters.",
      "Your continued use of Toolverse after an updated version becomes effective may constitute acceptance of the revised Terms to the extent permitted by applicable law.",
    ],
  },

  {
    number: "02",
    title: "Eligibility & Lawful Use",
    icon: UserCheck,
    content: [
      "You may use Toolverse only in compliance with applicable laws and regulations.",
      "You are responsible for ensuring that your use of the service is lawful in the jurisdiction where you access or use it.",
      "You must not use Toolverse to facilitate fraud, identity theft, harassment, abuse, unauthorized access, infringement, malware distribution, or other unlawful activity.",
      "Where a particular Toolverse feature has additional eligibility or usage requirements, those requirements also apply.",
      "If you are using Toolverse on behalf of an organisation, you confirm that you have appropriate authority to do so.",
    ],
  },

  {
    number: "03",
    title: "Acceptable Use",
    icon: ShieldCheck,
    content: [
      "You agree not to misuse Toolverse or attempt to disrupt, damage, overload, or interfere with the website, infrastructure, APIs, security systems, or other users.",
      "You must not attempt to gain unauthorised access to accounts, systems, servers, databases, networks, or other protected resources.",
      "You must not use automated activity, scraping, bots, scripts, or other mechanisms in a manner that places unreasonable load on the service or bypasses technical restrictions.",
      "You must not use Toolverse to create, distribute, store, or process content that is unlawful or that violates the rights of others.",
      "Toolverse may restrict or suspend access where reasonably necessary to protect users, systems, security, legal compliance, or service availability.",
    ],
  },

  {
    number: "04",
    title: "Files, Content & User Responsibility",
    icon: FileCheck2,
    content: [
      "You remain responsible for the files, PDFs, images, documents, text, URLs, and other content that you submit to or process through Toolverse.",
      "You represent that you have the necessary rights, permissions, licences, or other legal authority to upload, process, modify, share, or distribute the content you provide.",
      "You must not upload or process content that you are prohibited from possessing, sharing, or processing under applicable law.",
      "You should maintain your own backup copies of important files because Toolverse does not guarantee permanent storage or recovery of submitted content.",
      "Where a Toolverse feature creates a public or shareable link, you are responsible for deciding what content you make accessible through that link.",
    ],
  },

  {
    number: "05",
    title: "Privacy & Personal Data",
    icon: LockKeyhole,
    content: [
      "Toolverse processes personal data according to its Privacy Policy and applicable data-protection requirements.",
      "Some Toolverse tools are designed to perform processing directly in the user's browser when server-side processing is not required.",
      "Other features may require information or content to be transmitted to Toolverse infrastructure or service providers in order to provide the requested functionality.",
      "You should avoid submitting unnecessary sensitive personal information into tools where it is not required for the requested service.",
      "Where applicable, personal-data processing is intended to be carried out in accordance with the Digital Personal Data Protection Act, 2023, the Digital Personal Data Protection Rules, 2025, and other applicable legal requirements.",
    ],
  },

  {
    number: "06",
    title: "Intellectual Property",
    icon: Globe2,
    content: [
      "The Toolverse website, branding, interface, software, design elements, logos, graphics, text, and other original materials may be protected by intellectual-property laws.",
      "Unless otherwise stated, Toolverse retains the rights it has in its own website, software, branding, and materials.",
      "These Terms do not transfer ownership of Toolverse intellectual property to you.",
      "You retain rights that you already have in content that you submit, subject to the rights and permissions necessary for Toolverse to provide the requested service.",
      "You must not copy, reproduce, modify, distribute, reverse engineer, sell, or commercially exploit Toolverse materials except where permitted by law or expressly authorised by Toolverse.",
    ],
  },

  {
    number: "07",
    title: "Security, Availability & Service Changes",
    icon: Wrench,
    content: [
      "Toolverse aims to maintain reasonable security and reliability measures appropriate to the nature of its services.",
      "However, no online service can guarantee uninterrupted availability, complete security, or error-free operation.",
      "Toolverse may perform maintenance, upgrades, security changes, feature changes, or infrastructure changes that temporarily affect availability.",
      "Toolverse may add, modify, suspend, or discontinue features where reasonably necessary.",
      "You acknowledge that internet connectivity, browsers, devices, third-party infrastructure, and other external factors can affect the availability or performance of the service.",
    ],
  },

  {
    number: "08",
    title: "Third-Party Services & Links",
    icon: Globe2,
    content: [
      "Toolverse may rely on third-party infrastructure, hosting, storage, communication, analytics, security, or other service providers to operate certain features.",
      "Some Toolverse pages may contain links to websites or services operated by third parties.",
      "Third-party services operate according to their own terms, policies, and practices.",
      "Toolverse is not responsible for the content, availability, security, or privacy practices of independent third-party websites or services.",
      "You should review the applicable terms and privacy policies before using a third-party service.",
    ],
  },

  {
    number: "09",
    title: "Suspension, Termination & Abuse Reporting",
    icon: UserX,
    content: [
      "Toolverse may restrict, suspend, or terminate access where reasonably necessary because of misuse, security concerns, unlawful activity, violation of these Terms, or legal requirements.",
      "Toolverse may investigate reports involving abuse, infringement, harmful content, security issues, fraud, or other violations.",
      "Users may report suspected abuse or misuse through the Report Abuse page.",
      "Toolverse may remove or restrict access to content where reasonably necessary to comply with applicable law, protect users, respond to valid complaints, or maintain service security.",
      "Nothing in this section limits rights or procedures that cannot lawfully be excluded under applicable law.",
    ],
  },

  {
    number: "10",
    title: "Disclaimers, Liability & Contact",
    icon: Scale,
    content: [
      "Toolverse is provided on an 'as available' and 'as is' basis to the maximum extent permitted by applicable law.",
      "Toolverse does not guarantee that every tool will always be available, accurate, uninterrupted, secure, or suitable for every particular purpose.",
      "You are responsible for reviewing the output of any Toolverse tool before relying on it for important, legal, financial, professional, or other consequential purposes.",
      "To the maximum extent permitted by applicable law, Toolverse will not be responsible for losses arising from misuse of the service, user-provided content, third-party services, internet failures, or circumstances outside Toolverse's reasonable control.",
      "Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited.",
      `For questions about these Terms, contact Toolverse at ${supportEmail}.`,
    ],
  },
];

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function TermsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-6 shadow-2xl shadow-black/10 sm:p-8">

          <div>
            <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
              Legal & Service Terms
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Terms of Use
            </h1>

            <p className="mt-4 text-base text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* ================================================================
              TERMS HIGHLIGHTS
          ================================================================ */}

          <div className="mt-8 grid gap-4 md:grid-cols-3">

            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition duration-200 hover:border-violet-400/20 hover:bg-slate-950/70"
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

        </header>

        {/* ================================================================
            IMPORTANT NOTICE
        ================================================================ */}

        <section className="mt-8 rounded-3xl border border-blue-400/10 bg-blue-500/[0.04] p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <Gavel className="mt-1 h-6 w-6 shrink-0 text-blue-400" />

            <div>

              <h2 className="text-lg font-semibold text-white">
                Important Legal Notice
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                These Terms are intended to establish the rules for using
                Toolverse and should be read together with the Privacy Policy.
                Nothing in these Terms is intended to remove or restrict a
                legal right or protection that cannot lawfully be excluded.
              </p>

            </div>

          </div>

        </section>

        {/* ================================================================
            10 TERMS
        ================================================================ */}

        <main className="mt-8 space-y-5">

          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.number}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-400/20 sm:p-8"
              >

                <div className="flex items-start gap-4">

                  {/* Number */}

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 text-sm font-bold text-violet-300 ring-1 ring-violet-400/20">
                    {section.number}
                  </div>

                  <div className="min-w-0 flex-1">

                    {/* Heading */}

                    <div className="flex items-center gap-3">

                      <Icon className="h-5 w-5 shrink-0 text-violet-300" />

                      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        {section.title}
                      </h2>

                    </div>

                    {/* Content */}

                    <div className="mt-5 space-y-3">

                      {section.content.map((paragraph, index) => (
                        <div
                          key={`${section.number}-${index}`}
                          className="flex items-start gap-3"
                        >

                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-violet-400" />

                          <p className="text-sm leading-7 text-slate-300 sm:text-base">
                            {paragraph}
                          </p>

                        </div>
                      ))}

                    </div>

                  </div>

                </div>

              </section>
            );
          })}

        </main>

        {/* ================================================================
            CONTACT / ABUSE SECTION
        ================================================================ */}

        <section className="mt-8 rounded-3xl border border-violet-400/10 bg-violet-500/[0.04] p-6 sm:p-8">

          <div className="flex items-start gap-4">

            <UserCheck className="mt-1 h-6 w-6 shrink-0 text-violet-300" />

            <div>

              <h2 className="text-xl font-bold text-white">
                Questions or concerns?
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Contact Toolverse if you have questions about these Terms,
                believe that your rights have been affected, or need to report
                suspected abuse or misuse of the service.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Mail className="h-4 w-4" />
                  Contact Toolverse
                </Link>

                <Link
                  href="/report-abuse"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Report Abuse
                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================================
            LEGAL NOTICE
        ================================================================ */}

        <footer className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">

          <div className="flex items-start gap-3">

            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <p className="text-xs leading-6 text-slate-500">
              These Terms of Use are provided for the operation of Toolverse
              and are not a substitute for legal advice. The interpretation
              and enforceability of particular provisions may depend on the
              applicable law, jurisdiction, nature of the service, and facts
              of a particular situation.
            </p>

          </div>

        </footer>

      </div>
    </Container>
  );
}