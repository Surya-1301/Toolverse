function normalizeConfiguredUrl(value: string | undefined) {
  const trimmed = (value || "").trim();

  if (!trimmed) return "";

  const markdownMatch = trimmed.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i);
  const plainMarkdownLikeMatch = trimmed.match(/^(https?:\/\/[^\s]+)$/i);

  const normalized = markdownMatch
    ? markdownMatch[1]
    : plainMarkdownLikeMatch
      ? plainMarkdownLikeMatch[1]
      : trimmed.replace(/^['"]|['"]$/g, "");

  try {
    const url = new URL(normalized);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return normalized.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

let workingApiBaseUrl = "";
let workingPdfApiBaseUrl = "";

export function getApiBaseCandidates() {
  return unique([
    normalizeConfiguredUrl(process.env.NEXT_PUBLIC_API_BASE_URL),

    // Main Cloudflare Worker API
    "https://toolversex-api.jethalalmirror.workers.dev",

    // Fallback only if you actually deployed this Worker too
    "https://toolversex-api.workers.dev",
  ]);
}

export function getApiBaseUrl() {
  return workingApiBaseUrl || getApiBaseCandidates()[0] || "";
}

export function apiUrl(path: string, baseUrl = getApiBaseUrl()) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export async function fetchApi(path: string, init?: RequestInit) {
  const candidates = getApiBaseCandidates();
  const errors: string[] = [];

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(apiUrl(path, baseUrl), init);
      workingApiBaseUrl = baseUrl;
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${baseUrl}: ${message}`);
    }
  }

  throw new Error(errors[0] || "Could not reach the backend API.");
}

export function getPdfApiBaseCandidates() {
  return unique([
    normalizeConfiguredUrl(process.env.NEXT_PUBLIC_PDF_API_BASE_URL),

    // Main PDF backend
    "https://toolverse-pdf-api.onrender.com",

    // Fallback only if deployed
    "https://toolversex-pdf-api.onrender.com",
  ]);
}

export function getPdfApiBaseUrl() {
  return workingPdfApiBaseUrl || getPdfApiBaseCandidates()[0] || "";
}

export async function fetchPdfApi(path: string, init?: RequestInit) {
  const candidates = getPdfApiBaseCandidates();
  const errors: string[] = [];
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${cleanPath}`, init);
      workingPdfApiBaseUrl = baseUrl;
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${baseUrl}: ${message}`);
    }
  }

  throw new Error(errors[0] || "Could not reach the PDF backend.");
}