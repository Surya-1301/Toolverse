"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  Eye,
  Palette,
  Pipette,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function componentToHex(value: number) {
  return clamp(Math.round(value), 0, 255)
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
}

function normalizeHex(value: string) {
  let hex = value.trim().replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(
      "Enter a valid HEX color, for example #7C3AED.",
    );
  }

  return `#${hex.toUpperCase()}`;
}

function hexToRgb(value: string): RgbColor {
  const hex = normalizeHex(value).replace("#", "");

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);

  let h = 0;
  let s = 0;

  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;

    s =
      l > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);

    if (max === red) {
      h =
        (green - blue) /
          delta +
        (green < blue ? 6 : 0);
    } else if (max === green) {
      h =
        (blue - red) /
          delta +
        2;
    } else {
      h =
        (red - green) /
          delta +
        4;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb({
  h,
  s,
  l,
}: HslColor): RgbColor {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);

    return {
      r: gray,
      g: gray,
      b: gray,
    };
  }

  const hueToRgb = (
    p: number,
    q: number,
    tValue: number,
  ) => {
    let t = tValue;

    if (t < 0) t += 1;
    if (t > 1) t -= 1;

    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }

    if (t < 1 / 2) {
      return q;
    }

    if (t < 2 / 3) {
      return (
        p +
        (q - p) *
          (2 / 3 - t) *
          6
      );
    }

    return p;
  };

  const q =
    lightness < 0.5
      ? lightness *
        (1 + saturation)
      : lightness +
        saturation -
        lightness * saturation;

  const p = 2 * lightness - q;

  return {
    r: Math.round(
      hueToRgb(
        p,
        q,
        hue + 1 / 3,
      ) * 255,
    ),
    g: Math.round(
      hueToRgb(
        p,
        q,
        hue,
      ) * 255,
    ),
    b: Math.round(
      hueToRgb(
        p,
        q,
        hue - 1 / 3,
      ) * 255,
    ),
  };
}

function parseRgb(value: string): RgbColor {
  const numbers =
    value
      .match(/\d+(\.\d+)?/g)
      ?.map(Number) || [];

  if (numbers.length < 3) {
    throw new Error(
      "Enter RGB as rgb(124, 58, 237) or 124, 58, 237.",
    );
  }

  return {
    r: clamp(numbers[0], 0, 255),
    g: clamp(numbers[1], 0, 255),
    b: clamp(numbers[2], 0, 255),
  };
}

function parseHsl(value: string): HslColor {
  const numbers =
    value
      .match(/-?\d+(\.\d+)?/g)
      ?.map(Number) || [];

  if (numbers.length < 3) {
    throw new Error(
      "Enter HSL as hsl(262, 83%, 58%) or 262, 83, 58.",
    );
  }

  return {
    h: numbers[0],
    s: clamp(numbers[1], 0, 100),
    l: clamp(numbers[2], 0, 100),
  };
}

function formatRgb({
  r,
  g,
  b,
}: RgbColor) {
  return `rgb(${Math.round(r)}, ${Math.round(
    g,
  )}, ${Math.round(b)})`;
}

function formatHsl({
  h,
  s,
  l,
}: HslColor) {
  return `hsl(${Math.round(
    h,
  )}, ${Math.round(
    s,
  )}%, ${Math.round(l)}%)`;
}

function adjustHslLightness(
  color: HslColor,
  amount: number,
) {
  return {
    ...color,
    l: clamp(
      color.l + amount,
      0,
      100,
    ),
  };
}

function rotateHue(
  color: HslColor,
  amount: number,
) {
  return {
    ...color,
    h:
      (color.h +
        amount +
        360) %
      360,
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
    title: "Enter color",
    description:
      "Type a HEX, RGB, or HSL color value into the input.",
    icon: (
      <Pipette className="h-5 w-5" />
    ),
  },
  {
    title: "Choose format",
    description:
      "Select whether your input is HEX, RGB, or HSL.",
    icon: (
      <RefreshCw className="h-5 w-5" />
    ),
  },
  {
    title: "Convert color",
    description:
      "Generate equivalent HEX, RGB, and HSL values instantly.",
    icon: (
      <Wand2 className="h-5 w-5" />
    ),
  },
  {
    title: "Preview color",
    description:
      "Check the converted color in the live preview card.",
    icon: (
      <Eye className="h-5 w-5" />
    ),
  },
  {
    title: "Generate palette",
    description:
      "Create lighter, darker, complementary, and accent colors.",
    icon: (
      <Palette className="h-5 w-5" />
    ),
  },
  {
    title: "Copy values",
    description:
      "Copy any converted color or palette value to your clipboard.",
    icon: (
      <Copy className="h-5 w-5" />
    ),
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Color Converter
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {howToUseSteps.map(
          (step) => (
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
          ),
        )}
      </div>
    </section>
  );
}

