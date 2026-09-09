"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BadgeX,
  Banknote,
  Check,
  Copy,
  Eraser,
  Globe2,
  Landmark,
  Phone,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   TYPES
   ========================================================================== */

type Tab = "email" | "phone" | "iban";

type EmailResult = {
  ok: boolean;
  user: string;
  domain: string;
  tld: string;
  issues: string[];
};

type PhoneCheck = {
  ok: boolean;
  country: string | null;
  digits: string;
  issues: string[];
  e164: boolean;
};

type IbanCheck = {
  valid: boolean;
  country: string | null;
  iban: string;
  issues: string[];
};

type ExampleItem = {
  label: string;
  value: string;
};

/* ==========================================================================
   EMAIL VALIDATION
   ========================================================================== */

function validateEmail(value: string): EmailResult | null {
  const email = value.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const issues: string[] = [];
  const atIndex = email.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === email.length - 1) {
    issues.push(
      "An email needs a local part and a domain separated by '@'."
    );
  }

  const user = atIndex > 0 ? email.slice(0, atIndex) : "";
  const domain = atIndex > 0 ? email.slice(atIndex + 1) : "";

  if ((email.match(/@/g) ?? []).length !== 1) {
    issues.push("An email should contain exactly one '@' character.");
  }

  if (user.length > 64) {
    issues.push("The local part is longer than 64 characters.");
  }

  if (
    user.startsWith(".") ||
    user.endsWith(".") ||
    user.includes("..")
  ) {
    issues.push(
      "The local part cannot start/end with a dot or contain consecutive dots."
    );
  }

  if (user && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(user)) {
    issues.push("The local part contains unsupported characters.");
  }

  if (domain.includes("..")) {
    issues.push("The domain contains consecutive dots.");
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    issues.push("The domain cannot start or end with a dot.");
  }

  if (domain && !/^[a-z0-9.-]+$/i.test(domain)) {
    issues.push("The domain contains unsupported characters.");
  }

  const dotIndex = domain.lastIndexOf(".");

  const tld =
    dotIndex > 0 && dotIndex < domain.length - 1
      ? domain.slice(dotIndex + 1)
      : "";

  if (!domain || dotIndex <= 0 || dotIndex >= domain.length - 1) {
    issues.push(
      "The domain must contain a top-level domain such as '.com'."
    );
  }

  if (tld && tld.length < 2) {
    issues.push("The top-level domain is too short.");
  }

  return {
    ok: issues.length === 0,
    user,
    domain,
    tld,
    issues,
  };
}

/* ==========================================================================
   PHONE VALIDATION
   ========================================================================== */

const PHONE_LOCALES: {
  key: string;
  label: string;
  flag: string;
  ranges: [number, number][];
}[] = [
  {
    key: "US",
    label: "United States/Canada",
    flag: "🇺🇸",
    ranges: [[10, 10]],
  },
  {
    key: "GB",
    label: "United Kingdom",
    flag: "🇬🇧",
    ranges: [[10, 11]],
  },
  {
    key: "AU",
    label: "Australia",
    flag: "🇦🇺",
    ranges: [[9, 10]],
  },
  {
    key: "IN",
    label: "India",
    flag: "🇮🇳",
    ranges: [[10, 10]],
  },
  {
    key: "DE",
    label: "Germany",
    flag: "🇩🇪",
    ranges: [[9, 12]],
  },
  {
    key: "FR",
    label: "France",
    flag: "🇫🇷",
    ranges: [[9, 10]],
  },
  {
    key: "BR",
    label: "Brazil",
    flag: "🇧🇷",
    ranges: [[10, 11]],
  },
  {
    key: "Intl",
    label: "International (E.164)",
    flag: "🌐",
    ranges: [[7, 15]],
  },
];

function validatePhone(value: string): PhoneCheck | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return {
      ok: false,
      country: null,
      digits: "",
      issues: ["Enter a phone number containing digits."],
      e164: false,
    };
  }

  const issues: string[] = [];

  const hasPlus =
    trimmed.startsWith("+");

  const e164 = hasPlus && /^[+][1-9]\d{1,14}$/.test(trimmed.replace(/\s/g, ""));

  let working = digits;
  let country: string | null = null;

  if (digits.startsWith("1")) {
    country = "US";

    if (digits.length === 11) {
      working = digits.slice(1);
    }
  } else if (digits.startsWith("44")) {
    country = "GB";
    working = digits.slice(2);
  } else if (digits.startsWith("61")) {
    country = "AU";
    working = digits.slice(2);
  } else if (digits.startsWith("91")) {
    country = "IN";
    working = digits.slice(2);
  } else if (digits.startsWith("49")) {
    country = "DE";
    working = digits.slice(2);
  } else if (digits.startsWith("33")) {
    country = "FR";
    working = digits.slice(2);
  } else if (digits.startsWith("55")) {
    country = "BR";
    working = digits.slice(2);
  }

  if (working.length < 7) {
    issues.push("Phone numbers usually need at least 7 digits.");
  }

  if (working.length > 15) {
    issues.push(
      "Phone numbers have a maximum of 15 digits under E.164."
    );
  }

  const locale = country
    ? PHONE_LOCALES.find((item) => item.key === country)
    : PHONE_LOCALES.find((item) => item.key === "Intl");

  const lengthOk = locale
    ? locale.ranges.some(
        ([min, max]) =>
          working.length >= min &&
          working.length <= max
      )
    : working.length >= 7 &&
      working.length <= 15;

  if (!lengthOk) {
    issues.push(
      "The digit count does not match the expected format for this number."
    );
  }

  return {
    ok: issues.length === 0,
    country,
    digits,
    issues,
    e164,
  };
}

