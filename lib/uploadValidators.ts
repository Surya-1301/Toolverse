const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedTextTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);

const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
]);

const allowedArchiveTypes = new Set([
  "application/zip",
  "application/x-zip-compressed",
]);

const allowedTextExtensions = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
]);

const allowedDocumentExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
]);

const allowedArchiveExtensions = new Set([".zip"]);

const blockedFileExtensions = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".scr",
  ".msi",
  ".dll",
  ".com",
  ".jar",
  ".apk",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
  ".ps1",
  ".psm1",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".wsf",
  ".wsh",
  ".hta",
  ".lnk",
  ".reg",
  ".iso",
]);

const blockedMimeTypes = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-ms-installer",
  "application/x-msi",
  "application/x-sh",
  "application/x-shellscript",
  "application/java-archive",
  "application/vnd.android.package-archive",
  "application/x-apple-diskimage",
  "application/x-debian-package",
  "application/x-rpm",
  "application/x-ms-shortcut",
]);

function getExtension(fileName: string) {
  const cleanName = fileName.toLowerCase().trim();
  const lastDot = cleanName.lastIndexOf(".");

  if (lastDot < 0) return "";

  return cleanName.slice(lastDot);
}

function hasBlockedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase().trim();

  for (const extension of blockedFileExtensions) {
    if (lowerName.endsWith(extension)) return true;
  }

  return false;
}

export function getUploadKind(file: File): "image" | "pdf" | "file" {
  if (allowedImageTypes.has(file.type) || file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type === "application/pdf" || getExtension(file.name) === ".pdf") {
    return "pdf";
  }

  return "file";
}

export function validateImageUpload(file: File) {
  if (!file) return "Image is required.";

  if (hasBlockedExtension(file.name) || blockedMimeTypes.has(file.type)) {
    return "This file type is not allowed.";
  }

  if (!allowedImageTypes.has(file.type)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  const maxSize = 25 * 1024 * 1024;

  if (file.size > maxSize) {
    return "Image is too large. Max size is 25 MB.";
  }

  if (file.name.length > 180) {
    return "Image file name is too long.";
  }

  return "";
}

export function validateFileUpload(file: File) {
  if (!file) return "File is required.";

  if (file.name.length > 180) {
    return "File name is too long.";
  }

  const extension = getExtension(file.name);

  if (hasBlockedExtension(file.name) || blockedMimeTypes.has(file.type)) {
    return "Executable or unsafe file types are not allowed.";
  }

  const isPdf = file.type === "application/pdf" || extension === ".pdf";

  const isText =
    allowedTextTypes.has(file.type) || allowedTextExtensions.has(extension);

  const isDocument =
    allowedDocumentTypes.has(file.type) ||
    allowedDocumentExtensions.has(extension);

  const isArchive =
    allowedArchiveTypes.has(file.type) ||
    allowedArchiveExtensions.has(extension);

  if (!isPdf && !isText && !isDocument && !isArchive) {
    return "Only images, PDFs, text files, documents, and ZIP files are allowed.";
  }

  const maxPdfSize = 50 * 1024 * 1024;
  const maxGeneralSize = 100 * 1024 * 1024;

  if (isPdf && file.size > maxPdfSize) {
    return "PDF is too large. Max size is 50 MB.";
  }

  if (!isPdf && file.size > maxGeneralSize) {
    return "File is too large. Max size is 100 MB.";
  }

  return "";
}

export function validateUploadForSharing(file: File) {
  const kind = getUploadKind(file);

  if (kind === "image") return validateImageUpload(file);

  return validateFileUpload(file);
}