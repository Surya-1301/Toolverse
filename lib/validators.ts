const blockedHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const reservedSlugs = new Set([
  "api",
  "admin",
  "app",
  "assets",
  "auth",
  "blog",
  "contact",
  "dashboard",
  "help",
  "home",
  "image-compressor",
  "image-host",
  "json-formatter",
  "login",
  "logout",
  "paste",
  "privacy",
  "qr-generator",
  "raw",
  "register",
  "report-abuse",
  "robots.txt",
  "s",
  "settings",
  "shorten",
  "signup",
  "sitemap.xml",
  "terms",
  "tools",
  "url-shortener",
]);

const reservedPasteAliases = new Set([
  "api",
  "admin",
  "app",
  "assets",
  "auth",
  "blog",
  "contact",
  "dashboard",
  "help",
  "home",
  "image-compressor",
  "image-host",
  "json-formatter",
  "login",
  "logout",
  "paste",
  "privacy",
  "qr-generator",
  "raw",
  "register",
  "report-abuse",
  "robots.txt",
  "s",
  "settings",
  "shorten",
  "signup",
  "sitemap.xml",
  "terms",
  "tools",
  "url-shortener",
]);

export function validateShortUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Please enter a valid http or https URL.";
    }

    if (value.length > 2_000) {
      return "URL is too long. Max 2,000 characters.";
    }

    if (blockedHostnames.has(url.hostname.toLowerCase())) {
      return "This URL cannot be shortened.";
    }

    return "";
  } catch {
    return "Please enter a valid http or https URL.";
  }
}

export function validateCustomSlug(value: string) {
  if (!value) return "";

  if (!/^[a-z0-9-]{3,30}$/.test(value)) {
    return "Custom alias must be 3-30 characters and use lowercase letters, numbers, or hyphens.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "Custom alias cannot start or end with a hyphen.";
  }

  if (value.includes("--")) {
    return "Custom alias cannot contain consecutive hyphens.";
  }

  if (reservedSlugs.has(value)) {
    return "This custom alias is reserved.";
  }

  return "";
}

export function validatePasteContent(value: string) {
  if (!value.trim()) {
    return "Paste content is required.";
  }

  if (value.length > 100_000) {
    return "Paste is too large. Max 100,000 characters.";
  }

  return "";
}

export function validatePasteAlias(value: string) {
  if (!value) return "";

  if (!/^[a-z0-9-]{3,40}$/.test(value)) {
    return "Alias must be 3-40 characters and use lowercase letters, numbers, or hyphens.";
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    return "Alias cannot start or end with a hyphen.";
  }

  if (value.includes("--")) {
    return "Alias cannot contain consecutive hyphens.";
  }

  if (reservedPasteAliases.has(value)) {
    return "This alias is reserved.";
  }

  return "";
}