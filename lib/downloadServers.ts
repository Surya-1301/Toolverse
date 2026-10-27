const stripSlash = (u: string) => u.trim().replace(/\/+$/, "");

/** yt-dlp backend: YouTube, Instagram Reels, and Music downloaders. */
export const PRIVATE_YT_BACKEND = stripSlash(
  process.env.NEXT_PUBLIC_YT_BACKEND || "https://toolverse-yt-api-cyg1.onrender.com",
);

/** YoutubeExplode backend (.NET 8): specialized alternative for YouTube. */
export const PRIVATE_YE_BACKEND = stripSlash(
  process.env.NEXT_PUBLIC_YE_BACKEND || "https://toolverse-ye-api.onrender.com",
);

export const PRIVATE_YT_KEY = "";
