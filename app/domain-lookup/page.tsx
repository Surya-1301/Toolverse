"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Copy,
  Fingerprint,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Network,
  Search,
  Server,
  Eraser,
  ShieldCheck,
  ShieldX,
  User,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { fetchApi } from "@/lib/apiBase";

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
   HOW TO USE
========================================================================== */

const howToUseSteps = [
  {
    title: "Enter a domain",
    description: "Type the domain or hostname you want to inspect.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Pick DNS, WHOIS, or SSL",
    description: "Query records, look up ownership, or check the TLS certificate.",
    icon: <Server className="h-5 w-5" />,
  },
  {
    title: "Review results",
    description: "See records, registrar, dates, contacts, and cert validity.",
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: "Copy anything",
    description: "Copy the results to your clipboard in one click.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Spot expiring certs",
    description: "Catch certificates rolling over before they break TLS.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Look up another",
    description: "Search a new domain without reloading the page.",
    icon: <Search className="h-5 w-5" />,
  },
];


/* ==========================================================================
   MODE
========================================================================== */

type LookupMode = "whois" | "dns" | "ssl";

/* ==========================================================================
   DNS TYPES & LOGIC
========================================================================== */

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
type RecordType = (typeof RECORD_TYPES)[number];

type DnsRecord = {
  type: RecordType;
  ttl: number;
  data: string;
};

/* ==========================================================================
   WHOIS TYPES & LOGIC
========================================================================== */

interface Contact {
  kind?: string;
  name?: string;
  email?: string;
  phone?: string;
}

type WhoisResult = {
  domain: string;
  registrar: string;
  status: string[];
  events: { eventAction: string; eventDate: string }[];
  nameservers: string[];
  registrant: Contact | null;
  administrative: Contact | null;
  technical: Contact | null;
  raw: string;
};

/* ==========================================================================
   SSL / TLS TYPES
   ========================================================================== */

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

function sslFormatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function certDaysUntil(value: string) {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function certStatus(cert: Certificate) {
  const days = certDaysUntil(cert.not_after);
  const expiryMs = new Date(cert.not_after).getTime();

  if (isNaN(expiryMs)) {
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

type JCard = Array<string | Record<string, unknown>>;

interface RegistrantInfo {
  registrant: Contact | null;
  administrative: Contact | null;
  technical: Contact | null;
  registrar: string;
}

function getJCardProperty(jcard: JCard, name: string): string | undefined {
  const prop = jcard.find((item) => Array.isArray(item) && item[0] === name);
  if (!prop || !Array.isArray(prop)) return undefined;
  const value = prop[3];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const arr = value as unknown[];
    if (typeof arr[0] === "string") return arr[0];
    if (arr[0] && typeof arr[0] === "object" && "value" in (arr[0] as object)) {
      const inner = (arr[0] as { value?: unknown }).value;
      if (typeof inner === "string") return inner;
    }
  }
  if (value && typeof value === "object" && "value" in (value as object)) {
    const inner = (value as { value?: unknown }).value;
    if (typeof inner === "string") return inner;
  }
  return undefined;
}

function getEntityVcard(entity: Record<string, unknown>): JCard {
  const vcardArray = entity.vcardArray;
  if (Array.isArray(vcardArray) && Array.isArray(vcardArray[1])) {
    return vcardArray[1] as JCard;
  }
  return [];
}

function parseRegistrantEntities(json: Record<string, unknown>): RegistrantInfo {
  const entities = Array.isArray(json.entities) ? (json.entities as Record<string, unknown>[]) : [];
  let registrant: Contact | null = null;
  let administrative: Contact | null = null;
  let technical: Contact | null = null;
  let registrar = "";

  for (const entity of entities) {
    const roles = Array.isArray(entity.roles) ? (entity.roles as string[]) : [];
    const vcard = getEntityVcard(entity);
    const contact: Contact = {
      kind: typeof entity.kind === "string" ? entity.kind : undefined,
      name: getJCardProperty(vcard, "fn"),
      email: getJCardProperty(vcard, "email"),
      phone: getJCardProperty(vcard, "tel"),
    };

    if (roles.includes("registrar")) {
      if (!registrar && contact.name) registrar = contact.name;
    } else if (roles.includes("registrant") || roles.includes("owner")) {
      if (!registrant) registrant = contact;
    } else if (roles.includes("administrative")) {
      if (!administrative) administrative = contact;
    } else if (roles.includes("technical")) {
      if (!technical) technical = contact;
    }
  }

  return { registrant, administrative, technical, registrar };
}

/* ==========================================================================
   RDAP BOOTSTRAP
========================================================================== */

const RDAP_BOOTSTRAP = [
  "https://rdap.org/domain/",
  "https://rdap.verisign.com/com/v1/domain/",
  "https://rdap.ident.net/domain/",
  "https://rdap.nic.google/domain/",
];

async function rdapFetch(url: string): Promise<{
  status: number;
  json: Record<string, unknown> | null;
}> {
  try {
    const res = await fetch(url, { mode: "cors" });
    let json: Record<string, unknown> | null = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json };
  } catch {
    return { status: 0, json: null };
  }
}

async function lookupWhois(domain: string) {
  const cleanDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(cleanDomain)) {
    return { error: "Please enter a valid domain name (e.g., example.com)." };
  }

  const parts = cleanDomain.split(".");
  const tld = parts.slice(1).join(".") || parts[parts.length - 1];
  if (!tld) return { error: "Please enter a valid domain name." };

  const rawTextRef = { value: "" };

  for (const base of RDAP_BOOTSTRAP) {
    const { status, json } = await rdapFetch(`${base}${cleanDomain}`);

    if (json) {
      rawTextRef.value = JSON.stringify(json, null, 2);
      if (status === 200 || status === 404) {
        if (json.errorCode === 404 || status === 404) {
          return { error: `No RDAP record found for "${cleanDomain}".` };
        }
        return { json, raw: rawTextRef.value };
      }
    }
  }

  try {
    const ianaRes = await fetch(`https://data.iana.org/rdap/dns.json`);
    const iana = await ianaRes.json();
    const services = Array.isArray(iana.services) ? (iana.services as [string[], string][]) : [];
    let rdapBase = "";
    for (const [tlds, urls] of services) {
      if (tlds.some((t) => t.toLowerCase() === tld.toLowerCase())) {
        rdapBase = Array.isArray(urls) && urls.length > 0 ? String(urls[0]) : "";
        break;
      }
    }

    if (rdapBase) {
      const baseUrl = rdapBase.endsWith("/") ? rdapBase : `${rdapBase}/`;
      const { status, json } = await rdapFetch(`${baseUrl}domain/${cleanDomain}`);
      if (json) {
        rawTextRef.value = JSON.stringify(json, null, 2);
        if (status === 404 || json.errorCode === 404) {
          return { error: `No RDAP record found for "${cleanDomain}".` };
        }
        return { json, raw: rawTextRef.value };
      }
    }
  } catch {
    /* fall through */
  }

  return { error: "Could not resolve the RDAP registry for this TLD. Try another domain." };
}

/* ==========================================================================
   SHARED HELPERS
========================================================================== */

