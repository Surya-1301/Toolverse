"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Code2,
  Copy,
  Eraser,
  FileJson,
  KeyRound,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { Container } from "@/components/Container";

type JwtDecoded = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
};

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return decodeURIComponent(
    Array.from(atob(padded))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function decodeJwt(token: string): JwtDecoded {
  const parts = token.trim().split(".");

  if (parts.length < 2) {
    throw new Error("Invalid JWT. Expected at least header and payload parts.");
  }

  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));

  return { header, payload };
}

function formatDateFromSeconds(value: unknown) {
  if (typeof value !== "number") return null;

  const date = new Date(value * 1000);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
}

function getExpiryStatus(exp: unknown) {
  if (typeof exp !== "number") {
    return {
      label: "No expiry claim",
      detail: "This token does not include an exp field.",
      expired: false,
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpired = exp < nowSeconds;

  return {
    label: isExpired ? "Expired" : "Active",
    detail: `Expires at ${formatDateFromSeconds(exp)}`,
    expired: isExpired,
  };
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
    title: "Paste JWT",
    description: "Add your JWT token into the input editor.",
    icon: <KeyRound className="h-5 w-5" />,
  },
  {
    title: "Decode locally",
    description: "Decode the header and payload directly in your browser.",
    icon: <LockKeyhole className="h-5 w-5" />,
  },
  {
    title: "Review header",
    description: "Check the token algorithm, type, and header metadata.",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "Review payload",
    description: "Inspect claims like subject, issuer, roles, and expiry.",
    icon: <FileJson className="h-5 w-5" />,
  },
  {
    title: "Check expiry",
    description: "See whether the token is active or expired.",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "No upload",
    description: "JWT data stays in your browser and is not sent to a server.",
    icon: <ShieldAlert className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use JWT Decoder
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}

export default function JwtDecoderPage() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<JwtDecoded | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const expiry = useMemo(
    () => getExpiryStatus(decoded?.payload?.exp),
    [decoded],
  );

  function handleDecode() {
    try {
      setError("");

      if (!input.trim()) {
        setDecoded(null);
        setError("Paste a JWT token first.");
        return;
      }

      setDecoded(decodeJwt(input));
    } catch (caughtError) {
      setDecoded(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not decode this JWT.",
      );
    }
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setDecoded(null);
    setError("");
    setCopied("");
  }

  const headerOutput = decoded ? formatJson(decoded.header) : "";
  const payloadOutput = decoded ? formatJson(decoded.payload) : "";

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          JWT Decoder
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Decode JWT headers and payloads locally, inspect expiry claims, and
          keep tokens off the server.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <label className="mb-3 block text-sm font-semibold text-slate-300">
          JWT input
        </label>

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste JWT here..."
          className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
        />

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleDecode}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <KeyRound className="h-4 w-4" />
            Decode JWT
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Header
            </label>

            <button
              onClick={() => copyValue("header", headerOutput)}
              disabled={!headerOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {copied === "header" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "header" ? "Copied" : "Copy"}
            </button>
          </div>

          <textarea
            readOnly
            value={headerOutput}
            placeholder="Decoded header will appear here..."
            className="min-h-[300px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Payload
            </label>

            <button
              onClick={() => copyValue("payload", payloadOutput)}
              disabled={!payloadOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {copied === "payload" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "payload" ? "Copied" : "Copy"}
            </button>
          </div>

          <textarea
            readOnly
            value={payloadOutput}
            placeholder="Decoded payload will appear here..."
            className="min-h-[300px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Expiry display</h2>
            <p className="mt-1 text-sm text-slate-400">{expiry.detail}</p>
          </div>

          <span
            className={[
              "inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold",
              expiry.expired
                ? "bg-red-500/10 text-red-300"
                : decoded?.payload?.exp
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-800 text-slate-400",
            ].join(" ")}
          >
            {expiry.label}
          </span>
        </div>
      </div>
      <HowToUseSection />
    </Container>
  );
}