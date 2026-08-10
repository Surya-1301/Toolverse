"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  FileText,
  Fingerprint,
  Hash,
  LockKeyhole,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

type HashResult = {
  algorithm: HashAlgorithm;
  value: string;
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

function rotateLeft(value: number, shift: number) {
  return (value << shift) | (value >>> (32 - shift));
}

function addUnsigned(a: number, b: number) {
  const aLow = a & 0x40000000;
  const bLow = b & 0x40000000;
  const aHigh = a & 0x80000000;
  const bHigh = b & 0x80000000;
  const result = (a & 0x3fffffff) + (b & 0x3fffffff);

  if (aLow & bLow) {
    return result ^ 0x80000000 ^ aHigh ^ bHigh;
  }

  if (aLow | bLow) {
    if (result & 0x40000000) {
      return result ^ 0xc0000000 ^ aHigh ^ bHigh;
    }

    return result ^ 0x40000000 ^ aHigh ^ bHigh;
  }

  return result ^ aHigh ^ bHigh;
}

function md5F(x: number, y: number, z: number) {
  return (x & y) | (~x & z);
}

function md5G(x: number, y: number, z: number) {
  return (x & z) | (y & ~z);
}

function md5H(x: number, y: number, z: number) {
  return x ^ y ^ z;
}

function md5I(x: number, y: number, z: number) {
  return y ^ (x | ~z);
}

function md5Round(
  fn: (x: number, y: number, z: number) => number,
  a: number,
  b: number,
  c: number,
  d: number,
  x: number,
  s: number,
  ac: number,
) {
  const result = addUnsigned(addUnsigned(a, fn(b, c, d)), addUnsigned(x, ac));
  return addUnsigned(rotateLeft(result, s), b);
}

function wordToHex(value: number) {
  let output = "";

  for (let count = 0; count <= 3; count += 1) {
    const byte = (value >>> (count * 8)) & 255;
    output += `0${byte.toString(16)}`.slice(-2);
  }

  return output;
}

function utf8Encode(value: string) {
  return unescape(encodeURIComponent(value));
}

function convertToWordArray(value: string) {
  const messageLength = value.length;
  const numberOfWordsTempOne = messageLength + 8;
  const numberOfWordsTempTwo =
    (numberOfWordsTempOne - (numberOfWordsTempOne % 64)) / 64;
  const numberOfWords = (numberOfWordsTempTwo + 1) * 16;
  const wordArray = Array(numberOfWords - 1);
  let bytePosition = 0;
  let byteCount = 0;

  while (byteCount < messageLength) {
    const wordCount = (byteCount - (byteCount % 4)) / 4;
    bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] =
      wordArray[wordCount] | (value.charCodeAt(byteCount) << bytePosition);
    byteCount += 1;
  }

  const wordCount = (byteCount - (byteCount % 4)) / 4;
  bytePosition = (byteCount % 4) * 8;
  wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
  wordArray[numberOfWords - 2] = messageLength << 3;
  wordArray[numberOfWords - 1] = messageLength >>> 29;

  return wordArray;
}

