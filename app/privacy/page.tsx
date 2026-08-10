import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Privacy Policy | Toolverse",
  description:
    "Toolverse Privacy Policy explaining how personal data is collected, used, protected, stored, and deleted in accordance with applicable law.",
};

const lastUpdated = "August 10, 2026";

const supportEmail = "support.toolversee@gmail.com";

/* ==========================================================================
   PRIVACY HIGHLIGHTS
   ========================================================================== */

const highlights = [
  {
    title: "Privacy-First",
    description:
      "Many Toolverse tools are designed to process content directly in your browser whenever server processing is not required.",
    icon: ShieldCheck,
  },
  {
    title: "DPDP Aligned",
    description:
      "Our privacy practices are designed with the Digital Personal Data Protection Act, 2023 and applicable DPDP Rules in mind.",
    icon: Scale,
  },
  {
    title: "Your Privacy Rights",
    description:
      "Subject to applicable law, you may request access, correction, erasure, consent withdrawal, or grievance redressal.",
    icon: UserCheck,
  },
];

/* ==========================================================================
   PRIVACY POLICY SECTIONS
   ========================================================================== */

const sections = [
  {
    number: "01",
    title: "Introduction",
    icon: FileText,
    content: [
      "Toolverse provides online utilities for working with PDFs, files, images, text, links, and other digital content.",
      "This Privacy Policy explains how Toolverse may process personal data when you visit or use the website, use our tools, upload or share content, contact us, or submit a privacy or abuse report.",
      "Toolverse aims to process personal data in a lawful, fair, transparent, and purpose-limited manner.",
      "For users in India, this policy is intended to address the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Digital Personal Data Protection Rules, 2025 (DPDP Rules), to the extent applicable and in force.",
    ],
  },

  {
    number: "02",
    title: "Personal Data We Collect",
    icon: Database,
    content: [
      "The type of personal data processed depends on the Toolverse feature you use.",
      "We may process information such as your name, email address, contact information, technical information, device information, IP or network information, timestamps, diagnostic information, and information you voluntarily provide.",
      "If you use file-sharing or hosting features, the information may include files, PDFs, images, text, URLs, filenames, file sizes, expiry settings, and related identifiers.",
      "We aim to collect and process only the information reasonably necessary for the relevant purpose.",
      "You should not submit passwords, authentication codes, financial credentials, Aadhaar numbers, PAN numbers, medical records, or other highly sensitive information unless it is genuinely necessary.",
    ],
  },

  {
    number: "03",
    title: "How We Use Personal Data",
    icon: CheckCircle2,
    content: [
      "Toolverse may process personal data to provide and operate requested services.",
      "We may use information to respond to support requests, privacy requests, and abuse reports.",
      "We may also process technical information for security, fraud prevention, troubleshooting, service reliability, performance monitoring, and improvement.",
      "Where consent is required, Toolverse aims to obtain consent for a specific and informed purpose.",
      "Personal data will not intentionally be used for unrelated purposes unless another lawful basis or applicable legal requirement permits the processing.",
    ],
  },

  {
    number: "04",
    title: "Browser-First Processing",
    icon: ShieldCheck,
    content: [
      "Many Toolverse utilities are designed to perform processing directly in your browser.",
      "When a feature operates entirely in your browser, the content entered into that feature may remain on your device and may not be transmitted to Toolverse.",
      "However, some services require server-side processing. This can include file sharing, image hosting, paste sharing, URL shortening, or other link-based services.",
      "The actual processing method depends on the particular Toolverse feature you use.",
      "Where server-side processing is required, the relevant content may be transmitted to and processed by Toolverse infrastructure or service providers used to operate the feature.",
    ],
  },

  {
    number: "05",
    title: "Consent, Notice & Your Choices",
    icon: KeyRound,
    content: [
      "Where processing is based on consent, Toolverse aims to obtain consent through a clear affirmative action for a specified purpose.",
      "Where applicable, you may withdraw consent using the method provided by Toolverse or by contacting us.",
      "Withdrawal of consent does not affect processing that was lawfully carried out before withdrawal.",
      "If a particular feature requires personal data to function, withdrawing consent may prevent continued use of that feature.",
      "Where applicable law requires a privacy notice, Toolverse aims to explain what personal data is being requested, why it is required, and how you can exercise applicable rights.",
    ],
  },

  {
    number: "06",
    title: "Your Privacy Rights",
    icon: UserCheck,
    content: [
      "Subject to applicable law and its conditions, you may have rights concerning your personal data.",
      "These may include requesting access to information about processing, correction or completion of inaccurate personal data, and erasure of personal data where legally applicable.",
      "Where processing is based on consent, you may also have the ability to withdraw that consent.",
      "You may submit a privacy grievance if you believe your personal data has been processed improperly.",
      "Where applicable, you may also exercise other rights available to a Data Principal under the DPDP framework.",
      "Toolverse may require reasonable information to verify a request before disclosing, correcting, or deleting personal data.",
    ],
  },

  {
    number: "07",
    title: "Security & Data Breaches",
    icon: LockKeyhole,
    content: [
      "Toolverse uses reasonable technical and organisational measures appropriate to the risks associated with the personal data it processes.",
      "Security measures may include access controls, authentication controls, encryption or other protective technologies, monitoring, logging, backups, software maintenance, and security procedures.",
      "No internet service can guarantee absolute security, so users should avoid submitting unnecessary sensitive information.",
      "If Toolverse becomes aware of a personal data breach, we will take appropriate steps to investigate, contain, mitigate, and remediate the incident.",
      "Where required by applicable law, Toolverse will provide notifications to the relevant authority and affected Data Principals in the manner and within the timelines prescribed by law.",
    ],
  },

  {
    number: "08",
    title: "Storage, Sharing & Retention",
    icon: Server,
    content: [
      "Some Toolverse features require content to be stored on servers so that a shareable link or other service can be provided.",
      "If you intentionally create a public or shareable resource, people who obtain the relevant link may be able to access the information depending on the feature.",
      "You are responsible for ensuring that you have the necessary rights and permissions to upload or share content.",
      "Toolverse does not intend to retain personal data indefinitely.",
      "Information may be retained for as long as reasonably necessary for the purpose for which it was collected, security, fraud prevention, dispute resolution, legal compliance, or other lawful purposes.",
      "Where applicable, shared files or content may automatically expire and be deleted according to the feature's retention settings.",
    ],
  },

  {
    number: "09",
    title: "Children, Third Parties & Legal Compliance",
    icon: Scale,
    content: [
      "Where the DPDP Act provisions relating to children apply, Toolverse will handle children's personal data subject to the applicable statutory requirements.",
      "Toolverse will not knowingly undertake prohibited tracking, behavioural monitoring, or targeted advertising involving children where such conduct is restricted by applicable law.",
      "Toolverse may use third-party infrastructure or service providers for hosting, storage, security, analytics, communication, or other operational purposes.",
      "Where third parties process personal data on behalf of Toolverse, appropriate contractual and technical safeguards are intended to be used as required by applicable law.",
      "Toolverse may disclose information where necessary to comply with applicable law, lawful government requests, court orders, security requirements, fraud prevention, or enforcement of its Terms of Use.",
      "Third-party websites and services linked from Toolverse operate under their own privacy policies.",
    ],
  },

  {
    number: "10",
    title: "Privacy Requests, Grievances & Contact",
    icon: Mail,
    content: [
      "You can contact Toolverse regarding personal-data access, correction, deletion, consent withdrawal, privacy concerns, or grievances.",
      `Privacy requests may be sent to ${supportEmail}.`,
      "When submitting a privacy request, provide enough information for Toolverse to understand and process the request, but do not unnecessarily include sensitive personal information.",
      "Toolverse may request reasonable identity verification before acting on a privacy request.",
      "We aim to handle privacy requests and grievances according to applicable law and the applicable provisions of the DPDP Act and DPDP Rules.",
      "If applicable law provides a statutory escalation or complaint mechanism, your right to use that mechanism remains unaffected.",
      "Toolverse may update this Privacy Policy when its services, data practices, security measures, or legal obligations change.",
    ],
  },
];

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function PrivacyPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-6 shadow-2xl shadow-black/10 sm:p-8">

          <div>
            <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
              Privacy & Data Protection
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Privacy Policy
            </h1>

            <p className="mt-4 text-base text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* ================================================================
              PRIVACY HIGHLIGHTS
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
            DPDP NOTICE
        ================================================================ */}

        <section className="mt-8 rounded-3xl border border-blue-400/10 bg-blue-500/[0.04] p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <Scale className="mt-1 h-6 w-6 shrink-0 text-blue-400" />

            <div>

              <h2 className="text-lg font-semibold text-white">
                Digital Personal Data Protection
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Toolverse is designed with the principles of the Digital
                Personal Data Protection Act, 2023 and the Digital Personal
                Data Protection Rules, 2025 in mind. The Act and Rules have
                phased commencement provisions, so statutory rights,
                obligations, procedures, and timelines apply to the extent
                that the relevant provisions are in force and applicable to
                the processing concerned.
              </p>

            </div>

          </div>

        </section>

        {/* ================================================================
            10 PRIVACY POINTS
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
            PRIVACY REQUEST BOX
        ================================================================ */}

        <section className="mt-8 rounded-3xl border border-violet-400/10 bg-violet-500/[0.04] p-6 sm:p-8">

          <div className="flex items-start gap-4">

            <UserCheck className="mt-1 h-6 w-6 shrink-0 text-violet-300" />

            <div>

              <h2 className="text-xl font-bold text-white">
                Need to make a privacy request?
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                You can contact Toolverse for privacy questions, personal-data
                requests, consent withdrawal, corrections, deletion requests,
                or privacy grievances.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
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
              This Privacy Policy describes Toolverse&apos;s intended privacy
              practices and should be read together with the Terms of Use.
              It does not constitute legal advice. The applicability of
              particular provisions of the Digital Personal Data Protection
              Act, 2023 and Digital Personal Data Protection Rules, 2025 may
              depend on their commencement, the nature of the processing, and
              other requirements under applicable law.
            </p>

          </div>

        </footer>

      </div>
    </Container>
  );
}