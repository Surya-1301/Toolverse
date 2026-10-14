const stripSlash = (u: string) => u.trim().replace(/\/+$/, "");

/** cobalt API: Instagram Reels + Music (TikTok/SoundCloud) downloaders. */
export const PRIVATE_COBALT_API = stripSlash(
  "https://toolverse-cobalt-api.onrender.com",
);

/** Sent as `Authorization: Api-Key <key>` to cobalt. Empty = no key needed. */
export const PRIVATE_COBALT_KEY = "";

/** yt-dlp backend: YouTube downloader. */
export const PRIVATE_YT_BACKEND = stripSlash(
  "https://toolverse-yt-api.onrender.com",
);

export const PRIVATE_YT_KEY = "";
