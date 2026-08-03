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
      return error("Please enter a valid URL starting with http:// or https://.");
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
      await env.DB.prepare("DELETE FROM links WHERE slug = ?")
        .bind(slug)
        .run();

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
      await env.DB.prepare("DELETE FROM links WHERE slug = ?")
        .bind(slug)
        .run();

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
   * IMAGE UPLOAD
   */

  if (pathname === "/api/image/upload" && request.method === "POST") {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    if (!(file instanceof File)) {
      return error("Image file is required.");
    }

    if (!file.type.startsWith("image/")) {
      return error("Please upload a valid image file.");
    }

    const maxSize = 25 * 1024 * 1024;

    if (file.size > maxSize) {
      return error("Image is too large. Max size is 25 MB.");
    }

    let id = createId(8);

    while (
      await env.DB.prepare("SELECT id FROM images WHERE id = ?")
        .bind(id)
        .first()
    ) {
      id = createId(8);
    }

    const extension = getExtensionFromName(file.name) || ".img";
    const key = `images/${id}${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.FILES_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const createdAt = new Date().toISOString();
    const expiresAt = getExpiresAt(expiry);

    await env.DB.prepare(
      `
      INSERT INTO images (
        id, original_name, mime_type, size, width, height,
        created_at, expires_at, views, r2_key
      )
      VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, 0, ?)
      `,
    )
      .bind(
        id,
        file.name,
        file.type || "application/octet-stream",
        file.size,
        createdAt,
        expiresAt,
        key,
      )
      .run();

    return json({
      id,
      url: `/i/${id}`,
      directUrl: `/api/image/${id}/direct`,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      width: null,
      height: null,
      expiresAt,
      views: 0,
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
             created_at, expires_at, views, r2_key
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
      SELECT mime_type, expires_at, r2_key
      FROM images
      WHERE id = ?
      `,
    )
      .bind(id)
      .first<{
        mime_type: string;
        expires_at: string | null;
        r2_key: string;
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
      headers: cacheHeaders(image.mime_type || "application/octet-stream"),
    });
  }

  /**
   * FILE UPLOAD
   */

  if (pathname === "/api/file/upload" && request.method === "POST") {
    const formData = await request.formData();

    const file = formData.get("file");
    const expiry = String(formData.get("expiry") || "never");

    if (!(file instanceof File)) {
      return error("File is required.");
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return error("File is too large. Max size is 100 MB.");
    }

    let id = createId(8);

    while (
      await env.DB.prepare("SELECT id FROM files WHERE id = ?")
        .bind(id)
        .first()
    ) {
      id = createId(8);
    }

    const extension = getExtensionFromName(file.name);
    const key = `files/${id}${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.FILES_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const createdAt = new Date().toISOString();
    const expiresAt = getExpiresAt(expiry);

    await env.DB.prepare(
      `
      INSERT INTO files (
        id, original_name, mime_type, size,
        created_at, expires_at, downloads, r2_key
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `,
    )
      .bind(
        id,
        file.name,
        file.type || "application/octet-stream",
        file.size,
        createdAt,
        expiresAt,
        key,
      )
      .run();

    return json({
      id,
      url: `/f/${id}`,
      downloadUrl: `/api/file/${id}/download`,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      expiresAt,
      downloads: 0,
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
             created_at, expires_at, downloads, r2_key
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
      SELECT original_name, mime_type, expires_at, r2_key
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
        "Content-Type": file.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.original_name.replace(
          /"/g,
          "",
        )}"`,
        "Cache-Control": "private, max-age=0, no-store",
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