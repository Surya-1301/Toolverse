"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  Columns2,
  Copy,
  Eraser,
  FileDiff,
  GitCompare,
  Sparkles,
  Type,
  XCircle,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

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
   DIFF ENGINE — Myers-style line diff built on longest common subsequence
   ========================================================================== */

type Change = { type: "equal" | "add" | "remove"; text: string };

function diffLines(left: string, right: string): Change[] {
  const a = left.split("\n");
  const b = right.split("\n");

  // LCS table
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const changes: Change[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      changes.push({ type: "equal", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      changes.push({ type: "remove", text: a[i] });
      i++;
    } else {
      changes.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) changes.push({ type: "remove", text: a[i++] });
  while (j < m) changes.push({ type: "add", text: b[j++] });

  return changes;
}

/* Re-flow a unified change list into parallel left/right rows so we can render
   side-by-side. Adds are blank on the left, removes blank on the right. */
function toRows(changes: Change[]): { left: string | null; right: string | null }[] {
  const rows: { left: string | null; right: string | null }[] = [];
  for (const change of changes) {
    if (change.type === "equal") rows.push({ left: change.text, right: change.text });
    else if (change.type === "add") rows.push({ left: null, right: change.text });
    else rows.push({ left: change.text, right: null });
  }
  return rows;
}

const EXAMPLES = {
  before: `The quick brown fox jumps over the lazy dog.
This line is unchanged.
This line will be removed soon.
Everything here stays the same.
A final sentence to round it out.`,
  after: `The quick brown fox jumps over the lazy dog.
This line is unchanged.
This brand new line was added.
Everything here stays the same.
A final sentence to round it out.`,
};

export default function TextComparePage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [copied, setCopied] = useState(false);

  const changes = useMemo(() => diffLines(left, right), [left, right]);
  const rows = useMemo(() => toRows(changes), [changes]);

  const stats = useMemo(() => {
    const adds = changes.filter((c) => c.type === "add").length;
    const removes = changes.filter((c) => c.type === "remove").length;
    const equal = changes.filter((c) => c.type === "equal").length;
    return { adds, removes, equal };
  }, [changes]);

  function loadExample() {
    setLeft(EXAMPLES.before);
    setRight(EXAMPLES.after);
  }

  function clearAll() {
    setLeft("");
    setRight("");
  }

  function swap() {
    setLeft(right);
    setRight(left);
  }

  async function copyResult() {
    if (!changes.length) return;
    const lines = changes.map((c) =>
      c.type === "add" ? `+ ${c.text}` : c.type === "remove" ? `- ${c.text}` : `  ${c.text}`,
    );
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Text Compare / Diff
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Compare text side by side to instantly spot added, removed, and unchanged. Runs locally in your browser.

        </p>
      </div>

      {/* Stats bar */}
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <GitCompare className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-lg font-bold text-white">{stats.equal}</p>
            <p className="text-xs text-slate-500">Unchanged</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-lg font-bold text-emerald-300">{stats.adds}</p>
            <p className="text-xs text-slate-500">Added</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <XCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-lg font-bold text-red-300">{stats.removes}</p>
            <p className="text-xs text-slate-500">Removed</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-300">
              Original text
            </label>
            <button
              onClick={loadExample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load example
            </button>
          </div>
          <textarea
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            rows={10}
            placeholder="Paste the original text here…"
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-300">
              Changed text
            </label>
            <button
              onClick={() => navigator.clipboard.readText().then((t) => setRight(t))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </button>
          </div>
          <textarea
            value={right}
            onChange={(event) => setRight(event.target.value)}
            rows={10}
            placeholder="Paste the changed text here…"
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={loadExample}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Sparkles className="h-4 w-4" />
          Compare example
        </button>

        <button
          onClick={swap}
          disabled={!left && !right}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          <Columns2 className="h-4 w-4" />
          Swap sides
        </button>

        <button
          onClick={copyResult}
          disabled={!changes.length}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy diff"}
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Diff output */}
      {left || right ? (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">Diff</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> added
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> removed
              </span>
            </div>
          </div>

          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-950 lg:grid-cols-2">
            {/* LEFT pane */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-400">
                <ArrowLeft className="h-3.5 w-3.5" />
                Original
              </div>
              <table className="w-full border-collapse font-mono text-sm leading-6">
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={
                        row.left === null
                          ? "opacity-30"
                          : row.left !== row.right
                            ? "bg-red-500/15"
                            : ""
                      }
                    >
                      <td className="w-10 select-none border-r border-white/5 px-2 text-right text-xs text-slate-600">
                        {row.left === null ? "" : index + 1}
                      </td>
                      <td className="px-3 text-slate-100">
                        {row.left === null ? "" : row.left || " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RIGHT pane */}
            <div className="overflow-x-auto border-t border-white/10 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-400">
                Changed
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <table className="w-full border-collapse font-mono text-sm leading-6">
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={
                        row.right === null
                          ? "opacity-30"
                          : row.left !== row.right
                            ? "bg-emerald-500/15"
                            : ""
                      }
                    >
                      <td className="w-10 select-none border-r border-white/5 px-2 text-right text-xs text-slate-600">
                        {row.right === null ? "" : index + 1}
                      </td>
                      <td className="px-3 text-slate-100">
                        {row.right === null ? "" : row.right || " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="">
        </div>
      )}

      <div className="mt-10">
        <HowToUse
          title="How to use Text Compare"
          subtitle=""
          steps={[
            {
              title: "Paste both texts",
              description: "Add the original and changed versions in the two boxes.",
              icon: <Type className="h-5 w-5" />,
            },
            {
              title: "Watch the diff",
              description: "Added lines highlight green, removed lines red — instantly.",
              icon: <Columns2 className="h-5 w-5" />,
            },
            {
              title: "Check the stats",
              description: "See counts of added, removed, and unchanged lines.",
              icon: <GitCompare className="h-5 w-5" />,
            },
            {
              title: "Swap or clear",
              description: "Flip the sides or reset the inputs with one click.",
              icon: <ArrowRight className="h-5 w-5" />,
            },
            {
              title: "Copy the diff",
              description: "Export the comparison in standard +/− text format.",
              icon: <Copy className="h-5 w-5" />,
            },
            {
              title: "Stays private",
              description: "Comparison happens locally — nothing is uploaded.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
