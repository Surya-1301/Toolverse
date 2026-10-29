"use client";

import { BackButton } from "@/components/BackButton";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/Container";
import { fetchApi } from "@/lib/apiBase";

type PasteRecord = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function PasteViewPage() {
  return (
    <Suspense fallback={<PasteLoading />}>
      <PasteEditor />
    </Suspense>
  );
}

function PasteLoading() {
  return (
    <Container className="py-6 sm:py-8">
      <div className="apple-glass relative overflow-hidden flex min-h-[70vh] items-center justify-center rounded-3xl p-8 backdrop-blur-xl">
        <div className="apple-specular opacity-40" />
        <div className="flex items-center gap-3 text-slate-400 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
          Loading paste...
        </div>
      </div>
    </Container>
  );
}

function PasteEditor() {
  const searchParams = useSearchParams();
  const pasteId = searchParams.get("id") || "";

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef("");

  const [paste, setPaste] = useState<PasteRecord | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    document.title = "Toolverse - Your All-in-One Utility Hub.";
  }, []);

  useEffect(() => {
    async function loadPaste() {
      if (!pasteId) {
        setError("Missing paste ID.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const response = await fetchApi(`/api/paste/${pasteId}`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: (PasteRecord & { error?: string }) | null = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              responseText ||
              `Could not load paste. Backend returned ${response.status}.`,
          );
          setPaste(null);
          return;
        }

        if (!data) {
          setError("Paste not found.");
          setPaste(null);
          return;
        }

        setPaste(data);
        setContent(data.content || "");
        latestContentRef.current = data.content || "";
        setSaveStatus("saved");
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not load paste: ${caughtError.message}`
            : "Could not load paste.",
        );
        setPaste(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadPaste();

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [pasteId]);

  async function savePaste(nextContent: string) {
    if (!pasteId) return;

    try {
      setSaveStatus("saving");

      const response = await fetchApi(`/api/paste/${pasteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: nextContent,
          language: paste?.language || "plain_text",
        }),
      });

      const responseText = await response.text();

      let data: { error?: string } | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(
          data?.error ||
            responseText ||
            `Could not save paste. Backend returned ${response.status}.`,
        );
        setSaveStatus("error");
        return;
      }

      setError("");
      setSaveStatus("saved");
      latestContentRef.current = nextContent;
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof Error
          ? `Could not save paste: ${caughtError.message}`
          : "Could not save paste.",
      );
      setSaveStatus("error");
    }
  }

  function handleContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextContent = event.target.value;

    setContent(nextContent);
    setSaveStatus("idle");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      savePaste(nextContent);
    }, 700);
  }

  function getSaveLabel() {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved") return "Saved";
    if (saveStatus === "error") return "Save failed";
    return "Unsaved";
  }

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <PasteLoading />
        ) : error && !paste ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : paste ? (
          <div className="apple-glass relative overflow-hidden rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
            <div className="apple-specular opacity-40" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between gap-3">
                <BackButton fallbackHref="/paste" label="Back" />

                <div className="flex min-w-0 shrink items-center gap-2">
                  <span className="min-w-0 truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400 light:border-slate-900/10 light:bg-slate-100 light:text-slate-600">
                    Paste ID: {paste.id}
                  </span>

                  {typeof paste.views === "number" && paste.views > 0 ? (
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400 light:border-slate-900/10 light:bg-slate-100 light:text-slate-600">
                      {paste.views} view{paste.views === 1 ? "" : "s"}
                    </span>
                  ) : null}

                  <div
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      saveStatus === "error"
                        ? "border border-red-500/30 bg-red-500/10 text-red-300"
                        : saveStatus === "saving"
                          ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {getSaveLabel()}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <textarea
                value={content}
                onChange={handleContentChange}
                spellCheck={false}
                autoFocus
                placeholder="Start typing..."
                className="min-h-[75vh] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.02] p-5 font-mono text-sm leading-6 text-slate-100 outline-none backdrop-blur-sm transition placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/[0.04] focus:ring-1 focus:ring-sky-400/30 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
              />
            </div>
          </div>
        ) : null}
      </div>
    </Container>
  );
}