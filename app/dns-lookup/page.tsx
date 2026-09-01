"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Globe2,
  Loader2,
  Network,
  Search,
  Server,
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

const howToUseSteps = [
  {
    title: "Enter a domain",
    description: "Type the hostname you want to resolve.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Pick a record",
    description: "Choose A, AAAA, CNAME, MX, TXT, or NS records.",
    icon: <Server className="h-5 w-5" />,
  },
  {
    title: "Look it up",
    description: "Query public DNS servers for the record.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Review results",
    description: "See TTLs and all returned values.",
    icon: <Network className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use DNS Lookup
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
type RecordType = (typeof RECORD_TYPES)[number];

type Record = {
  type: RecordType;
  ttl: number;
  data: string;
};

export default function DnsLookupPage() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function lookup() {
    const host = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!host) return;

    setLoading(true);
    setError("");
    setRecords([]);

    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${recordType}`,
      );

      if (!response.ok) {
        throw new Error(`DNS query failed (${response.status}).`);
      }

      const json = await response.json();

      if (json.Status === 2) {
        setError("The server responded with a DNS failure (NXDOMAIN or error).");
        return;
      }

      const answers: Record[] = (json.Answer || []).map((answer: { type: number; TTL: number; data: string }) => ({
        type: recordType,
        ttl: answer.TTL ?? 0,
        data: answer.data,
      }));

      if (!answers.length) {
        setError("No records found for this domain.");
        return;
      }

      setRecords(answers);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "DNS lookup failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyResults() {
    const text = records
      .map((record) => `${record.type} ${record.ttl} ${record.data}`)
      .join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          DNS Lookup
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Query DNS records (A, AAAA, CNAME, MX, TXT, NS) for any domain using
          public DNS-over-HTTPS resolvers.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void lookup();
              }}
              placeholder="example.com"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <select
            value={recordType}
            onChange={(event) => setRecordType(event.target.value as RecordType)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
          >
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            onClick={lookup}
            disabled={!domain.trim() || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Looking up..." : "Look up"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <Network className="h-6 w-6 text-red-300" />
            <p className="text-sm leading-6 text-red-200">{error}</p>
          </div>
        ) : null}

        {records.length ? (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                {records.length} {recordType} record{records.length > 1 ? "s" : ""} for {domain.trim()}
              </p>
              <button
                onClick={copyResults}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="space-y-2">
              {records.map((record, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-4"
                >
                  <span className="rounded-md bg-violet-600/15 px-2 py-0.5 font-mono text-xs font-bold text-violet-300">
                    {record.type}
                  </span>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    TTL {record.ttl}
                  </span>
                  <span className="min-w-0 flex-1 break-all font-mono text-sm text-slate-100">
                    {record.data}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <HowToUseSection />
    </Container>
  );
}