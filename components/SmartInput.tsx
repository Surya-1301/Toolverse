"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Check,
  FileCode2,
  FileImage,
  KeyRound,
  Link2,
  Search,
  Type,
  Upload,
} from "lucide-react";

type Detection = {
  type: "json" | "url" | "jwt" | "base64" | "image" | "text";
  label: string;
  description: string;
  href: string;
};

const detectionMeta: Record<
  Detection["type"],
  Omit<Detection, "type">
> = {
  json: {
    label: "JSON detected",
    description:
      "Format, validate, minify, or inspect this JSON.",
    href: "/json-formatter",
  },

  url: {
    label: "URL detected",
    description:
      "Parse, inspect, encode, or work with this URL.",
    href: "/url-parser",
  },

  jwt: {
    label: "JWT detected",
    description:
      "Decode and inspect the token payload and header.",
    href: "/jwt-decoder",
  },

  base64: {
    label: "Base64 detected",
    description:
      "Encode, decode, or inspect Base64 data.",
    href: "/base64-encoder-decoder",
  },

  image: {
    label: "Image detected",
    description:
      "Convert, resize, compress, crop, or optimize your image.",
    href: "/image-converter",
  },

  text: {
    label: "Text detected",
    description:
      "Work with text and developer utilities.",
    href: "/tools/text-developer-tools",
  },
};

function looksLikeJwt(value: string) {
  const parts = value.trim().split(".");

  return (
    parts.length === 3 &&
    parts.every((part) =>
      /^[A-Za-z0-9_-]+$/.test(part),
    )
  );
}

function looksLikeBase64(value: string) {
  const compact = value
    .trim()
    .replace(/\s+/g, "");

  if (
    compact.length < 8 ||
    compact.length % 4 === 1
  ) {
    return false;
  }

  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    compact,
  );
}

function detectText(value: string): Detection {
  const trimmed = value.trim();

  if (trimmed) {
    try {
      JSON.parse(trimmed);

      return {
        type: "json",
        ...detectionMeta.json,
      };
    } catch {
      // Not JSON. Continue checking.
    }

    if (looksLikeJwt(trimmed)) {
      return {
        type: "jwt",
        ...detectionMeta.jwt,
      };
    }

    try {
      const url = new URL(trimmed);

      if (
        url.protocol === "http:" ||
        url.protocol === "https:"
      ) {
        return {
          type: "url",
          ...detectionMeta.url,
        };
      }
    } catch {
      // Not a URL.
    }

    if (
      looksLikeBase64(trimmed) &&
      !/[\s{}<>]/.test(trimmed)
    ) {
      return {
        type: "base64",
        ...detectionMeta.base64,
      };
    }
  }

  return {
    type: "text",
    ...detectionMeta.text,
  };
}

