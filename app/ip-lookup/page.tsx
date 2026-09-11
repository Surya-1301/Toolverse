"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  Crosshair,
  Globe2,
  Loader2,
  MapPin,
  RefreshCw,
  Router,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { fetchApi } from "@/lib/apiBase";

type IpInfo = {
  ip: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  regionCode: string | null;
  continent: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  postalCode: string | null;
  metroCode: string | null;
  asn: string | null;
  asOrganization: string | null;
  isp: string | null;
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

const howToUseSteps = [
  {
    title: "Auto-detect your IP",
    description: "Your public IP is detected automatically on page load.",
    icon: <Crosshair className="h-5 w-5" />,
  },
  {
    title: "Look up any IP",
    description: "Enter any IP address to view its location, network, and timezone.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "View location",
    description: "See the country, city, region, and coordinates.",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Check network",
    description: "Review the ASN, organization, and timezone.",
    icon: <Router className="h-5 w-5" />,
  },
  {
    title: "Copy the IP",
    description: "Copy any IP address to the clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Refresh anytime",
    description: "Re-check if your IP or location changes.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
];

export default function IpLookupPage() {
  const [data, setData] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState("");
  // Tracks whether we are showing "your IP" or a looked-up IP.
  const [lookingUpOwn, setLookingUpOwn] = useState(true);

  async function runLookup(targetIp?: string) {
    try {
      // "My IP" uses the backend (Cloudflare cf properties).
      // Custom IP uses ipwho.is directly — no backend deploy needed.
      if (!targetIp) {
        const response = await fetchApi("/api/ip", { cache: "no-store" });
        const text = await response.text();
        let json: (IpInfo & { error?: string }) | null = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        if (!response.ok) {
          setError(json?.error || `Could not load IP info. Backend returned ${response.status}.`);
          setData(null);
          return;
        }
        setData(json);
        return;
      }

      // Custom IP — call ipwho.is directly (free, HTTPS, CORS).
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(targetIp)}`);
      const j: Record<string, unknown> = await res.json();

      if (j.success === false) {
        setError(typeof j.message === "string" ? j.message : "Invalid IP address.");
        setData(null);
        return;
      }

      const conn = (j.connection || {}) as Record<string, unknown>;
      setData({
        ip: typeof j.ip === "string" ? j.ip : targetIp,
        countryCode: typeof j.country_code === "string" ? j.country_code : null,
        city: typeof j.city === "string" ? j.city : null,
        region: typeof j.region === "string" ? j.region : null,
        regionCode: typeof j.region_code === "string" ? j.region_code : null,
        continent: typeof j.continent === "string" ? j.continent : null,
        latitude:
          typeof j.latitude === "number" || typeof j.latitude === "string"
            ? String(j.latitude)
            : null,
        longitude:
          typeof j.longitude === "number" || typeof j.longitude === "string"
            ? String(j.longitude)
            : null,
        timezone:
          typeof j.timezone === "object" && j.timezone !== null && typeof (j.timezone as Record<string, unknown>).id === "string"
            ? String((j.timezone as Record<string, unknown>).id)
            : null,
        postalCode: typeof j.postal === "string" ? j.postal : null,
        metroCode: null,
        asn:
          typeof conn.asn === "number" || typeof conn.asn === "string"
            ? String(conn.asn)
            : null,
        asOrganization: typeof conn.org === "string" ? conn.org : null,
        isp: typeof conn.isp === "string" ? conn.isp : null,
      });
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not load IP info: ${caughtError.message}`
          : "Could not load IP info.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function lookupOwn() {
    setLookingUpOwn(true);
    setCustomIp("");
    setLoading(true);
    setError("");
    void runLookup();
  }

  function lookupCustom() {
    const ip = customIp.trim();
    if (!ip) return;
    setLookingUpOwn(false);
    setLoading(true);
    setError("");
    void runLookup(ip);
  }

  // Initial lookup on load. `loading` already starts true and the state
  // updates happen after the awaited fetch, so this is a standard
  // fetch-on-mount effect rather than a cascading setState.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runLookup();
  }, []);

  async function copyIp() {
    if (!data?.ip) return;

    await navigator.clipboard.writeText(data.ip);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  const locationParts = [data?.city, data?.region, data?.countryCode]
    .filter(Boolean)
    .join(", ");

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          IP Address Lookup
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          See your public IP address or look up any IP with its approximate
          location, network, and timezone details.
        </p>
      </div>

      {/* IP lookup input */}
      <div className="mx-auto mt-8 max-w-xl">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
            <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") lookupCustom(); }}
              placeholder="Enter any IP — e.g. 8.8.8.8, 1.1.1.1"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              onClick={lookupCustom}
              disabled={!customIp.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-4 w-4" />
              Look up
            </button>
            <button
              onClick={lookupOwn}
              disabled={lookingUpOwn || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <User className="h-4 w-4" />
              My IP
            </button>
          </div>
        </div>
        {!lookingUpOwn && data?.ip && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-violet-600/10 px-4 py-2 text-xs text-slate-300">
            <Globe2 className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            Showing results for <span className="font-mono font-semibold text-white">{data.ip}</span>
            <button
              onClick={lookupOwn}
              className="ml-auto text-xs font-semibold text-violet-400 transition hover:text-violet-300"
            >
              View my IP →
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              {lookingUpOwn ? "Looking up your IP address..." : `Looking up ${customIp}...`}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-sm leading-6 text-red-200">{error}</p>
            <button
              onClick={() => lookingUpOwn ? lookupOwn() : lookupCustom()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : data ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            {/* IP highlight */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                {lookingUpOwn ? "Your public IP address" : "Lookup result"}
              </p>
              <p className="mt-2 break-all font-mono text-3xl font-bold text-white">
                {data.ip}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={copyIp}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy IP"}
                </button>

                <button
                  onClick={() => lookingUpOwn ? lookupOwn() : lookupCustom()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Location + network grid */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={locationParts || null}
              />
              <InfoRow
                icon={<Globe2 className="h-4 w-4" />}
                label="Country / region code"
                value={
                  data.countryCode
                    ? [data.countryCode, data.regionCode].filter(Boolean).join(" · ") || data.countryCode
                    : null
                }
              />
              <InfoRow
                icon={<Crosshair className="h-4 w-4" />}
                label="Coordinates"
                value={
                  data.latitude && data.longitude
                    ? `${data.latitude}, ${data.longitude}`
                    : null
                }
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Timezone"
                value={data.timezone}
              />
              <InfoRow
                icon={<Router className="h-4 w-4" />}
                label="ASN"
                value={data.asn ? `AS${data.asn}` : null}
              />
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Organization"
                value={data.asOrganization || data.isp}
              />
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Postal code"
                value={data.postalCode}
              />
              <InfoRow
                icon={<Crosshair className="h-4 w-4" />}
                label="Continent"
                value={data.continent}
              />
            </div>
          </div>
        ) : null}
      </div>

      <HowToUse
        title="How to use IP Address Lookup"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
