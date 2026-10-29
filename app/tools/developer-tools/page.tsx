"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Braces,
  Clock,
  Fingerprint,
  Globe2,
  Hash,
  KeyRound,
  Link2,
  LockKeyhole,
  MapPin,
  Network,
  Send,
  ShieldCheck,
  Shuffle,
  Tags,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";

const tools = [
  {
    title: "IP Address Lookup",
    description:
      "See your public IP address with location, network, and timezone details.",
    href: "/ip-lookup",
    icon: <Network className="h-6 w-6" />,
  },
  {
    title: "Credit Card Generator",
    description:
      "Generate test cards (number, expiry, name, CVV) or validate any card's checksum and brand.",
    href: "/credit-card-generator",
    icon: <WalletCards className="h-6 w-6" />,
  },
  {
    title: "Fake Address Generator",
    description:
      "Generate realistic fake addresses with full user profiles (name, email, phone) for testing with multiple locale presets.",
    href: "/fake-address-generator",
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    title: "UUID Generator",
    description: "Generate UUID v4 values in bulk and copy all results.",
    href: "/uuid-generator",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    title: "Password Generator",
    description:
      "Create secure passwords with length, symbols, ambiguity filtering, and strength checks.",
    href: "/password-generator",
    icon: <KeyRound className="h-6 w-6" />,
  },
  {
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text.",
    href: "/hash-generator",
    icon: <Fingerprint className="h-6 w-6" />,
  },
  {
    title: "Random String Generator",
    description:
      "Generate random strings with custom character sets, length, and quantity.",
    href: "/random-string-generator",
    icon: <Shuffle className="h-6 w-6" />,
  },
  {
    title: "Base64 Encoder / Decoder",
    description:
      "Convert text and files to Base64, or decode Base64 back to text and files.",
    href: "/base64-encoder-decoder",
    icon: <Braces className="h-6 w-6" />,
  },
  {
    title: "JWT Decoder",
    description:
      "Decode JWT header and payload locally, inspect expiry, and avoid server upload.",
    href: "/jwt-decoder",
    icon: <LockKeyhole className="h-6 w-6" />,
  },
  {
    title: "Timestamp Converter",
    description:
      "Convert Unix timestamps to dates, dates to Unix timestamps, and view timezones.",
    href: "/timestamp-converter",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    title: "URL Tools",
    description:
      "Parse URL components, encode or decode text, and trace redirect chains in one place.",
    href: "/url-tools",
    icon: <Link2 className="h-6 w-6" />,
  },
  {
    title: "Domain Lookup",
    description:
      "Query DNS records or look up WHOIS ownership, registrar, status, and dates in one place.",
    href: "/domain-lookup",
    icon: <Globe2 className="h-6 w-6" />,
  },
  {
    title: "API Tester",
    description:
      "Full-featured API client — build requests with params, headers, auth, and body. Save to collections and view history.",
    href: "/http-request-tester",
    icon: <Send className="h-6 w-6" />,
  },
  {
    title: "Email, Phone & IBAN Validator",
    description:
      "Validate emails, phone numbers, and IBANs in one private, local tool.",
    href: "/email-phone-iban-validator",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    title: "Meta Tag Generator",
    description:
      "Generate SEO meta tags, Open Graph and Twitter cards with live Google and social previews.",
    href: "/meta-tag-generator",
    icon: <Tags className="h-6 w-6" />,
  },
  {
    title: "robots.txt Generator",
    description:
      "Build crawl rules, crawl delays and sitemaps, then download a ready robots.txt file.",
    href: "/robots-txt-generator",
    icon: <Bot className="h-6 w-6" />,
  },
];

function RelatedToolCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="apple-glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-sky-500/15 max-sm:rounded-[22px] max-sm:p-4.5"
    >
      <div className="apple-specular opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-4 max-sm:gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10 transition group-hover:scale-105 group-hover:text-sky-200 light:text-sky-600 light:border-sky-500/20 max-sm:h-[54px] max-sm:w-[54px] max-sm:rounded-[18px] max-sm:[&>svg]:h-6 max-sm:[&>svg]:w-6">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white light:text-slate-900 max-sm:text-[17px] max-sm:leading-snug">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600 max-sm:mt-1.5 max-sm:text-[13.5px] max-sm:leading-relaxed max-sm:line-clamp-2">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 max-sm:mt-4 max-sm:text-[13.5px]">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 max-sm:h-4 max-sm:w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DeveloperToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl light:text-slate-900">
          Developer Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Generate UUIDs, passwords, hashes, Base64, JWTs, validate data, test APIs, and more.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <RelatedToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </Container>
  );
}

