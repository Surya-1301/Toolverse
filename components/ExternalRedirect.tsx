"use client";

import { useEffect } from "react";

/**
 * Sends the visitor to an external site.
 *
 * The site is built with `output: "export"`, so a server-side `redirect()`
 * to an external URL can never be emitted as a real HTTP 3xx — the static
 * host only ever serves the pre-rendered HTML. This component performs the
 * redirect on the client instead and ships a `<meta http-equiv="refresh">`
 * fallback (React hoists it into <head>) for visitors without JavaScript
 * and for crawlers.
 *
 * The current query string is forwarded so deep links such as
 * `/pdf-editor?tool=merge` keep their parameters on the destination.
 */
export function ExternalRedirect({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  useEffect(() => {
    const search = window.location.search;

    window.location.replace(search ? `${url}?${search.slice(1)}` : url);
  }, [url]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <meta httpEquiv="refresh" content={`0;url=${url}`} />

      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl light:text-slate-900">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-400 light:text-slate-600">
        {description}
      </p>

      <a
        href={url}
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        Continue to PDFVerse
      </a>
    </main>
  );
}
