"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/Container";

type PasteRecord = {
  id: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  hasEditPassword?: boolean;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function PasteViewPage({ params }: PageProps) {
  const [pasteId, setPasteId] = useState("");
  const [paste, setPaste] = useState<PasteRecord | null>(null);
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plain_text");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const latestContentRef = useRef("");
  const latestLanguageRef = useRef("plain_text");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setPasteId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!pasteId) return;

    async function loadPaste() {
      try {
        setError("");
        setIsLoading(true);

        const response = await fetch(`/api/paste/${pasteId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Paste not found.");
          setPaste(null);
          return;
        }

        setPaste(data);
        setContent(data.content);
        setLanguage(data.language || "plain_text");

        latestContentRef.current = data.content;
        latestLanguageRef.current = data.language || "plain_text";
        isDirtyRef.current = false;
        setSaveStatus("saved");
      } catch {
        setError("Could not load paste.");
        setPaste(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadPaste();
  }, [pasteId]);

  async function savePaste({
    useBeacon = false,
  }: {
    useBeacon?: boolean;
  } = {}) {
    if (!pasteId || !paste) return;

    const nextContent = latestContentRef.current;
    const nextLanguage = latestLanguageRef.current;

    if (!nextContent.trim()) {
      setSaveStatus("error");
      setError("Paste content is required.");
      return;
    }

    const payload = JSON.stringify({
      content: nextContent,
      language: nextLanguage,
      expiry: "never",
      editPassword: "",
    });

    try {
      setSaveStatus("saving");

      if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([payload], {
          type: "application/json",
        });

        const sent = navigator.sendBeacon(`/api/paste/${pasteId}`, blob);

        if (sent) {
          isDirtyRef.current = false;
          setSaveStatus("saved");
          return;
        }
      }

      const response = await fetch(`/api/paste/${pasteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: useBeacon,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setSaveStatus("error");
        setError(data?.error || "Could not auto-save paste.");
        return;
      }

      setPaste(data);
      isDirtyRef.current = false;
      setSaveStatus("saved");
      setError("");
    } catch {
      setSaveStatus("error");
      setError("Could not auto-save paste.");
    }
  }

  function scheduleSave(nextContent: string) {
    latestContentRef.current = nextContent;
    isDirtyRef.current = true;
    setSaveStatus("idle");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      savePaste();
    }, 800);
  }

  function handleContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextContent = event.target.value;
    setContent(nextContent);
    scheduleSave(nextContent);
  }

  useEffect(() => {
    function saveOnLeave() {
      if (isDirtyRef.current) {
        savePaste({ useBeacon: true });
      }
    }

    window.addEventListener("beforeunload", saveOnLeave);
    window.addEventListener("pagehide", saveOnLeave);

    return () => {
      window.removeEventListener("beforeunload", saveOnLeave);
      window.removeEventListener("pagehide", saveOnLeave);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      if (isDirtyRef.current) {
        savePaste({ useBeacon: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteId, paste]);

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
          <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading paste...
            </div>
          </div>
        ) : error && !paste ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : paste ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm text-slate-500">
                /paste/{pasteId}
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
              className="min-h-[75vh] w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />
          </div>
        ) : null}
      </div>
    </Container>
  );
}