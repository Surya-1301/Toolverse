"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { Container } from "@/components/Container";
import { fetchApi } from "@/lib/apiBase";

type LinkRecord = {
  slug: string;
  longUrl: string;
  originalUrl?: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
};

export default function GoPage() {
  return (
    <Suspense fallback={<GoLoading />}>
      <GoContent />
    </Suspense>
  );
}

function GoLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Opening link...
        </div>
      </div>
    </Container>
  );
}

function GoContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  const [link, setLink] = useState<LinkRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function openShortLink() {
      if (!slug) {
        setError("Missing short link slug.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const response = await fetchApi(`/api/shorten/${slug}`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: (LinkRecord & { error?: string }) | null = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              responseText ||
              `Could not open short link. Backend returned ${response.status}.`,
          );
          setLink(null);
          return;
        }

        if (!data) {
          setError("Short link not found.");
          setLink(null);
          return;
        }

        setLink(data);

        const targetUrl = data.longUrl || data.originalUrl;

        if (targetUrl) {
          window.location.href = targetUrl;
        }
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not open this short link: ${caughtError.message}`
            : "Could not open this short link.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    openShortLink();
  }, [slug]);

  const targetUrl = link?.longUrl || link?.originalUrl || "";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {isLoading ? (
          <GoLoading />
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : link ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Opening link
            </h1>

            <p className="mt-4 break-all text-slate-400">{targetUrl}</p>

            <a
              href={targetUrl}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Continue
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}
      </div>
    </Container>
  );
}