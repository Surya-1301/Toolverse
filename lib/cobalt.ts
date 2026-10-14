
export const DEFAULT_COBALT_API = "https://api.cobalt.tools/";

export type CobaltRequest = {
  url: string;
  videoQuality?: string;
  audioFormat?: string;
  audioBitrate?: string;
  downloadMode?: "auto" | "audio" | "mute";
  filenameStyle?: string;
  youtubeVideoCodec?: string;
};

export type CobaltPickerItem = {
  type?: string;
  url: string;
  thumb?: string;
};

export type CobaltResponse =
  | { status: "tunnel" | "redirect"; url: string; filename?: string }
  | { status: "local-processing" }
  | { status: "picker"; picker: CobaltPickerItem[] }
  | { status: "error"; error: { code: string } };

export type InstanceInfo = {
  sitekey: string | null;
  services: string[] | null;
  version: string | null;
};

const infoCache = new Map<string, Promise<InstanceInfo>>();

function normalizeBase(apiBase: string): string {
  const clean = (apiBase || "").trim().replace(/\/+$/, "");
  return clean || DEFAULT_COBALT_API.replace(/\/+$/, "");
}

/** Basic instance info: turnstile sitekey + supported services. Cached. */
export function getInstanceInfo(apiBase: string): Promise<InstanceInfo> {
  const base = normalizeBase(apiBase);
  const cached = infoCache.get(base);
  if (cached) return cached;

  const p = (async (): Promise<InstanceInfo> => {
    try {
      const res = await fetch(`${base}/`);
      if (!res.ok) return { sitekey: null, services: null, version: null };
      const data = await res.json();
      return {
        sitekey: data?.cobalt?.turnstileSitekey ?? null,
        services: Array.isArray(data?.cobalt?.services)
          ? data.cobalt.services
          : null,
        version: data?.cobalt?.version ?? null,
      };
    } catch {
      return { sitekey: null, services: null, version: null };
    }
  })();

  infoCache.set(base, p);
  return p;
}

export function clearInstanceInfoCache() {
  infoCache.clear();
}

export type CobaltAuth =
  | { scheme: "Bearer"; token: string }
  | { scheme: "Api-Key"; token: string }
  | null;

export type CobaltDownloadOptions = {
  signal?: AbortSignal;
  auth?: CobaltAuth;
};

const ERROR_MESSAGES: Record<string, string> = {
  "error.api.invalid_body": "Invalid request. Please check the URL and try again.",
  "error.api.auth.missing": "This API instance needs authentication.",
  "error.api.auth.invalid": "This API instance rejected the request.",
  "error.api.auth.jwt.missing":
    "This server needs a quick human check first — complete it below and try again.",
  "error.api.auth.jwt.invalid": "Your check expired — complete it again below.",
  "error.api.auth.key.missing":
    "This server needs an API key — paste one in Advanced settings.",
  "error.api.rate_exceeded": "Rate limit hit — wait a minute and try again.",
  "error.link.invalid": "That link doesn't look valid.",
  "error.link.unsupported":
    "This link isn't supported by the current download server. Try another API instance in Advanced settings.",
  "error.fetch.empty": "Nothing was found at that link.",
  "error.fetch.failed":
    "Couldn't fetch the media. The post may be private or deleted.",
  "error.link.blocked": "This link is blocked on this instance.",
  "error.api.disabled":
    "This API instance is disabled. Try another instance URL below.",
};

export function cobaltErrorMessage(code: string): string {
  return (
    ERROR_MESSAGES[code] ||
    `Download failed (${code}). Try again or use another API instance.`
  );
}

/** True when the error means "solve the human check / (re)authenticate". */
export function isAuthError(code: string): boolean {
  return (
    code === "error.api.auth.jwt.missing" ||
    code === "error.api.auth.jwt.invalid" ||
    code === "error.api.auth.missing" ||
    code === "error.api.auth.invalid"
  );
}

export async function cobaltDownload(
  apiBase: string,
  body: CobaltRequest,
  options: CobaltDownloadOptions = {},
): Promise<CobaltResponse> {
  const base = normalizeBase(apiBase);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (options.auth) {
    headers.Authorization = `${options.auth.scheme} ${options.auth.token}`;
  }

  const res = await fetch(`${base}/`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok) {
    let code = "error.api.disabled";
    try {
      const data = (await res.json()) as { error?: { code?: string } };
      if (data?.error?.code) code = data.error.code;
    } catch {
      /* keep default */
    }
    return { status: "error", error: { code } };
  }

  return (await res.json()) as CobaltResponse;
}

/**
 * Exchange a solved Turnstile response for a JWT bearer token.
 * Throws with a human-readable message on failure.
 */
export async function createSession(
  apiBase: string,
  turnstileResponse: string,
): Promise<{ token: string; exp: number }> {
  const base = normalizeBase(apiBase);
  const res = await fetch(`${base}/session`, {
    method: "POST",
    headers: { "cf-turnstile-response": turnstileResponse },
  });
  if (!res.ok) {
    throw new Error("Human check failed — please try again.");
  }
  const data = await res.json();
  if (!data?.token) throw new Error("Human check failed — please try again.");
  return { token: data.token, exp: Date.now() + (data.exp ?? 600) * 1000 };
}

/** Basic sanity check so users get a fast error for obviously bad links. */
export function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  return /^(https?:\/\/)[\w-]+(\.[\w-]+)+/.test(v);
}
