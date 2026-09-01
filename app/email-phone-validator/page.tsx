"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AtSign,
  ArrowLeft,
  BadgeCheck,
  BadgeX,
  Check,
  Copy,
  Eraser,
  Globe2,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   EMAIL VALIDATION
   ========================================================================== */

type EmailResult = {
  ok: boolean;
  user: string;
  domain: string;
  tld: string;
  issues: string[];
};

function validateEmail(value: string): EmailResult | null {
  const email = value.trim().toLowerCase();
  if (!email) return null;

  const issues: string[] = [];
  const atIndex = email.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === email.length - 1) {
    issues.push("An email needs a local part and a domain separated by '@'.");
  }

  const user = atIndex > 0 ? email.slice(0, atIndex) : "";
  const domain = atIndex > 0 ? email.slice(atIndex + 1) : "";

  if (domain.includes("@")) {
    issues.push("An email should contain only one '@' character.");
  }

  if (user.length > 64) issues.push("The local part is longer than 64 characters.");
  if (user.startsWith(".") || user.endsWith(".") || user.includes("..")) {
    issues.push("The local part cannot start/end with a dot or contain consecutive dots.");
  }

  const dot = domain.lastIndexOf(".");
  const tld = dot > 0 && dot < domain.length - 1 ? domain.slice(dot + 1) : "";
  if (dot <= 0 || dot >= domain.length - 1) {
    issues.push("The domain must contain a top-level domain (e.g. '.com').");
  }
  if (domain.includes("..")) issues.push("The domain contains consecutive dots.");
  if (tld && tld.length < 2) issues.push("The top-level domain is too short.");

  const ok = issues.length === 0;

  return { ok, user, domain, tld, issues };
}

/* ==========================================================================
   PHONE VALIDATION — basic E.164 + country-locale digit counts
   ========================================================================== */

type PhoneCheck = {
  ok: boolean;
  country: string | null;
  digits: string;
  issues: string[];
  e164: boolean;
};

// Known digit-count patterns (after removing common prefixes) per locale.
const PHONE_LOCALES: { key: string; label: string; flag: string; ranges: [number, number][] }[] = [
  { key: "US", label: "United States/Canada", flag: "🇺🇸", ranges: [[10, 10]] },
  { key: "GB", label: "United Kingdom", flag: "🇬🇧", ranges: [[10, 11]] },
  { key: "AU", label: "Australia", flag: "🇦🇺", ranges: [[9, 10]] },
  { key: "IN", label: "India", flag: "🇮🇳", ranges: [[10, 10]] },
  { key: "DE", label: "Germany", flag: "🇩🇪", ranges: [[9, 12]] },
  { key: "FR", label: "France", flag: "🇫🇷", ranges: [[9, 10]] },
  { key: "BR", label: "Brazil", flag: "🇧🇷", ranges: [[10, 11]] },
  { key: "Intl", label: "International (E.164)", flag: "🌐", ranges: [[7, 15]] },
];

function validatePhone(value: string): PhoneCheck | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  const issues: string[] = [];
  let working = digits;
  const isE164 = /^[1-9]\d{1,14}$/.test(digits);

  // Determine a likely country from common dial codes for nicer output.
  let country: string | null = null;
  if (/^(1)/.test(digits)) {
    country = "US";
    if (digits.length === 11) working = digits.slice(1);
  } else if (/^(44)/.test(digits)) {
    country = "GB";
  } else if (/^(61)/.test(digits)) {
    country = "AU";
  } else if (/^(91)/.test(digits)) {
    country = "IN";
  } else if (/^(49)/.test(digits)) {
    country = "DE";
  } else if (/^(33)/.test(digits)) {
    country = "FR";
  } else if (/^(55)/.test(digits)) {
    country = "BR";
  }

  // Match digit count against the guessed locale (or generic international range).
  const locale = country
    ? PHONE_LOCALES.find((p) => p.key === country)
    : PHONE_LOCALES.find((p) => p.key === "Intl");

  let lengthOk = false;
  if (locale) {
    lengthOk = locale.ranges.some(([min, max]) => working.length >= min && working.length <= max);
    if (country && working === digits && country !== "US" && /^[1-9]\d{6,}$/.test(working)) {
      // Heuristic: treat guessed country codes without removing a prefix loosely.
      lengthOk = lengthOk || working.length >= 7;
    }
  } else {
    lengthOk = working.length >= 7 && working.length <= 15;
  }

  if (working.length < 7) issues.push("Phone numbers usually need at least 7 digits.");
  if (working.length > 15) issues.push("Phone numbers have a maximum of 15 digits (E.164).");
  if (!lengthOk) issues.push("The digit count doesn't match the expected format for this number.");

  const ok = issues.length === 0;

  return { ok, country, digits, issues, e164: isE164 };
}