export default function ColorConverterPage() {
  /*
   * Empty initial state.
   * No predefined color is loaded.
   */
  const [input, setInput] = useState("");

  const [inputType, setInputType] =
    useState<
      "hex" | "rgb" | "hsl"
    >("hex");

  const [hex, setHex] =
    useState("");

  const [rgb, setRgb] =
    useState<RgbColor | null>(null);

  const [hsl, setHsl] =
    useState<HslColor | null>(null);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState("");

  /*
   * Palette remains empty until
   * a color has actually been converted.
   */
  const palette = useMemo(() => {
    if (!hex || !hsl) {
      return [];
    }

    const baseHsl = hsl;

    return [
      {
        label: "Base",
        value: hex,
      },
      {
        label: "Light",
        value: rgbToHex(
          hslToRgb(
            adjustHslLightness(
              baseHsl,
              18,
            ),
          ),
        ),
      },
      {
        label: "Dark",
        value: rgbToHex(
          hslToRgb(
            adjustHslLightness(
              baseHsl,
              -18,
            ),
          ),
        ),
      },
      {
        label: "Complement",
        value: rgbToHex(
          hslToRgb(
            rotateHue(
              baseHsl,
              180,
            ),
          ),
        ),
      },
      {
        label: "Analogous 1",
        value: rgbToHex(
          hslToRgb(
            rotateHue(
              baseHsl,
              -30,
            ),
          ),
        ),
      },
      {
        label: "Analogous 2",
        value: rgbToHex(
          hslToRgb(
            rotateHue(
              baseHsl,
              30,
            ),
          ),
        ),
      },
    ];
  }, [hex, hsl]);

  function convertColor() {
    try {
      setError("");
      setCopied("");

      if (!input.trim()) {
        throw new Error(
          "Enter a color first.",
        );
      }

      let nextRgb: RgbColor;

      if (inputType === "hex") {
        nextRgb = hexToRgb(input);
      } else if (
        inputType === "rgb"
      ) {
        nextRgb = parseRgb(input);
      } else {
        nextRgb =
          hslToRgb(
            parseHsl(input),
          );
      }

      const nextHex =
        rgbToHex(nextRgb);

      const nextHsl =
        rgbToHsl(nextRgb);

      setRgb(nextRgb);
      setHex(nextHex);
      setHsl(nextHsl);
      setCopied("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert this color.",
      );

      setHex("");
      setRgb(null);
      setHsl(null);
    }
  }

  async function copyValue(
    label: string,
    value: string,
  ) {
    if (!value) return;

    await navigator.clipboard.writeText(
      value,
    );

    setCopied(label);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setHex("");
    setRgb(null);
    setHsl(null);
    setError("");
    setCopied("");
  }

  const rgbOutput = rgb
    ? formatRgb(rgb)
    : "";

  const hslOutput = hsl
    ? formatHsl(hsl)
    : "";

  const hasColor =
    Boolean(
      hex &&
        rgb &&
        hsl,
    );

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Color Converter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert HEX, RGB, and HSL colors,
          preview the result, and generate a
          simple color palette.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* LEFT PANEL */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            {/* Color input */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Color input
              </label>

              <input
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value,
                  )
                }
                placeholder="Enter color value..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            {/* Input format */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Input format
              </label>

              <select
                value={inputType}
                onChange={(event) =>
                  setInputType(
                    event.target
                      .value as
                      | "hex"
                      | "rgb"
                      | "hsl",
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              >
                <option value="hex">
                  HEX
                </option>

                <option value="rgb">
                  RGB
                </option>

                <option value="hsl">
                  HSL
                </option>
              </select>
            </div>
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
              onClick={
                convertColor
              }
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Wand2 className="h-4 w-4" />
              Convert color
            </button>

            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </button>
          </div>

          {/* Converted values */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "HEX",
                value: hex,
              },
              {
                label: "RGB",
                value: rgbOutput,
              },
              {
                label: "HSL",
                value: hslOutput,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-slate-950 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>

                <p
                  className={`mt-2 break-all font-mono text-sm ${
                    item.value
                      ? "text-slate-200"
                      : "text-slate-600"
                  }`}
                >
                  {item.value ||
                    `${item.label} value will appear here...`}
                </p>

                <button
                  onClick={() =>
                    copyValue(
                      item.label,
                      item.value,
                    )
                  }
                  disabled={!item.value}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
                >
                  {copied ===
                  item.label ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}

                  {copied ===
                  item.label
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Color preview
            </h2>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {hasColor
                ? hex
                : "Waiting"}
            </span>
          </div>

          {/* Preview */}
          {hasColor ? (
            <div
              className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 text-center"
              style={{
                backgroundColor:
                  hex,
              }}
            >
              <div className="rounded-2xl bg-black/35 px-5 py-3 backdrop-blur">
                <p className="font-mono text-sm font-semibold text-white">
                  {hex}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950 text-center">
              <p className="text-sm text-slate-500">
                Color preview will appear
                here after conversion.
              </p>
            </div>
          )}

          {/* Palette */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-300" />

              <h3 className="text-sm font-semibold text-slate-300">
                Palette generator
              </h3>
            </div>

            {palette.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {palette.map(
                  (item) => (
                    <button
                      key={
                        item.label
                      }
                      onClick={() =>
                        copyValue(
                          item.label,
                          item.value,
                        )
                      }
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left transition hover:border-violet-400/40"
                    >
                      <div
                        className="h-16"
                        style={{
                          backgroundColor:
                            item.value,
                        }}
                      />

                      <div className="p-3">
                        <p className="text-sm font-semibold text-white">
                          {item.label}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {item.value}
                        </p>

                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                          {copied ===
                          item.label
                            ? "Copied"
                            : "Copy"}

                          {copied ===
                          item.label ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            ) : (
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950 p-6 text-center">
                <p className="text-sm leading-6 text-slate-500">
                  Palette colors will
                  appear here after
                  conversion.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <HowToUseSection />
    </Container>
  );
}