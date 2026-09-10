"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Eye,
  EyeOff,
  FileJson,
  FileText,
  Globe2,
  History,
  Key,
  Loader2,
  Lock,
  Play,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

/* ==========================================================================
   TYPES
========================================================================== */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

type AuthType = "none" | "bearer" | "basic" | "apikey";

type BodyType = "none" | "json" | "text" | "form-urlencoded" | "form-data";

type Param = { key: string; value: string; enabled: boolean };

interface SavedRequest {
  id: string;
  name: string;
  method: Method;
  url: string;
  params: Param[];
  headers: Param[];
  authType: AuthType;
  authConfig: { token: string; username: string; password: string; apiKey: string; apiKeyName: string; apiKeyIn: "header" | "query" };
  bodyType: BodyType;
  body: string;
  formData: Param[];
  createdAt: number;
}

interface HistoryEntry {
  id: string;
  method: Method;
  url: string;
  status: number;
  time: number;
  timestamp: number;
  request: {
    params: Param[];
    headers: Param[];
    authType: AuthType;
    authConfig: SavedRequest["authConfig"];
    bodyType: BodyType;
    body: string;
    formData: Param[];
  };
}

interface ResponseResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

/* ==========================================================================
   STORAGE HELPERS
========================================================================== */

function loadSaved(): SavedRequest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("api_tester_saved") || "[]");
  } catch { return []; }
}

function saveToDisk(list: SavedRequest[]) {
  localStorage.setItem("api_tester_saved", JSON.stringify(list));
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("api_tester_history") || "[]");
  } catch { return []; }
}

function saveHistory(list: HistoryEntry[]) {
  localStorage.setItem("api_tester_history", JSON.stringify(list.slice(0, 50)));
}

/* ==========================================================================
   METHOD COLOR MAP
========================================================================== */

const METHOD_COLORS: Record<Method, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PUT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  HEAD: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  OPTIONS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const METHOD_BG: Record<Method, string> = {
  GET: "bg-emerald-600 hover:bg-emerald-500",
  POST: "bg-amber-600 hover:bg-amber-500",
  PUT: "bg-blue-600 hover:bg-blue-500",
  PATCH: "bg-orange-600 hover:bg-orange-500",
  DELETE: "bg-red-600 hover:bg-red-500",
  HEAD: "bg-slate-600 hover:bg-slate-500",
  OPTIONS: "bg-purple-600 hover:bg-purple-500",
};

/* ==========================================================================
   SHARED EMPTY PARAM
========================================================================== */

function emptyParam(): Param {
  return { key: "", value: "", enabled: true };
}

type ApiKeyIn = "header" | "query";

function emptyAuthConfig(): { token: string; username: string; password: string; apiKey: string; apiKeyName: string; apiKeyIn: ApiKeyIn } {
  return { token: "", username: "", password: "", apiKey: "", apiKeyName: "X-API-Key", apiKeyIn: "header" as ApiKeyIn };
}

/* ==========================================================================
   HOW TO USE SECTION
========================================================================== */

const howToUseSteps = [
  { title: "Pick a method", description: "Choose GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.", icon: <Send className="h-5 w-5" /> },
  { title: "Enter the URL", description: "Paste the API endpoint you want to test.", icon: <Globe2 className="h-5 w-5" /> },
  { title: "Configure request", description: "Set params, headers, auth, and body from the tabs.", icon: <Settings2 className="h-5 w-5" /> },
  { title: "Send & inspect", description: "Fire the request and check status, headers, and body.", icon: <Play className="h-5 w-5" /> },
  { title: "Save for later", description: "Save requests to collections or revisit from history.", icon: <Database className="h-5 w-5" /> },
  { title: "Copy the response", description: "Copy response bodies or headers straight to your clipboard.", icon: <Copy className="h-5 w-5" /> },
];


/* ==========================================================================
   PARAM EDITOR COMPONENT
========================================================================== */

