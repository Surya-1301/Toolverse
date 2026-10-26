const stripSlash = (u: string) => u.trim().replace(/\/+$/, "");

/** yt-dlp backend: YouTube, Instagram Reels, and Music downloaders. */
export const PRIVATE_YT_BACKEND = stripSlash(
  "https://toolverse-yt-api-cyg1.onrender.com",
);

export const PRIVATE_YT_KEY = "";
