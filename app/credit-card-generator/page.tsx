"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BadgeDollarSign,
  BadgeX,
  Check,
  Copy,
  CreditCard,
  Eraser,
  Fingerprint,
  Lock,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  User,
  WalletCards,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   CREDIT CARD GENERATOR — valid test cards (number, expiry, name, CVV)
   ========================================================================== */

type Brand =
  | "Visa"
  | "Mastercard"
  | "American Express"
  | "Discover"
  | "JCB"
  | "Diners Club"
  | "UnionPay";

const BRANDS: { name: Brand; test: (d: string) => boolean; lengths: number[] }[] = [
  { name: "Visa", test: (d) => /^4/.test(d), lengths: [13, 16, 19] },
  { name: "Mastercard", test: (d) => /^(5[1-5]|2[2-7])/.test(d), lengths: [16] },
  { name: "American Express", test: (d) => /^3[47]/.test(d), lengths: [15] },
  { name: "Discover", test: (d) => /^(6011|65|64[4-9])/.test(d), lengths: [16, 19] },
  { name: "JCB", test: (d) => /^(35[2-8]|30[0-5]|36|38)/.test(d), lengths: [16, 19] },
  { name: "Diners Club", test: (d) => /^(36|38|30[0-5]|5[0-9])/.test(d), lengths: [14] },
  { name: "UnionPay", test: (d) => /^(62|81)/.test(d), lengths: [16, 19] },
];

const BRAND_PREFIXES: Record<Brand, string> = {
  Visa: "4",
  Mastercard: "51",
  "American Express": "34",
  Discover: "6011",
  JCB: "3528",
  "Diners Club": "300",
  UnionPay: "62",
};

const SELECTABLE_BRANDS: { key: Brand | "random"; label: string }[] = [
  { key: "random", label: "Random" },
  { key: "Visa", label: "Visa" },
  { key: "Mastercard", label: "Mastercard" },
  { key: "American Express", label: "Amex" },
  { key: "Discover", label: "Discover" },
  { key: "JCB", label: "JCB" },
  { key: "Diners Club", label: "Diners" },
  { key: "UnionPay", label: "UnionPay" },
];

const VALIDATE_EXAMPLES = [
  { label: "Valid Visa", value: "4111 1111 1111 1111" },
  { label: "Valid Mastercard", value: "5555 5555 5555 4444" },
  { label: "Valid Amex", value: "3782 822463 10005" },
  { label: "Invalid (fails Luhn)", value: "1234 5678 9012 3456" },
];

const FIRST_NAMES = [
  "Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte",
  "James", "Sophia", "Mateo", "Amara", "Kenji", "Nora", "Theo", "Isla",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Nguyen", "Khan", "Silva", "Costa",
  "Müller", "Kim",
];

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function randomDigits(count: number): string {
  let value = "";
  for (let i = 0; i < count; i++) value += Math.floor(Math.random() * 10);
  return value;
}

function luhnCheckDigit(body: string): string {
  for (let check = 0; check <= 9; check++) {
    if (luhnCheck(body + check)) return String(check);
  }
  return "0";
}

