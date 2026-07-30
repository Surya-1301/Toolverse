export function createId(length = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id = "";

  for (let index = 0; index < length; index++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

export function createSlug(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  let slug = "";

  for (let index = 0; index < length; index++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }

  return slug;
}