function ParamEditor({
  params,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  params: Param[];
  onChange: (p: Param[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  function update(index: number, field: keyof Param, val: string | boolean) {
    const copy = [...params];
    copy[index] = { ...copy[index], [field]: val };
    onChange(copy);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-semibold text-slate-500">
        <span className="w-8" />
        <span>Key</span>
        <span>Value</span>
        <span className="w-8" />
      </div>
      {params.map((p, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => update(i, "enabled", e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
          />
          <input
            value={p.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder={keyPlaceholder || "Key"}
            spellCheck={false}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
          <input
            value={p.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder={valuePlaceholder || "Value"}
            spellCheck={false}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
          />
          <button
            onClick={() => onChange(params.filter((_, j) => j !== i))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...params, emptyParam()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-violet-400/40 hover:text-violet-300"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

/* ==========================================================================
   AUTH EDITOR COMPONENT
========================================================================== */

function AuthEditor({
  authType,
  onAuthTypeChange,
  config,
  onConfigChange,
}: {
  authType: AuthType;
  onAuthTypeChange: (t: AuthType) => void;
  config: SavedRequest["authConfig"];
  onConfigChange: (c: SavedRequest["authConfig"]) => void;
}) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["none", "bearer", "basic", "apikey"] as AuthType[]).map((t) => (
          <button
            key={t}
            onClick={() => onAuthTypeChange(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              authType === t
                ? "bg-violet-600 text-white"
                : "border border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-white"
            }`}
          >
            {t === "none" ? "No Auth" : t === "bearer" ? "Bearer Token" : t === "basic" ? "Basic Auth" : "API Key"}
          </button>
        ))}
      </div>

      {authType === "bearer" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Token</label>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center rounded-lg border border-white/10 bg-slate-950 px-3">
              <span className="mr-2 text-xs text-slate-600">Bearer</span>
              <input
                value={config.token}
                onChange={(e) => onConfigChange({ ...config, token: e.target.value })}
                type={showToken ? "text" : "password"}
                placeholder="Enter your token"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={() => setShowToken(!showToken)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {authType === "basic" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Username</label>
            <input
              value={config.username}
              onChange={(e) => onConfigChange({ ...config, username: e.target.value })}
              placeholder="Username"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Password</label>
            <input
              value={config.password}
              onChange={(e) => onConfigChange({ ...config, password: e.target.value })}
              type={showToken ? "text" : "password"}
              placeholder="Password"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
          <button
            onClick={() => setShowToken(!showToken)}
            className="inline-flex w-fit items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showToken ? "Hide" : "Show"} credentials
          </button>
        </div>
      )}

      {authType === "apikey" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Header / Param Name</label>
              <input
                value={config.apiKeyName}
                onChange={(e) => onConfigChange({ ...config, apiKeyName: e.target.value })}
                placeholder="X-API-Key"
                spellCheck={false}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Send In</label>
              <select
                value={config.apiKeyIn}
                onChange={(e) => onConfigChange({ ...config, apiKeyIn: e.target.value as "header" | "query" })}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none transition focus:border-violet-500"
              >
                <option value="header">Header</option>
                <option value="query">Query Param</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Value</label>
            <input
              value={config.apiKey}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              type={showToken ? "text" : "password"}
              placeholder="Enter API key"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showToken ? "Hide" : "Show"} key
            </button>
          </div>
        </div>
      )}

      {authType === "none" && (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950 p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">No authentication configured for this request.</p>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE
========================================================================== */

export default function HttpRequestTesterPage() {
  /* ---- Request state ---- */
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("");
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Param[]>([]);
  const [authType, setAuthType] = useState<AuthType>("none");
  const [authConfig, setAuthConfig] = useState(emptyAuthConfig);
  const [bodyType, setBodyType] = useState<BodyType>("none");
  const [body, setBody] = useState("");
  const [formData, setFormData] = useState<Param[]>([]);

  /* ---- UI state ---- */
  const [reqTab, setReqTab] = useState<"params" | "headers" | "auth" | "body">("params");
  const [resTab, setResTab] = useState<"body" | "headers" | "raw">("body");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResponseResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"collections" | "history">("collections");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---- Saved collections ---- */
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /* ---- Load from localStorage ---- */
  useEffect(() => {
    setSaved(loadSaved());
    setHistory(loadHistory());
  }, []);

  /* ---- Build full URL from base + params ---- */
  const buildUrl = useCallback(() => {
    let base = url.trim();
    if (!base) return "";
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`;

    const enabledParams = params.filter((p) => p.enabled && p.key.trim());

    /* Also append API key as query param if configured */
    if (authType === "apikey" && authConfig.apiKeyIn === "query" && authConfig.apiKeyName && authConfig.apiKey) {
      enabledParams.push({ key: authConfig.apiKeyName, value: authConfig.apiKey, enabled: true });
    }

    if (enabledParams.length === 0) return base;

    const separator = base.includes("?") ? "&" : "?";
    const qs = enabledParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    return base + separator + qs;
  }, [url, params, authType, authConfig]);

  /* ---- Send request ---- */
  async function send() {
    const target = buildUrl();
    if (!target) return;

    setLoading(true);
    setError("");
    setResult(null);

    /* Build headers */
    const fetchHeaders = new Headers();
    for (const h of headers.filter((h) => h.enabled && h.key.trim())) {
      fetchHeaders.set(h.key, h.value);
    }

    /* Apply auth */
    if (authType === "bearer" && authConfig.token) {
      fetchHeaders.set("Authorization", `Bearer ${authConfig.token}`);
    } else if (authType === "basic" && authConfig.username) {
      fetchHeaders.set("Authorization", `Basic ${btoa(`${authConfig.username}:${authConfig.password}`)}`);
    } else if (authType === "apikey" && authConfig.apiKeyIn === "header" && authConfig.apiKeyName && authConfig.apiKey) {
      fetchHeaders.set(authConfig.apiKeyName, authConfig.apiKey);
    }

    /* Build body */
    let requestBody: string | undefined;
    const hasBody = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

    if (hasBody && bodyType === "json" && body.trim()) {
      requestBody = body;
      if (!fetchHeaders.has("Content-Type")) fetchHeaders.set("Content-Type", "application/json");
    } else if (hasBody && bodyType === "text" && body.trim()) {
      requestBody = body;
      if (!fetchHeaders.has("Content-Type")) fetchHeaders.set("Content-Type", "text/plain");
    } else if (hasBody && bodyType === "form-urlencoded") {
      const enabled = formData.filter((f) => f.enabled && f.key.trim());
      if (enabled.length > 0) {
        requestBody = enabled.map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`).join("&");
        if (!fetchHeaders.has("Content-Type")) fetchHeaders.set("Content-Type", "application/x-www-form-urlencoded");
      }
    }

    const started = performance.now();

    try {
      const response = await fetch(target, {
        method,
        headers: fetchHeaders,
        body: requestBody,
        redirect: "follow",
      });
      const time = Math.round(performance.now() - started);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();
      const size = new TextEncoder().encode(responseBody).byteLength;

      setResult({ status: response.status, statusText: response.statusText, headers: responseHeaders, body: responseBody, time, size });

      /* Save to history */
      const entry: HistoryEntry = {
        id: Date.now().toString(36),
        method,
        url: url.trim(),
        status: response.status,
        time,
        timestamp: Date.now(),
        request: { params: [...params], headers: [...headers], authType, authConfig: { ...authConfig }, bodyType, body, formData: [...formData] },
      };
      const newHistory = [entry, ...history].slice(0, 50);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The request failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Save request to collection ---- */
  function saveRequest() {
    if (!saveName.trim()) return;
    const req: SavedRequest = {
      id: Date.now().toString(36),
      name: saveName.trim(),
      method,
      url: url.trim(),
      params: [...params],
      headers: [...headers],
      authType,
      authConfig: { ...authConfig },
      bodyType,
      body,
      formData: [...formData],
      createdAt: Date.now(),
    };
    const updated = [...saved, req];
    setSaved(updated);
    saveToDisk(updated);
    setSaveName("");
    setShowSaveDialog(false);
  }

  /* ---- Load request from collection or history ---- */
  function loadRequest(data: Partial<SavedRequest> & { method: Method; url: string }) {
    setMethod(data.method);
    setUrl(data.url);
    setParams(data.params || []);
    setHeaders(data.headers || []);
    setAuthType(data.authType || "none");
    setAuthConfig(data.authConfig || emptyAuthConfig());
    setBodyType(data.bodyType || "none");
    setBody(data.body || "");
    setFormData(data.formData || []);
    setResult(null);
    setError("");
    setSidebarOpen(false);
  }

  /* ---- Delete saved request ---- */
  function deleteSaved(id: string) {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    saveToDisk(updated);
  }

  /* ---- Clear history ---- */
  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  /* ---- Copy response ---- */
  async function copyResponse() {
    if (!result) return;
    const text = `Status: ${result.status} ${result.statusText}\n\nHeaders:\n${Object.entries(
      result.headers,
    )
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}\n\nBody:\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  /* ---- Clear all ---- */
  function clearAll() {
    setUrl("");
    setBody("");
    setParams([]);
    setHeaders([]);
    setAuthType("none");
    setAuthConfig(emptyAuthConfig());
    setBodyType("none");
    setFormData([]);
    setResult(null);
    setError("");
  }

  /* ---- Status color ---- */
  const statusColor = result
    ? result.status < 300
      ? "text-emerald-400"
      : result.status < 400
        ? "text-amber-400"
        : result.status < 500
          ? "text-orange-400"
          : "text-red-400"
    : "";

  const statusBg = result
    ? result.status < 300
      ? "bg-emerald-500/10 border-emerald-500/20"
      : result.status < 400
        ? "bg-amber-500/10 border-amber-500/20"
        : result.status < 500
          ? "bg-orange-500/10 border-orange-500/20"
          : "bg-red-500/10 border-red-500/20"
    : "";

  /* ---- Format body as pretty JSON ---- */
  function prettyBody(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  /* ---- Format size ---- */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /* ---- Count active params/headers ---- */
  const activeParams = params.filter((p) => p.enabled && p.key.trim()).length;
  const activeHeaders = headers.filter((h) => h.enabled && h.key.trim()).length;
  const hasAuth = authType !== "none";

  const REQ_TABS = [
    { key: "params" as const, label: "Params", badge: activeParams },
    { key: "headers" as const, label: "Headers", badge: activeHeaders },
    { key: "auth" as const, label: "Auth", badge: hasAuth ? 1 : 0 },
    { key: "body" as const, label: "Body", badge: bodyType !== "none" ? 1 : 0 },
  ];

  return (
    <Container className="py-12 sm:py-16">
      {/* Back link */}
      <Link
        href="/tools/text-developer-tools"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tools
      </Link>

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          API Tester
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
Build API requests with params, headers, auth, and body, inspect responses, and save requests for reuse.
        </p>
      </div>

      {/* Main layout */}
      <div className="mx-auto mt-10 max-w-6xl">
        <div className="flex gap-4">
          {/* ===== Sidebar toggle (mobile) ===== */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 sm:hidden"
          >
            <Database className="h-5 w-5" />
          </button>

          {/* ===== Sidebar (collections & history) ===== */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-72 transform bg-slate-950/95 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 sm:relative sm:inset-auto sm:z-auto sm:w-64 sm:shrink-0 sm:translate-x-0 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.03]
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex rounded-lg border border-white/10 bg-slate-900 p-0.5">
                  <button
                    onClick={() => setSidebarTab("collections")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${sidebarTab === "collections" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Saved
                  </button>
                  <button
                    onClick={() => setSidebarTab("history")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${sidebarTab === "history" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    <History className="h-3.5 w-3.5" /> History
                  </button>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:text-white sm:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {sidebarTab === "collections" && (
                  <>
                    {saved.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                        <BookOpen className="mx-auto h-7 w-7 text-slate-600" />
                        <p className="mt-2 text-xs text-slate-500">No saved requests yet.</p>
                        <p className="text-xs text-slate-600">Send a request, then click Save.</p>
                      </div>
                    )}
                    {saved.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => loadRequest(s)}
                        className="group flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition hover:border-violet-400/30 hover:bg-white/[0.04]"
                      >
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLORS[s.method]}`}>
                          {s.method}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-300">
                          {s.name}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSaved(s.id); }}
                          className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-slate-600 transition hover:text-red-400 group-hover:flex"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {sidebarTab === "history" && (
                  <>
                    {history.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="mb-2 text-xs font-medium text-slate-600 transition hover:text-red-400"
                      >
                        Clear all
                      </button>
                    )}
                    {history.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                        <History className="mx-auto h-7 w-7 text-slate-600" />
                        <p className="mt-2 text-xs text-slate-500">No request history yet.</p>
                      </div>
                    )}
                    {history.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => loadRequest({ ...h.request, method: h.method, url: h.url })}
                        className="group flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition hover:border-violet-400/30 hover:bg-white/[0.04]"
                      >
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLORS[h.method]}`}>
                          {h.method}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                          {h.url}
                        </span>
                        <span className={`shrink-0 text-[10px] font-bold ${h.status < 300 ? "text-emerald-400" : h.status < 400 ? "text-amber-400" : "text-red-400"}`}>
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ===== Main content ===== */}
          <div className="min-w-0 flex-1">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              {/* ---- Method + URL ---- */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold text-white outline-none transition ${METHOD_COLORS[method]}`}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-slate-950 px-4">
                  <Globe2 className="mr-3 h-4 w-4 shrink-0 text-slate-500" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
                    placeholder="https://api.example.com/endpoint"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* ---- Request tabs ---- */}
              <div className="mt-5 border-b border-white/10">
                <div className="-mb-px flex gap-1 overflow-x-auto">
                  {REQ_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setReqTab(tab.key)}
                      className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                        reqTab === tab.key
                          ? "border-violet-500 text-white"
                          : "border-transparent text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {tab.label}
                      {tab.badge > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500/30 px-1 text-[10px] text-violet-300">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---- Tab content ---- */}
              <div className="mt-4">
                {reqTab === "params" && (
                  <ParamEditor params={params} onChange={setParams} keyPlaceholder="Parameter" valuePlaceholder="Value" />
                )}

                {reqTab === "headers" && (
                  <ParamEditor params={headers} onChange={setHeaders} keyPlaceholder="Header name" valuePlaceholder="Header value" />
                )}

                {reqTab === "auth" && (
                  <AuthEditor authType={authType} onAuthTypeChange={setAuthType} config={authConfig} onConfigChange={setAuthConfig} />
                )}

                {reqTab === "body" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(["none", "json", "text", "form-urlencoded"] as BodyType[]).map((bt) => {
                        const labels: Record<BodyType, string> = { none: "None", json: "JSON", text: "Raw Text", "form-urlencoded": "Form URL Encoded", "form-data": "Form Data" };
                        const disabled = method === "GET" || method === "HEAD" || method === "OPTIONS";
                        return (
                          <button
                            key={bt}
                            onClick={() => !disabled && setBodyType(bt)}
                            disabled={disabled}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              bodyType === bt
                                ? "bg-violet-600 text-white"
                                : "border border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-white"
                            }`}
                          >
                            {labels[bt]}
                          </button>
                        );
                      })}
                    </div>

                    {(method === "GET" || method === "HEAD" || method === "OPTIONS") && bodyType === "none" && (
                      <div className="rounded-xl border border-dashed border-white/10 bg-slate-950 p-6 text-center">
                        <FileText className="mx-auto h-8 w-8 text-slate-600" />
                        <p className="mt-2 text-sm text-slate-500">Body is not sent for this HTTP method.</p>
                      </div>
                    )}

                    {bodyType === "json" && (
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        placeholder={'{\n  "key": "value"\n}'}
                        spellCheck={false}
                        className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                      />
                    )}

                    {bodyType === "text" && (
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        placeholder="Enter raw text body..."
                        spellCheck={false}
                        className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                      />
                    )}

                    {bodyType === "form-urlencoded" && (
                      <ParamEditor params={formData} onChange={setFormData} keyPlaceholder="Field name" valuePlaceholder="Field value" />
                    )}
                  </div>
                )}
              </div>

              {/* ---- Action buttons ---- */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={send}
                  disabled={!url.trim() || loading}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${METHOD_BG[method]}`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Sending..." : "Send"}
                </button>

                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!url.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save className="h-4 w-4" /> Save
                </button>

                <button
                  onClick={copyResponse}
                  disabled={!result}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  onClick={clearAll}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" /> Clear
                </button>
              </div>

              {/* ---- Save dialog ---- */}
              {showSaveDialog && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <Save className="h-4 w-4 shrink-0 text-violet-400" />
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRequest(); }}
                    placeholder="Request name (e.g., Get Users)"
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={saveRequest}
                    disabled={!saveName.trim()}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveDialog(false); setSaveName(""); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* ---- Error ---- */}
              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-medium leading-6 text-red-200">{error}</p>
                </div>
              )}

              {/* ---- Response ---- */}
              {result && (
                <div className="mt-6 space-y-4">
                  {/* Status bar */}
                  <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${statusBg}`}>
                    <span className={`text-2xl font-bold ${statusColor}`}>{result.status}</span>
                    <span className="text-sm font-semibold text-slate-300">{result.statusText || "OK"}</span>
                    <span className="ml-auto flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" /> {result.time} ms
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-400">
                        <FileJson className="h-3.5 w-3.5" /> {formatSize(result.size)}
                      </span>
                    </span>
                  </div>

                  {/* Response tabs */}
                  <div className="border-b border-white/10">
                    <div className="-mb-px flex gap-1">
                      {([
                        { key: "body" as const, label: "Body" },
                        { key: "headers" as const, label: `Headers (${Object.keys(result.headers).length})` },
                        { key: "raw" as const, label: "Raw" },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setResTab(tab.key)}
                          className={`border-b-2 px-4 py-2 text-xs font-semibold transition ${
                            resTab === tab.key
                              ? "border-violet-500 text-white"
                              : "border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response body (pretty) */}
                  {resTab === "body" && (
                    <div className="relative">
                      <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                        {result.body ? prettyBody(result.body) : "(empty body)"}
                      </pre>
                    </div>
                  )}

                  {/* Response headers */}
                  {resTab === "headers" && (
                    <div className="max-h-96 space-y-1 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4">
                      {Object.entries(result.headers).length === 0 && (
                        <p className="text-xs text-slate-500">No response headers.</p>
                      )}
                      {Object.entries(result.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-3 text-xs leading-6">
                          <span className="shrink-0 font-semibold text-violet-300">{key}:</span>
                          <span className="break-all text-slate-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw */}
                  {resTab === "raw" && (
                    <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-[11px] leading-5 text-slate-300">
                      {result.body || "(empty body)"}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="mx-auto max-w-6xl">
      <HowToUse
        title="How to use API Tester"
        subtitle=""
        steps={howToUseSteps}
      />

      </div>
    </Container>
  );
}