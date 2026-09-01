"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Container } from "@/components/Container";

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

/* ==========================================================================
   STRENGTH ANALYSIS
   ========================================================================== */

const CLASS_SIZES = {
  lower: 26,
  upper: 26,
  digit: 10,
  symbol: 33,
};

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "admin",
  "guest",
  "login",
  "princess",
  "football",
  "baseball",
  "iloveyou",
  "trustno1",
  "sunshine",
  "master",
  "shadow",
  "passw0rd",
  "123123",
  "654321",
  "111111",
  "000000",
]);

type Analysis = {
  score: number;
  bits: number | null;
  label: string;
  color: string;
  labelColor: string;
  checks: { label: string; passed: boolean }[];
  suggestions: string[];
  crackTimes: { label: string; time: string }[];
};

function hasSequence(password: string) {
  const lower = password.toLowerCase();
  const sequences = lower.match(/(.)\1{2,}|(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890)/g);
  return sequences ? sequences.length > 0 : false;
}

function analyzePassword(password: string): Analysis {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const poolSize =
    (hasLower ? CLASS_SIZES.lower : 0) +
    (hasUpper ? CLASS_SIZES.upper : 0) +
    (hasDigit ? CLASS_SIZES.digit : 0) +
    (hasSymbol ? CLASS_SIZES.symbol : 0);

  const bits = password.length > 0 && poolSize > 0
    ? Math.round(password.length * Math.log2(poolSize))
    : null;

  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());
  const hasRepeats = hasSequence(password);

  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Contains uppercase letters", passed: hasUpper },
    { label: "Contains lowercase letters", passed: hasLower },
    { label: "Contains numbers", passed: hasDigit },
    { label: "Contains symbols", passed: hasSymbol },
    { label: "Above 60 bits of entropy", passed: bits !== null && bits > 60 },
    { label: "No obvious sequences / repeats", passed: !hasRepeats },
    { label: "Not a common password", passed: !isCommon },
  ];

  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push("Use at least 12 characters.");
  if (!hasUpper) suggestions.push("Add uppercase letters (A–Z).");
  if (!hasDigit) suggestions.push("Add numbers (0–9).");
  if (!hasSymbol) suggestions.push("Add symbols like ! @ # $ %");
  if (isCommon) suggestions.push("This is a commonly used password — avoid it.");
  if (hasRepeats) suggestions.push("Avoid obvious repeats and sequences like 1111 or abc.");
  if (bits !== null && bits <= 45) suggestions.push("Aim for at least 60 bits of entropy — consider a passphrase.");

  let score = 0;
  if (password) {
    score += password.length >= 8 ? 1 : 0;
    score += password.length >= 12 ? 1 : 0;
    score += password.length >= 16 ? 1 : 0;
    score += hasLower && hasUpper ? 1 : 0;
    score += hasDigit ? 1 : 0;
    score += hasSymbol ? 1 : 0;
    if (bits !== null && bits > 60) score += 1;
    if (!hasRepeats && !isCommon && bits !== null && bits > 70) score += 1;
  }

  let label: string;
  let color: string;
  let labelColor: string;
  if (isCommon || (bits !== null && bits < 30)) {
    label = "Very weak";
    color = "bg-red-500";
    labelColor = "text-red-400";
  } else if (bits !== null && bits < 45) {
    label = "Weak";
    color = "bg-orange-500";
    labelColor = "text-orange-400";
  } else if (bits !== null && bits < 60) {
    label = "Fair";
    color = "bg-yellow-500";
    labelColor = "text-yellow-400";
  } else if (bits !== null && bits < 95) {
    label = "Good";
    color = "bg-emerald-500";
    labelColor = "text-emerald-400";
  } else {
    label = "Strong";
    color = "bg-cyan-400";
    labelColor = "text-cyan-300";
  }

  // Estimate crack times at a typical online attacker (~1k guesses/s).
  const guesses = bits !== null ? 2 ** bits : 0;
  const crackTimes = bits === null
    ? []
    : [
        {
          label: "Online attack",
          time: formatCrackTime(guesses / 1000),
        },
        {
          label: "Offline fast hash",
          time: formatCrackTime(guesses / 1e10),
        },
        {
          label: "Offline slow hash",
          time: formatCrackTime(guesses / 1e5),
        },
      ];

  return { score, bits, label, color, labelColor, checks, suggestions, crackTimes };
}

function formatCrackTime(seconds: number) {
  if (seconds < 1) return "Instantly";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 31536000 * 1000) return `${Math.floor(seconds / 31536000)} years`;
  return `${Math.floor(seconds / 31536000 / 1000)}k years`;
}

const howToUseSteps = [
  {
    title: "Type a password",
    description: "Enter any password — results are computed live.",
    icon: <Fingerprint className="h-5 w-5" />,
  },
  {
    title: "Watch the score",
    description: "See an instant strength score and entropy estimate.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Read the checks",
    description: "Review which character classes and rules pass.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Check crack time",
    description: "See how long an attacker might need to break it.",
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  {
    title: "Use suggestions",
    description: "Follow the tips to make the password stronger.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Stay private",
    description: "Everything is analyzed locally in your browser.",
    icon: <EyeOff className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Password Strength Checker
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-[#071522] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-[#092B40] text-[#63E5F7] shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold leading-5 text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PasswordStrengthCheckerPage() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyzePassword(password), [password]);

  async function copyPassword() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const pct = analysis.bits === null
    ? 0
    : Math.min(Math.max((analysis.score / 8) * 100, 6), 100);

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Password Strength Checker
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Analyze a password instantly — entropy, character checks, estimated
          crack time, and tips to make it stronger. All local to your browser.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Password input */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-h-[52px] flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Type a password to analyze..."
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? "Hide password" : "Show password"}
              className="ml-3 text-slate-500 transition hover:text-white"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={copyPassword}
              disabled={!password}
              aria-label="Copy password"
              className="ml-2 text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Score bar */}
        {password ? (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">
                Strength
              </span>
              <span className="flex items-center gap-2 text-sm font-bold">
                <span className={analysis.labelColor}>{analysis.label}</span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                  {analysis.bits} bits
                </span>
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${analysis.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Crack time estimates */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {analysis.crackTimes.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-slate-950 p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex min-h-[80px] items-center justify-center rounded-2xl border border-dashed border-white/10">
            <p className="px-6 text-center text-sm leading-6 text-slate-500">
              Start typing to see the analysis.
            </p>
          </div>
        )}

        {/* Checks */}
        {password ? (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-slate-300">
              Requirements
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {analysis.checks.map((check) => (
                <div
                  key={check.label}
                  className={[
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
                    check.passed
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                      : "border-white/10 bg-slate-950 text-slate-400",
                  ].join(" ")}
                >
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  {check.label}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Suggestions */}
        {password && analysis.suggestions.length ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Suggestions
            </p>
            <ul className="mt-3 space-y-2">
              {analysis.suggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  className="flex items-start gap-2 text-sm leading-6 text-amber-100/90"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <HowToUseSection />
    </Container>
  );
}