function groupDigits(digits: string) {
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function sanitize(value: string) {
  return value.replace(/[\s-]/g, "");
}

function detectBrand(digits: string): Brand | null {
  if (!digits) return null;
  return BRANDS.find((b) => b.test(digits))?.name ?? null;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

type GeneratedCard = {
  brand: Brand;
  number: string; // grouped digits
  name: string;
  expiryLabel: string; // MM/YY
  cvv: string;
};

function generateCard(brandChoice: Brand | "random"): GeneratedCard {
  const brand: Brand =
    brandChoice === "random"
      ? pick(BRANDS).name
      : brandChoice;

  const info = BRANDS.find((b) => b.name === brand)!;
  const length = pick(info.lengths);
  const prefix = BRAND_PREFIXES[brand];
  const body = prefix + randomDigits(length - prefix.length - 1);
  const number = groupDigits(body + luhnCheckDigit(body));

  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`.toUpperCase();

  const now = new Date();
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const year = String(now.getFullYear() + 1 + Math.floor(Math.random() * 5)).slice(-2);
  const expiryLabel = `${month}/${year}`;

  const cvv = brand === "American Express" ? randomDigits(4) : randomDigits(3);

  return { brand, number, name, expiryLabel, cvv };
}

/* Card brand accent colors for the visual preview. */
const BRAND_ACCENTS: Record<Brand, string> = {
  Visa: "from-blue-600 via-blue-700 to-indigo-900",
  Mastercard: "from-orange-500 via-red-600 to-rose-900",
  "American Express": "from-cyan-600 via-sky-700 to-blue-900",
  Discover: "from-amber-500 via-orange-600 to-orange-900",
  JCB: "from-emerald-600 via-green-700 to-slate-900",
  "Diners Club": "from-violet-600 via-purple-700 to-slate-900",
  UnionPay: "from-rose-600 via-red-700 to-slate-900",
};

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

export default function CreditCardGeneratorPage() {
  const [tab, setTab] = useState<"generate" | "validate">("generate");
  const [brandChoice, setBrandChoice] = useState<Brand | "random">("random");
  const [card, setCard] = useState<GeneratedCard | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  // Validate tab state
  const [validateInput, setValidateInput] = useState("");
  const [validCopied, setValidCopied] = useState(false);

  function regenerate() {
    setCard(generateCard(brandChoice));
  }

  async function copyField(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1400);
  }

  function cardBlock(c: GeneratedCard) {
    return [
      `Card Number: ${c.number}`,
      `Cardholder:  ${c.name}`,
      `Expiry:      ${c.expiryLabel}`,
      `CVV:         ${c.cvv}`,
    ].join("\n");
  }

  function cardJson(c: GeneratedCard) {
    return JSON.stringify(
      {
        type: "test_card",
        brand: c.brand,
        number: c.number.replace(/\s/g, ""),
        name: c.name,
        expiry: c.expiryLabel,
        cvv: c.cvv,
      },
      null,
      2,
    );
  }

  async function copyAll() {
    if (!card) return;
    await navigator.clipboard.writeText(cardBlock(card));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  async function copyCardJson() {
    if (!card) return;
    await navigator.clipboard.writeText(cardJson(card));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  }

  // Derived validation (computed during render, no effect needed).
  const validateDigits = sanitize(validateInput);
  const validation = validateDigits
    ? { valid: luhnCheck(validateDigits), brand: detectBrand(validateDigits), digits: validateDigits }
    : null;

  async function copyValidated() {
    if (!validateInput) return;
    await navigator.clipboard.writeText(groupDigits(validateDigits));
    setValidCopied(true);
    setTimeout(() => setValidCopied(false), 1400);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Credit Card Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate realistic test cards or validate any number&apos;s checksum
          and brand — all locally, for testing forms and checkouts.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Tab switcher */}
        <div className="flex gap-2">
          {(
            [
              { key: "generate" as const, label: "Generate", icon: <Wand2 className="h-4 w-4" /> },
              { key: "validate" as const, label: "Validate", icon: <Fingerprint className="h-4 w-4" /> },
            ]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
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

        {tab === "generate" ? (
          <>
            {/* Brand selector */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Card brand
          </p>
          <div className="flex flex-wrap gap-2">
            {SELECTABLE_BRANDS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBrandChoice(b.key)}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  brandChoice === b.key
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={regenerate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Wand2 className="h-4 w-4" />
          {card ? "Generate another" : "Generate card"}
        </button>

        {card ? (
          <>
            {/* Card preview */}
            <div className="mt-6">
              <div
                className={[
                  "relative aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-2xl",
                  BRAND_ACCENTS[card.brand],
                ].join(" ")}
              >
                <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/20" />

                <div className="relative flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                    <CreditCard className="h-3.5 w-3.5" />
                    {card.brand}
                  </span>
                  <Lock className="h-4 w-4 opacity-80" />
                </div>

                <p className="relative mt-6 font-mono text-xl tracking-widest sm:text-2xl">
                  {card.number}
                </p>

                <div className="relative mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/60">
                      Card holder
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{card.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/60">
                      Expires
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">
                      {card.expiryLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Field rows with copy */}
            <div className="mt-5 space-y-2">
              {(
                [
                  { key: "number", label: "Card number", value: card.number, icon: <CreditCard className="h-4 w-4" /> },
                  { key: "name", label: "Cardholder name", value: card.name, icon: <User className="h-4 w-4" /> },
                  { key: "expiry", label: "Expiry date", value: card.expiryLabel, icon: <BadgeDollarSign className="h-4 w-4" /> },
                  { key: "cvv", label: "CVV", value: card.cvv, icon: <Fingerprint className="h-4 w-4" /> },
                ] as { key: string; label: string; value: string; icon: React.ReactNode }[]
              ).map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-slate-500">{field.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {field.label}
                      </p>
                      <p className="truncate font-mono text-sm text-white">
                        {field.value}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyField(field.key, field.value)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {copiedField === field.key ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedField === field.key ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>

            {/* Developer JSON output */}
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Developer · JSON
                </p>
                <button
                  onClick={copyCardJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {copiedJson ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedJson ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-5 text-cyan-300">
                {cardJson(card)}
              </pre>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={copyAll}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                {copiedAll ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedAll ? "Copied!" : "Copy all fields"}
              </button>
              <button
                onClick={regenerate}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                New card
              </button>
              <button
                onClick={() => setCard(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>
          </>
        ) : (
          <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
            <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
              <WalletCards className="h-4 w-4" />
              Pick a brand (or leave it on Random) and generate your test card.
            </p>
          </div>
        )}
          </>
        ) : (
          /* ---------- VALIDATE TAB ---------- */
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Card number
            </label>
            <input
              value={validateInput}
              onChange={(event) => setValidateInput(event.target.value)}
              inputMode="numeric"
              placeholder="4111 1111 1111 1111"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 font-mono text-lg tracking-wider text-slate-100 outline-none transition placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-slate-600 focus:border-violet-500"
            />

            {validation ? (
              <div
                className={[
                  "mt-4 flex items-center gap-4 rounded-2xl border p-4",
                  validation.valid
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    validation.valid
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300",
                  ].join(" ")}
                >
                  {validation.valid ? (
                    <BadgeCheck className="h-6 w-6" />
                  ) : (
                    <BadgeX className="h-6 w-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      "text-lg font-bold",
                      validation.valid ? "text-emerald-300" : "text-red-300",
                    ].join(" ")}
                  >
                    {validation.valid ? "Valid card number" : "Invalid card number"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {groupDigits(validation.digits)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Fingerprint className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {validation.brand ?? "Unknown brand"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Luhn checksum: {validation.valid ? "passed ✓" : "failed ✗"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
                <p className="flex items-center gap-2 px-6 text-center text-sm leading-6 text-slate-500">
                  <Fingerprint className="h-4 w-4" />
                  Enter a card number to check its validity and brand.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {VALIDATE_EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => setValidateInput(example.value)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  {example.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={copyValidated}
                disabled={!validateInput}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {validCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {validCopied ? "Copied!" : "Copy formatted"}
              </button>

              <button
                onClick={() => setValidateInput("")}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use Credit Card Generator"
          subtitle=""
          steps={[
            {
              title: "Pick a brand",
              description: "Choose a card network or let Random decide.",
              icon: <CreditCard className="h-5 w-5" />,
            },
            {
              title: "Generate a card",
              description: "Creates a valid Luhn number, future expiry, name, and CVV.",
              icon: <Wand2 className="h-5 w-5" />,
            },
            {
              title: "Copy each field",
              description: "Copy the number, name, expiry, or CVV with one click.",
              icon: <Copy className="h-5 w-5" />,
            },
            {
              title: "Validate any number",
              description: "Switch tabs to check a card's Luhn checksum and brand.",
              icon: <Fingerprint className="h-5 w-5" />,
            },
            {
              title: "Private by design",
              description: "Everything runs locally — nothing is sent or stored.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
            {
              title: "Testing only",
              description: "These are structurally valid test numbers, not real cards.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
