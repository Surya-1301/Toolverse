"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, fetchApi } from "@/lib/apiBase";
import {
  decryptEncryptedFile,
  decryptEncryptedMetadata,
} from "@/lib/clientEncryption";

type FileRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  downloads: number;
  downloadUrl: string;
  encrypted?: boolean;
  encryption?: {
    salt: string;
    iv: string;
    metadataIv: string;
    encryptedMetadata: string;
  } | null;
};

export default function ShareFilePage() {
  return (
    <Suspense fallback={<ShareFileLoading />}>
      <ShareFileContent />
    </Suspense>
  );
}

function ShareFileLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading file...
        </div>
      </div>
    </Container>
  );
}

function ShareFileContent() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("id") || "";

  const [file, setFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    document.title = "ToolverseX - Your All-in-One Utility Hub.";
  }, []);

  useEffect(() => {
    async function loadFile() {
      if (!fileId) {
        setError("Missing file ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await fetchApi(`/api/file/${fileId}/meta`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: (FileRecord & { error?: string }) | null = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              responseText ||
              `Could not load file. Backend returned ${response.status}.`,
          );
          setFile(null);
          return;
        }

        if (!data) {
          setError("File not found.");
          setFile(null);
          return;
        }

        setFile(data);
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not load file: ${caughtError.message}`
            : "Could not load file.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [fileId]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatExpiry(value: string | null) {
    if (!value) return "Never";
    return formatDate(value);
  }

  const isPdf = file?.mimeType === "application/pdf";
  const downloadPath = fileId ? apiUrl(`/api/file/${fileId}/download`) : "";

  async function decryptAndDownload() {
    if (!file?.encryption || !password) return;

    try {
      setDecrypting(true);
      setError("");

      const [metadata, response] = await Promise.all([
        decryptEncryptedMetadata(
          file.encryption.encryptedMetadata,
          password,
          file.encryption.salt,
          file.encryption.metadataIv,
        ),
        fetch(downloadPath),
      ]);

      if (!response.ok) {
        throw new Error("Could not download encrypted file.");
      }

      const decryptedBlob = await decryptEncryptedFile(
        await response.blob(),
        password,
        file.encryption.salt,
        file.encryption.iv,
      );

      const url = URL.createObjectURL(
        new Blob([decryptedBlob], { type: metadata.mimeType }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = metadata.originalName || file.id;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Incorrect password or encrypted file is corrupted.");
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <ShareFileLoading />
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : file ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {isPdf ? "Shared PDF" : "Shared File"}
            </h1>

            <p className="mt-3 break-all text-slate-400">
              {file.encrypted
                ? "Encrypted file — enter the password to decrypt in your browser."
                : file.originalName}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Type</p>
                <p className="mt-1 break-all text-sm text-slate-200">
                  {file.mimeType}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Size</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Created</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(file.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Expires</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatExpiry(file.expiresAt)}
                </p>
              </div>
            </div>

            {file.encrypted ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <label className="mb-2 block text-sm font-medium text-emerald-100">
                  Encryption password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                  placeholder="Enter password"
                />

                <button
                  type="button"
                  onClick={decryptAndDownload}
                  disabled={!password || decrypting}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {decrypting ? "Decrypting..." : "Decrypt & download"}
                </button>
              </div>
            ) : (
              <a
                href={downloadPath}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <Download className="h-4 w-4" />
                {isPdf ? "Open PDF" : "Download file"}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </Container>
  );
}