"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { Container } from "@/components/Container";
import { formatFileSize } from "@/lib/formatFileSize";
import { apiUrl, fetchApi, getApiBaseUrl } from "@/lib/apiBase";
import {
  decryptEncryptedFileWithKey,
  decryptEncryptedMetadataWithKey,
  getEncryptionKeyFromHash,
} from "@/lib/clientEncryption";

type ImageRecord = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
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

export default function ImagePage() {
  return (
    <Suspense fallback={<ImageLoading />}>
      <ImageContent />
    </Suspense>
  );
}

function ImageLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading image...
        </div>
      </div>
    </Container>
  );
}

function ImageContent() {
  const searchParams = useSearchParams();
  const imageId = searchParams.get("id") || "";

  const [image, setImage] = useState<ImageRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState<CopyType>("");

  const [encryptionKey, setEncryptionKey] = useState("");
  const [decryptedImageUrl, setDecryptedImageUrl] = useState("");
  const [decryptedName, setDecryptedName] = useState("");
  const [decryptedMimeType, setDecryptedMimeType] = useState("");
  const [decryptedSize, setDecryptedSize] = useState<number | null>(null);
  const [decryptError, setDecryptError] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

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

  useEffect(() => {
    async function loadImage() {
      if (!imageId) {
        setError("Missing image ID.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);
        setImageFailed(false);
        setDecryptError("");

        const response = await fetchApi(`/api/image/${imageId}/meta`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: (ImageRecord & { error?: string }) | null = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              responseText ||
              `Could not load image. Backend returned ${response.status}.`,
          );
          setImage(null);
          return;
        }

        if (!data) {
          setError("Image not found.");
          setImage(null);
          return;
        }

        setImage(data);
      } catch (caughtError) {
        console.error(caughtError);
        setError(
          caughtError instanceof Error
            ? `Could not load image: ${caughtError.message}`
            : "Could not load image.",
        );
        setImage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadImage();
  }, [imageId]);

  useEffect(() => {
    if (image?.encrypted && encryptionKey && !decryptedImageUrl && !isDecrypting) {
      decryptImage(image, encryptionKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, encryptionKey]);

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

  function getDirectImageUrl() {
    if (!imageId) return "";
    return `${getApiBaseUrl()}/api/image/${imageId}/direct`;
  }

  function getPageUrl() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  async function decryptImage(currentImage: ImageRecord, key: string) {
    if (!currentImage.encryption || !key) return;

    try {
      setIsDecrypting(true);
      setDecryptError("");

      const [metadata, response] = await Promise.all([
        decryptEncryptedMetadataWithKey(
          currentImage.encryption.encryptedMetadata,
          key,
          currentImage.encryption.metadataIv,
        ),
        fetch(apiUrl(`/api/image/${currentImage.id}/direct`)),
      ]);

      if (!response.ok) {
        throw new Error("Could not download encrypted image.");
      }

      const decryptedBlob = await decryptEncryptedFileWithKey(
        await response.blob(),
        key,
        currentImage.encryption.iv,
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
    if (!image) return;

    const pageUrl = getPageUrl();
    const imageUrl = image.encrypted
      ? pageUrl
      : getDirectImageUrl();

    let value = "";

    if (type === "page") value = pageUrl;
    if (type === "markdown") value = `![${decryptedName || image.originalName}](${imageUrl})`;
    if (type === "html") {
      value = `<img src="${imageUrl}" alt="${decryptedName || image.originalName}" />`;
    }

    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  function downloadImage() {
    if (!image) return;

    const link = document.createElement("a");

    if (image.encrypted) {
      if (!decryptedImageUrl) return;
      link.href = decryptedImageUrl;
      link.download = decryptedName || image.id;
    } else {
      link.href = getDirectImageUrl();
      link.download = image.originalName || `${image.id}.png`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const imageSrc = imageId ? apiUrl(`/api/image/${imageId}/direct`) : "";
  const displayName = decryptedName || image?.originalName || "";
  const displayMimeType = decryptedMimeType || image?.mimeType || "";
  const displaySize =
    typeof decryptedSize === "number" ? decryptedSize : image?.size || 0;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <ImageLoading />
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : image ? (
          <>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Hosted Image
                </h1>

                <p className="mt-3 break-all text-sm text-slate-400">
                  ID: {image.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/file-share"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Upload new
                </Link>

                {!image.encrypted ? (
                  <a
                    href={getDirectImageUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Direct
                  </a>
                ) : null}

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

                <button
                  type="button"
                  onClick={downloadImage}
                  disabled={image.encrypted && !decryptedImageUrl}
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

              {image.width && image.height ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                  {image.width} × {image.height}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Created: {formatDate(image.createdAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                Expires: {formatExpiry(image.expiresAt)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
                {image.views} views
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
              {image.encrypted ? (
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
                      onChange={(event) => setEncryptionKey(event.target.value)}
                      placeholder="Paste encryption key"
                      className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => decryptImage(image, encryptionKey)}
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
                  alt={image.originalName}
                  onError={() => setImageFailed(true)}
                  className="mx-auto max-h-[75vh] max-w-full object-contain"
                />
              ) : (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Could not display this image.
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => copyValue("page")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copied === "page" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "page" ? "Copied" : "Copy page"}
              </button>

              <button
                type="button"
                onClick={() => copyValue("markdown")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {copied === "html" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "html" ? "Copied" : "Copy HTML"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Container>
  );
}