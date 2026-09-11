"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Eraser,
  FileText,
  Sparkles,
  Type,
  Wand2,
  ClipboardCheck,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   TEXT HELPERS
========================================================================== */

function words(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean);
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .replace(
      /(^|\s|[-_])([\p{L}\p{N}])/gu,
      (_, separator, char) =>
        `${separator}${char.toUpperCase()}`,
    );
}

function sentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(
      /(^|[.!?]\s+)([\p{L}\p{N}])/gu,
      (_, separator, char) =>
        `${separator}${char.toUpperCase()}`,
    );
}

function camelCase(text: string) {
  const parts = words(text)
    .map((word) =>
      word.replace(/[^\p{L}\p{N}]/gu, ""),
    )
    .filter(Boolean);

  return parts
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase(),
    )
    .join("");
}

function pascalCase(text: string) {
  return words(text)
    .map((word) =>
      word.replace(/[^\p{L}\p{N}]/gu, ""),
    )
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join("");
}

function snakeCase(text: string) {
  return words(text)
    .map((word) =>
      word
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase(),
    )
    .filter(Boolean)
    .join("_");
}

function kebabCase(text: string) {
  return words(text)
    .map((word) =>
      word
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase(),
    )
    .filter(Boolean)
    .join("-");
}

function alternatingCase(text: string) {
  let letterIndex = 0;

  return [...text]
    .map((char) => {
      if (!/[\p{L}]/u.test(char)) {
        return char;
      }

      const result =
        letterIndex % 2 === 0
          ? char.toLowerCase()
          : char.toUpperCase();

      letterIndex += 1;

      return result;
    })
    .join("");
}

/* ==========================================================================
   CONVERSION OPTIONS
========================================================================== */

const conversions = [
  ["UPPERCASE", (text: string) => text.toUpperCase()],
  ["lowercase", (text: string) => text.toLowerCase()],
  ["Title Case", titleCase],
  ["Sentence case", sentenceCase],
  ["camelCase", camelCase],
  ["PascalCase", pascalCase],
  ["snake_case", snakeCase],
  ["kebab-case", kebabCase],
  ["aLtErNaTiNg", alternatingCase],
] as const;

/* ==========================================================================
   HOW TO USE
========================================================================== */

const howToUseSteps = [
  {
    title: "Enter your text",
    description:
      "Type or paste the text you want to convert into the editor.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Choose a case",
    description:
      "Select uppercase, lowercase, title case, sentence case, or another format.",
    icon: <Type className="h-5 w-5" />,
  },
  {
    title: "Convert text",
    description:
      "Apply the selected case instantly to your text.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review the result",
    description:
      "Check the converted text and make any changes you need.",
    icon: <Check className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description:
      "Copy the converted result directly to your clipboard.",
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  {
    title: "Clear and restart",
    description:
      "Reset the editor whenever you want to convert another piece of text.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

/* ==========================================================================
   HOW TO USE SECTION
========================================================================== */


/* ==========================================================================
   BACK TO TOOLS
========================================================================== */

function BackToToolsLink() {
  return (
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
  );
}

/* ==========================================================================
   CASE CONVERTER PAGE
========================================================================== */

export default function CaseConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("UPPERCASE");
  const [copied, setCopied] = useState(false);

  /* ------------------------------------------------------------------------
     CONVERT
  ------------------------------------------------------------------------ */

  function convert() {
    const converter = conversions.find(
      ([name]) => name === mode,
    )?.[1];

    setOutput(converter ? converter(input) : input);
    setCopied(false);
  }

  /* ------------------------------------------------------------------------
     COPY
  ------------------------------------------------------------------------ */

  async function copyOutput() {
    if (!output) return;

    await navigator.clipboard.writeText(output);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  /* ------------------------------------------------------------------------
     CLEAR
  ------------------------------------------------------------------------ */

  function clear() {
    setInput("");
    setOutput("");
    setCopied(false);
  }

  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      {/* ====================================================================
          BACK
      ==================================================================== */}

      <BackToToolsLink />

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
          Case Converter
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
          Quickly convert text between uppercase, lowercase,
          title, sentence, camel, snake, kebab.
        </p>
      </div>

      {/* ====================================================================
          CONVERTER
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
            CASE SELECTOR
        ================================================================ */}

        <div
          className="
            grid
            grid-cols-3
            gap-2

            sm:flex
            sm:flex-wrap
            sm:gap-2
          "
        >
          {conversions.map(([name]) => (
            <button
              key={name}
              type="button"
              onClick={() => setMode(name)}
              className={`
                flex
                min-h-[46px]
                min-w-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                px-1.5
                py-2
                text-[11px]
                font-semibold
                leading-tight
                whitespace-nowrap
                transition-all
                duration-200

                sm:min-h-0
                sm:px-3
                sm:py-2
                sm:text-xs

                ${
                  mode === name
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
                      hover:border-white/15
                      hover:bg-white/10
                      hover:text-white
                    `
                }
              `}
            >
              {name}
            </button>
          ))}
        </div>

        {/* ================================================================
            INPUT / OUTPUT
        ================================================================ */}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Input */}

          <div>
            <label
              className="
                mb-3
                block
                text-sm
                font-semibold
                text-slate-300
              "
            >
              Input text
            </label>

            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Type or paste text here..."
              className="
                min-h-[320px]
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

          {/* Output */}

          <div>
            <label
              className="
                mb-3
                block
                text-sm
                font-semibold
                text-slate-300
              "
            >
              Output · {mode}
            </label>

            <textarea
              value={output}
              readOnly
              placeholder="Converted text will appear here..."
              className="
                min-h-[320px]
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
                placeholder:text-slate-600

                sm:min-h-[360px]
              "
            />
          </div>
        </div>

        {/* ================================================================
            ACTIONS
        ================================================================ */}

        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
          "
        >
          {/* Convert */}

          <button
            type="button"
            onClick={convert}
            disabled={!input}
            className="
              inline-flex
              min-h-[44px]
              items-center
              justify-center
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
              disabled:cursor-not-allowed
              disabled:bg-slate-700
              disabled:text-slate-400
            "
          >
            <Sparkles className="h-4 w-4" />
            Convert text
          </button>

          {/* Copy */}

          <button
            type="button"
            onClick={copyOutput}
            disabled={!output}
            className="
              inline-flex
              min-h-[44px]
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-white/10
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-200
              transition
              hover:bg-white/10
              disabled:cursor-not-allowed
              disabled:text-slate-600
            "
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}

            {copied ? "Copied" : "Copy output"}
          </button>

          {/* Clear */}

          <button
            type="button"
            onClick={clear}
            className="
              col-span-2
              inline-flex
              min-h-[44px]
              items-center
              justify-center
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
              sm:col-span-1
            "
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* ====================================================================
          HOW TO USE
      ==================================================================== */}
      <HowToUse
        title="How to use Case Converter"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}