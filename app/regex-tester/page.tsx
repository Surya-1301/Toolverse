"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eraser,
  FileText,
  Flag,
  Highlighter,
  Regex,
  Search,
} from "lucide-react";
import { Container } from "@/components/Container";

type MatchItem = {
  index: number;
  value: string;
  start: number;
  end: number;
  groups: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHighlightedHtml(text: string, matches: MatchItem[]) {
  if (!text) return "";

  if (!matches.length) {
    return escapeHtml(text);
  }

  let html = "";
  let cursor = 0;

  for (const match of matches) {
    html += escapeHtml(text.slice(cursor, match.start));

    html += `<mark class="rounded bg-violet-500/35 px-1 text-violet-100">${escapeHtml(
      match.value,
    )}</mark>`;

    cursor = match.end;
  }

  html += escapeHtml(text.slice(cursor));

  return html.replace(/\n/g, "<br />");
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
    title: "Enter regex",
    description:
      "Type your regular expression pattern in the regex input.",
    icon: <Regex className="h-5 w-5" />,
  },
  {
    title: "Add test text",
    description:
      "Paste the text you want to test your pattern against.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Choose flags",
    description:
      "Enable flags like global, ignore case, multiline, or dotAll.",
    icon: <Flag className="h-5 w-5" />,
  },
  {
    title: "Find matches",
    description:
      "Run the regex and view all matches with positions.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Highlight matches",
    description:
      "Matched text is highlighted in the preview panel.",
    icon: <Highlighter className="h-5 w-5" />,
  },
  {
    title: "Copy results",
    description:
      "Copy the match list or clear everything when done.",
    icon: <Copy className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Regex Tester
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

export default function RegexTesterPage() {
  // Empty initial values — no predefined regex or test text
  const [pattern, setPattern] = useState("");
  const [testText, setTestText] = useState("");

  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
  });

  const [copied, setCopied] = useState(false);

  const flagString = useMemo(() => {
    return [
      flags.global ? "g" : "",
      flags.ignoreCase ? "i" : "",
      flags.multiline ? "m" : "",
      flags.dotAll ? "s" : "",
    ].join("");
  }, [flags]);

  const result = useMemo(() => {
    try {
      if (!pattern) {
        return {
          error: "",
          matches: [] as MatchItem[],
        };
      }

      const regex = new RegExp(pattern, flagString || undefined);
      const matches: MatchItem[] = [];

      if (flags.global) {
        let match: RegExpExecArray | null;
        let safety = 0;

        while ((match = regex.exec(testText)) && safety < 1000) {
          matches.push({
            index: matches.length + 1,
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            groups: match.slice(1),
          });

          // Prevent infinite loops for zero-length matches
          if (match[0] === "") {
            regex.lastIndex += 1;
          }

          safety += 1;
        }
      } else {
        const match = regex.exec(testText);

        if (match) {
          matches.push({
            index: 1,
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            groups: match.slice(1),
          });
        }
      }

      return {
        error: "",
        matches,
      };
    } catch (caughtError) {
      return {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Invalid regular expression.",
        matches: [] as MatchItem[],
      };
    }
  }, [pattern, flagString, flags.global, testText]);

  const highlightedHtml = useMemo(
    () => buildHighlightedHtml(testText, result.matches),
    [testText, result.matches],
  );

  const matchOutput = useMemo(() => {
    if (!result.matches.length) return "";

    return result.matches
      .map(
        (match) =>
          `#${match.index}: "${match.value}" at ${match.start}-${match.end}${
            match.groups.length
              ? `\nGroups: ${match.groups
                  .map((group, index) => `${index + 1}: ${group}`)
                  .join(", ")}`
              : ""
          }`,
      )
      .join("\n\n");
  }, [result.matches]);

  function updateFlag(
    key: keyof typeof flags,
    value: boolean,
  ) {
    setFlags((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function copyMatches() {
    if (!matchOutput) return;

    await navigator.clipboard.writeText(matchOutput);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function clearAll() {
    setPattern("");
    setTestText("");

    setFlags({
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
    });

    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Regex Tester
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Test regular expressions with flags, match highlighting,
          capture groups, and detailed match positions.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Regex input
          </label>

          <div className="flex rounded-2xl border border-white/10 bg-slate-950 focus-within:border-violet-500">
            <span className="border-r border-white/10 px-4 py-3 font-mono text-slate-500">
              /
            </span>

            <input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="Enter regex pattern..."
              className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />

            <span className="border-l border-white/10 px-4 py-3 font-mono text-slate-500">
              /{flagString}
            </span>
          </div>

          {/* Regex flags */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={flags.global}
                onChange={(event) =>
                  updateFlag("global", event.target.checked)
                }
                className="h-4 w-4 accent-violet-600"
              />

              Global `g`
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={flags.ignoreCase}
                onChange={(event) =>
                  updateFlag(
                    "ignoreCase",
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-violet-600"
              />

              Ignore case `i`
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={flags.multiline}
                onChange={(event) =>
                  updateFlag(
                    "multiline",
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-violet-600"
              />

              Multiline `m`
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={flags.dotAll}
                onChange={(event) =>
                  updateFlag("dotAll", event.target.checked)
                }
                className="h-4 w-4 accent-violet-600"
              />

              Dot all `s`
            </label>
          </div>

          {/* Test text */}
          <label className="mb-3 mt-5 block text-sm font-semibold text-slate-300">
            Test text
          </label>

          <textarea
            value={testText}
            onChange={(event) => setTestText(event.target.value)}
            placeholder="Paste test text here..."
            className="min-h-[280px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

          {/* Error */}
          {result.error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {result.error}
            </p>
          ) : null}

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={copyMatches}
              disabled={!matchOutput}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              {copied ? "Copied" : "Copy matches"}
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

        {/* Right panel */}
        <div className="space-y-6">
          {/* Match highlighting */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-slate-300">
                Match highlighting
              </label>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                {result.matches.length} match
                {result.matches.length === 1 ? "" : "es"}
              </span>
            </div>

            <div
              className="min-h-[260px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-200"
              dangerouslySetInnerHTML={{
                __html:
                  highlightedHtml ||
                  "Matches will appear here.",
              }}
            />
          </div>

          {/* Match details */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Match details
            </label>

            <textarea
              readOnly
              value={matchOutput}
              placeholder="Match details will appear here..."
              className="min-h-[260px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
            />
          </div>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}