const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const blockedFileExtensions = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".scr",
  ".msi",
  ".dll",
  ".com",
  ".jar",
  ".sh",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
  ".ps1",
  ".vbs",
  ".wsf",
]);

const blockedMimeTypes = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-ms-installer",
  "application/x-sh",
  "application/java-archive",
]);

export function validateImageUpload(file: File) {
  if (!file) {
    return "Image is required.";
  }

  if (!allowedImageTypes.has(file.type)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    return "Image is too large. Max size is 10 MB.";
  }

  if (file.name.length > 180) {
    return "Image file name is too long.";
  }

  return "";
}

export function validateFileUpload(file: File) {
  if (!file) {
    return "File is required.";
  }

  const maxSize = 50 * 1024 * 1024;

  if (file.size > maxSize) {
    return "File is too large. Max size is 50 MB.";
  }

  if (file.name.length > 180) {
    return "File name is too long.";
  }

  const lowerName = file.name.toLowerCase();

  for (const extension of blockedFileExtensions) {
    if (lowerName.endsWith(extension)) {
      return "This file type is not allowed.";
    }
  }

  if (blockedMimeTypes.has(file.type)) {
    return "This file type is not allowed.";
  }

  return "";
}