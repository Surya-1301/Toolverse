export interface Env {
  DB: D1Database;
  FILES_BUCKET: R2Bucket;
}

type ExpiryValue = "never" | "1h" | "1d" | "7d" | "30d";

const FRONTEND_ORIGIN = "https://toolversee.pages.dev";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

function withCors(headers?: HeadersInit) {
  return {
    ...corsHeaders,
    ...(headers || {}),
  };
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: withCors(init?.headers),
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, { status });
}

function notFound(message = "Not found.") {
  return error(message, 404);
}

function gone(message = "This item has expired.") {
  return error(message, 410);
}

function createId(length = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";

  crypto.getRandomValues(new Uint8Array(length)).forEach((value) => {
    id += chars[value % chars.length];
  });

  return id;
}

function createSlug(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";

  crypto.getRandomValues(new Uint8Array(length)).forEach((value) => {
    slug += chars[value % chars.length];
  });

  return slug;
}

function getExpiresAt(expiry: string | null | undefined) {
  const value = (expiry || "never") as ExpiryValue;

  if (value === "never") return null;

  const now = Date.now();

  if (value === "1h") {
    return new Date(now + 60 * 60 * 1000).toISOString();
  }

  if (value === "1d") {
    return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  }

  if (value === "7d") {
    return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (value === "30d") {
    return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  return null;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return Date.now() > new Date(expiresAt).getTime();
}

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function validateUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getExtensionFromName(name: string) {
  const index = name.lastIndexOf(".");

  if (index === -1) return "";

  return name.slice(index).toLowerCase().slice(0, 20);
}

function cacheHeaders(contentType: string) {
  return withCors({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
}

async function route(request: Request, env: Env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (pathname === "/") {
    return json({
      name: "Toolverse API",
      status: "ok",
    });
  }

  /**
   * PASTE COUNT
   */

  if (pathname === "/api/paste/count" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM pastes",
    ).first<{ count: number | string }>();

    return json({
      count: Number(result?.count || 0),
    });
  }

  /**
   * PASTE CREATE
   */

  if (pathname === "/api/paste/create" && request.method === "POST") {
    const body = await request.json<{
      content?: string;
      language?: string;
      expiry?: string;
      customAlias?: string;
    }>();

    const content = String(body.content || "").trim();

    if (!content) {
      return error("Paste content is required.");
    }

    const language = String(body.language || "plain_text");
    const expiresAt = getExpiresAt(body.expiry);

    let id = sanitizeSlug(String(body.customAlias || ""));

    if (id) {
      if (!/^[a-z0-9-]{3,40}$/.test(id)) {
        return error(
          "Alias must be 3-40 characters and use lowercase letters, numbers, or hyphens.",
        );
      }

      const existing = await env.DB.prepare(
        "SELECT id FROM pastes WHERE id = ?",
      )
        .bind(id)
        .first<{ id: string }>();

      if (existing) {
        return error("This paste alias is already taken.", 409);
      }
    } else {
      id = createSlug(8);

      while (
        await env.DB.prepare("SELECT id FROM pastes WHERE id = ?")
          .bind(id)
          .first()
      ) {
        id = createSlug(8);
      }
    }

    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `
      INSERT INTO pastes (id, content, language, created_at, expires_at, views)
      VALUES (?, ?, ?, ?, ?, 0)
      `,
    )
      .bind(id, content, language, createdAt, expiresAt)
      .run();

    return json({
      id,
      url: `/paste/${id}`,
      rawUrl: `/raw/${id}`,
      expiresAt,
    });
  }

  /**
   * PASTE GET + AUTOSAVE UPDATE
   */

  const pasteMatch = pathname.match(/^\/api\/paste\/([^/]+)$/);

  if (pasteMatch && request.method === "GET") {
    const id = pasteMatch[1];

    const paste = await env.DB.prepare(
      `
      SELECT id, content, language, created_at, expires_at, views
      FROM pastes
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        id: string;
        content: string;
        language: string;
        created_at: string;
        expires_at: string | null;
        views: number;
      }>();

    if (!paste) return notFound("Paste not found.");

    if (isExpired(paste.expires_at)) {
      await env.DB.prepare("DELETE FROM pastes WHERE id = ?").bind(id).run();
      return gone("This paste has expired.");
    }

    await env.DB.prepare("UPDATE pastes SET views = views + 1 WHERE id = ?")
      .bind(id)
      .run();

    return json({
      id: paste.id,
      content: paste.content,
      language: paste.language,
      createdAt: paste.created_at,
      expiresAt: paste.expires_at,
      views: paste.views + 1,
    });
  }

  if (pasteMatch && request.method === "PUT") {
    const id = pasteMatch[1];

    const body = await request.json<{
      content?: string;
      language?: string;
    }>();

    const content = String(body.content ?? "");
    const language = String(body.language || "plain_text");

    const existing = await env.DB.prepare(
      `
      SELECT id, expires_at
      FROM pastes
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        id: string;
        expires_at: string | null;
      }>();

    if (!existing) {
      return notFound("Paste not found.");
    }

    if (isExpired(existing.expires_at)) {
      await env.DB.prepare("DELETE FROM pastes WHERE id = ?").bind(id).run();
      return gone("This paste has expired.");
    }

    await env.DB.prepare(
      `
      UPDATE pastes
      SET content = ?, language = ?
      WHERE id = ?
      `,
    )
      .bind(content, language, id)
      .run();

    return json({
      id,
      content,
      language,
      saved: true,
    });
  }

  /**
   * RAW PASTE
   */

  const rawMatch = pathname.match(/^\/raw\/([^/]+)$/);

  if (rawMatch && request.method === "GET") {
    const id = rawMatch[1];

    const paste = await env.DB.prepare(
      "SELECT content, expires_at FROM pastes WHERE id = ?",
    )
      .bind(id)
      .first<{ content: string; expires_at: string | null }>();

    if (!paste) return notFound("Paste not found.");

    if (isExpired(paste.expires_at)) {
      await env.DB.prepare("DELETE FROM pastes WHERE id = ?").bind(id).run();
      return gone("This paste has expired.");
    }

    return new Response(paste.content, {
      headers: withCors({
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      }),
    });
  }

  /**
   * URL SHORTENER GLOBAL STATS
   * Exact totals from the links table for the URL Shortener page.
   */

  if (pathname === "/api/shorten/stats" && request.method === "GET") {
    const stats = await env.DB.prepare(
      `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(clicks), 0) AS clicks,
        COALESCE(
          SUM(
            CASE
              WHEN expires_at IS NULL OR expires_at > ? THEN 1
              ELSE 0
            END
          ),
          0
        ) AS active
      FROM links
      `,
    )
      .bind(new Date().toISOString())
      .first<{
        total: number | string;
        clicks: number | string;
        active: number | string;
      }>();

    return json({
      total: Number(stats?.total || 0),
      clicks: Number(stats?.clicks || 0),
      active: Number(stats?.active || 0),
    });
  }

  /**
   * URL SHORTENER CREATE
   */

  if (pathname === "/api/shorten" && request.method === "POST") {
    const body = await request.json<{
      longUrl?: string;
      url?: string;
      customSlug?: string;
      expiry?: string;
    }>();

    const originalUrl = String(body.longUrl || body.url || "").trim();

    if (!validateUrl(originalUrl)) {
      return error(
        "Please enter a valid URL starting with http:// or https://.",
      );
    }

    const expiresAt = getExpiresAt(body.expiry);

    let slug = sanitizeSlug(String(body.customSlug || ""));

    if (slug) {
      if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
        return error(
          "Custom alias must be 3-40 characters and use lowercase letters, numbers, or hyphens.",
        );
      }

      const existing = await env.DB.prepare(
        "SELECT slug FROM links WHERE slug = ?",
      )
        .bind(slug)
        .first();

      if (existing) {
        return error("This short alias is already taken.", 409);
      }
    } else {
      slug = createSlug(6);

      while (
        await env.DB.prepare("SELECT slug FROM links WHERE slug = ?")
          .bind(slug)
          .first()
      ) {
        slug = createSlug(6);
      }
    }

    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `
      INSERT INTO links (slug, original_url, created_at, expires_at, clicks)
      VALUES (?, ?, ?, ?, 0)
      `,
    )
      .bind(slug, originalUrl, createdAt, expiresAt)
      .run();

    return json({
      slug,
      url: `/s/${slug}`,
      longUrl: originalUrl,
      originalUrl,
      clicks: 0,
      expiresAt,
    });
  }

  /**
   * URL SHORTENER STATS
   */

  const linkStatsMatch = pathname.match(/^\/api\/shorten\/([^/]+)$/);

  if (linkStatsMatch && request.method === "GET") {
    const slug = linkStatsMatch[1];

    const link = await env.DB.prepare(
      `
      SELECT slug, original_url, created_at, expires_at, clicks
      FROM links
      WHERE slug = ?
      `,
    )
      .bind(slug)
      .first<{
        slug: string;
        original_url: string;
        created_at: string;
        expires_at: string | null;
        clicks: number;
      }>();

    if (!link) return notFound("Short URL not found.");

    if (isExpired(link.expires_at)) {
      await env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(slug).run();

      return gone("This short URL has expired.");
    }

    return json({
      slug: link.slug,
      longUrl: link.original_url,
      originalUrl: link.original_url,
      createdAt: link.created_at,
      expiresAt: link.expires_at,
      clicks: link.clicks,
    });
  }

  /**
   * WORKER SHORTLINK REDIRECT
   */

  const redirectMatch = pathname.match(/^\/s\/([^/]+)$/);

  if (redirectMatch && request.method === "GET") {
    const slug = redirectMatch[1];

    const link = await env.DB.prepare(
      "SELECT original_url, expires_at FROM links WHERE slug = ?",
    )
      .bind(slug)
      .first<{ original_url: string; expires_at: string | null }>();

    if (!link) {
      return Response.redirect(`${FRONTEND_ORIGIN}/url-shortener`, 302);
    }

    if (isExpired(link.expires_at)) {
      await env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(slug).run();

      return Response.redirect(
        `${FRONTEND_ORIGIN}/url-shortener?error=expired`,
        302,
      );
    }

    await env.DB.prepare("UPDATE links SET clicks = clicks + 1 WHERE slug = ?")
      .bind(slug)
      .run();

    return Response.redirect(link.original_url, 302);
  }

  /**
   * UPLOAD & SHARE STATS
   * Exact totals from the database for the Upload & Share page.
   */

  if (pathname === "/api/upload/stats" && request.method === "GET") {
    const [filesResult, imagesResult] = await Promise.all([
      env.DB.prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS size, COALESCE(SUM(downloads), 0) AS downloads FROM files",
      ).first<{
        count: number | string;
        size: number | string;
        downloads: number | string;
      }>(),
      env.DB.prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS size, COALESCE(SUM(views), 0) AS views FROM images",
      ).first<{
        count: number | string;
        size: number | string;
        views: number | string;
      }>(),
    ]);

    const filesCount = Number(filesResult?.count || 0);
    const imagesCount = Number(imagesResult?.count || 0);
    const filesSize = Number(filesResult?.size || 0);
    const imagesSize = Number(imagesResult?.size || 0);
    const fileDownloads = Number(filesResult?.downloads || 0);
    const imageViews = Number(imagesResult?.views || 0);

    return json({
      filesHosted: filesCount + imagesCount,
      totalViews: fileDownloads + imageViews,
      storageUsed: filesSize + imagesSize,
      files: filesCount,
      images: imagesCount,
    });
  }

  /**
   * IMAGE UPLOAD
   */

  if (pathname === "/api/image/upload" && request.method === "POST") {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    const encrypted = String(formData.get("encrypted") || "false") === "true";
    const encryptionAlgorithm = String(
      formData.get("encryptionAlgorithm") || "",
    );
    const encryptionIv = String(formData.get("encryptionIv") || "");
    const encryptionMetadataIv = String(
      formData.get("encryptionMetadataIv") || "",
    );
    const encryptedMetadata = String(formData.get("encryptedMetadata") || "");

    if (!(file instanceof File)) {
      return error("Image file is required.");
    }

    if (!encrypted && !file.type.startsWith("image/")) {
      return error("Please upload a valid image file.");
    }

    const maxSize = 25 * 1024 * 1024;

    if (file.size > maxSize) {
      return error("Image is too large. Max size is 25 MB.");
    }

    if (
      encrypted &&
      (!encryptionIv || !encryptionMetadataIv || !encryptedMetadata)
    ) {
      return error("Encryption metadata is missing.");
    }

    let id = createId(8);

    while (
      await env.DB.prepare("SELECT id FROM images WHERE id = ?")
        .bind(id)
        .first()
    ) {
      id = createId(8);
    }

    const extension = encrypted
      ? ".enc"
      : getExtensionFromName(file.name) || ".img";
    const key = `images/${id}${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.FILES_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: encrypted
          ? "application/octet-stream"
          : file.type || "application/octet-stream",
      },
    });

    const createdAt = new Date().toISOString();
    const expiresAt = getExpiresAt(expiry);

    await env.DB.prepare(
      `
      INSERT INTO images (
        id, original_name, mime_type, size, width, height,
        created_at, expires_at, views, r2_key, encrypted,
        encryption_algorithm, encryption_kdf, encryption_iterations,
        encryption_salt, encryption_iv, encryption_metadata_iv, encrypted_metadata
      )
      VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        id,
        encrypted ? "Encrypted image" : file.name,
        encrypted
          ? "application/octet-stream"
          : file.type || "application/octet-stream",
        file.size,
        createdAt,
        expiresAt,
        key,
        encrypted ? 1 : 0,
        encrypted ? encryptionAlgorithm || "AES-GCM-256" : null,
        null,
        null,
        null,
        encrypted ? encryptionIv : null,
        encrypted ? encryptionMetadataIv : null,
        encrypted ? encryptedMetadata : null,
      )
      .run();

    return json({
      id,
      url: `/i/${id}`,
      directUrl: `/api/image/${id}/direct`,
      originalName: encrypted ? "Encrypted image" : file.name,
      mimeType: encrypted
        ? "application/octet-stream"
        : file.type || "application/octet-stream",
      size: file.size,
      width: null,
      height: null,
      expiresAt,
      views: 0,
      encrypted,
    });
  }

  /**
   * IMAGE META
   */

  const imageMetaMatch = pathname.match(/^\/api\/image\/([^/]+)\/meta$/);

  if (imageMetaMatch && request.method === "GET") {
    const id = imageMetaMatch[1];

    const image = await env.DB.prepare(
      `
      SELECT id, original_name, mime_type, size, width, height,
             created_at, expires_at, views, r2_key, encrypted,
             encryption_algorithm, encryption_kdf, encryption_iterations,
             encryption_salt, encryption_iv, encryption_metadata_iv, encrypted_metadata
      FROM images
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        id: string;
        original_name: string;
        mime_type: string;
        size: number;
        width: number | null;
        height: number | null;
        created_at: string;
        expires_at: string | null;
        views: number;
        r2_key: string;
        encrypted?: number;
        encryption_algorithm?: string | null;
        encryption_kdf?: string | null;
        encryption_iterations?: number | null;
        encryption_salt?: string | null;
        encryption_iv?: string | null;
        encryption_metadata_iv?: string | null;
        encrypted_metadata?: string | null;
      }>();

    if (!image) return notFound("Image not found.");

    if (isExpired(image.expires_at)) {
      await env.FILES_BUCKET.delete(image.r2_key);
      await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
      return gone("This image has expired.");
    }

    return json({
      id: image.id,
      originalName: image.original_name,
      mimeType: image.mime_type,
      size: image.size,
      width: image.width,
      height: image.height,
      createdAt: image.created_at,
      expiresAt: image.expires_at,
      views: image.views,
      directUrl: `/api/image/${id}/direct`,
      encrypted: Boolean(image.encrypted),
      encryption: image.encrypted
        ? {
            algorithm: image.encryption_algorithm || "AES-GCM-256",
            kdf: image.encryption_kdf,
            iterations: image.encryption_iterations,
            salt: image.encryption_salt,
            iv: image.encryption_iv,
            metadataIv: image.encryption_metadata_iv,
            encryptedMetadata: image.encrypted_metadata,
          }
        : null,
    });
  }

  /**
   * IMAGE DIRECT
   */

  const imageDirectMatch = pathname.match(/^\/api\/image\/([^/]+)\/direct$/);

  if (imageDirectMatch && request.method === "GET") {
    const id = imageDirectMatch[1];

    const image = await env.DB.prepare(
      `
      SELECT mime_type, expires_at, r2_key, encrypted
      FROM images
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        mime_type: string;
        expires_at: string | null;
        r2_key: string;
        encrypted?: number;
      }>();

    if (!image) return notFound("Image not found.");

    if (isExpired(image.expires_at)) {
      await env.FILES_BUCKET.delete(image.r2_key);
      await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
      return gone("This image has expired.");
    }

    const object = await env.FILES_BUCKET.get(image.r2_key);

    if (!object) {
      return notFound("Image file missing.");
    }

    await env.DB.prepare("UPDATE images SET views = views + 1 WHERE id = ?")
      .bind(id)
      .run();

    return new Response(object.body, {
      headers: cacheHeaders(
        image.encrypted
          ? "application/octet-stream"
          : image.mime_type || "application/octet-stream",
      ),
    });
  }

  /**
   * FILE UPLOAD
   */

  if (pathname === "/api/file/upload" && request.method === "POST") {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    const encrypted = String(formData.get("encrypted") || "false") === "true";
    const encryptionAlgorithm = String(
      formData.get("encryptionAlgorithm") || "",
    );
    const encryptionIv = String(formData.get("encryptionIv") || "");
    const encryptionMetadataIv = String(
      formData.get("encryptionMetadataIv") || "",
    );
    const encryptedMetadata = String(formData.get("encryptedMetadata") || "");

    if (!(file instanceof File)) {
      return error("File is required.");
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return error("File is too large. Max size is 100 MB.");
    }

    if (
      encrypted &&
      (!encryptionIv || !encryptionMetadataIv || !encryptedMetadata)
    ) {
      return error("Encryption metadata is missing.");
    }

    let id = createId(8);

    while (
      await env.DB.prepare("SELECT id FROM files WHERE id = ?").bind(id).first()
    ) {
      id = createId(8);
    }

    const extension = encrypted ? ".enc" : getExtensionFromName(file.name);
    const key = `files/${id}${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.FILES_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: encrypted
          ? "application/octet-stream"
          : file.type || "application/octet-stream",
      },
    });

    const createdAt = new Date().toISOString();
    const expiresAt = getExpiresAt(expiry);

    await env.DB.prepare(
      `
      INSERT INTO files (
        id, original_name, mime_type, size,
        created_at, expires_at, downloads, r2_key, encrypted,
        encryption_algorithm, encryption_kdf, encryption_iterations,
        encryption_salt, encryption_iv, encryption_metadata_iv, encrypted_metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        id,
        encrypted ? "Encrypted file" : file.name,
        encrypted
          ? "application/octet-stream"
          : file.type || "application/octet-stream",
        file.size,
        createdAt,
        expiresAt,
        key,
        encrypted ? 1 : 0,
        encrypted ? encryptionAlgorithm || "AES-GCM-256" : null,
        null,
        null,
        null,
        encrypted ? encryptionIv : null,
        encrypted ? encryptionMetadataIv : null,
        encrypted ? encryptedMetadata : null,
      )
      .run();

    return json({
      id,
      url: `/f/${id}`,
      downloadUrl: `/api/file/${id}/download`,
      originalName: encrypted ? "Encrypted file" : file.name,
      mimeType: encrypted
        ? "application/octet-stream"
        : file.type || "application/octet-stream",
      size: file.size,
      expiresAt,
      downloads: 0,
      encrypted,
    });
  }

  /**
   * FILE META
   */

  const fileMetaMatch = pathname.match(/^\/api\/file\/([^/]+)\/meta$/);

  if (fileMetaMatch && request.method === "GET") {
    const id = fileMetaMatch[1];

    const file = await env.DB.prepare(
      `
      SELECT id, original_name, mime_type, size,
             created_at, expires_at, downloads, r2_key, encrypted,
             encryption_algorithm, encryption_kdf, encryption_iterations,
             encryption_salt, encryption_iv, encryption_metadata_iv, encrypted_metadata
      FROM files
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        id: string;
        original_name: string;
        mime_type: string;
        size: number;
        created_at: string;
        expires_at: string | null;
        downloads: number;
        r2_key: string;
        encrypted?: number;
        encryption_algorithm?: string | null;
        encryption_kdf?: string | null;
        encryption_iterations?: number | null;
        encryption_salt?: string | null;
        encryption_iv?: string | null;
        encryption_metadata_iv?: string | null;
        encrypted_metadata?: string | null;
      }>();

    if (!file) return notFound("File not found.");

    if (isExpired(file.expires_at)) {
      await env.FILES_BUCKET.delete(file.r2_key);
      await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
      return gone("This file has expired.");
    }

    return json({
      id: file.id,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: file.size,
      createdAt: file.created_at,
      expiresAt: file.expires_at,
      downloads: file.downloads,
      downloadUrl: `/api/file/${id}/download`,
      encrypted: Boolean(file.encrypted),
      encryption: file.encrypted
        ? {
            algorithm: file.encryption_algorithm || "AES-GCM-256",
            kdf: file.encryption_kdf,
            iterations: file.encryption_iterations,
            salt: file.encryption_salt,
            iv: file.encryption_iv,
            metadataIv: file.encryption_metadata_iv,
            encryptedMetadata: file.encrypted_metadata,
          }
        : null,
    });
  }

  /**
   * FILE DOWNLOAD
   */

  const fileDownloadMatch = pathname.match(/^\/api\/file\/([^/]+)\/download$/);

  if (fileDownloadMatch && request.method === "GET") {
    const id = fileDownloadMatch[1];

    const file = await env.DB.prepare(
      `
      SELECT original_name, mime_type, expires_at, r2_key, encrypted
      FROM files
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        original_name: string;
        mime_type: string;
        expires_at: string | null;
        r2_key: string;
        encrypted?: number;
      }>();

    if (!file) return notFound("File not found.");

    if (isExpired(file.expires_at)) {
      await env.FILES_BUCKET.delete(file.r2_key);
      await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
      return gone("This file has expired.");
    }

    const object = await env.FILES_BUCKET.get(file.r2_key);

    if (!object) {
      return notFound("File missing.");
    }

    await env.DB.prepare(
      "UPDATE files SET downloads = downloads + 1 WHERE id = ?",
    )
      .bind(id)
      .run();

    return new Response(object.body, {
      headers: withCors({
        "Content-Type": file.encrypted
          ? "application/octet-stream"
          : file.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${(
          file.encrypted ? "encrypted-file.enc" : file.original_name
        ).replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-Content-Type-Options": "nosniff",
      }),
    });
  }

  /**
   * PDF COMPRESSION PLACEHOLDER
   */

  if (pathname === "/api/pdf/compress" && request.method === "POST") {
    return error(
      "PDF compression is not enabled on the Cloudflare Worker backend yet. Use client-side compression or a Node/WASM-compatible compressor.",
      501,
    );
  }

  /**
   * IP ADDRESS INFO
   *
   * Resolves the caller's public IP from Cloudflare's headers and augments
   * it with geolocation + ASN data from `request.cf` (no outbound call).
   */

  if (pathname === "/api/ip" && request.method === "GET") {
    const requested = url.searchParams.get("ip")?.trim() || "";

    // If a specific IP was requested, look it up via a public geo-IP service.
    if (requested) {
      const ip = requested
        .replace(/^\[?/, "")
        .replace(/\]?$/, "")
        .replace(/^::ffff:/, "");

      try {
        const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
          headers: { Accept: "application/json" },
        });
        const j = (await res.json()) as Record<string, unknown>;

        if (j.success === false) {
          return error(
            typeof j.message === "string" ? j.message : "Invalid IP address.",
            400,
          );
        }

        const connection = (j.connection || {}) as Record<string, unknown>;
        return json({
          ip: typeof j.ip === "string" ? j.ip : ip,
          country: typeof j.country === "string" ? j.country : null,
          countryCode: typeof j.country_code === "string" ? j.country_code : null,
          city: typeof j.city === "string" ? j.city : null,
          region: typeof j.region === "string" ? j.region : null,
          regionCode: typeof j.region_code === "string" ? j.region_code : null,
          continent: typeof j.continent === "string" ? j.continent : null,
          latitude: typeof j.latitude === "number" || typeof j.latitude === "string" ? String(j.latitude) : null,
          longitude: typeof j.longitude === "number" || typeof j.longitude === "string" ? String(j.longitude) : null,
          timezone:
            typeof j.timezone === "object" && j.timezone && typeof (j.timezone as { id?: unknown }).id === "string"
              ? (j.timezone as { id: string }).id
              : null,
          postalCode: typeof j.postal === "string" ? j.postal : null,
          metroCode: null,
          asn:
            typeof connection.asn === "number" || typeof connection.asn === "string"
              ? String(connection.asn)
              : null,
          asOrganization:
            typeof connection.org === "string" ? connection.org : null,
          isp: typeof connection.isp === "string" ? connection.isp : null,
        });
      } catch {
        return error("Could not look up that IP address.", 502);
      }
    }

    const cf = (request as Request & { cf?: Record<string, unknown> }).cf;
    const forwarded = request.headers.get("X-Forwarded-For") || "";
    const publicIp =
      request.headers.get("CF-Connecting-IP") ||
      forwarded.split(",")[0].trim() ||
      "";

    return json({
      ip: publicIp || null,
      country: typeof cf?.country === "string" ? cf.country : null,
      countryCode: typeof cf?.country === "string" ? cf.country : null,
      city: typeof cf?.city === "string" ? cf.city : null,
      region: typeof cf?.region === "string" ? cf.region : null,
      regionCode: typeof cf?.regionCode === "string" ? cf.regionCode : null,
      continent: typeof cf?.continent === "string" ? cf.continent : null,
      latitude: typeof cf?.latitude === "string" ? cf.latitude : null,
      longitude: typeof cf?.longitude === "string" ? cf.longitude : null,
      timezone: typeof cf?.timezone === "string" ? cf.timezone : null,
      postalCode: typeof cf?.postalCode === "string" ? cf.postalCode : null,
      metroCode: typeof cf?.metroCode === "string" ? cf.metroCode : null,
      asn: typeof cf?.asn === "number" || typeof cf?.asn === "string" ? String(cf.asn) : null,
      asOrganization:
        typeof cf?.asOrganization === "string" ? cf.asOrganization : null,
      isp: typeof cf?.isp === "string" ? cf.isp : null,
    });
  }

  /**
   * SSL CERTIFICATE CHECKER
   *
   * Queries Certificate Transparency logs (crt.sh) for the certificate
   * history of a domain and returns the deduped, most recent entries.
   */

  if (pathname === "/api/ssl" && request.method === "GET") {
    const raw = url.searchParams.get("domain") || "";

    const domain = raw
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

    if (!domain) {
      return error("Please provide a domain (e.g. example.com).");
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return error("Please enter a valid domain name.");
    }

    let response: Response;

    try {
      response = await fetch(
        `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`,
      );
    } catch {
      return error("Could not reach the certificate transparency service.", 502);
    }

    if (!response.ok) {
      return error("Certificate transparency service is unavailable.", 502);
    }

    let entries: unknown;

    try {
      entries = JSON.parse(await response.text());
    } catch {
      return error("Unexpected response from certificate transparency service.");
    }

    if (!Array.isArray(entries)) {
      return error("No certificate data returned for this domain.");
    }

    type CertEntry = {
      issuer_name?: string;
      common_name?: string;
      name_value?: string;
      not_before?: string;
      not_after?: string;
      serial_number?: string;
    };

    const seen = new Set<string>();
    const certificates: CertEntry[] = [];

    for (const rawEntry of entries as CertEntry[]) {
      const key = [
        rawEntry.common_name || "",
        rawEntry.issuer_name || "",
        rawEntry.not_after || "",
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);

      certificates.push({
        issuer_name: rawEntry.issuer_name || "",
        common_name: rawEntry.common_name || "",
        name_value: rawEntry.name_value || "",
        not_before: rawEntry.not_before || "",
        not_after: rawEntry.not_after || "",
        serial_number: rawEntry.serial_number || "",
      });
    }

    certificates.sort((a, b) =>
      (b.not_before || "").localeCompare(a.not_before || ""),
    );

    return json({
      domain,
      certificateCount: certificates.length,
      certificates: certificates.slice(0, 20),
    });
  }

  return notFound("Route not found.");
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await route(request, env);
    } catch (caughtError) {
      console.error(caughtError);

      return json(
        {
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "Internal server error.",
        },
        {
          status: 500,
        },
      );
    }
  },
};
