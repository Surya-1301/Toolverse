"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Eraser,
  Hash,
  ListChecks,
  PenLine,
  Type,
} from "lucide-react";
import { Container } from "@/components/Container";

/* ==========================================================================
   TYPES
========================================================================== */

type ResultKey =
  | "Characters"
  | "No spaces"
  | "Letters"
  | "Numbers"
  | "Spaces"
  | "Punctuation"
  | "Words";

type HowToUseStep = {
  title: string;
  description: string;
  icon: ReactNode;
};

/* ==========================================================================
   RESULT OPTIONS
========================================================================== */

const resultLabels: ResultKey[] = [
  "Characters",
  "No spaces",
  "Letters",
  "Numbers",
  "Spaces",
  "Punctuation",
  "Words",
];

/* ==========================================================================
   HOW TO USE
========================================================================== */

const howToUseSteps: HowToUseStep[] = [
  {
    title: "Paste text",
    description:
      "Type or paste the text you want to analyze into the editor.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "View character count",
    description:
      "See total characters and characters without spaces instantly.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    title: "Check the breakdown",
    description:
      "Review letters, numbers, spaces, punctuation, and words.",
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    title: "Edit and recheck",
    description:
      "Change the text and all statistics update automatically.",
    icon: <PenLine className="h-5 w-5" />,
  },
  {
    title: "Clear",
    description:
      "Reset the editor and start a new character count.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

/* ==========================================================================
   HOW TO USE SECTION
========================================================================== */

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Character Counter
      </h2>

      {/* ====================================================================
          DESKTOP / TABLET
      ==================================================================== */}

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-5
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:border-cyan-400/20
              hover:bg-white/[0.045]
            "
          >
            <div
              className="
                mb-5
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-cyan-500
                text-white
                shadow-lg
                shadow-cyan-500/20
              "
            >
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

      {/* ====================================================================
          MOBILE
      ==================================================================== */}

      <div className="mt-6 grid gap-3 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-cyan-400/10
              bg-[#071522]
              p-4
              shadow-[0_8px_24px_rgba(0,0,0,0.18)]
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-cyan-400/10
                bg-[#092B40]
                text-[#63E5F7]
                shadow-[0_0_18px_rgba(34,211,238,0.08)]
              "
            >
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

/* ==========================================================================
   PAGE
========================================================================== */

export default function CharacterCounterPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const [selectedResult, setSelectedResult] =
    useState<ResultKey>("Characters");

  /* ------------------------------------------------------------------------
     STATISTICS
  ------------------------------------------------------------------------ */

  const stats = useMemo(() => {
    const characters = text.length;

    const charactersNoSpaces =
      text.replace(/\s/gu, "").length;

    const letters =
      (text.match(/[\p{L}]/gu) ?? []).length;

    const digits =
      (text.match(/[0-9]/gu) ?? []).length;

    const spaces =
      (text.match(/\s/gu) ?? []).length;

    const punctuation =
      (text.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;

    const words = text.trim()
      ? text.trim().split(/\s+/u).length
      : 0;

    return {
      characters,
      charactersNoSpaces,
      letters,
      digits,
      spaces,
      punctuation,
      words,
    };
  }, [text]);

  /* ------------------------------------------------------------------------
     RESULT VALUE
  ------------------------------------------------------------------------ */

  const resultValue = useMemo(() => {
    switch (selectedResult) {
      case "Characters":
        return stats.characters;

      case "No spaces":
        return stats.charactersNoSpaces;

      case "Letters":
        return stats.letters;

      case "Numbers":
        return stats.digits;

      case "Spaces":
        return stats.spaces;

      case "Punctuation":
        return stats.punctuation;

      case "Words":
        return stats.words;

      default:
        return 0;
    }
  }, [selectedResult, stats]);

  /* ------------------------------------------------------------------------
     COPY RESULT
  ------------------------------------------------------------------------ */

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(
        String(resultValue),
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  /* ------------------------------------------------------------------------
     CLEAR
  ------------------------------------------------------------------------ */

  function clear() {
    setText("");
    setCopied(false);
    setSelectedResult("Characters");
  }

  /* ------------------------------------------------------------------------
     UI
  ------------------------------------------------------------------------ */

  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      {/* ====================================================================
          BACK
      ==================================================================== */}

      <Link
        href="/tools/text-developer-tools"
        className="
          mb-8
          inline-flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-slate-400
          transition
          hover:text-white
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      {/* ====================================================================
          HEADER
      ==================================================================== */}

      <div className="mx-auto max-w-3xl text-center">
        <h1
          className="
            text-3xl
            font-bold
            tracking-tight
            text-white
            sm:text-5xl
          "
        >
          Character Counter
        </h1>

        <p
          className="
            mt-4
            text-base
            leading-7
            text-slate-400
            sm:text-lg
          "
        >
          Count characters, letters, numbers, spaces,
          punctuation, and words instantly.
        </p>
      </div>

      {/* ====================================================================
          MAIN TOOL
      ==================================================================== */}

      <div
        className="
          mx-auto
          mt-8
          max-w-5xl
          rounded-3xl
          border
          border-white/10
          bg-white/[0.03]
          p-3.5

          sm:mt-10
          sm:p-6
        "
      >
        {/* ================================================================
            RESULT SELECTOR
        ================================================================ */}

        <div className="flex flex-wrap gap-2">
          {resultLabels.map((label) => {
            const active =
              selectedResult === label;

            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setSelectedResult(label)
                }
                className={`
                  rounded-xl
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  transition-all
                  duration-200

                  sm:px-4
                  sm:py-2.5
                  sm:text-sm

                  ${
                    active
                      ? `
                        bg-violet-600
                        text-white
                        shadow-lg
                        shadow-violet-600/20
                      `
                      : `
                        border
                        border-white/10
                        bg-white/[0.03]
                        text-slate-400
                        hover:bg-white/10
                        hover:text-white
                      `
                  }

                  max-[480px]:flex-1
                  max-[480px]:text-[11px]
                `}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ================================================================
            TEXT EDITOR
        ================================================================ */}

        <div className="mt-5">
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <label
              className="
                text-sm
                font-semibold
                text-slate-300
              "
            >
              Your text
            </label>

            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              {stats.characters} characters
            </span>
          </div>

          <textarea
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            placeholder="Type or paste text here..."
            className="
              min-h-[300px]
              w-full
              resize-y
              rounded-2xl
              border
              border-white/10
              bg-slate-950
              p-4
              text-base
              leading-7
              text-slate-100
              outline-none
              transition
              placeholder:text-slate-600
              focus:border-violet-500

              sm:min-h-[360px]
            "
          />
        </div>

        {/* ================================================================
            ACTIONS
        ================================================================ */}

        <div
          className="
            mt-5
            flex
            flex-wrap
            gap-3
          "
        >
          {/* Copy Result */}

          <button
            type="button"
            onClick={copyResult}
            className="
              inline-flex
              min-h-[44px]
              items-center
              gap-2
              rounded-xl
              bg-violet-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-violet-500
            "
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}

            {copied
              ? "Copied"
              : `Copy ${selectedResult}`}
          </button>

          {/* Clear */}

          <button
            type="button"
            onClick={clear}
            className="
              inline-flex
              min-h-[44px]
              items-center
              gap-2
              rounded-xl
              border
              border-red-500/30
              px-4
              py-2.5
              text-sm
              font-semibold
              text-red-300
              transition
              hover:bg-red-500/10
            "
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* ================================================================
            QUICK STATISTICS
        ================================================================ */}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

          {[
            ["Characters", stats.characters],
            ["No spaces", stats.charactersNoSpaces],
            ["Letters", stats.letters],
            ["Numbers", stats.digits],
            ["Spaces", stats.spaces],
            ["Punctuation", stats.punctuation],
            ["Words", stats.words],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                setSelectedResult(
                  label as ResultKey,
                )
              }
              className={`
                rounded-2xl
                border
                p-4
                text-left
                transition

                ${
                  selectedResult === label
                    ? `
                      border-violet-500/40
                      bg-violet-500/10
                    `
                    : `
                      border-white/10
                      bg-white/[0.03]
                      hover:border-white/15
                      hover:bg-white/[0.05]
                    `
                }
                ${
                label === "Words"
                 ? `
                 max-sm:col-span-2
                 max-sm:text-center
                `
              : ""
              }
              `}
            >
              <p className="text-xs font-medium text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {value}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================================
          HOW TO USE
      ==================================================================== */}

      <HowToUseSection />
    </Container>
  );
}