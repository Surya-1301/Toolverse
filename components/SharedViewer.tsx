"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  Image as ImageIcon,
  Loader2,
  Plus,
  Shield,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, fetchApi, getApiBaseUrl } from "@/lib/apiBase";
import {
  decryptEncryptedFileWithKey,
  decryptEncryptedMetadataWithKey,
  getEncryptionKeyFromHash,
} from "@/lib/clientEncryption";

export type HostedRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  expiresAt: string | null;
  downloads?: number;
  views?: number;
  directUrl?: string;
  encrypted?: boolean;
  encryption?: {
    algorithm?: string | null;
    kdf?: string | null;
    iterations?: number | null;
    salt?: string | null;
    iv: string;
    metadataIv: string;
    encryptedMetadata: string;
  } | null;
};

type CopyType = "page" | "markdown" | "html" | "";

type SharedViewerProps = {
  mode: "owner" | "share";
};

export function SharedViewer({ mode }: SharedViewerProps) {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("id") || "";

  const [record, setRecord] = useState<HostedRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<CopyType>("");

  const [imageFailed, setImageFailed] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [decryptedImageUrl, setDecryptedImageUrl] = useState("");
  const [decryptedName, setDecryptedName] = useState("");
  const [decryptedMimeType, setDecryptedMimeType] = useState("");
  const [decryptedSize, setDecryptedSize] = useState<number | null>(null);
  const [decryptError, setDecryptError] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [hasHydrated, setHasHydrated] = useState(false);
  const [recentFiles, setRecentFiles] = useState<
    {
      id: string;
      name: string;
      kind: "file" | "image";
      size: number;
      views?: number;
      downloads?: number;
    }[]
  >([]);

  // Only render localStorage-driven UI after hydration to avoid hydration mismatches.
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("toolverse-recent-hosted");
      if (stored) setRecentFiles(JSON.parse(stored));
    } catch {
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "toolverse-recent-hosted",
        JSON.stringify(recentFiles),
      );
    } catch {
      // ignore storage errors
    }
  }, [recentFiles]);

  // Detect whether this is an image
  const isImage =
    record?.mimeType?.startsWith("image/") ||
    !!record?.width ||
    !!record?.height ||
    !!decryptedMimeType ||
    record?.views !== undefined;

  useEffect(() => {
    document.title = "Toolverse - Your All-in-One Utility Hub.";
    setEncryptionKey(getEncryptionKeyFromHash());
  }, []);

  useEffect(() => {
    return () => {
      if (decryptedImageUrl) {
        URL.revokeObjectURL(decryptedImageUrl);
      }
    };
  }, [decryptedImageUrl]);

  function trackRecord(r: HostedRecord) {
    const kind: "file" | "image" = r.mimeType?.startsWith("image/")
      ? "image"
      : "file";

    setRecentFiles((prev) => {
      const filtered = prev.filter((x) => x.id !== r.id);
      return [
        {
          id: r.id,
          name: r.originalName,
          kind,
          size: r.size,
          views: r.views,
          downloads: r.downloads,
        },
        ...filtered,
      ].slice(0, 20);
    });
  }

  useEffect(() => {
    async function loadRecord() {
      if (!shareId) {
        setError("Missing ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        setImageFailed(false);
        setDecryptError("");

        // Try file API first, then image API
        let response = await fetchApi(`/api/file/${shareId}/meta`, {
          cache: "no-store",
        });

        if (!response.ok) {
          response = await fetchApi(`/api/image/${shareId}/meta`, {
            cache: "no-store",
          });
        }

        const responseText = await response.text();
        let parsed: (HostedRecord & { error?: string }) | null = null;

        try {
          parsed = responseText ? JSON.parse(responseText) : null;
        } catch {
          parsed = null;
        }

        if (!response.ok) {
          setError(
            parsed?.error ||
              responseText ||
              `Could not load. Backend returned ${response.status}.`,
          );
          setRecord(null);
          return;
        }

        if (!parsed) {
          setError("Content not found.");
          setRecord(null);
          return;
        }

        setRecord(parsed);
        if (mode === "owner") trackRecord(parsed);
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not load: ${caughtError.message}`
            : "Could not load this content.",
        );
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  // Auto-decrypt image with key from URL hash (owner mode auto-run only)
  useEffect(() => {
    if (
      mode === "owner" &&
      isImage &&
      record?.encrypted &&
      encryptionKey &&
      !decryptedImageUrl &&
      !isDecrypting
    ) {
      decryptImage(record, encryptionKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, encryptionKey, isImage]);

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

  function getDirectUrl() {
    if (!shareId) return "";
    if (isImage) {
      return `${getApiBaseUrl()}/api/image/${shareId}/direct`;
    }
    return `${getApiBaseUrl()}/api/file/${shareId}/download`;
  }

  function getDownloadUrl() {
    if (!shareId) return "";
    return `${getApiBaseUrl()}/api/file/${shareId}/download`;
  }

  function getPageUrl() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  async function decryptImage(current: HostedRecord, key: string) {
    if (!current.encryption || !key) return;

    try {
      setIsDecrypting(true);
      setDecryptError("");

      const [metadata, response] = await Promise.all([
        decryptEncryptedMetadataWithKey(
          current.encryption.encryptedMetadata,
          key,
          current.encryption.metadataIv,
        ),
        fetch(apiUrl(`/api/image/${current.id}/direct`)),
      ]);

      if (!response.ok) {
        throw new Error("Could not download encrypted image.");
      }

      const decryptedBlob = await decryptEncryptedFileWithKey(
        await response.blob(),
        key,
        current.encryption.iv,
      );

      const imageBlob = new Blob([decryptedBlob], {
        type: metadata.mimeType,
      });

      const objectUrl = URL.createObjectURL(imageBlob);

      if (decryptedImageUrl) {
        URL.revokeObjectURL(decryptedImageUrl);
      }

      setDecryptedImageUrl(objectUrl);
      setDecryptedName(metadata.originalName);
      setDecryptedMimeType(metadata.mimeType);
      setDecryptedSize(metadata.size);
      setImageFailed(false);
    } catch (caughtError) {
      console.error(caughtError);
      setDecryptError(
        "Could not decrypt this image. The key may be missing or incorrect.",
      );
    } finally {
      setIsDecrypting(false);
    }
  }

  // Decrypt only the metadata to reveal the original file/image name,
  // as soon as an encryption key is available (no full download needed).
  async function decryptMetadataName(current: HostedRecord, key: string) {
    if (!current.encryption || !key || decryptedName) return;

    try {
      const metadata = await decryptEncryptedMetadataWithKey(
        current.encryption.encryptedMetadata,
        key,
        current.encryption.metadataIv,
      );
      setDecryptedName(metadata.originalName);
    } catch {
      // Invalid or incomplete key — ignore, we just won't reveal the name yet.
    }
  }

  // Reveal the original name as soon as a key is supplied (URL hash or typed).
  useEffect(() => {
    if (record?.encrypted && encryptionKey && !decryptedName) {
      decryptMetadataName(record, encryptionKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, encryptionKey, decryptedName]);

  async function copyValue(type: CopyType) {
    if (!record) return;

    const pageUrl = getPageUrl();
    const imageUrl = record.encrypted ? pageUrl : getDirectUrl();

    let value = "";

    if (type === "page") value = pageUrl;
    if (type === "markdown") {
      value = `![${decryptedName || record.originalName}](${imageUrl})`;
    }
    if (type === "html") {
      value = `<img src="${imageUrl}" alt="${decryptedName || record.originalName}" />`;
    }

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function downloadFile() {
    if (!record) return;

    const link = document.createElement("a");
    link.href = getDownloadUrl();
    link.download = record.originalName || record.id;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function decryptAndDownloadFile() {
    if (!record?.encryption || !encryptionKey) return;

    try {
      setIsDecrypting(true);
      setDecryptError("");

      const [metadata, response] = await Promise.all([
        decryptEncryptedMetadataWithKey(
          record.encryption.encryptedMetadata,
          encryptionKey,
          record.encryption.metadataIv,
        ),
        fetch(getDownloadUrl()),
      ]);

      if (!response.ok) {
        throw new Error("Could not download encrypted file.");
      }

      const decryptedBlob = await decryptEncryptedFileWithKey(
        await response.blob(),
        encryptionKey,
        record.encryption.iv,
      );

      const url = URL.createObjectURL(
        new Blob([decryptedBlob], { type: metadata.mimeType }),
      );

      setDecryptedName(metadata.originalName);

      const link = document.createElement("a");
      link.href = url;
      link.download = metadata.originalName || record.id;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setDecryptError("Incorrect key or encrypted file is corrupted.");
    } finally {
      setIsDecrypting(false);
    }
  }

  function downloadImage() {
    if (!record) return;

    const link = document.createElement("a");

    if (record.encrypted) {
      if (!decryptedImageUrl) return;
      link.href = decryptedImageUrl;
      link.download = decryptedName || record.id;
    } else {
      link.href = getDirectUrl();
      link.download = record.originalName || `${record.id}.png`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isPdf = record?.mimeType === "application/pdf";
  const imageSrc = shareId ? apiUrl(`/api/image/${shareId}/direct`) : "";
  const displayName = decryptedName || record?.originalName || "";
  const displayMimeType = decryptedMimeType || record?.mimeType || "";
  const displaySize =
    typeof decryptedSize === "number" ? decryptedSize : record?.size || 0;

  // ============ SHARED FILE VIEW ============
  // Keep shared non-image files on their dedicated, minimal presentation.
  // This avoids exposing owner controls such as Direct, Copy page, upload, etc.
  if (mode === "share" && !isImage) {
    return (
      <Container className="min-h-[calc(100vh-180px)] py-5 sm:py-20">
        <div className="mx-auto max-w-[800px]">
          {isLoading ? (
            <ViewerLoading />
          ) : error ? (
            <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          ) : record ? (
            <section
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10101f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              aria-label="Shared file"
            >
              <div className="p-7 text-center sm:p-8 sm:text-left">
                <h1 className="text-[42px] font-bold leading-none tracking-[-0.04em] text-white sm:text-[48px]">
                  Shared File
                </h1>

                <p className="mt-4 text-[15px] leading-6 text-slate-400 sm:text-base">
                  This file was encrypted before upload. Use the key in the share
                  link to decrypt it in your browser.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      File name
                    </p>
                    <p className="mt-2 truncate text-[15px] text-slate-200">
                      {decryptedName || record.originalName || record.mimeType || "application/octet-stream"}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      Encrypted size
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatFileSize(record.size)}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      Created
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatDate(record.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      Expires
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatExpiry(record.expiresAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] border border-emerald-500/40 bg-emerald-500/[0.10] p-4 sm:p-5">
                  <label className="block text-[15px] font-semibold text-emerald-100">
                    Encryption key
                  </label>

                  <input
                    type="text"
                    value={encryptionKey}
                    onChange={(event) => setEncryptionKey(event.target.value)}
                    aria-label="Encryption key"
                    spellCheck={false}
                    autoComplete="off"
                    className="mt-4 h-[52px] w-full rounded-[16px] border border-white/10 bg-[#020617] px-4 text-[15px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Encryption key from share link"
                  />

                  {decryptError ? (
                    <p
                      className="mt-3 text-sm leading-5 text-red-300"
                      role="alert"
                    >
                      {decryptError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={decryptAndDownloadFile}
                    disabled={!encryptionKey || isDecrypting}
                    className="mt-3 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-500 px-4 text-[15px] font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDecrypting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    {isDecrypting ? "Decrypting..." : "Decrypt & download"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </Container>
    );
  }

  // ============ IMAGE VIEW ============
  if (mode === "share" && isImage) {
    return (
      <Container className="min-h-[calc(100vh-180px)] py-5 sm:py-20">
        <div className="mx-auto max-w-[800px]">
          {isLoading ? (
            <ViewerLoading />
          ) : error ? (
            <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          ) : record ? (
            <section
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10101f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              aria-label="Shared image"
            >
             <div className="p-7 text-center sm:p-8 sm:text-left">
  <div className="flex items-center justify-center gap-4 sm:justify-between">
    <h1 className="w-full text-center text-[42px] font-bold leading-none tracking-[-0.04em] text-white sm:w-auto sm:text-left sm:text-[48px]">
      Shared Image
    </h1>
                  

                  {/* Copy buttons - desktop/tablet only, right corner */}
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => copyValue("markdown")}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-transparent px-4 text-[14px] font-medium text-white transition hover:bg-white/[0.05]"
                    >
                      {copied === "markdown" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === "markdown" ? "Copied" : "Copy Markdown"}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyValue("html")}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-transparent px-4 text-[14px] font-medium text-white transition hover:bg-white/[0.05]"
                    >
                      {copied === "html" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === "html" ? "Copied" : "Copy HTML"}
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-6 text-slate-400 sm:text-base">
                  {record.encrypted
                    ? "This image was encrypted before upload. Use the key in the share link to decrypt it in your browser."
                    : "This image is ready to view and share."}
                </p>

{/* MOBILE IMAGE COPY ACTIONS - directly below the shared image */}
                <div className="mt-6 grid grid-cols-2 gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={() => copyValue("markdown")}
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-transparent px-5 text-[15px] font-medium text-white transition hover:bg-white/[0.05]"
                  >
                    {copied === "markdown" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                    {copied === "markdown" ? "Copied" : "Copy Markdown"}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyValue("html")}
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-transparent px-5 text-[15px] font-medium text-white transition hover:bg-white/[0.05]"
                  >
                    {copied === "html" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                    {copied === "html" ? "Copied" : "Copy HTML"}
                  </button>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      File name
                    </p>
                    <p className="mt-2 truncate text-[15px] text-slate-200">
                      {decryptedName || record.originalName || record.mimeType || "image/*"}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      {record.encrypted ? "Encrypted size" : "Image size"}
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatFileSize(displaySize)}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      Created
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatDate(record.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5">
                    <p className="text-[13px] font-medium text-slate-500">
                      Expires
                    </p>
                    <p className="mt-2 text-[15px] text-slate-200">
                      {formatExpiry(record.expiresAt)}
                    </p>
                  </div>
                </div>

                {/* IMAGE PREVIEW */}
                <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10 bg-[#020617]/95 p-4 sm:p-5">
                  {record.encrypted ? (
                    decryptedImageUrl ? (
                      <div className="rounded-[16px] bg-black/20 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={decryptedImageUrl}
                          alt={displayName || "Decrypted shared image"}
                          className="mx-auto max-h-[55vh] max-w-full rounded-xl object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-white/10 px-6 text-center text-sm text-slate-500">
                        Decrypt the image below to preview it securely in your
                        browser.
                      </div>
                    )
                  ) : imageSrc && !imageFailed ? (
                    <div className="rounded-[16px] bg-black/20 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={record.originalName || "Shared image"}
                        onError={() => setImageFailed(true)}
                        className="mx-auto max-h-[55vh] max-w-full rounded-xl object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                      Could not display this image.
                    </div>
                  )}
                </div>

                
                {/* ENCRYPTION */}
                {record.encrypted ? (
                  <div className="mt-6 rounded-[20px] border border-emerald-500/40 bg-emerald-500/[0.10] p-4 sm:p-5">
                    <label className="block text-[15px] font-semibold text-emerald-100">
                      Encryption key
                    </label>

                    <input
                      type="text"
                      value={encryptionKey}
                      onChange={(event) => setEncryptionKey(event.target.value)}
                      aria-label="Encryption key"
                      spellCheck={false}
                      autoComplete="off"
                      className="mt-4 h-[52px] w-full rounded-[16px] border border-white/10 bg-[#020617] px-4 text-[15px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-400/30"
                      placeholder="Encryption key from share link"
                    />

                    {decryptError ? (
                      <p
                        className="mt-3 text-sm leading-5 text-red-300"
                        role="alert"
                      >
                        {decryptError}
                      </p>
                    ) : null}

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => decryptImage(record, encryptionKey)}
                        disabled={!encryptionKey || isDecrypting}
                        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-500 px-4 text-[15px] font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDecrypting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                        {isDecrypting ? "Decrypting..." : "Decrypt & view image"}
                      </button>
{/* MOBILE IMAGE DOWNLOAD */}
                <div className="mt-3 sm:hidden">
                  <button
                    type="button"
                    onClick={downloadImage}
                    disabled={record.encrypted && !decryptedImageUrl}
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-violet-600 px-5 text-[15px] font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-600/55 disabled:text-slate-400"
                  >
                    <Download className="h-5 w-5" />
                    Download image
                  </button>
                </div>

                      {/* Download - desktop/tablet only, adjacent to decrypt */}
                      <button
                        type="button"
                        onClick={downloadImage}
                        disabled={!decryptedImageUrl}
                        className="hidden h-[52px] items-center justify-center gap-2 rounded-[16px] bg-violet-600 px-4 text-[15px] font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-600/55 disabled:text-slate-400 sm:inline-flex"
                      >
                        <Download className="h-5 w-5" />
                        Download image
                      </button>
                    </div>
                  </div>
                ) : null}

              </div>
            </section>
          ) : null}
        </div>
      </Container>
    );
  }

  // ============ OWNER IMAGE VIEW ============
  if (isImage) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <ViewerLoading />
          ) : error ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          ) : record ? (
            <>
              <div className="mx-auto max-w-[800px]">
                <section
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10101f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                  aria-label="Hosted image details"
                >
                  <div className="p-7 sm:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 text-center sm:text-left">
                        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[40px]">
                          Hosted Image
                        </h2>

                        <p className="mt-2 text-[15px] leading-6 text-slate-400">
                          This image is securely stored and ready to view or download.
                        </p>
                      </div>

                      {mode === "owner" ? (
                        <div className="grid w-full shrink-0 grid-cols-2 items-center gap-4 md:w-auto md:flex md:flex-row md:justify-end md:gap-2 md:-translate-y-2 lg:-translate-y-3">                        <Link
                          href="/file-share"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:w-auto md:px-4 md:py-2.5"
                        >
                          <Plus className="h-4 w-4" />
                          Upload new
                        </Link>

                        {!record.encrypted ? (
                          <a
                            href={getDirectUrl()}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:w-auto md:px-4 md:py-2.5"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Direct
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => copyValue("page")}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:w-auto md:px-4 md:py-2.5"
                        >
                          {copied === "page" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copied === "page" ? "Copied" : "Copy page"}
                        </button>
                      </div>
                    ) : null}
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                        <p className="text-[13px] font-medium text-slate-500">File name</p>
                        <p className="mt-2 truncate text-[15px] text-slate-200">
                          {displayName || record.originalName || record.mimeType || "Untitled image"}
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                        <p className="text-[13px] font-medium text-slate-500">Image size</p>
                        <p className="mt-2 text-[15px] text-slate-200">
                          {formatFileSize(displaySize)}
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                        <p className="text-[13px] font-medium text-slate-500">Created</p>
                        <p className="mt-2 text-[15px] text-slate-200">
                          {formatDate(record.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                        <p className="text-[13px] font-medium text-slate-500">Expires</p>
                        <p className="mt-2 text-[15px] text-slate-200">
                          {formatExpiry(record.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10 bg-[#020617]/95 p-4 sm:p-5">
                      {record.encrypted ? (
                        decryptedImageUrl ? (
                          <div className="rounded-[16px] bg-black/20 p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={decryptedImageUrl}
                              alt={displayName || "Decrypted hosted image"}
                              className="mx-auto max-h-[65vh] max-w-full rounded-xl object-contain"
                            />
                          </div>
                        ) : (
                          <div className="rounded-[16px] border border-dashed border-white/10 px-6 py-12 text-center text-sm text-slate-500">
                            Decrypt the image below to preview it securely in your browser.
                          </div>
                        )
                      ) : imageSrc && !imageFailed ? (
                        <div className="rounded-[16px] bg-black/20 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageSrc}
                            alt={record.originalName || "Hosted image"}
                            onError={() => setImageFailed(true)}
                            className="mx-auto max-h-[65vh] max-w-full rounded-xl object-contain"
                          />
                        </div>
                      ) : (
                        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                          Could not display this image.
                        </div>
                      )}
                    </div>

                    {record.encrypted ? (
                      <div className="">
                        
                        {decryptError ? (
                          <p className="">
                            {decryptError}
                          </p>
                        ) : null}

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-1">
                          <button
                            type="button"
                            onClick={downloadImage}
                            disabled={!decryptedImageUrl}
                            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 px-4 text-[15px] font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download className="h-5 w-5" />
                            Download image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-[20px] border border-emerald-500/40 bg-emerald-500/[0.10] p-4 sm:p-5">
                        <button
                          type="button"
                          onClick={downloadImage}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <Download className="h-4 w-4" />
                          Download image
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => copyValue("markdown")}
                      className="hidden"
                    >
                      {copied === "markdown" ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                      {copied === "markdown" ? "Copied" : "Copy Markdown"}
                    </button>
                  </div>
                </section>
              </div>

              {mode === "owner" ? (
                <>
                  {/* Recent Hosted Stats */}
                  {hasHydrated && recentFiles.length > 0 ? (
                    <div className="mx-auto mt-16 max-w-6xl">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-violet-400" />
                          <h3 className="text-sm font-semibold text-white">
                            Recent Images
                          </h3>
                        </div>

                        <div className="max-h-[300px] overflow-auto rounded-xl border border-white/10 bg-slate-950">
                          <table className="w-full table-fixed text-left text-xs sm:table-auto">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-500">
                                <th className="w-[52%] px-3 py-2 font-medium sm:w-auto">Name</th>
                                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                                  Kind
                                </th>
                                <th className="hidden px-5 py-2 text-right font-medium sm:table-cell">
                                  Size
                                </th>
                                <th className="w-[16%] px-1.5 py-2 text-center font-medium sm:w-auto sm:px-10 sm:text-right">
                                  <span className="inline-block -translate-x-5 sm:translate-x-0">
                                    Count
                                  </span>
                                </th>
                                <th className="w-[32%] px-1.5 py-2 text-center font-medium sm:w-auto sm:px-14 sm:text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {recentFiles.map((r) => (
                                <tr key={r.id} className="text-slate-300">
                                  <td className="max-w-[180px] truncate px-3 py-2 text-violet-300">
                                    {r.name || r.id}
                                  </td>
                                  <td className="hidden px-3 py-2 text-slate-500 capitalize sm:table-cell">
                                    {r.kind}
                                  </td>
                                  <td className="hidden px-3 py-2 text-right text-slate-500 sm:table-cell">
                                    {formatFileSize(r.size)}
                                  </td>
                                  <td className="w-[16%] px-1.5 py-2 text-center text-slate-500 sm:w-auto sm:px-11 sm:text-right">
                                    <span className="inline-block -translate-x-5 whitespace-nowrap sm:translate-x-0">
                                      {typeof r.views === "number"
                                        ? `${r.views} views`
                                        : typeof r.downloads === "number"
                                          ? `${r.downloads} dl`
                                          : "—"}
                                    </span>
                                  </td>
                                  <td className="w-[32%] px-1.5 py-2 text-center sm:w-auto sm:px-2 sm:text-right sm:px-4 lg:px-6">
                                    <div className="flex items-center justify-center gap-1 whitespace-nowrap sm:justify-end">
                                      <a
                                        href={`/file?id=${r.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-white/10 px-1.5 py-1 text-[10px] text-slate-500 hover:bg-white/5 sm:px-2.5 sm:text-[12px]"
                                      >
                                        View
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRecentFiles((prev) =>
                                            prev.filter((x) => x.id !== r.id),
                                          )
                                        }
                                        className="rounded-lg border border-white/10 px-1.5 py-1 text-[10px] text-slate-500 hover:bg-white/5 sm:px-2.5 sm:text-[12px]"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs text-slate-500"></p>
                          <button
                            type="button"
                            onClick={() => setRecentFiles([])}
                            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] font-medium text-red-300 hover:bg-red-500/10"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </Container>
    );
  }

  // ============ FILE VIEW ============
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <ViewerLoading />
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : record ? (
          <>
            {(mode === "share" || isPdf) ? (
              <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {mode === "owner" && isPdf ? "Hosted PDF" : "Shared File"}
                </h1>
              </div>
            ) : null}

            <div className="mx-auto max-w-[800px]">
              <section
                className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10101f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                aria-label={mode === "owner" ? "Hosted file details" : "Shared file details"}
              >
                <div className="p-7 sm:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 text-center sm:text-left">
                      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[40px]">
                        Hosted File
                      </h2>

                      <p className="mt-2 text-[15px] leading-6 text-slate-400">
                        {isPdf
                          ? "This PDF is ready to open or download."
                          : "This file is securely stored and ready to download."}
                      </p>
                    </div>

                    {mode === "owner" ? (
                        <div className="grid w-full shrink-0 grid-cols-2 items-center gap-4 md:w-auto md:flex md:flex-row md:justify-end md:gap-2 md:-translate-y-2 lg:-translate-y-3">                        <Link
                          href="/file-share"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:w-auto md:px-4 md:py-2.5"
                        >
                          <Plus className="h-4 w-4" />
                          Upload new
                        </Link>

                        <button
                          type="button"
                          onClick={() => copyValue("page")}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:w-auto md:px-4 md:py-2.5"
                        >
                          {copied === "page" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copied === "page" ? "Copied" : "Copy page"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                        <p className="text-[13px] font-medium text-slate-500">File name</p>
                        <p className="mt-2 truncate text-[15px] text-slate-200">
                        {record.originalName || record.mimeType || "Untitled file"}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                      <p className="text-[13px] font-medium text-slate-500">File size</p>
                      <p className="mt-2 text-[15px] text-slate-200">
                        {formatFileSize(record.size)}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                      <p className="text-[13px] font-medium text-slate-500">Created</p>
                      <p className="mt-2 text-[15px] text-slate-200">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#020617]/95 px-4 py-5 text-center sm:text-left">
                      <p className="text-[13px] font-medium text-slate-500">Expires</p>
                      <p className="mt-2 text-[15px] text-slate-200">
                        {formatExpiry(record.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {mode === "owner" ? (
                    <div className="mt-5 ">
                      <button
                        type="button"
                        onClick={downloadFile}
                        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      >
                        <Download className="h-4 w-4" />
                        {isPdf ? "Open / Download PDF" : "Download file"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            {mode === "share" ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <label className="mb-2 block text-sm font-medium text-emerald-100">
                  Encryption key
                </label>

                <input
                  type="text"
                  value={encryptionKey}
                  onChange={(event) => setEncryptionKey(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                  placeholder="Encryption key from share link"
                />

                {decryptError ? (
                  <p className="mt-2 text-sm text-red-200">{decryptError}</p>
                ) : null}

                <button
                  type="button"
                  onClick={decryptAndDownloadFile}
                  disabled={!encryptionKey || isDecrypting}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {isDecrypting ? "Decrypting..." : "Decrypt & download"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {mode === "owner" ? (
          <>

            {/* Recent Files Stats */}
            {recentFiles.filter((x) => x.kind === "file").length > 0 ? (
              <div className="mx-auto mt-16 max-w-6xl">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Recent Files
                    </h3>
                  </div>

                  <div className="max-h-[300px] overflow-auto rounded-xl border border-white/10 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500">
                          <th className="px-5 py-2 font-medium">Name</th>
                          <th className="hidden px-3 py-2 font-medium sm:table-cell">
                            Size
                          </th>
                          <th className="px-2 py-2 text-right font-medium sm:px-6 lg:px-8">Downloads</th>
                          <th className="px-10 py-2 text-right font-medium sm:px-15 lg:px-17">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentFiles
                          .filter((r) => r.kind === "file")
                          .map((r) => (
                            <tr key={r.id} className="text-slate-300">
                              <td className="max-w-[180px] truncate px-3 py-2 text-violet-300">
                                {r.name || r.id}
                              </td>
                              <td className="hidden px-2 py-2 text-slate-500 sm:table-cell">
                                {formatFileSize(r.size)}
                              </td>
                              <td className="px-8 py-2 text-right text-slate-500 sm:px-15 lg:px-15">
                                {typeof r.downloads === "number"
                                  ? r.downloads
                                  : "-"}
                              </td>
                              <td className="px-2 py-2 text-right sm:px-4 lg:px-6">
                                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                  <a
                                    href={`/file?id=${r.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-500 hover:bg-white/5 sm:px-2.5 sm:text-[12px]"
                                  >
                                    View
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRecentFiles((prev) =>
                                        prev.filter((x) => x.id !== r.id),
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-500 hover:bg-white/5 sm:px-2.5 sm:text-[12px]"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                    </p>
                    <button
                      type="button"
                      onClick={() => setRecentFiles([])}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] font-medium text-red-300 hover:bg-red-500/10"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Container>
  );
}

function ViewerLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    </Container>
  );
}
