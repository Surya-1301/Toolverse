"use client";

import { useCallback, useRef, useState } from "react";
import {
  DEFAULT_COBALT_API,
  clearInstanceInfoCache,
  cobaltDownload,
  createSession,
  getInstanceInfo,
  isAuthError,
  type CobaltAuth,
  type CobaltRequest,
  type CobaltResponse,
} from "./cobalt";

// In-memory JWT cache per API instance (tokens are short-lived).
const tokenCache = new Map<string, { token: string; exp: number }>();

export type ChallengeState = "challenge" | null;

export type AuthState = "challenge" | "needs-server" | "key-error" | null;

function normalizeBase(base: string): string {
  return base.trim().replace(/\/+$/, "").toLowerCase();
}

// Instances whose Turnstile widget can never work on a third-party site,
// because the sitekey is bound to the instance owner's domains.
const PUBLIC_BASES = [normalizeBase(DEFAULT_COBALT_API)];


export function useCobaltDownloader(apiBase: string, apiKey: string) {
  const [challengeSitekey, setChallengeSitekey] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(null);
  const lastBodyRef = useRef<CobaltRequest | null>(null);
  const apiBaseRef = useRef(apiBase);
  apiBaseRef.current = apiBase;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;

  const getAuth = useCallback((): CobaltAuth => {
    const key = apiKeyRef.current.trim();
    if (key) return { scheme: "Api-Key", token: key };
    const base = apiBaseRef.current.trim();
    const cached = tokenCache.get(base);
    if (cached && cached.exp > Date.now() + 30_000) {
      return { scheme: "Bearer", token: cached.token };
    }
    return null;
  }, []);

  const download = useCallback(
    async (
      body: CobaltRequest,
      signal?: AbortSignal,
    ): Promise<CobaltResponse | "challenge"> => {
      lastBodyRef.current = body;
      const base = apiBaseRef.current;
      const info = await getInstanceInfo(base);
      const res = await cobaltDownload(base, body, {
        signal,
        auth: getAuth(),
      });

      if (res.status === "error" && isAuthError(res.error.code)) {
        if (apiKeyRef.current.trim()) {
          // Key was sent but rejected.
          setChallengeSitekey(null);
          setAuthState("key-error");
        } else if (info.sitekey && !PUBLIC_BASES.includes(normalizeBase(base))) {
          // Own instance: the human check can work if the site's domain
          // is allowed in the owner's Cloudflare Turnstile widget.
          setChallengeSitekey(info.sitekey);
          setAuthState("challenge");
        } else {
          // Public instance (or no Turnstile offered): the widget is
          // domain-bound to the instance owner's sites and can never
          // load here. Point the user at their own server instead.
          setChallengeSitekey(null);
          setAuthState("needs-server");
        }
        return "challenge";
      }
      setChallengeSitekey(null);
      setAuthState(null);
      return res;
    },
    [getAuth],
  );

  const solveChallenge = useCallback(
    async (
      turnstileResponse: string,
      signal?: AbortSignal,
    ): Promise<CobaltResponse | "challenge"> => {
      const base = apiBaseRef.current.trim();
      try {
        const { token, exp } = await createSession(base, turnstileResponse);
        tokenCache.set(base, { token, exp });
      } catch {
        return {
          status: "error",
          error: { code: "error.api.auth.jwt.invalid" },
        };
      }
      setChallengeSitekey(null);
      setAuthState(null);
      const body = lastBodyRef.current;
      if (!body) return "challenge";
      return download(body, signal);
    },
    [download],
  );

  const resetChallenge = useCallback(() => {
    setChallengeSitekey(null);
    setAuthState(null);
    clearInstanceInfoCache();
  }, []);

  return {
    download,
    solveChallenge,
    challengeSitekey,
    authState,
    resetChallenge,
  };
}
