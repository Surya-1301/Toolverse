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
  FileText,
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

  // ============ IMAGE VIEW ============
  if (isImage) {
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
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {mode === "owner" ? "Hosted Image" : "Shared Image"}
                  </h1>

                  <p className="mt-3 break-all text-sm text-slate-400">
                    ID: {record.id}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  {mode === "owner" ? (
                    <Link
                      href="/file-share"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                      Upload new
                    </Link>
                  ) : null}

                  {mode === "owner" && !record.encrypted ? (
                    <a
                      href={getDirectUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Direct
                    </a>
                  ) : null}

                  {mode === "owner" ? (
                    <>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => copyValue("markdown")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {copied === "html" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === "html" ? "Copied" : "Copy HTML"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadImage}
                    disabled={record.encrypted && !decryptedImageUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download image
                  </button>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {displayMimeType}
                </span>

                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {formatFileSize(displaySize)}
                </span>

                {record.width && record.height ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                    {record.width} × {record.height}
                  </span>
                ) : null}

                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  Created: {formatDate(record.createdAt)}
                </span>

                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  Expires: {formatExpiry(record.expiresAt)}
                </span>

                {typeof record.views === "number" ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                    {record.views} views
                  </span>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
                {record.encrypted ? (
                  decryptedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={decryptedImageUrl}
                      alt={displayName || "Decrypted image"}
                      className="mx-auto max-h-[75vh] max-w-full object-contain"
                    />
                  ) : (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                      <p className="font-semibold">Encrypted image</p>
                      <p className="mt-2 text-amber-100/80">
                        This image needs the key from the share link to display.
                      </p>

                      <input
                        value={encryptionKey}
                        onChange={(event) =>
                          setEncryptionKey(event.target.value)
                        }
                        placeholder="Paste encryption key"
                        className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => decryptImage(record, encryptionKey)}
                        disabled={!encryptionKey || isDecrypting}
                        className="mt-3 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isDecrypting ? "Decrypting..." : "Decrypt image"}
                      </button>

                      {decryptError ? (
                        <p className="mt-3 text-sm text-red-200">
                          {decryptError}
                        </p>
                      ) : null}
                    </div>
                  )
                ) : imageSrc && !imageFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt={record.originalName}
                    onError={() => setImageFailed(true)}
                    className="mx-auto max-h-[75vh] max-w-full object-contain"
                  />
                ) : (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    Could not display this image.
                  </div>
                )}
              </div>

              {mode === "owner" ? (
                <div className="">
                </div>
              ) : null}
            </>
          ) : null}

         

              {mode === "owner" ? (
                <>
                  {/* Recent Hosted Stats */}
                  {hasHydrated && recentFiles.length > 0 ? (
                    <div className="mx-auto mt-16 max-w-6xl">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-violet-400" />
                          <h3 className="text-sm font-semibold text-white">
                            Recent Uploads
                          </h3>
                        </div>

                        <div className="max-h-[300px] overflow-auto rounded-xl border border-white/10 bg-slate-950">
                          <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500">
                            <th className="px-3 py-2 font-medium">Name</th>
                            <th className="hidden px-3 py-2 font-medium sm:table-cell">
                              Kind
                            </th>
                            <th className="hidden px-5 py-2 text-right font-medium sm:table-cell">
                              Size
                            </th>
                            <th className="px-10 py-2 text-right font-medium">Count</th>
                            <th className="px-14 py-2 text-right font-medium">Actions</th>
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
                              <td className="px-11 py-2 text-right text-slate-500">
                                {typeof r.views === "number"
                                  ? `${r.views} views`
                                  : typeof r.downloads === "number"
                                    ? `${r.downloads} dl`
                                    : "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <a
                                    href={`/file?id=${r.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] text-slate-500 hover:bg-white/5"
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
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] text-slate-500 hover:bg-white/5"
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
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {mode === "owner"
                    ? isPdf
                      ? "Hosted PDF"
                      : "Hosted File"
                    : "Shared File"}
                </h1>

                <p className="mt-3 break-all text-sm text-slate-400">
                  ID: {record.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                {mode === "owner" ? (
                  <Link
                    href="/file-share"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Upload new
                  </Link>
                ) : null}

                {mode === "owner" ? (
                  <>
                    <a
                      href={getDownloadUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Direct
                    </a>

                    <button
                      type="button"
                      onClick={() => copyValue("page")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {copied === "page" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === "page" ? "Copied" : "Copy page"}
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={downloadFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Download className="h-4 w-4" />
                  {isPdf ? "Download PDF" : "Download file"}
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {record.mimeType}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {formatFileSize(record.size)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(record.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(record.expiresAt)}
              </span>

              {typeof record.downloads === "number" ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {record.downloads} downloads
                </span>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <h2 className="break-all text-xl font-semibold text-white">
                {record.originalName}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {mode === "owner"
                  ? isPdf
                    ? "This PDF is ready to open or download."
                    : "This file is ready to download."
                  : "This file was encrypted before upload. Use the key in the share link to decrypt it."}
              </p>

              {mode === "owner" ? (
                <button
                  type="button"
                  onClick={downloadFile}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Download className="h-4 w-4" />
                  {isPdf ? "Download PDF" : "Download file"}
                </button>
              ) : null}
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
                          <th className="px-1 py-2 font-medium">Name</th>
                          <th className="hidden px-3 py-2 font-medium sm:table-cell">
                            Size
                          </th>
                          <th className="px-2 py-2 text-right font-medium">Downloads</th>
                          <th className="px-15 py-2 text-right font-medium">Actions</th>
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
                              <td className="px-10 py-2 text-right text-slate-500">
                                {typeof r.downloads === "number"
                                  ? r.downloads
                                  : "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <a
                                    href={`/file?id=${r.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] text-slate-500 hover:bg-white/5"
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
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] text-slate-500 hover:bg-white/5"
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
