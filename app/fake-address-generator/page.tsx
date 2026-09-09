"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Globe2,
  Hash,
  MapPin,
  RefreshCw,
  Sparkles,
  Search,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { type Locale, type Address, type FakeUser, locales, formatAddress, generateUser } from "@/lib/fakeData";

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
    title: "Pick a location",
    description: "Choose a country to generate addresses and user profiles for.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Enter zipcode (optional)",
    description: "Enter a specific zipcode/pincode to generate addresses for that area.",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Choose format",
    description: "Single-line or multi-line address output.",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Generate",
    description: "Click the button to produce fresh fake addresses with user profiles.",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "Copy or download",
    description: "Copy any address or profile, copy all, or export as CSV or JSON.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Stays private",
    description: "All addresses and user data are generated locally in your browser.",
    icon: <Sparkles className="h-5 w-5" />,
  },
];


function addressToCsvRow(addr: Address, user: FakeUser): string {
  const fields = [
    user.firstName, user.lastName, user.email, user.phone, user.username,
    addr.street, addr.secondary ?? "", addr.city, addr.state, addr.zip, addr.country,
  ];
  return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(",");
}

export default function FakeAddressGeneratorPage() {
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locales[0]);
  const [count, setCount] = useState(5);
  const [style, setStyle] = useState<"single" | "multi">("multi");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<FakeUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [zipcode, setZipcode] = useState("");

  function generate() {
    const result = Array.from({ length: count }, () => selectedLocale.generate(zipcode.trim() || undefined));
    const userResult = Array.from({ length: count }, () => generateUser());
    setAddresses(result);
    setUsers(userResult);
    setCopied(false);
  }

  function regenerateSingle(index: number) {
    setAddresses((prev) => {
      const next = [...prev];
      next[index] = selectedLocale.generate(zipcode.trim() || undefined);
      return next;
    });
    setUsers((prev) => {
      const next = [...prev];
      next[index] = generateUser();
      return next;
    });
    setCopied(false);
  }

  async function copyAll() {
    if (!addresses.length) return;
    const text = addresses.map((a, i) => {
      const user = users[i];
      const userBlock = user
        ? `${user.firstName} ${user.lastName} (${user.gender})\n${user.username} | ${user.email} | ${user.phone}\nDOB: ${user.dob}`
        : "";
      return userBlock ? `${userBlock}\n${formatAddress(a, style)}` : formatAddress(a, style);
    }).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadCsv() {
    if (!addresses.length) return;
    const header = "First Name,Last Name,Email,Phone,Username,Street,Secondary,City,State,Zip,Country";
    const rows = addresses.map((a, i) => addressToCsvRow(a, users[i]));
    const blob = new Blob([header, "\n", rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fake-addresses-${selectedLocale.key.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    if (!addresses.length) return;
    const data = addresses.map((addr, i) => ({
      user: {
        firstName: users[i].firstName,
        lastName: users[i].lastName,
        email: users[i].email,
        phone: users[i].phone,
        username: users[i].username,
        avatar: users[i].avatar,
        dob: users[i].dob,
        gender: users[i].gender,
      },
      address: {
        street: addr.street,
        secondary: addr.secondary ?? undefined,
        city: addr.city,
        state: addr.state ?? undefined,
        zip: addr.zip,
        country: addr.country,
      },
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fake-addresses-${selectedLocale.key.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyOne(index: number) {
    const user = users[index];
    const addressText = formatAddress(addresses[index], style);
    const text = user
      ? `${user.firstName} ${user.lastName} (${user.gender})\n${user.email} | ${user.phone}\n${addressText}`
      : addressText;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1400);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Fake Address Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
            Generate realistic fake user profiles with addresses, names, emails, and phone numbers. Choose a locale and get random formatted details for testing and demos.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Locale picker */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Location
          </label>
          <div className="flex flex-wrap gap-2">
            {locales.map((loc) => (
              <button
                key={loc.key}
                type="button"
                onClick={() => {
                  setSelectedLocale(loc);
                  setAddresses([]);
                  setZipcode("");
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                  selectedLocale.key === loc.key
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                <span>{loc.flag}</span>
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zipcode/Pincode input */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Zipcode / Pincode (optional)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              placeholder="Enter zipcode to generate addresses for a specific area"
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>
          {zipcode && (
            <p className="mt-1 text-xs text-slate-500">
              Generating addresses for zipcode: <span className="font-mono text-slate-300">{zipcode}</span>
            </p>
          )}
        </div>

        {/* Count */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Count: {count}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Format toggle */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Format
          </label>
          <div className="flex gap-2">
            {(["multi", "single"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStyle(opt)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  style === opt
                    ? "border-violet-500 bg-violet-600/20 text-white"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                {opt === "multi" ? "Multi-line" : "Single-line"}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </button>

          <button
            onClick={copyAll}
            disabled={!addresses.length}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy all"}
          </button>

          <button
            onClick={downloadCsv}
            disabled={!addresses.length}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          <button
            onClick={downloadJson}
            disabled={!addresses.length}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>

        {/* Results */}
        {addresses.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span>{selectedLocale.flag}</span>
              Generated {addresses.length} profile{addresses.length > 1 ? "s" : ""} &amp; address{addresses.length > 1 ? "es" : ""}
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{selectedLocale.label}</span>
            </p>
            <div className="max-h-[600px] overflow-auto rounded-xl border border-white/10 bg-slate-950">
              <ul className="divide-y divide-white/5">
                {addresses.map((addr, index) => {
                  const user = users[index];
                  return (
                    <li key={index} className="flex items-start gap-3 px-4 py-4">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600/20 text-xs font-bold text-violet-300">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {/* User profile */}
                        {user ? (
                          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={user.avatar}
                              alt={`${user.firstName} ${user.lastName} avatar`}
                              className="h-10 w-10 shrink-0 rounded-full bg-white/10"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {user.firstName} {user.lastName}
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                  {user.gender}
                                </span>
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                @{user.username}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                <span className="truncate">{user.email}</span>
                                <span>{user.phone}</span>
                                <span>DOB: {user.dob}</span>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* Address */}
                        {style === "multi" ? (
                          <div className="font-mono text-sm leading-6 text-slate-100">
                            <div>{addr.street}</div>
                            {addr.secondary ? <div>{addr.secondary}</div> : null}
                            <div>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.zip}</div>
                            <div>{addr.country}</div>
                          </div>
                        ) : (
                          <code className="block break-all font-mono text-sm text-slate-100">
                            {formatAddress(addr, "single")}
                          </code>
                        )}
                      </div>
                      <div className="mt-0.5 flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => copyOne(index)}
                          aria-label={`Copy profile and address ${index + 1}`}
                          className={[
                            "rounded-md p-1.5 transition",
                            copiedIndex === index
                              ? "text-emerald-400"
                              : "text-slate-500 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => regenerateSingle(index)}
                          aria-label={`Regenerate profile and address ${index + 1}`}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="">
          </div>
        )}
      </div>
      <HowToUse
        title="How to use Fake Address & User Generator"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}