export default function SmartInput() {
  const [value, setValue] = useState("");
  const [detection, setDetection] =
    useState<Detection | null>(null);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /*
   * Keep the placeholder focused on text input.
   * Image upload has its own dedicated button.
   */
  const placeholder = useMemo(
    () =>
      "Paste JSON, URL, JWT, Base64, or text...",
    [],
  );

  function analyzeText(nextValue: string) {
    setValue(nextValue);
    setFileName("");
    setCopied(false);

    setDetection(
      nextValue.trim()
        ? detectText(nextValue)
        : null,
    );
  }

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setValue("");
      setFileName("");
      setDetection(null);
      return;
    }

    setValue("");
    setFileName(file.name);

    setDetection({
      type: "image",
      ...detectionMeta.image,
    });
  }

  function handlePaste(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const pastedFiles = Array.from(
      event.clipboardData.files,
    );

    const image = pastedFiles.find((file) =>
      file.type.startsWith("image/"),
    );

    if (image) {
      event.preventDefault();
      handleFile(image);
    }
  }

  async function copyInput() {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  const DetectionIcon = detection
    ? {
        json: Braces,
        url: Link2,
        jwt: KeyRound,
        base64: FileCode2,
        image: FileImage,
        text: Type,
      }[detection.type]
    : Search;

  return (
    <section
      aria-label="Smart Toolverse input"
      className="
        mx-auto
        w-full
        max-w-3xl
        text-left
      "
    >
      {/* ================================================================
          OUTER INPUT CARD
      ================================================================ */}

      <div
        className="
          rounded-3xl
          border
          border-white/[0.08]
          bg-black/[0.10]
          p-2
          shadow-[0_20px_70px_rgba(0,0,0,0.25)]
          backdrop-blur-md
          sm:p-2.5
        "
      >
        {/* ================================================================
            MAIN INPUT SURFACE
        ================================================================ */}

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-white/[0.09]
            bg-white/[0.018]
            transition-all
            duration-200
            focus-within:border-violet-400/30
            focus-within:bg-white/[0.025]
            focus-within:shadow-[0_0_40px_rgba(124,58,237,0.08)]
          "
        >
          {/* ============================================================
              SUBTLE PURPLE AMBIENT LIGHT
          ============================================================ */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-52
              w-52
              rounded-full
              bg-violet-500/[0.06]
              blur-3xl
            "
          />

          {/* ============================================================
              INPUT LABEL
          ============================================================ */}

          <div
            className="
              pointer-events-none
              absolute
              left-5
              top-4
              z-10
              flex
              items-center
              gap-2.5
            "
          >
            <Search
              aria-hidden="true"
              className="
                h-[18px]
                w-[18px]
                shrink-0
                text-slate-500
              "
            />

            <span
              className="
                text-xs
                font-medium
                tracking-wide
                text-slate-300
              "
            >
              Smart Toolverse input
            </span>
          </div>

          {/* ============================================================
              TEXTAREA
          ============================================================ */}

          <textarea
            value={value}
            onChange={(event) =>
              analyzeText(event.target.value)
            }
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={5}
            aria-label="Paste or enter content for Toolverse"
            className="
              relative
              z-[1]
              block
              min-h-[168px]
              w-full
              resize-none
              rounded-2xl
              border-0
              bg-transparent
              px-5
              pb-[64px]
              pt-[52px]
              text-[15px]
              leading-7
              text-slate-100
              outline-none
              placeholder:text-slate-500/90
              focus:outline-none

              sm:min-h-[174px]
              sm:text-base

              md:pb-16
            "
          />

          {/* ============================================================
              DESKTOP / TABLET DROP IMAGE BUTTON

              Positioned directly inside the input's
              bottom-right corner from md upward.
          ============================================================ */}

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            aria-label="Upload an image"
            className="
              absolute
              bottom-3
              right-3
              z-20
              hidden
              min-h-10
              items-center
              gap-2
              rounded-xl
              border
              border-white/[0.10]
              bg-[#080b1d]/90
              px-3.5
              py-2
              text-xs
              font-medium
              text-slate-300
              shadow-lg
              shadow-black/10
              backdrop-blur-md
              transition-all
              duration-200

              hover:border-violet-400/30
              hover:bg-[#0d1028]
              hover:text-white
              hover:shadow-violet-500/10

              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-violet-400/60
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[#030617]

              md:inline-flex
            "
          >
            <Upload
              aria-hidden="true"
              className="h-4 w-4"
            />

            <span>Drop image</span>
          </button>

          {/* ============================================================
              MOBILE DROP IMAGE / COPY ROW

              Desktop/tablet use the corner button above.
          ============================================================ */}

          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              z-10
              flex
              min-h-[52px]
              items-center
              justify-between
              gap-3
              border-t
              border-white/[0.055]
              bg-black/[0.08]
              px-3
              py-2
              md:hidden
            "
          >
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              aria-label="Upload an image"
              className="
                inline-flex
                min-h-9
                items-center
                gap-2
                rounded-lg
                border
                border-white/[0.10]
                bg-white/[0.025]
                px-3
                py-1.5
                text-xs
                font-medium
                text-slate-300
                transition-all
                duration-200
                hover:border-violet-400/25
                hover:bg-white/[0.055]
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/60
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#030617]
              "
            >
              <Upload
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />

              <span>Drop image</span>
            </button>

            {value ? (
              <button
                type="button"
                onClick={copyInput}
                className="
                  inline-flex
                  min-h-9
                  items-center
                  gap-1.5
                  rounded-lg
                  px-2.5
                  py-1.5
                  text-xs
                  font-medium
                  text-slate-400
                  transition
                  hover:bg-white/[0.05]
                  hover:text-white
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-violet-400/60
                "
              >
                {copied ? (
                  <>
                    <Check
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />

                    Copied
                  </>
                ) : (
                  "Copy"
                )}
              </button>
            ) : null}
          </div>

          {/* ============================================================
              DESKTOP / TABLET COPY BUTTON

              Kept near the lower-right corner beside the
              upload action when text is present.
          ============================================================ */}

          {value ? (
            <button
              type="button"
              onClick={copyInput}
              className="
                absolute
                bottom-3
                right-[138px]
                z-20
                hidden
                min-h-9
                items-center
                gap-1.5
                rounded-lg
                border
                border-transparent
                px-2.5
                py-1.5
                text-xs
                font-medium
                text-slate-400
                transition
                hover:border-white/[0.08]
                hover:bg-white/[0.05]
                hover:text-white
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/60
                md:inline-flex
              "
            >
              {copied ? (
                <>
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />

                  Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
          ) : null}

          {/* ============================================================
              SELECTED FILE NAME
          ============================================================ */}

          {fileName ? (
            <span
              title={fileName}
              className="
                absolute
                bottom-3
                left-4
                z-20
                max-w-[42%]
                truncate
                text-xs
                text-slate-500
              "
            >
              {fileName}
            </span>
          ) : null}

          {/* ============================================================
              ACCESSIBLE FILE INPUT
          ============================================================ */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Choose an image to upload"
            className="sr-only"
            onChange={(event) => {
              handleFile(
                event.target.files?.[0],
              );

              event.target.value = "";
            }}
          />
        </div>

        {/* ================================================================
            HELPER TEXT
        ================================================================ */}

        {!detection ? (
          <p
            className="
              px-3
              pb-0.5
              pt-2.5
              text-center
              text-xs
              leading-5
              text-slate-500
            "
          >
            Paste anything and Toolverse will suggest
            the right tool.
          </p>
        ) : null}

        {/* ================================================================
            DETECTION RESULT
        ================================================================ */}

        {detection ? (
          <div
            className="
              mt-3
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-violet-400/15
              bg-violet-500/[0.045]
              p-3
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-4
            "
          >
            {/* ==========================================================
                DETECTION INFO
            ========================================================== */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <div
                aria-hidden="true"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                  text-violet-300
                  ring-1
                  ring-violet-400/15
                "
              >
                <DetectionIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {detection.label}
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  {detection.description}
                </p>
              </div>
            </div>

            {/* ==========================================================
                OPEN TOOL
            ========================================================== */}

            <Link
              href={detection.href}
              className="
                inline-flex
                min-h-10
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                shadow-lg
                shadow-violet-600/10
                transition

                hover:bg-violet-500

                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-violet-400/60
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#030617]
              "
            >
              Open tool

              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}