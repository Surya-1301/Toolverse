// Toolverse Content Script: YouTube In-Page Dropdown, Subtitles & Thumbnail Grabber

(function () {
  "use strict";

  const BACKEND_BASE = "https://toolverse-backend.centralindia.cloudapp.azure.com";
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
      // 1. Try English track
      let res = await fetch(`https://www.youtube.com/api/timedtext?v=${vid}&lang=en&fmt=json3`);
      let text = await res.text();

      // 2. Try auto captions
      if (!text || !text.trim()) {
        res = await fetch(`https://www.youtube.com/api/timedtext?v=${vid}&lang=en&kind=asr&fmt=json3`);
        text = await res.text();
      }

      // 3. Try default track without language filter
      if (!text || !text.trim()) {
        res = await fetch(`https://www.youtube.com/api/timedtext?v=${vid}&fmt=json3`);
        text = await res.text();
      }

      if (!text || !text.trim()) {
        throw new Error("No subtitles or captions are available for this video.");
      }

      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Subtitles format could not be parsed for this video.");
      }

      if (!json?.events || !json.events.length) {
        throw new Error("No subtitle caption events found for this video.");
      }

      let srt = "";
      let idx = 1;
      for (const ev of json.events) {
        if (!ev.segs) continue;
        const textSeg = ev.segs.map((s) => s.utf8).join("").trim();
        if (!textSeg || textSeg === "\n") continue;
        const start = ev.tStartMs || 0;
        const end = start + (ev.dDurationMs || 2000);
        srt += `${idx}\n${fmtSrtTime(start)} --> ${fmtSrtTime(end)}\n${textSeg}\n\n`;
        idx++;
      }

      if (!srt.trim()) {
        throw new Error("No readable text found in captions.");
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
      alert(`Notice: ${err.message || "No captions available"}`);
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
      { label: "🎬 4K Ultra HD (MP4)", action: () => triggerDownload(2160, false) },
      { label: "🎬 2K Quad HD (MP4)", action: () => triggerDownload(1440, false) },
      { label: "🎬 1080p Full HD (MP4)", action: () => triggerDownload(1080, false) },
      { label: "🎬 720p HD (MP4)", action: () => triggerDownload(720, false) },
      { label: "🎵 Audio (MP3)", action: () => triggerDownload(null, true) },
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

  // ==========================================
  // Instagram In-Page Downloader Integration
  // ==========================================

  function createIgDropdown(options) {
    const dropdown = document.createElement("div");
    dropdown.className = "toolverse-ig-dropdown";
    dropdown.style.cssText = `
      display: none;
      position: absolute;
      ${options.position || "top: 38px; right: 0;"}
      width: 210px;
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      padding: 6px;
      flex-direction: column;
      gap: 2px;
      color: #f8fafc;
      font-size: 13px;
      z-index: 99999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    options.items.forEach((item) => {
      if (item.divider) {
        const div = document.createElement("div");
        div.style.cssText = "height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 0;";
        dropdown.appendChild(div);
        return;
      }
      const opt = document.createElement("button");
      opt.type = "button";
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
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display = "none";
        item.action();
      });
      dropdown.appendChild(opt);
    });

    return dropdown;
  }

  function triggerInstagramDownload(targetUrl, isAudio = false, preferredMedia = null) {
    const isStory = targetUrl.includes("/stories/");
    const isReel = targetUrl.includes("/reel/") || targetUrl.includes("/reels/");

    // If direct CDN media URL was detected in DOM and user didn't request audio
    if (preferredMedia && preferredMedia.url && !isAudio && !preferredMedia.url.startsWith("blob:")) {
      const ext = preferredMedia.type === "video" ? "mp4" : "jpg";
      const filename = `instagram_${isStory ? "story" : isReel ? "reel" : "post"}_${Date.now()}.${ext}`;
      chrome.runtime.sendMessage({
        action: "downloadMedia",
        url: preferredMedia.url,
        filename,
      });
      return;
    }

    // Otherwise, route through Toolverse backend
    const params = new URLSearchParams({
      url: targetUrl,
      audio: isAudio ? "1" : "0",
    });
    if (isAudio) params.set("audio_format", "mp3");

    const ext = isAudio ? "mp3" : "mp4";
    const filename = `toolverse_instagram_${isAudio ? "audio" : isStory ? "story" : "media"}_${Date.now()}.${ext}`;
    const dlUrl = `${BACKEND_BASE}/api/download?${params.toString()}`;

    chrome.runtime.sendMessage({
      action: "downloadMedia",
      url: dlUrl,
      filename,
    });
  }

  function injectInstagramStoryButton() {
    if (!window.location.pathname.startsWith("/stories")) {
      const existing = document.getElementById("toolverse-ig-story-container");
      if (existing) existing.remove();
      return;
    }
    if (document.getElementById("toolverse-ig-story-container")) return;

    const container = document.createElement("div");
    container.id = "toolverse-ig-story-container";
    container.style.cssText = `
      position: fixed;
      top: 18px;
      right: 70px;
      z-index: 9999999;
      display: inline-flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const mainBtn = document.createElement("button");
    mainBtn.type = "button";
    mainBtn.id = "toolverse-ig-story-btn";
    mainBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
      color: #ffffff;
      padding: 0 14px;
      height: 34px;
      border-radius: 17px;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(220, 39, 67, 0.4);
      transition: transform 0.15s, opacity 0.15s;
    `;
    mainBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download Story</span>
    `;

    const dropdown = createIgDropdown({
      position: "top: 40px; right: 0;",
      items: [
        {
          label: "📥 Download Active Story",
          action: () => {
            const vid = document.querySelector("section video, div[role='dialog'] video, video");
            const img = document.querySelector("section img[srcset], div[role='dialog'] img, section img");
            let media = null;
            if (vid && vid.src && !vid.src.startsWith("blob:")) {
              media = { type: "video", url: vid.src };
            } else if (img && img.src) {
              media = { type: "image", url: img.src };
            }
            triggerInstagramDownload(window.location.href, false, media);
          },
        },
        {
          label: "🎵 Download Audio (MP3)",
          action: () => triggerInstagramDownload(window.location.href, true),
        },
        { divider: true },
        {
          label: "🚀 Open Toolverse Downloader",
          action: () => {
            window.open(
              `${TOOLVERSE_WEB}/instagram-reels-downloader?url=${encodeURIComponent(window.location.href)}`,
              "_blank"
            );
          },
        },
      ],
    });

    mainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVis = dropdown.style.display === "flex";
      dropdown.style.display = isVis ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) dropdown.style.display = "none";
    });

    container.appendChild(mainBtn);
    container.appendChild(dropdown);
    document.body.appendChild(container);
  }

  function injectInstagramPostButtons() {
    // Find all post action bars (sections containing Like/Comment/Share/Save)
    const actionSections = document.querySelectorAll("article section");
    actionSections.forEach((section) => {
      if (section.querySelector(".toolverse-ig-post-btn")) return;

      // Find the article root to resolve the post URL
      const article = section.closest("article");
      const postLinkEl =
        article?.querySelector("a[href*='/p/']") ||
        article?.querySelector("a[href*='/reel/']");
      const postUrl = postLinkEl
        ? new URL(postLinkEl.getAttribute("href"), window.location.origin).href
        : window.location.href;

      const container = document.createElement("div");
      container.className = "toolverse-ig-post-btn";
      container.style.cssText = `
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        z-index: 1000;
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = "Download with Toolverse";
      btn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        color: #e1306c;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
      `;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;

      const dropdown = createIgDropdown({
        position: "bottom: 38px; left: 0;",
        items: [
          {
            label: "🎬 Download HD Video / Reel",
            action: () => {
              const vid = article?.querySelector("video");
              const media = vid && vid.src && !vid.src.startsWith("blob:") ? { type: "video", url: vid.src } : null;
              triggerInstagramDownload(postUrl, false, media);
            },
          },
          {
            label: "🖼️ Download Photo (JPG)",
            action: () => {
              const img = article?.querySelector("img[srcset]") || article?.querySelector("img");
              const media = img && img.src ? { type: "image", url: img.src } : null;
              triggerInstagramDownload(postUrl, false, media);
            },
          },
          {
            label: "🎵 Download Audio (MP3)",
            action: () => triggerInstagramDownload(postUrl, true),
          },
          { divider: true },
          {
            label: "🚀 Open in Toolverse HD Table",
            action: () => {
              window.open(
                `${TOOLVERSE_WEB}/instagram-reels-downloader?url=${encodeURIComponent(postUrl)}`,
                "_blank"
              );
            },
          },
        ],
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVis = dropdown.style.display === "flex";
        dropdown.style.display = isVis ? "none" : "flex";
      });

      document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) dropdown.style.display = "none";
      });

      container.appendChild(btn);
      container.appendChild(dropdown);

      // Append to the section action bar (usually beside bookmark)
      const lastChild = section.lastElementChild;
      if (lastChild) {
        lastChild.appendChild(container);
      } else {
        section.appendChild(container);
      }
    });
  }

  function injectInstagramReelsButton() {
    const isReelPage =
      window.location.pathname.startsWith("/reels") ||
      window.location.pathname.startsWith("/reel/");
    if (!isReelPage) return;

    if (document.getElementById("toolverse-ig-reel-float")) return;

    const container = document.createElement("div");
    container.id = "toolverse-ig-reel-float";
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: inline-flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const mainBtn = document.createElement("button");
    mainBtn.type = "button";
    mainBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
      color: #ffffff;
      padding: 0 16px;
      height: 40px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transition: transform 0.15s;
    `;
    mainBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download Reel</span>
    `;

    const dropdown = createIgDropdown({
      position: "bottom: 48px; right: 0;",
      items: [
        {
          label: "🎬 Download HD Video (MP4)",
          action: () => {
            const vid = document.querySelector("video");
            const media = vid && vid.src && !vid.src.startsWith("blob:") ? { type: "video", url: vid.src } : null;
            triggerInstagramDownload(window.location.href, false, media);
          },
        },
        {
          label: "🎵 Download Audio (MP3)",
          action: () => triggerInstagramDownload(window.location.href, true),
        },
        { divider: true },
        {
          label: "🚀 Open in Toolverse",
          action: () => {
            window.open(
              `${TOOLVERSE_WEB}/instagram-reels-downloader?url=${encodeURIComponent(window.location.href)}`,
              "_blank"
            );
          },
        },
      ],
    });

    mainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVis = dropdown.style.display === "flex";
      dropdown.style.display = isVis ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) dropdown.style.display = "none";
    });

    container.appendChild(mainBtn);
    container.appendChild(dropdown);
    document.body.appendChild(container);
  }

  function scanAndInjectInstagram() {
    injectInstagramStoryButton();
    injectInstagramPostButtons();
    injectInstagramReelsButton();
  }

  // ==========================================
  // URL & Platform Initialization
  // ==========================================

  const isYouTube = window.location.hostname.includes("youtube.com");
  const isInstagram = window.location.hostname.includes("instagram.com");

  if (isYouTube) {
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(injectYouTubeDropdown, 1000);
      }
    }, 1000);
    setTimeout(injectYouTubeDropdown, 1500);
  } else if (isInstagram) {
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(scanAndInjectInstagram, 600);
      }
      scanAndInjectInstagram();
    }, 1500);
    setTimeout(scanAndInjectInstagram, 1500);
  }
})();
