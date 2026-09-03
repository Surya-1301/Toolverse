"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Database,
  Eraser,
  FileCode2,
  Minimize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "ALTER",
  "DROP",
  "INDEX",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "CROSS",
  "ON",
  "GROUP",
  "BY",
  "ORDER",
  "ASC",
  "DESC",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "DISTINCT",
  "AS",
  "IN",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "EXISTS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "IF",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "TRANSACTION",
  "VIEW",
  "TRIGGER",
  "PROCEDURE",
  "FUNCTION",
  "RETURN",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "CONSTRAINT",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "AUTO_INCREMENT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "COALESCE",
  "CAST",
  "CONVERT",
  "WITH",
  "RECURSIVE",
  "FETCH",
  "NEXT",
  "ROWS",
  "ONLY",
  "FIRST",
  "LAST",
  "OVER",
  "PARTITION",
  "ROW_NUMBER",
  "RANK",
  "DENSE_RANK",
  "LAG",
  "LEAD",
  "NTILE",
  "EXPLAIN",
  "ANALYZE",
  "USE",
  "GRANT",
  "REVOKE",
  "REPLACE",
  "INTO",
  "ASC",
  "DESC",
  "NATURAL",
  "USING",
];

const SQL_BLOCK_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "CROSS",
  "ON",
  "GROUP",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "SET",
  "VALUES",
  "INTO",
];

function removeSqlComments(value: string) {
  return value
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function formatSqlCode(value: string) {
  let indent = 0;
  const lines: string[] = [];
  const keywords = new Set(
    SQL_BLOCK_KEYWORDS.map((k) => k.toUpperCase()),
  );

  // Remove comments, collapse whitespace, then split on semicolons
  // so each statement can be formatted independently.
  const clean = removeSqlComments(value).replace(/\s+/g, " ").trim();

  if (!clean) {
    return "";
  }

  const statements = clean.split(";").filter((s) => s.trim());

  const formatStatement = (statement: string) => {
    const tokens = statement.trim().split(/\b/);
    const currentLines: string[] = [];

    for (const raw of tokens) {
      const token = raw;
      if (!token.trim()) continue;

      const trimmed = token.trim();
      const upper = trimmed.toUpperCase();

      if (upper === ")") {
        indent = Math.max(indent - 1, 0);
      }

      if (keywords.has(upper)) {
        if (currentLines.length > 0 && upper !== "AND" && upper !== "OR") {
          currentLines.push("");
        }
        currentLines.push(`${"  ".repeat(indent)}${trimmed}`);
        indent++;
      } else if (upper === ")" || upper === "};" || upper === ");") {
        currentLines.push(`${"  ".repeat(indent)}${trimmed}`);
        indent = Math.max(indent - 1, 0);
      } else {
        currentLines.push(`${"  ".repeat(indent)}${trimmed}`);
      }
    }

    return currentLines;
  };

  for (const statement of statements) {
    const formatted = formatStatement(statement);
    lines.push(...formatted);
    lines.push("");
  }

  return lines.filter((line) => line.trim() !== "").join("\n");
}

function minifySqlCode(value: string) {
  return removeSqlComments(value)
    .replace(/\s+/g, " ")
    .replace(/\s*([,;=<>!()+\-/.])\s*/g, "$1")
    .replace(/;\s*/g, ";")
    .trim();
}

function BackToToolsLink() {
  return (
    <Link
      href="/tools/formatter-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Paste SQL",
    description: "Add your SQL query or statement into the input box.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Format query",
    description: "Use Format SQL to beautify your query with proper indentation.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Minify SQL",
    description: "Use Minify SQL to compress the query into a single line.",
    icon: <Minimize2 className="h-5 w-5" />,
  },
  {
    title: "Remove comments",
    description: "Strip SQL comments before using the query in production.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Copy output",
    description: "Copy the processed SQL output instantly to your clipboard.",
    icon: <Copy className="h-5 w-5" />,
  },
  {
    title: "Clear editor",
    description: "Reset the input and output areas when you want to start over.",
    icon: <Eraser className="h-5 w-5" />,
  },
];

export default function SqlFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function formatSql() {
    setOutput(formatSqlCode(input));
  }

  function minifySql() {
    setOutput(minifySqlCode(input));
  }

  function stripComments() {
    setOutput(removeSqlComments(input));
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
    setInput("");
    setOutput("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          SQL Formatter
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Format, beautify, minify, remove comments, and copy SQL queries
          instantly in your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <label className="mb-3 block text-sm font-semibold text-slate-300">
            SQL input
          </label>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={"SELECT u.name, u.email, COUNT(o.id) AS order_count\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1\nGROUP BY u.id\nHAVING COUNT(o.id) > 5\nORDER BY order_count DESC\nLIMIT 10;"}
            className="min-h-[460px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              Output
            </label>

            <button
              onClick={copyOutput}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
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
            placeholder="Output will appear here..."
            className="min-h-[440px] w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={formatSql}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Wand2 className="h-4 w-4" />
          Format SQL
        </button>

        <button
          onClick={minifySql}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Minimize2 className="h-4 w-4" />
          Minify SQL
        </button>

        <button
          onClick={stripComments}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Remove comments
        </button>

        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>

      <HowToUse
        title="How to use SQL Formatter / Minifier"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
