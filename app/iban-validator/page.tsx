"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BadgeX,
  Banknote,
  Check,
  Copy,
  Eraser,
  FileCheck2,
  Globe2,
  Landmark,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   IBAN VALIDATION — structure + mod-97 checksum
   ========================================================================== */

// Country -> expected IBAN length (in characters, no spaces).
const COUNTRY_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
  BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
  DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
  GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
  IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20,
  LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24,
  ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24,
  PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SC: 31,
  SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24,
  TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

const COUNTRY_NAMES: Record<string, string> = {
  AD: "Andorra", AE: "United Arab Emirates", AL: "Albania", AT: "Austria",
  AZ: "Azerbaijan", BA: "Bosnia & Herz.", BE: "Belgium", BG: "Bulgaria",
  BH: "Bahrain", BR: "Brazil", BY: "Belarus", CH: "Switzerland",
  CR: "Costa Rica", CY: "Cyprus", CZ: "Czechia", DE: "Germany",
  DK: "Denmark", DO: "Dominican Rep.", EE: "Estonia", EG: "Egypt",
  ES: "Spain", FI: "Finland", FO: "Faroe Islands", FR: "France",
  GB: "United Kingdom", GE: "Georgia", GI: "Gibraltar", GL: "Greenland",
  GR: "Greece", GT: "Guatemala", HR: "Croatia", HU: "Hungary",
  IE: "Ireland", IL: "Israel", IQ: "Iraq", IS: "Iceland",
  IT: "Italy", JO: "Jordan", KW: "Kuwait", KZ: "Kazakhstan",
  LB: "Lebanon", LC: "St. Lucia", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", LV: "Latvia", MC: "Monaco", MD: "Moldova",
  ME: "Montenegro", MK: "North Macedonia", MR: "Mauritania", MT: "Malta",
  MU: "Mauritius", NL: "Netherlands", NO: "Norway", PK: "Pakistan",
  PL: "Poland", PS: "Palestine", PT: "Portugal", QA: "Qatar",
  RO: "Romania", RS: "Serbia", SA: "Saudi Arabia", SC: "Seychelles",
  SE: "Sweden", SI: "Slovenia", SK: "Slovakia", SM: "San Marino",
  ST: "São Tomé", SV: "El Salvador", TL: "Timor-Leste", TN: "Tunisia",
  TR: "Turkey", UA: "Ukraine", VA: "Vatican", VG: "British Virgin Is.",
  XK: "Kosovo",
};

function sanitize(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/* Converts an IBAN to a numeric string for the mod-97 check:
   move the first 4 characters to the end, map letters A=10..Z=35. */
function toNumeric(iban: string): string {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  return rearranged
    .split("")
    .map((char) => (/[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char))
    .join("");
}

function mod97(iban: string): number {
  // Process one digit at a time: remainder = (remainder * 10 + digit) % 97.
  // Taking mod on every step keeps the value safely under Number.MAX_SAFE_INTEGER,
  // and avoids pairing bugs on odd-length strings.
  const digits = toNumeric(iban);
  let remainder = 0;
  for (const char of digits) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }
  return remainder;
}

type IbanCheck = {
  valid: boolean;
  unsupported: boolean;
  structural: boolean;
  checksum: boolean;
  country: string | null;
  iban: string;
  issues: string[];
};

function validateIban(value: string): IbanCheck {
  const iban = sanitize(value);
  const issues: string[] = [];

  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban)) {
    return {
      valid: false,
      unsupported: false,
      structural: false,
      checksum: false,
      country: null,
      iban,
      issues: ["IBAN must start with a 2-letter country code followed by digits/letters."],
    };
  }

  const country = iban.slice(0, 2);
  const name = COUNTRY_NAMES[country] ?? null;
  const expectedLength = COUNTRY_LENGTHS[country];
  const unsupported = expectedLength === undefined;
  const lengthOk = expectedLength === undefined ? true : iban.length === expectedLength;

  if (unsupported) {
    issues.push(`'${country}' is not a recognized IBAN country code.`);
  } else {
    if (!lengthOk) {
      issues.push(`Expected ${expectedLength} characters for ${name}, got ${iban.length}.`);
    }
    if (iban.length < 5) {
      issues.push("IBAN is too short to validate.");
    }
  }

  const structural = !unsupported && lengthOk && iban.length >= 5;
  const checksum = structural && mod97(iban) === 1;

  if (structural && !checksum) issues.push("The mod-97 checksum does not match.");

  return {
    valid: structural && checksum,
    unsupported,
    structural,
    checksum,
    country: name,
    iban,
    issues,
  };
}

function groupIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

const EXAMPLES = [
  { label: "Valid DE", value: "DE89370400440532013000" },
  { label: "Valid GB", value: "GB29NWBK60161331926819" },
  { label: "Valid FR", value: "FR1420041010050500013M02606" },
  { label: "Invalid checksum", value: "DE89370400440532013001" },
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

export default function IbanValidatorPage() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = input ? validateIban(input) : null;

  async function copyFormatted() {
    if (!result) return;
    await navigator.clipboard.writeText(groupIban(result.iban));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          IBAN Validator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Validate any international bank account number (IBAN) from 70+
          countries — checking its structure, length, and mod-97 checksum.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          IBAN
        </label>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="DE89 3704 0044 0532 0130 00"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg tracking-wider text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-slate-600 focus:border-violet-500"
        />

        {/* Result */}
        {result ? (
          <div
            className={[
              "mt-4 rounded-2xl border p-4",
              result.valid
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-red-500/30 bg-red-500/10",
            ].join(" ")}
          >
            <div className="flex items-center gap-4">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  result.valid
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300",
                ].join(" ")}
              >
                {result.valid ? (
                  <BadgeCheck className="h-6 w-6" />
                ) : (
                  <BadgeX className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={[
                    "text-lg font-bold",
                    result.valid ? "text-emerald-300" : "text-red-300",
                  ].join(" ")}
                >
                  {result.valid ? "Valid IBAN" : "Invalid IBAN"}
                </p>
                <p className="mt-0.5 font-mono text-sm text-slate-400">
                  {groupIban(result.iban)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Globe2 className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {result.country ?? "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {result.iban.length} characters
                </p>
              </div>
            </div>

            {result.issues.length ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-slate-400">
                {result.issues.join(" ")}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
            <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
              <Landmark className="h-4 w-4" />
              Enter an IBAN to validate its structure and checksum.
            </p>
          </div>
        )}

        {/* Examples */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setInput(example.value)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <ScanLine className="h-3.5 w-3.5" />
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={copyFormatted}
            disabled={!result}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy formatted"}
          </button>

          <button
            onClick={() => setInput("")}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use IBAN Validator"
          subtitle=""
          steps={[
            {
              title: "Enter the IBAN",
              description: "Paste or type the IBAN. Spaces and dashes are ignored automatically.",
              icon: <Banknote className="h-5 w-5" />,
            },
            {
              title: "Country & length",
              description: "The tool checks the country code and expected character length.",
              icon: <Globe2 className="h-5 w-5" />,
            },
            {
              title: "Mod-97 checksum",
              description: "A math check confirms the number hasn't been mistyped.",
              icon: <FileCheck2 className="h-5 w-5" />,
            },
            {
              title: "Copy formatted",
              description: "Output the IBAN neatly grouped in 4-character blocks.",
              icon: <Copy className="h-5 w-5" />,
            },
            {
              title: "Private by design",
              description: "Validation happens locally — nothing is ever uploaded.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
            {
              title: "70+ countries",
              description: "Covers all standard IBAN-issuing countries and territories.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
