"use client";

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
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
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
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm text-slate-500">
                Paste ID: {paste.id}
              </p>

              <div
                className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                  saveStatus === "error"
                    ? "bg-red-500/10 text-red-300"
                    : saveStatus === "saving"
                      ? "bg-violet-500/10 text-violet-300"
                      : "bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {getSaveLabel()}
              </div>
            </div>

            {error ? (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <textarea
              value={content}
              onChange={handleContentChange}
              spellCheck={false}
              autoFocus
              placeholder="Start typing..."
              className="min-h-[75vh] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
        ) : null}
      </div>
    </Container>
  );
}