const EMAIL_EXAMPLES = [
  { label: "Valid", value: "hello@example.com" },
  { label: "Missing TLD", value: "hello@example" },
  { label: "Two @", value: "a@b@c.com" },
];

const PHONE_EXAMPLES = [
  { label: "US", value: "+1 (415) 555-0132" },
  { label: "UK", value: "+44 20 7946 0958" },
  { label: "Intl", value: "+972 50 123 4567" },
];

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

export default function EmailPhoneValidatorPage() {
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const emailResult = email ? validateEmail(email) : null;
  const phoneResult = phone ? validatePhone(phone) : null;

  async function copyResult() {
    const value = tab === "email" ? email : phone;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Email &amp; Phone Validator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Check whether an email address or phone number is well-formed —
          useful before forms, signups, and data cleanups.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex gap-2">
          {(
            [
              { key: "email" as const, label: "Email", icon: <AtSign className="h-4 w-4" /> },
              { key: "phone" as const, label: "Phone", icon: <Phone className="h-4 w-4" /> },
            ]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setCopied(false);
              }}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                tab === item.key
                  ? "border-violet-500 bg-violet-600/20 text-white"
                  : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* EMAIL tab */}
        {tab === "email" ? (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Email address
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:text-slate-600 focus:border-violet-500"
            />

            {emailResult ? (
              <div
                className={[
                  "mt-4 flex items-start gap-3 rounded-2xl border p-4",
                  emailResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    emailResult.ok
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300",
                  ].join(" ")}
                >
                  {emailResult.ok ? (
                    <BadgeCheck className="h-5 w-5" />
                  ) : (
                    <BadgeX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p
                    className={[
                      "text-base font-bold",
                      emailResult.ok ? "text-emerald-300" : "text-red-300",
                    ].join(" ")}
                  >
                    {emailResult.ok ? "Valid email address" : "Invalid email address"}
                  </p>
                  {!emailResult.ok ? (
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {emailResult.issues.join(" ")}
                    </p>
                  ) : (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <AtSign className="h-3.5 w-3.5" />
                        {emailResult.user}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Globe2 className="h-3.5 w-3.5" />
                        {emailResult.domain}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        .{emailResult.tld}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
                <p className="px-6 text-center text-sm leading-6 text-slate-500">
                  Enter an email address to check its format.
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {EMAIL_EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setEmail(example.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* PHONE tab */
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Phone number
            </label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              placeholder="+1 415 555 0132"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:text-slate-600 focus:border-violet-500"
            />

            {phoneResult ? (
              <div
                className={[
                  "mt-4 flex items-start gap-3 rounded-2xl border p-4",
                  phoneResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    phoneResult.ok
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300",
                  ].join(" ")}
                >
                  {phoneResult.ok ? (
                    <BadgeCheck className="h-5 w-5" />
                  ) : (
                    <BadgeX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p
                    className={[
                      "text-base font-bold",
                      phoneResult.ok ? "text-emerald-300" : "text-red-300",
                    ].join(" ")}
                  >
                    {phoneResult.ok
                      ? `Valid phone number (${phoneResult.digits.length} digits)`
                      : "Invalid phone number"}
                  </p>
                  {!phoneResult.ok ? (
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {phoneResult.issues.join(" ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      Likely region: {phoneResult.country ?? "International"}
                      {phoneResult.e164 ? " · valid E.164 format" : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
                <p className="px-6 text-center text-sm leading-6 text-slate-500">
                  Enter a phone number to check its format.
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {PHONE_EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setPhone(example.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={copyResult}
            disabled={tab === "email" ? !email : !phone}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy value"}
          </button>

          <button
            onClick={() => (tab === "email" ? setEmail("") : setPhone(""))}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use Email & Phone Validator"
          subtitle=""
          steps={[
            {
              title: "Pick a type",
              description: "Switch between Email and Phone validation tabs.",
              icon: <AtSign className="h-5 w-5" />,
            },
            {
              title: "Enter a value",
              description: "Type or paste the address / number to check.",
              icon: <Phone className="h-5 w-5" />,
            },
            {
              title: "See the verdict",
              description: "Get instant valid/invalid feedback with clear reasons why.",
              icon: <BadgeCheck className="h-5 w-5" />,
            },
            {
              title: "Review details",
              description: "Emails break into user, domain, and TLD; phones into region and digit count.",
              icon: <Globe2 className="h-5 w-5" />,
            },
            {
              title: "Copy or reset",
              description: "Copy the checked value or start over with one click.",
              icon: <Copy className="h-5 w-5" />,
            },
            {
              title: "Private by design",
              description: "Format checks are 100% local — nothing leaves your browser.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