/* ==========================================================================
   IBAN VALIDATION
   ========================================================================== */

const COUNTRY_LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IQ: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SC: 31,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

const COUNTRY_NAMES: Record<string, string> = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AL: "Albania",
  AT: "Austria",
  AZ: "Azerbaijan",
  BA: "Bosnia & Herz.",
  BE: "Belgium",
  BG: "Bulgaria",
  BH: "Bahrain",
  BR: "Brazil",
  BY: "Belarus",
  CH: "Switzerland",
  CR: "Costa Rica",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  DO: "Dominican Rep.",
  EE: "Estonia",
  EG: "Egypt",
  ES: "Spain",
  FI: "Finland",
  FO: "Faroe Islands",
  FR: "France",
  GB: "United Kingdom",
  GE: "Georgia",
  GI: "Gibraltar",
  GL: "Greenland",
  GR: "Greece",
  GT: "Guatemala",
  HR: "Croatia",
  HU: "Hungary",
  IE: "Ireland",
  IL: "Israel",
  IQ: "Iraq",
  IS: "Iceland",
  IT: "Italy",
  JO: "Jordan",
  KW: "Kuwait",
  KZ: "Kazakhstan",
  LB: "Lebanon",
  LC: "St. Lucia",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MK: "North Macedonia",
  MR: "Mauritania",
  MT: "Malta",
  MU: "Mauritius",
  NL: "Netherlands",
  NO: "Norway",
  PK: "Pakistan",
  PL: "Poland",
  PS: "Palestine",
  PT: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RS: "Serbia",
  SA: "Saudi Arabia",
  SC: "Seychelles",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
  SM: "San Marino",
  ST: "São Tomé",
  SV: "El Salvador",
  TL: "Timor-Leste",
  TN: "Tunisia",
  TR: "Turkey",
  UA: "Ukraine",
  VA: "Vatican",
  VG: "British Virgin Is.",
  XK: "Kosovo",
};

function sanitizeIban(value: string): string {
  return value
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

function ibanToNumeric(value: string): string {
  const rearranged =
    value.slice(4) +
    value.slice(0, 4);

  return rearranged
    .split("")
    .map((char) =>
      /[A-Z]/.test(char)
        ? String(char.charCodeAt(0) - 55)
        : char
    )
    .join("");
}

function ibanMod97(value: string): number {
  const numeric = ibanToNumeric(value);

  let remainder = 0;

  for (const character of numeric) {
    remainder =
      (remainder * 10 + Number(character)) % 97;
  }

  return remainder;
}

function validateIban(value: string): IbanCheck | null {
  const iban = sanitizeIban(value);

  if (!iban) {
    return null;
  }

  const issues: string[] = [];

  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban)) {
    return {
      valid: false,
      country: null,
      iban,
      issues: [
        "IBAN must start with a 2-letter country code followed by letters and digits.",
      ],
    };
  }

  const countryCode = iban.slice(0, 2);

  const country =
    COUNTRY_NAMES[countryCode] ?? null;

  const expectedLength =
    COUNTRY_LENGTHS[countryCode];

  if (!expectedLength) {
    issues.push(
      `'${countryCode}' is not a recognized IBAN country code.`
    );
  } else if (iban.length !== expectedLength) {
    issues.push(
      `Expected ${expectedLength} characters for ${country}, got ${iban.length}.`
    );
  }

  const structureIsValid =
    Boolean(expectedLength) &&
    iban.length === expectedLength;

  const checksumIsValid =
    structureIsValid &&
    iban.length >= 5 &&
    ibanMod97(iban) === 1;

  if (
    structureIsValid &&
    !checksumIsValid
  ) {
    issues.push(
      "The mod-97 checksum does not match."
    );
  }

  return {
    valid:
      structureIsValid &&
      checksumIsValid,
    country,
    iban,
    issues,
  };
}

