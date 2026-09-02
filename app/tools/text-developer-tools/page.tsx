"use client";

import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  AudioLines,
  Banknote,
  Braces,
  Clock,
  Fingerprint,
  Gauge,
  GitCompare,
  GitMerge,
  Globe2,
  Hash,
  KeyRound,
  Link2,
  LockKeyhole,
  MapPin,
  Network,
  Palette,
  Percent,
  Regex,
  Send,
  ShieldCheck,
  Shuffle,
  TextCursorInput,
  TextQuote,
  CaseSensitive,
  WalletCards,
  Waves,
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
      "Generate realistic fake addresses for testing with multiple locale presets.",
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
    title: "Base64 Encoder / Decoder",
    description:
      "Convert text and files to Base64, or decode Base64 back to text and files.",
    href: "/base64-encoder-decoder",
    icon: <Braces className="h-6 w-6" />,
  },
  {
    title: "URL Encode / Decode",
    description:
      "Encode and decode text for safe use in URLs and query strings.",
    href: "/url-encode-decode",
    icon: <Percent className="h-6 w-6" />,
  },
  {
    title: "JWT Decoder",
    description:
      "Decode JWT header and payload locally, inspect expiry, and avoid server upload.",
    href: "/jwt-decoder",
    icon: <LockKeyhole className="h-6 w-6" />,
  },
  {
    title: "Lorem Ipsum Generator",
    description:
      "Generate classic placeholder text as paragraphs, sentences, or words with optional HTML tags.",
    href: "/lorem-ipsum-generator",
    icon: <TextQuote className="h-6 w-6" />,
  },
  {
    title: "URL Parser",
    description:
      "Parse protocol, domain, path, query params, hash, and copy formatted results.",
    href: "/url-parser",
    icon: <Link2 className="h-6 w-6" />,
  },
  {
    title: "Text Counter",
    description:
      "Count words, characters, letters, numbers, spaces, punctuation, sentences, paragraphs, lines, and reading time — all in one place.",
    href: "/text-counter",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    title: "Case Converter",
    description: "Convert text to uppercase, lowercase, title case, sentence case, camelCase, snake_case.",
    href: "/case-converter",
    icon: <CaseSensitive className="h-6 w-6" />,
  },
  {
    title: "Regex Tester",
    description:
      "Test regex patterns with flags, match highlighting, and match details.",
    href: "/regex-tester",
    icon: <Regex className="h-6 w-6" />,
  },
  {
    title: "Timestamp Converter",
    description:
      "Convert Unix timestamps to dates, dates to Unix timestamps, and view timezones.",
    href: "/timestamp-converter",
    icon: <Clock className="h-6 w-6" />,
  },
  
  {
    title: "Color Converter",
    description:
      "Convert HEX, RGB, and HSL colors with preview and palette generation.",
    href: "/color-converter",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    title: "SSL Certificate Checker",
    description:
      "Look up SSL/TLS certificates for any domain and check validity and expiry.",
    href: "/ssl-checker",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    title: "Duplicate Line Remover",
    description:
      "Remove duplicate or blank lines from text and copy the cleaned result.",
    href: "/duplicate-line-remover",
    icon: <GitMerge className="h-6 w-6" />,
  },
  {
    title: "Password Strength Checker",
    description:
      "Analyze a password's entropy, crack time, and how to make it stronger.",
    href: "/password-strength-checker",
    icon: <Gauge className="h-6 w-6" />,
  },
  {
    title: "Text to Speech",
    description:
      "Turn text into spoken audio using your browser's built-in voice engine.",
    href: "/text-to-speech",
    icon: <AudioLines className="h-6 w-6" />,
  },
  {
    title: "Audio Converter",
    description:
      "Convert audio between MP3, WAV, and WebM right in your browser.",
    href: "/audio-converter",
    icon: <Waves className="h-6 w-6" />,
  },
  {
    title: "URL Redirect Checker",
    description:
      "Trace every redirect a URL makes and find where it finally lands.",
    href: "/url-redirect-checker",
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
    title: "Random String Generator",
    description:
      "Generate random strings with custom character sets, length, and quantity.",
    href: "/random-string-generator",
    icon: <Shuffle className="h-6 w-6" />,
  },
  {
    title: "Text Compare / Diff",
    description:
      "Compare two blocks of text side by side and see added, removed, and unchanged lines.",
    href: "/text-compare",
    icon: <GitCompare className="h-6 w-6" />,
  },
  
  {
    title: "IBAN Validator",
    description:
      "Validate IBANs from 70+ countries with structure and mod-97 checksum checks.",
    href: "/iban-validator",
    icon: <Banknote className="h-6 w-6" />,
  },
  {
    title: "Email & Phone Validator",
    description:
      "Check if an email address or phone number is well-formed, all locally.",
    href: "/email-phone-validator",
    icon: <AtSign className="h-6 w-6" />,
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
      className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open tool
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TextDeveloperToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Text and Developer Tools
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Count and transform text, generate UUIDs and passwords, hash text, encode Base64, decode JWTs, test regex, convert timestamps, parse URLs, and convert colors.
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