// Toolverse Content Script: YouTube In-Page Dropdown, Subtitles & Thumbnail Grabber

(function () {
  "use strict";

  const BACKEND_BASE = "https://toolverse-yt-api-cyg1.onrender.com";
  const TOOLVERSE_WEB = "https://toolversee.pages.dev";

  function getYouTubeVideoId(url) {
    const s = String(url || window.location.href);
    const m = s.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function getVideoTitle() {
    const titleEl = document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
                    document.querySelector("h1.title yt-formatted-string") ||
                    document.querySelector("meta[name='title']");
    return (titleEl?.textContent || titleEl?.getAttribute("content") || "youtube_video")
      .trim()
      .replace(/[/\\?%*:|"<>#]/g, "-")
      .slice(0, 70);
  }

  function fmtSrtTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const msec = ms % 1000;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(msec).padStart(3, "0")}`;
  }

  async function downloadSubtitles(vid, title) {
    try {
      // Fetch English or auto captions from YouTube timedtext
      const res = await fetch(`https://www.youtube.com/api/timedtext?v=${vid}&lang=en&fmt=json3`);
      if (!res.ok) throw new Error("Subtitles not found for this video.");
      const json = await res.json();
      if (!json?.events?.length) throw new Error("No caption events available.");

      let srt = "";
      let idx = 1;
      for (const ev of json.events) {
        if (!ev.segs) continue;
        const text = ev.segs.map((s) => s.utf8).join("").trim();
        if (!text || text === "\n") continue;
        const start = ev.tStartMs || 0;
        const end = start + (ev.dDurationMs || 2000);
        srt += `${idx}\n${fmtSrtTime(start)} --> ${fmtSrtTime(end)}\n${text}\n\n`;
        idx++;
      }

      const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
      const dlLink = document.createElement("a");
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `${title}.srt`;
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
      URL.revokeObjectURL(dlLink.href);
    } catch (err) {
      alert(`Could not download subtitles: ${err.message || "No captions found"}`);
    }
  }

  function triggerDownload(quality, isAudio = false) {
    const title = getVideoTitle();
    const vid = getYouTubeVideoId();
    const currentUrl = `https://www.youtube.com/watch?v=${vid}`;
    const ext = isAudio ? "mp3" : "mp4";
    const filename = `${title}${quality ? `-${quality}p` : ""}.${ext}`;

    const params = new URLSearchParams({
      url: currentUrl,
      quality: quality ? String(quality) : "",
      audio: isAudio ? "1" : "0",
      audio_format: "mp3",
    });

    const dlUrl = `${BACKEND_BASE}/api/download?${params.toString()}`;
    chrome.runtime.sendMessage({
      action: "downloadMedia",
      url: dlUrl,
      filename,
    });
  }

  function injectYouTubeDropdown() {
    if (!window.location.pathname.startsWith("/watch")) return;
    if (document.getElementById("toolverse-yt-container")) return;

    // Target the YouTube actions bar below the video
    const targetBar =
      document.querySelector("#actions #top-level-buttons-computed") ||
      document.querySelector("#actions-inner #top-level-buttons-computed") ||
      document.querySelector("#menu #top-level-buttons-computed");

    if (!targetBar) return;

    // Wrapper container
    const container = document.createElement("div");
    container.id = "toolverse-yt-container";
    container.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      z-index: 999999;
      font-family: Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    `;

    // Main Toggle Button
    const mainBtn = document.createElement("button");
    mainBtn.id = "toolverse-yt-toggle-btn";
    mainBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dc2626;
      color: #ffffff;
      padding: 0 14px;
      height: 36px;
      border-radius: 18px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    `;
    mainBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    // Dropdown Floating Menu
    const dropdown = document.createElement("div");
    dropdown.id = "toolverse-yt-dropdown";
    dropdown.style.cssText = `
      display: none;
      position: absolute;
      top: 42px;
      left: 0;
      width: 220px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      padding: 6px;
      flex-direction: column;
      gap: 2px;
      color: #f8fafc;
      font-size: 13px;
      z-index: 1000000;
    `;

    const items = [
      { label: "🎬 1080p Full HD (MP4)", action: () => triggerDownload(1080, false) },
      { label: "🎬 720p HD (MP4)", action: () => triggerDownload(720, false) },
      { label: "🎬 360p Fast (MP4)", action: () => triggerDownload(360, false) },
      { label: "🎵 MP3 Audio (HQ)", action: () => triggerDownload(null, true) },
      { divider: true },
      {
        label: "🖼️ Download HD Thumbnail",
        action: () => {
          const vid = getYouTubeVideoId();
          const title = getVideoTitle();
          if (vid) {
            chrome.runtime.sendMessage({
              action: "downloadMedia",
              url: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`,
              filename: `${title}_thumb.jpg`,
            });
          }
        },
      },
      {
        label: "📝 Download Subtitles (.srt)",
        action: () => {
          const vid = getYouTubeVideoId();
          const title = getVideoTitle();
          if (vid) downloadSubtitles(vid, title);
        },
      },
      { divider: true },
      {
        label: "🚀 Open Toolverse HD Table",
        action: () => {
          const vid = getYouTubeVideoId();
          window.open(`${TOOLVERSE_WEB}/youtube-downloader?url=https://www.youtube.com/watch?v=${vid}`, "_blank");
        },
      },
    ];

    items.forEach((item) => {
      if (item.divider) {
        const div = document.createElement("div");
        div.style.cssText = "height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 0;";
        dropdown.appendChild(div);
        return;
      }
      const opt = document.createElement("button");
      opt.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 10px;
        background: transparent;
        color: #e2e8f0;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
      `;
      opt.textContent = item.label;
      opt.addEventListener("mouseenter", () => (opt.style.background = "rgba(255, 255, 255, 0.1)"));
      opt.addEventListener("mouseleave", () => (opt.style.background = "transparent"));
      opt.addEventListener("click", () => {
        dropdown.style.display = "none";
        item.action();
      });
      dropdown.appendChild(opt);
    });

    mainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === "flex";
      dropdown.style.display = isVisible ? "none" : "flex";
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    container.appendChild(mainBtn);
    container.appendChild(dropdown);
    targetBar.appendChild(container);
  }

  // Observe URL / page changes on YouTube (Single Page App navigation)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(injectYouTubeDropdown, 1000);
    }
  }, 1000);

  // Initial check on load
  setTimeout(injectYouTubeDropdown, 1500);
})();
