"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "Il1O0";

function removeAmbiguousChars(value: string) {
  return value
    .split("")
    .filter((char) => !AMBIGUOUS.includes(char))
    .join("");
}

function getStrengthScore(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return Math.min(score, 7);
}

function getStrengthLabel(score: number) {
  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  if (score <= 6) return "Strong";
  return "Very strong";
}

function getStrengthColor(score: number) {
  if (score <= 2) return "bg-red-500";
  if (score <= 4) return "bg-yellow-500";
  if (score <= 6) return "bg-emerald-500";
  return "bg-cyan-400";
}

function generatePassword({
  length,
  includeSymbols,
  excludeAmbiguous,
}: {
  length: number;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}) {
  let charset = LOWERCASE + UPPERCASE + NUMBERS;

  if (includeSymbols) {
    charset += SYMBOLS;
  }

  if (excludeAmbiguous) {
    charset = removeAmbiguousChars(charset);
  }

  const safeLength = Math.min(Math.max(length || 16, 4), 128);
  const randomValues = new Uint32Array(safeLength);

  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join("");
}

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

const howToUseSteps = [
  {
    title: "Choose length",
    description: "Set the password length from short to very long.",
    icon: <SlidersHorizontal className="h-5 w-5" />,
  },
  {
    title: "Add symbols",
    description: "Include special characters for stronger passwords.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Avoid confusion",
    description: "Exclude ambiguous characters like I, l, 1, O, and 0.",
    icon: <EyeOff className="h-5 w-5" />,
  },
  {
    title: "Generate",
    description: "Create a secure random password in your browser.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Check strength",
    description: "Review the strength indicator before using it.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Copy password",
    description: "Copy the generated password to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Password Generator
      </h2>

      {/* Desktop / tablet layout — unchanged */}
      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>

            <h3 className="text-sm font-semibold text-white">
              {step.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile-only: cyan icon left + title/description right */}
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

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  const strengthScore = useMemo(() => getStrengthScore(password), [password]);
  const strengthLabel = useMemo(
    () => getStrengthLabel(strengthScore),
    [strengthScore],
  );

  function handleGenerate() {
    const nextPassword = generatePassword({
      length,
      includeSymbols,
      excludeAmbiguous,
    });

    setPassword(nextPassword);
    setCopied(false);
  }

  async function copyPassword() {
    if (!password) return;

    await navigator.clipboard.writeText(password);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setPassword("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Password Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate secure passwords with custom length, symbols, ambiguous
          character filtering, and a strength indicator.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 sm:p-5">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Generated password
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex min-h-[52px] flex-1 items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 font-mono text-sm text-slate-100">
              {password ? (
                showPassword ? (
                  <span className="break-all">{password}</span>
                ) : (
                  <span>{"•".repeat(password.length)}</span>
                )
              ) : (
                <span className="text-slate-600">
                  Click generate to create a password.
                </span>
              )}
            </div>

            <button
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPassword ? "Hide" : "Show"}
            </button>

            <button
              onClick={copyPassword}
              disabled={!password}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-300">Strength</span>
              <span className="text-slate-400">
                {password ? strengthLabel : "Not generated"}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={[
                  "h-full rounded-full transition-all",
                  password ? getStrengthColor(strengthScore) : "bg-slate-700",
                ].join(" ")}
                style={{
                  width: password
                    ? `${Math.max((strengthScore / 7) * 100, 12)}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Length: {length}
            </label>

            <input
              type="range"
              min="4"
              max="128"
              step="1"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="w-full accent-violet-500"
            />

            <input
              type="number"
              min="4"
              max="128"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(event) => setIncludeSymbols(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Include symbols
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(event) => setExcludeAmbiguous(event.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              Exclude ambiguous chars
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <KeyRound className="h-4 w-4" />
            Generate password
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}