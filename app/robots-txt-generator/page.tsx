"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Check,
  Clock,
  Copy,
  Download,
  Eraser,
  Eye,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { copyTextNative } from "@/lib/capacitor";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white light:text-slate-600 light:hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

type AgentRule = {
  id: number;
  agent: string;
  allow: string;
  disallow: string;
  crawlDelay: string;
};

const inputClass =
  "min-h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400";

let nextId = 1;

function makeRule(
  agent: string,
  allow = "",
  disallow = "",
  crawlDelay = "",
): AgentRule {
  return { id: nextId++, agent, allow, disallow, crawlDelay };
}

const PRESETS: { name: string; build: () => AgentRule[] }[] = [
  {
    name: "Allow all",
    build: () => [makeRule("*", "/", "")],
  },
  {
    name: "Disallow all",
    build: () => [makeRule("*", "", "/")],
  },
  {
    name: "Block admin & login",
    build: () => [
      makeRule("*", "/", "/admin/\n/login/\n/wp-admin/"),
    ],
  },
  {
    name: "Block AI scrapers",
    build: () => [
      makeRule("*", "/", ""),
      makeRule("GPTBot", "", "/"),
      makeRule("CCBot", "", "/"),
      makeRule("anthropic-ai", "", "/"),
      makeRule("ClaudeBot", "", "/"),
    ],
  },
];

export default function RobotsTxtGeneratorPage() {
  const [rules, setRules] = useState<AgentRule[]>(() => [
    makeRule("*", "/", ""),
  ]);
  const [sitemaps, setSitemaps] = useState("");

  const robotsTxt = useMemo(() => {
    const lines: string[] = [];
    for (const rule of rules) {
      const agent = rule.agent.trim() || "*";
      lines.push(`User-agent: ${agent}`);
      for (const path of rule.allow.split("\n")) {
        const p = path.trim();
        if (p) lines.push(`Allow: ${p}`);
      }
      for (const path of rule.disallow.split("\n")) {
        const p = path.trim();
        if (p) lines.push(`Disallow: ${p}`);
      }
      const delay = rule.crawlDelay.trim();
      if (delay && Number.isFinite(Number(delay)) && Number(delay) > 0) {
        lines.push(`Crawl-delay: ${delay}`);
      }
      lines.push("");
    }
    for (const sm of sitemaps.split("\n")) {
      const url = sm.trim();
      if (url) lines.push(`Sitemap: ${url}`);
    }
    return lines.join("\n").trimEnd() + "\n";
  }, [rules, sitemaps]);

  const [copied, setCopied] = useState(false);

  async function copyTxt() {
    try {
      if (!(await copyTextNative(robotsTxt))) return;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = robotsTxt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadTxt() {
    const blob = new Blob([robotsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function updateRule(id: number, patch: Partial<AgentRule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: number) {
    setRules((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function clearAll() {
    setRules([makeRule("*", "/", "")]);
    setSitemaps("");
    setCopied(false);
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          robots.txt Generator
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Build a robots.txt that tells search engines what to crawl. Add
          per-bot rules, crawl delays and sitemaps.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
        {/* Builder */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white light:text-slate-900">
            <Bot className="h-5 w-5 text-sky-300" />
            Crawl rules
          </h2>

          <div className="mb-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setRules(preset.build())}
                className="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-500/60 hover:text-white light:border-slate-900/15 light:text-slate-700 light:hover:text-slate-900"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-white/10 bg-slate-950 p-4 light:border-slate-900/10 light:bg-slate-50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={rule.agent}
                    onChange={(e) => updateRule(rule.id, { agent: e.target.value })}
                    placeholder="*"
                    aria-label="User agent"
                    className={`${inputClass} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    disabled={rules.length <= 1}
                    aria-label="Remove rule"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-emerald-300 light:text-emerald-700">
                      Allow <span className="font-normal text-slate-500">(one per line)</span>
                    </span>
                    <textarea
                      value={rule.allow}
                      onChange={(e) => updateRule(rule.id, { allow: e.target.value })}
                      placeholder="/&#10;/public/"
                      rows={3}
                      className={`${inputClass} py-2 font-mono`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-red-300 light:text-red-700">
                      Disallow <span className="font-normal text-slate-500">(one per line)</span>
                    </span>
                    <textarea
                      value={rule.disallow}
                      onChange={(e) => updateRule(rule.id, { disallow: e.target.value })}
                      placeholder="/admin/&#10;/login/"
                      rows={3}
                      className={`${inputClass} py-2 font-mono`}
                    />
                  </label>
                </div>
                <label className="mt-3 block max-w-40">
                  <span className="mb-1 block text-xs font-medium text-slate-400 light:text-slate-600">
                    Crawl delay (sec, optional)
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={rule.crawlDelay}
                    onChange={(e) =>
                      updateRule(rule.id, { crawlDelay: e.target.value })
                    }
                    placeholder="10"
                    className={`${inputClass} font-mono`}
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRules((prev) => [...prev, makeRule("Googlebot")])}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10 light:border-slate-900/15 light:text-slate-900 light:hover:bg-slate-900/5"
          >
            <Plus className="h-4 w-4" />
            Add bot rule
          </button>

          <div className="mt-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300 light:text-slate-700">
                Sitemap URLs <span className="font-normal text-slate-500">(one per line, optional)</span>
              </span>
              <textarea
                value={sitemaps}
                onChange={(e) => setSitemaps(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                rows={2}
                className={`${inputClass} py-2 font-mono`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Eraser className="h-4 w-4" />
            Reset
          </button>
        </div>

        {/* Output */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white light:text-slate-900">
              <FileText className="h-5 w-5 text-sky-300" />
              robots.txt
            </h2>
            <span className="text-xs text-slate-500">
              {robotsTxt.split("\n").length} lines
            </span>
          </div>
          <pre className="max-h-[480px] min-h-64 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-300 light:border-slate-900/10 light:bg-slate-950 light:text-slate-300">
            {robotsTxt}
          </pre>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyTxt}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy robots.txt"}
            </button>
            <button
              type="button"
              onClick={downloadTxt}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <HowToUse
          title="How to use the robots.txt Generator"
          subtitle=""
          steps={[
            {
              title: "Pick a starting preset",
              description: "Allow all, disallow all, block admin pages or block AI scrapers.",
              icon: <Bot className="h-5 w-5" />,
            },
            {
              title: "Add per-bot rules",
              description: "Add rules for specific crawlers with allow/disallow paths, one per line.",
              icon: <Plus className="h-5 w-5" />,
            },
            {
              title: "Set crawl delays",
              description: "Optionally slow down aggressive bots with a crawl-delay in seconds.",
              icon: <Clock className="h-5 w-5" />,
            },
            {
              title: "Add sitemap URLs",
              description: "List your sitemap.xml URLs so crawlers discover every page.",
              icon: <FileText className="h-5 w-5" />,
            },
            {
              title: "Review the live file",
              description: "The robots.txt preview updates instantly as you edit the rules.",
              icon: <Eye className="h-5 w-5" />,
            },
            {
              title: "Download & upload",
              description: "Download robots.txt and upload it to your domain root.",
              icon: <Download className="h-5 w-5" />,
            },
          ]}
        />
      </div>
    </Container>
  );
}