function groupIban(value: string): string {
  return value
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/* ==========================================================================
   EXAMPLES
   ========================================================================== */

const EMAIL_EXAMPLES: ExampleItem[] = [
  {
    label: "Valid",
    value: "hello@example.com",
  },
  {
    label: "Missing TLD",
    value: "hello@example",
  },
  {
    label: "Two @",
    value: "a@b@c.com",
  },
];

const PHONE_EXAMPLES: ExampleItem[] = [
  {
    label: "US",
    value: "+1 (415) 555-0132",
  },
  {
    label: "UK",
    value: "+44 20 7946 0958",
  },
  {
    label: "India",
    value: "+91 98765 43210",
  },
];

const IBAN_EXAMPLES: ExampleItem[] = [
  {
    label: "Valid DE",
    value: "DE89370400440532013000",
  },
  {
    label: "Valid GB",
    value: "GB29NWBK60161331926819",
  },
  {
    label: "Valid FR",
    value: "FR1420041010050500013M02606",
  },
  {
    label: "Invalid checksum",
    value: "DE89370400440532013001",
  },
];

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function EmailPhoneIbanValidatorPage() {
  const [tab, setTab] =
    useState<Tab>("email");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [iban, setIban] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    if (
      window.location.hash === "#iban"
    ) {
      setTab("iban");
    }
  }, []);

  const emailResult =
    validateEmail(email);

  const phoneResult =
    validatePhone(phone);

  const ibanResult =
    validateIban(iban);

  const activeValue =
    tab === "email"
      ? email
      : tab === "phone"
        ? phone
        : iban;

  async function copyResult() {
    if (!activeValue) {
      return;
    }

    const text =
      tab === "iban" && ibanResult
        ? groupIban(ibanResult.iban)
        : activeValue;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  function clearActive() {
    if (tab === "email") {
      setEmail("");
    }

    if (tab === "phone") {
      setPhone("");
    }

    if (tab === "iban") {
      setIban("");
    }

    setCopied(false);
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setCopied(false);

    if (
      typeof window !== "undefined"
    ) {
      if (nextTab === "iban") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}#iban`
        );
      } else {
        window.history.replaceState(
          null,
          "",
          window.location.pathname
        );
      }
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/tools/text-developer-tools"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      <div className="mx-auto max-w-3xl text-center">
        <div className="">
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Email, Phone &amp; IBAN Validator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Validate contact and banking identifiers
          in one place. All format checks run locally
          in your browser.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* TAB NAVIGATION */}

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={tab === "email"}
            onClick={() =>
              changeTab("email")
            }
            icon={
              <AtSign className="h-4 w-4" />
            }
          >
            Email
          </TabButton>

          <TabButton
            active={tab === "phone"}
            onClick={() =>
              changeTab("phone")
            }
            icon={
              <Phone className="h-4 w-4" />
            }
          >
            Phone
          </TabButton>

          <TabButton
            active={tab === "iban"}
            onClick={() =>
              changeTab("iban")
            }
            icon={
              <Banknote className="h-4 w-4" />
            }
          >
            IBAN
          </TabButton>
        </div>

        {/* EMAIL */}

        {tab === "email" && (
          <ValidatorPanel>
            <label
              htmlFor="email-validator-input"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Email address
            </label>

            <input
              id="email-validator-input"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              type="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:text-slate-600 focus:border-violet-500"
            />

            {emailResult ? (
              <ResultCard
                valid={emailResult.ok}
                title={
                  emailResult.ok
                    ? "Valid email address"
                    : "Invalid email address"
                }
              >
                {emailResult.ok ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <AtSign className="h-3.5 w-3.5" />
                      {emailResult.user}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5" />
                      {emailResult.domain}
                    </span>

                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                      .{emailResult.tld}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    {emailResult.issues.join(
                      " "
                    )}
                  </p>
                )}
              </ResultCard>
            ) : (
              <EmptyState>
                Enter an email address to check
                its format.
              </EmptyState>
            )}

            <Examples
              items={EMAIL_EXAMPLES}
              onPick={setEmail}
            />
          </ValidatorPanel>
        )}

        {/* PHONE */}

        {tab === "phone" && (
          <ValidatorPanel>
            <label
              htmlFor="phone-validator-input"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Phone number
            </label>

            <input
              id="phone-validator-input"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+1 415 555 0132"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:text-slate-600 focus:border-violet-500"
            />

            {phoneResult ? (
              <ResultCard
                valid={phoneResult.ok}
                title={
                  phoneResult.ok
                    ? `Valid phone number (${phoneResult.digits.length} digits)`
                    : "Invalid phone number"
                }
              >
                {phoneResult.ok ? (
                  <p className="text-sm leading-6 text-slate-400">
                    Likely region:{" "}
                    {phoneResult.country ??
                      "International"}

                    {phoneResult.e164
                      ? " · valid E.164 format"
                      : ""}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    {phoneResult.issues.join(
                      " "
                    )}
                  </p>
                )}
              </ResultCard>
            ) : (
              <EmptyState>
                Enter a phone number to check
                its format.
              </EmptyState>
            )}

            <Examples
              items={PHONE_EXAMPLES}
              onPick={setPhone}
            />
          </ValidatorPanel>
        )}

        {/* IBAN */}

        {tab === "iban" && (
          <ValidatorPanel>
            <label
              htmlFor="iban-validator-input"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              IBAN
            </label>

            <input
              id="iban-validator-input"
              value={iban}
              onChange={(event) =>
                setIban(
                  event.target.value
                )
              }
              autoComplete="off"
              spellCheck={false}
              placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg tracking-wider text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-slate-600 focus:border-violet-500"
            />

            {ibanResult ? (
              <ResultCard
                valid={ibanResult.valid}
                title={
                  ibanResult.valid
                    ? "Valid IBAN"
                    : "Invalid IBAN"
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-sm text-slate-400">
                    {groupIban(
                      ibanResult.iban
                    )}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Globe2 className="h-4 w-4" />
                    {ibanResult.country ??
                      "Unknown"}
                    <span>·</span>
                    {ibanResult.iban.length} chars
                  </div>
                </div>

                {ibanResult.issues.length >
                  0 && (
                  <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-slate-400">
                    {ibanResult.issues.join(
                      " "
                    )}
                  </p>
                )}
              </ResultCard>
            ) : (
              <EmptyState
                icon={
                  <Landmark className="h-4 w-4" />
                }
              >
                Enter an IBAN to validate its
                structure and checksum.
              </EmptyState>
            )}

            <Examples
              items={IBAN_EXAMPLES}
              onPick={setIban}
              showScanIcon
            />
          </ValidatorPanel>
        )}

        {/* ACTIONS */}

        <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={copyResult}
            disabled={!activeValue}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}

            {copied
              ? "Copied!"
              : tab === "iban"
                ? "Copy formatted"
                : "Copy value"}
          </button>

          <button
            type="button"
            onClick={clearActive}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* HOW TO USE */}

      <div className="mt-10">
        <HowToUse
          title="How to use Email, Phone & IBAN Validator"
          subtitle=""
          steps={[
            {
              title: "Pick a type",
              description:
                "Switch between Email, Phone, and IBAN validation.",
              icon: (
                <AtSign className="h-5 w-5" />
              ),
            },
            {
              title: "Enter a value",
              description:
                "Type or paste the identifier you want to validate.",
              icon: (
                <Phone className="h-5 w-5" />
              ),
            },
            {
              title: "Get instant feedback",
              description:
                "See whether the supplied value passes the local format checks.",
              icon: (
                <BadgeCheck className="h-5 w-5" />
              ),
            },
            {
              title: "Review details",
              description:
                "Inspect the relevant email, phone, or IBAN information.",
              icon: (
                <Globe2 className="h-5 w-5" />
              ),
            },
            {
              title: "Copy or clear",
              description:
                "Copy the current value or reset the active validator.",
              icon: (
                <Copy className="h-5 w-5" />
              ),
            },
            {
              title: "Private by design",
              description:
                "Validation runs locally in the browser.",
              icon: (
                <ShieldCheck className="h-5 w-5" />
              ),
            },
          ]}
        />
      </div>
    </Container>
  );
}

/* ==========================================================================
   COMPONENTS
   ========================================================================== */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-violet-500 bg-violet-600/20 text-white"
          : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function ValidatorPanel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      {children}
    </div>
  );
}

function EmptyState({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
      <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
        {icon}
        {children}
      </p>
    </div>
  );
}

function ResultCard({
  valid,
  title,
  children,
}: {
  valid: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "mt-4 rounded-2xl border p-4",
        valid
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-red-500/30 bg-red-500/10",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            valid
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300",
          ].join(" ")}
        >
          {valid ? (
            <BadgeCheck className="h-5 w-5" />
          ) : (
            <BadgeX className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-base font-bold",
              valid
                ? "text-emerald-300"
                : "text-red-300",
            ].join(" ")}
          >
            {title}
          </p>

          <div className="mt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Examples({
  items,
  onPick,
  showScanIcon = false,
}: {
  items: ExampleItem[];
  onPick: (value: string) => void;
  showScanIcon?: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Examples
      </p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={`${item.label}-${item.value}`}
            type="button"
            onClick={() =>
              onPick(item.value)
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            {showScanIcon ? (
              <ScanLine className="h-3.5 w-3.5" />
            ) : null}

            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}