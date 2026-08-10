"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Eraser,
  Globe2,
  RefreshCw,
  Timer,
  Wand2,
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

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().slice(0, 16);
}

function formatDate(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "long",
    timeZone,
  }).format(date);
}

function getTimezoneOffsetLabel(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);

  const hours = String(
    Math.floor(absoluteMinutes / 60),
  ).padStart(2, "0");

  const minutes = String(absoluteMinutes % 60).padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

function parseUnixTimestamp(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter a Unix timestamp first.");
  }

  const numericValue = Number(trimmed);

  if (!Number.isFinite(numericValue)) {
    throw new Error("Unix timestamp must be a number.");
  }

  const milliseconds =
    trimmed.length >= 13 || Math.abs(numericValue) > 9999999999
      ? numericValue
      : numericValue * 1000;

  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid Unix timestamp.");
  }

  return date;
}

const commonTimezones = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const howToUseSteps = [
  {
    title: "Enter timestamp",
    description:
      "Paste a Unix timestamp in seconds or milliseconds.",
    icon: <Timer className="h-5 w-5" />,
  },
  {
    title: "Convert to date",
    description:
      "Turn the Unix timestamp into readable local and UTC dates.",
    icon: <CalendarClock className="h-5 w-5" />,
  },
  {
    title: "Pick date",
    description:
      "Choose a date and time to convert back into Unix format.",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "View timezone",
    description:
      "Check the output in local time, UTC, and a selected timezone.",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Copy result",
    description:
      "Copy the formatted conversion result to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear fields",
    description:
      "Reset the converter when you want to start again.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Timestamp Converter
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

export default function TimestampConverterPage() {
  // No predefined timestamp
  const [timestampInput, setTimestampInput] = useState("");

  // No predefined date/time
  const [dateInput, setDateInput] = useState("");

  // No predefined timezone
  const [timezone, setTimezone] = useState("");

  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function unixToDate() {
    try {
      setError("");

      const date = parseUnixTimestamp(timestampInput);

      const seconds = Math.floor(date.getTime() / 1000);
      const milliseconds = date.getTime();

      setDateInput(toDatetimeLocalValue(date));

      const timezoneOutput = timezone
        ? `${timezone}: ${formatDate(date, timezone)}`
        : "Selected timezone: Not selected";

      setOutput(
        [
          `Unix seconds: ${seconds}`,
          `Unix milliseconds: ${milliseconds}`,
          `Local time: ${formatDate(date)}`,
          `UTC time: ${date.toUTCString()}`,
          timezoneOutput,
          `Local timezone: ${
            Intl.DateTimeFormat().resolvedOptions().timeZone
          } (${getTimezoneOffsetLabel(date)})`,
          `ISO: ${date.toISOString()}`,
        ].join("\n"),
      );
    } catch (caughtError) {
      setOutput("");

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert timestamp.",
      );
    }
  }

  function dateToUnix() {
    try {
      setError("");

      if (!dateInput) {
        setOutput("");
        setError("Choose a date first.");
        return;
      }

      const date = new Date(dateInput);

      if (Number.isNaN(date.getTime())) {
        setOutput("");
        setError("Invalid date.");
        return;
      }

      const seconds = Math.floor(date.getTime() / 1000);
      const milliseconds = date.getTime();

      setTimestampInput(String(seconds));

      const timezoneOutput = timezone
        ? `${timezone}: ${formatDate(date, timezone)}`
        : "Selected timezone: Not selected";

      setOutput(
        [
          `Unix seconds: ${seconds}`,
          `Unix milliseconds: ${milliseconds}`,
          `Local time: ${formatDate(date)}`,
          `UTC time: ${date.toUTCString()}`,
          timezoneOutput,
          `Local timezone: ${
            Intl.DateTimeFormat().resolvedOptions().timeZone
          } (${getTimezoneOffsetLabel(date)})`,
          `ISO: ${date.toISOString()}`,
        ].join("\n"),
      );
    } catch {
      setOutput("");
      setError("Could not convert date.");
    }
  }

  function useCurrentTime() {
    const currentDate = new Date();

    setTimestampInput(
      String(Math.floor(currentDate.getTime() / 1000)),
    );

    setDateInput(toDatetimeLocalValue(currentDate));

    setError("");

    const timezoneOutput = timezone
      ? `${timezone}: ${formatDate(currentDate, timezone)}`
      : "Selected timezone: Not selected";

    setOutput(
      [
        `Unix seconds: ${Math.floor(
          currentDate.getTime() / 1000,
        )}`,
        `Unix milliseconds: ${currentDate.getTime()}`,
        `Local time: ${formatDate(currentDate)}`,
        `UTC time: ${currentDate.toUTCString()}`,
        timezoneOutput,
        `Local timezone: ${
          Intl.DateTimeFormat().resolvedOptions().timeZone
        } (${getTimezoneOffsetLabel(currentDate)})`,
        `ISO: ${currentDate.toISOString()}`,
      ].join("\n"),
    );
  }

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setTimestampInput("");
    setDateInput("");
    setTimezone("");
    setOutput("");
    setError("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Timestamp Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert Unix timestamps to dates, dates to Unix timestamps,
          and view timezone-aware output instantly.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left Panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          {/* Unix Timestamp */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Unix timestamp
            </label>

            <input
              value={timestampInput}
              onChange={(event) =>
                setTimestampInput(event.target.value)
              }
              placeholder="Seconds or milliseconds..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>

          {/* Date and Time */}
          <div className="mt-5">
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Date and time
            </label>

            <input
              type="datetime-local"
              value={dateInput}
              onChange={(event) =>
                setDateInput(event.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-violet-500"
            />
          </div>

          {/* Timezone */}
          <div className="mt-5">
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Timezone display
            </label>

            <select
              value={timezone}
              onChange={(event) =>
                setTimezone(event.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
            >
              <option value="">
                Select timezone
              </option>

              {commonTimezones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={unixToDate}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Wand2 className="h-4 w-4" />
              Timestamp to date
            </button>

            <button
              onClick={dateToUnix}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Date to timestamp
            </button>

            <button
              onClick={useCurrentTime}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Clock className="h-4 w-4" />
              Use now
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

        {/* Right Panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Output
            </label>

            <button
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Converted timestamp details will appear here..."
            className="min-h-[420px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
          />
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}