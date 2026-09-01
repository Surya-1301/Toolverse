"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Eraser,
  Fingerprint,
  Globe2,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { fetchApi } from "@/lib/apiBase";

type Certificate = {
  issuer_name: string;
  common_name: string;
  name_value: string;
  not_before: string;
  not_after: string;
  serial_number: string;
};

type CertResult = {
  domain: string;
  certificateCount: number;
  certificates: Certificate[];
};

function BackToToolsLink() {
  return (
    <Link
      href="/tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function daysUntil(value: string) {
  if (!value) return null;

  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;

  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusInfo(cert: Certificate) {
  const days = daysUntil(cert.not_after);
  const expiryMs = new Date(cert.not_after).getTime();

  if (Number.isNaN(expiryMs)) {
    return { label: "Unknown", className: "bg-slate-800 text-slate-300", Dot: ShieldCheck };
  }

  if (expiryMs < Date.now()) {
    return { label: "Expired", className: "bg-red-500/10 text-red-300 ring-red-500/30", Dot: ShieldX };
  }

  if (days !== null && days <= 30) {
    return { label: `Expires in ${days} days`, className: "bg-amber-500/10 text-amber-300 ring-amber-500/30", Dot: ShieldCheck };
  }

  return { label: "Valid", className: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30", Dot: ShieldCheck };
}

const howToUseSteps = [
  {
    title: "Enter a domain",
    description: "Type a hostname like example.com (protocol is optional).",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Check the certificate",
    description: "Look up certificate details from Certificate Transparency logs.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Review the issuer",
    description: "See which CA issued the certificate.",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Check validity",
    description: "Review the valid-from and expiry dates.",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    title: "Compare entries",
    description: "Browse multiple recent certificates for the domain.",
    icon: <Fingerprint className="h-5 w-5" />,
  },
];

export default function SslCheckerPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function check() {
    try {
      setError("");
      setResult(null);

      const domain = input.trim();

      if (!domain) {
        setError("Please enter a domain first.");
        return;
      }

      setLoading(true);

      const response = await fetchApi(`/api/ssl?domain=${encodeURIComponent(domain)}`, {
        cache: "no-store",
      });

      const text = await response.text();
      let json: (CertResult & { error?: string }) | null = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!response.ok) {
        setError(json?.error || `Could not check the certificate. Backend returned ${response.status}.`);
        return;
      }

      setResult(json);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not check the certificate: ${caughtError.message}`
          : "Could not check the certificate from the backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyValue(value: string) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(value);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setResult(null);
    setError("");
    setCopied("");
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          SSL Certificate Checker
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Look up the SSL/TLS certificates issued for any domain and check
          their validity, issuer, and expiry.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") check();
              }}
              placeholder="example.com"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <button
            onClick={check}
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Checking..." : "Check cert"}
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Checks public Certificate Transparency logs, so results reflect
          certificates that have been publicly issued.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <LockKeyhole className="h-5 w-5 text-violet-300" />
                {result.domain}
              </h2>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {result.certificateCount} cert{result.certificateCount === 1 ? "" : "s"} found
              </span>
            </div>

            {result.certificates.length ? (
              <div className="space-y-4">
                {result.certificates.map((cert, index) => {
                  const info = statusInfo(cert);

                  return (
                    <div
                      key={`${cert.serial_number}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-bold text-white">
                            {cert.common_name}
                          </p>
                          <p className="mt-0.5 break-all text-xs text-slate-500">
                            {cert.name_value}
                          </p>
                        </div>

                        <span
                          className={[
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                            info.className,
                          ].join(" ")}
                        >
                          <info.Dot className="h-3.5 w-3.5" />
                          {info.label}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Building2 className="h-3.5 w-3.5" />
                            Issuer
                          </p>
                          <p className="mt-1 break-words text-xs font-semibold text-slate-200">
                            {cert.issuer_name || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Valid from
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-200">
                            {formatDate(cert.not_before)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Expires
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-200">
                            {formatDate(cert.not_after)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Fingerprint className="h-3.5 w-3.5" />
                            Serial
                          </p>
                          <button
                            onClick={() => copyValue(cert.serial_number)}
                            className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                          >
                            <span className="truncate">
                              {copied === cert.serial_number
                                ? "Copied!"
                                : cert.serial_number || "—"}
                            </span>
                            {copied !== cert.serial_number ? (
                              <Copy className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-center">
                <p className="text-sm leading-6 text-slate-400">
                  No certificates were found for this domain.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <HowToUse
        title="How to use SSL Certificate Checker"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