function cleanHost(value: string) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function DomainLookupPage() {
  const [mode, setMode] = useState<LookupMode>("whois");
  const [domain, setDomain] = useState("");

  /* ---- DNS state ---- */
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [records, setRecords] = useState<DnsRecord[]>([]);

  /* ---- WHOIS state ---- */
  const [whoisResult, setWhoisResult] = useState<WhoisResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  /* ---- SSL state ---- */
  const [sslResult, setSslResult] = useState<CertResult | null>(null);
  const [sslCopied, setSslCopied] = useState("");

  /* ---- Shared state ---- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function switchMode(next: LookupMode) {
    setMode(next);
    setError("");
    setRecords([]);
    setWhoisResult(null);
    setSslResult(null);
  }

  function clearAll() {
    setDomain("");
    setRecords([]);
    setWhoisResult(null);
    setSslResult(null);
    setError("");
  }

  /* ---- DNS lookup ---- */
  async function dnsLookup() {
    const host = cleanHost(domain);
    if (!host) return;

    setLoading(true);
    setError("");
    setRecords([]);

    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${recordType}`,
      );
      if (!response.ok) throw new Error(`DNS query failed (${response.status}).`);

      const json = await response.json();

      if (json.Status === 2) {
        setError("The server responded with a DNS failure (NXDOMAIN or error).");
        return;
      }

      const answers: DnsRecord[] = (json.Answer || []).map(
        (answer: { type: number; TTL: number; data: string }) => ({
          type: recordType,
          ttl: answer.TTL ?? 0,
          data: answer.data,
        }),
      );

      if (!answers.length) {
        setError("No records found for this domain.");
        return;
      }

      setRecords(answers);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "DNS lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ---- WHOIS lookup ---- */
  async function whoisLookup() {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setWhoisResult(null);

    const data = await lookupWhois(domain);

    if (data.error || !data.json) {
      setError(data.error || "Lookup failed.");
      setLoading(false);
      return;
    }

    const json = data.json;
    const reg = parseRegistrantEntities(json);

    let registrar = reg.registrar;
    const registrarEntity = Array.isArray(json.entities)
      ? (json.entities as Record<string, unknown>[]).find((e) =>
          Array.isArray(e.roles) && (e.roles as string[]).includes("registrar"),
        )
      : undefined;
    if (!registrar && registrarEntity) {
      const vcard = (registrarEntity as { vcardArray?: [unknown, JCard] }).vcardArray?.[1];
      registrar = vcard ? getJCardProperty(vcard, "fn") || "" : "";
    }

    const events = Array.isArray(json.events)
      ? (json.events as { eventAction?: string; eventDate?: string }[]).map((e) => ({
          eventAction: e.eventAction || "unknown",
          eventDate: e.eventDate || "",
        }))
      : [];

    const nameservers = Array.isArray(json.nameservers)
      ? (json.nameservers as Record<string, unknown>[]).map((ns) =>
          typeof ns.ldhName === "string" ? ns.ldhName : "",
        ).filter(Boolean)
      : [];

    const status = Array.isArray(json.status) ? (json.status as string[]) : [];

    setWhoisResult({
      domain: typeof json.ldhName === "string" ? json.ldhName : json.handle ? String(json.handle) : cleanHost(domain),
      registrar,
      status,
      events,
      nameservers,
      registrant: reg.registrant,
      administrative: reg.administrative,
      technical: reg.technical,
      raw: data.raw || "",
    });
    setLoading(false);
  }

  /* ---- SSL lookup ---- */
  async function sslLookup() {
    const host = cleanHost(domain);
    if (!host) return;
    setLoading(true);
    setError("");
    setSslResult(null);

    try {
      const response = await fetchApi(`/api/ssl?domain=${encodeURIComponent(host)}`, {
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
      setSslResult(json);
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

  function runLookup() {
    if (mode === "dns") void dnsLookup();
    else if (mode === "whois") void whoisLookup();
    else void sslLookup();
  }

  /* ---- Copy ---- */
  async function copyDns() {
    const text = records.map((r) => `${r.type} ${r.ttl} ${r.data}`).join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyWhois() {
    if (!whoisResult) return;
    const lines = [
      `Domain: ${whoisResult.domain}`,
      `Registrar: ${whoisResult.registrar || "—"}`,
      "",
      ...whoisResult.events.map((e) => `${labelForAction(e.eventAction)}: ${formatDate(e.eventDate)}`),
      "",
      ...(whoisResult.nameservers.length ? [`Name Servers:`, ...whoisResult.nameservers.map((n) => `  ${n}`)] : []),
      "",
      ...(whoisResult.status.length ? [`Status:`, ...whoisResult.status.map((s) => `  ${s}`)] : []),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  /* ---- Format helpers ---- */
  function formatDate(value: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function labelForAction(action: string) {
    const map: Record<string, string> = {
      registration: "Created",
      expiration: "Expires",
      last_changed: "Last updated",
      transfer: "Last transferred",
    };
    return map[action] || action;
  }

  /* ---- SSL copy ---- */
  async function copySsl(serial: string) {
    const cert = sslResult?.certificates.find((c) => c.serial_number === serial);
    if (!cert) return;
    const text = [
      `Domain: ${sslResult?.domain}`,
      `Common name: ${cert.common_name}`,
      `Issuer: ${cert.issuer_name}`,
      `Valid from: ${sslFormatDate(cert.not_before)}`,
      `Expires: ${sslFormatDate(cert.not_after)}`,
      `Serial: ${cert.serial_number}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setSslCopied(serial);
    setTimeout(() => setSslCopied(""), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Domain Lookup
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Query DNS records or look up WHOIS ownership, registrar, and dates for
          any domain.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Mode toggle */}
        <div className="mb-4 flex rounded-xl border border-white/10 bg-slate-950 p-1">
          <button
            onClick={() => switchMode("whois")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === "whois" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            WHOIS
          </button>
          <button
            onClick={() => switchMode("dns")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === "dns" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Server className="h-4 w-4" />
            DNS
          </button>
          <button
            onClick={() => switchMode("ssl")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mode === "ssl" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <LockKeyhole className="h-4 w-4" />
            SSL
          </button>
        </div>

        {/* Input row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void runLookup(); }}
              placeholder="example.com"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          {mode === "dns" && (
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
            >
              {RECORD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}

          <button
            onClick={runLookup}
            disabled={!domain.trim() || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Looking up..." : "Look up"}
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <Network className="h-5 w-5 shrink-0 text-red-300" />
            <p className="text-sm font-medium leading-6 text-red-200">{error}</p>
          </div>
        )}

        {/* ===== DNS results ===== */}
        {mode === "dns" && records.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                {records.length} {recordType} record{records.length > 1 ? "s" : ""} for {cleanHost(domain)}
              </p>
              <button
                onClick={copyDns}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="space-y-2">
              {records.map((record, index) => (
                <div key={index} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-4">
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
        )}

        {/* ===== WHOIS results ===== */}
        {mode === "whois" && whoisResult && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</p>
                <p className="mt-1 text-lg font-bold text-white">{whoisResult.domain}</p>
              </div>
              <button
                onClick={copyWhois}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registrar</p>
                  <p className="mt-1 break-words text-sm font-semibold text-white">{whoisResult.registrar || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  {whoisResult.status.length ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {whoisResult.status.map((s) => (
                        <span key={s} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-white">—</p>
                  )}
                </div>
              </div>
            </div>

            {whoisResult.events.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Important Dates</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {whoisResult.events.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-950 p-3">
                      <Clock className="h-4 w-4 shrink-0 text-violet-400" />
                      <div>
                        <p className="text-[11px] text-slate-500">{labelForAction(e.eventAction)}</p>
                        <p className="text-sm font-semibold text-white">{formatDate(e.eventDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <ContactCard title="Registrant" contact={whoisResult.registrant} icon={<User className="h-4 w-4" />} />
              <ContactCard title="Administrative" contact={whoisResult.administrative} icon={<Fingerprint className="h-4 w-4" />} />
              <ContactCard title="Technical" contact={whoisResult.technical} icon={<MapPin className="h-4 w-4" />} />
            </div>

            {whoisResult.nameservers.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name Servers</p>
                <div className="flex flex-wrap gap-2">
                  {whoisResult.nameservers.map((ns) => (
                    <span key={ns} className="rounded-lg bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-300">{ns}</span>
                  ))}
                </div>
              </div>
            )}

            {whoisResult.raw && (
              <div>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  {showRaw ? "Hide" : "Show"} raw RDAP data
                </button>
                {showRaw && (
                  <pre className="mt-3 max-h-96 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-[11px] leading-5 text-slate-300">
                    {whoisResult.raw}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== SSL results ===== */}
        {mode === "ssl" && sslResult && (
          <div className="mt-6 space-y-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <LockKeyhole className="h-5 w-5 text-violet-300" />
                {sslResult.domain}
              </h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {sslResult.certificateCount} cert{sslResult.certificateCount === 1 ? "" : "s"} found
              </span>
            </div>

            {sslResult.certificates.length ? (
              <div className="space-y-4">
                {sslResult.certificates.map((cert, index) => {
                  const info = certStatus(cert);
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
                            {sslFormatDate(cert.not_before)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Expires
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-200">
                            {sslFormatDate(cert.not_after)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-950 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Fingerprint className="h-3.5 w-3.5" />
                            Serial
                          </p>
                          <button
                            onClick={() => copySsl(cert.serial_number)}
                            className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                          >
                            <span className="truncate">
                              {sslCopied === cert.serial_number ? "Copied!" : cert.serial_number || "—"}
                            </span>
                            {sslCopied !== cert.serial_number ? (
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
        )}
      </div>

      {/* Clear button */}
      {domain && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={clearAll}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      )}

      <HowToUse
        title="How to use Domain Lookup"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}

/* ==========================================================================
   CONTACT CARD
========================================================================== */

function ContactCard({ title, contact, icon }: { title: string; contact: Contact | null; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {contact ? (
        <div className="space-y-2 text-sm">
          {contact.name && <p className="break-words text-slate-200">{contact.name}</p>}
          {contact.email && (
            <p className="flex items-center gap-2 break-all text-xs text-slate-400">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="flex items-center gap-2 break-all text-xs text-slate-400">
              <Globe2 className="h-3.5 w-3.5 shrink-0" /> {contact.phone}
            </p>
          )}
          {contact.kind && <p className="text-xs text-slate-500 capitalize">{contact.kind}</p>}
        </div>
      ) : (
        <p className="text-xs text-slate-500">—</p>
      )}
    </div>
  );
}