function md5(value: string) {
  const x = convertToWordArray(utf8Encode(value));

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = md5Round(md5F, a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = md5Round(md5F, d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = md5Round(md5F, c, d, a, b, x[k + 2], 17, 0x242070db);
    b = md5Round(md5F, b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = md5Round(md5F, a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = md5Round(md5F, d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = md5Round(md5F, c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = md5Round(md5F, b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = md5Round(md5F, a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = md5Round(md5F, d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = md5Round(md5F, c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = md5Round(md5F, b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = md5Round(md5F, a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = md5Round(md5F, d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = md5Round(md5F, c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = md5Round(md5F, b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = md5Round(md5G, a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = md5Round(md5G, d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = md5Round(md5G, c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = md5Round(md5G, b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = md5Round(md5G, a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = md5Round(md5G, d, a, b, c, x[k + 10], 9, 0x02441453);
    c = md5Round(md5G, c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = md5Round(md5G, b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = md5Round(md5G, a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = md5Round(md5G, d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = md5Round(md5G, c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = md5Round(md5G, b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = md5Round(md5G, a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = md5Round(md5G, d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = md5Round(md5G, c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = md5Round(md5G, b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = md5Round(md5H, a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = md5Round(md5H, d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = md5Round(md5H, c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = md5Round(md5H, b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = md5Round(md5H, a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = md5Round(md5H, d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = md5Round(md5H, c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = md5Round(md5H, b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = md5Round(md5H, a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = md5Round(md5H, d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = md5Round(md5H, c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = md5Round(md5H, b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = md5Round(md5H, a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = md5Round(md5H, d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = md5Round(md5H, c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = md5Round(md5H, b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = md5Round(md5I, a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = md5Round(md5I, d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = md5Round(md5I, c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = md5Round(md5I, b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = md5Round(md5I, a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = md5Round(md5I, d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = md5Round(md5I, c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = md5Round(md5I, b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = md5Round(md5I, a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = md5Round(md5I, d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = md5Round(md5I, c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = md5Round(md5I, b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = md5Round(md5I, a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = md5Round(md5I, d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = md5Round(md5I, c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = md5Round(md5I, b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  return `${wordToHex(a)}${wordToHex(b)}${wordToHex(c)}${wordToHex(d)}`.toLowerCase();
}

async function cryptoHash(algorithm: Exclude<HashAlgorithm, "MD5">, value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(algorithm, data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const howToUseSteps = [
  {
    title: "Enter text",
    description: "Paste or type the text you want to hash.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Choose hashes",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes.",
    icon: <Hash className="h-5 w-5" />,
  },
  {
    title: "Generate",
    description: "Click generate to calculate all selected hash values.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Review output",
    description: "Check the generated hash values in the output cards.",
    icon: <Fingerprint className="h-5 w-5" />,
  },
  {
    title: "Copy hashes",
    description: "Copy any generated hash value to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and generated hashes anytime.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Hash Generator
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

export default function HashGeneratorPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HashResult[]>([]);
  const [copiedValue, setCopiedValue] = useState("");
  const [error, setError] = useState("");

  async function generateHashes() {
    try {
      setError("");

      if (!input.trim()) {
        setResults([]);
        setError("Enter text first.");
        return;
      }

      const nextResults: HashResult[] = [
        {
          algorithm: "MD5",
          value: md5(input),
        },
        {
          algorithm: "SHA-1",
          value: await cryptoHash("SHA-1", input),
        },
        {
          algorithm: "SHA-256",
          value: await cryptoHash("SHA-256", input),
        },
        {
          algorithm: "SHA-512",
          value: await cryptoHash("SHA-512", input),
        },
      ];

      setResults(nextResults);
    } catch {
      setResults([]);
      setError("Could not generate hashes in this browser.");
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);

    setTimeout(() => {
      setCopiedValue("");
    }, 1500);
  }

  function clearAll() {
    setInput("");
    setResults([]);
    setCopiedValue("");
    setError("");
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Hash Generator
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text directly in
          your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            Text input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text here..."
            className="min-h-[420px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={generateHashes}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <LockKeyhole className="h-4 w-4" />
              Generate hashes
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Hash output
            </label>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {results.length ? `${results.length} hashes` : "Waiting"}
            </span>
          </div>

          <div className="min-h-[420px] rounded-2xl border border-white/10 bg-slate-950 p-4">
            {results.length ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.algorithm}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-white">
                        {result.algorithm}
                      </h2>

                      <button
                        onClick={() => copyValue(result.value)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        {copiedValue === result.value ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedValue === result.value ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <code className="break-all text-xs leading-6 text-slate-300">
                      {result.value}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-sm leading-6 text-slate-500">
                  Generated hashes will appear here.
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