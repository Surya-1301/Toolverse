// Toolverse Extension Popup Logic

const BACKEND_BASE = "https://toolverse-backend.centralindia.cloudapp.azure.com";
const TOOLVERSE_WEB = "https://toolversee.pages.dev";

document.addEventListener("DOMContentLoaded", () => {
  const loadingEl = document.getElementById("loading");
  const cardEl = document.getElementById("detected-card");
  const thumbEl = document.getElementById("thumb");
  const titleEl = document.getElementById("video-title");
  const metaEl = document.getElementById("video-meta");
  const qualitiesListEl = document.getElementById("qualities-list");
  const btnOpenToolverse = document.getElementById("btn-open-toolverse");
  const btnDownloadThumb = document.getElementById("btn-download-thumb");
  const btnDownloadSub = document.getElementById("btn-download-sub");
  const urlInput = document.getElementById("url-input");
  const btnFetch = document.getElementById("btn-fetch");
  const errorBox = document.getElementById("error-box");

  let currentVideoUrl = "";

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  function isSupportedMediaUrl(url) {
    return /youtube\.com|youtu\.be|instagram\.com/i.test(url);
  }

  function getYouTubeVideoId(url) {
    const s = String(url || "");
    const m = s.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
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
    // 1. Try English
    let res = await fetch(`https://www.youtube.com/api/timedtext?v=${vid}&lang=en&fmt=json3`);
    let text = await res.text();

    // 2. Try auto-generated captions
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
    const reader = new FileReader();
    reader.onload = () => {
      chrome.downloads.download({
        url: reader.result,
        filename: `${title}.srt`,
        saveAs: true,
      });
    };
    reader.readAsDataURL(blob);
  }

  async function fetchVideoInfo(url) {
    clearError();
    loadingEl.classList.remove("hidden");
    cardEl.classList.add("hidden");
    currentVideoUrl = url;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const rawText = await res.text();
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(
          data?.detail ||
          data?.error ||
          (res.status === 502 || res.status === 504
            ? "Backend server is waking up. Please wait 15 seconds and try again."
            : `Server returned error (${res.status}).`)
        );
      }

      if (!data) {
        throw new Error("Server returned an empty or invalid response. Please try again.");
      }

      renderVideoCard(data, url);
    } catch (err) {
      showError(err.message || "Failed to inspect video streams.");
    } finally {
      loadingEl.classList.add("hidden");
    }
  }

  function renderVideoCard(data, sourceUrl) {
    titleEl.textContent = data.title || "Video";
    thumbEl.src = data.thumbnail || "https://toolversee.pages.dev/icon.png";
    metaEl.textContent = [
      data.uploader,
      data.duration ? `${Math.floor(data.duration / 60)}:${String(Math.round(data.duration % 60)).padStart(2, "0")}` : null,
    ]
      .filter(Boolean)
      .join(" • ") || "Ready to download";

    qualitiesListEl.innerHTML = "";

    const isIg = /instagram\.com/i.test(sourceUrl);
    const resources = data.resources || [];
    const allVideos = resources.filter((r) => !r.audioOnly && !r.isImage);
    const allPhotos = resources.filter((r) => r.isImage);
    const audioRes = resources.find((r) => r.audioOnly);

    if (isIg) {
      // 1. Instagram Videos / Reels
      if (allVideos.length > 0) {
        allVideos.forEach((v) => {
          const row = document.createElement("div");
          row.className = "quality-row";
          const label = v.sizeLabel || (v.quality ? `${v.quality}p MP4` : "HD Video (MP4)");
          row.innerHTML = `
            <span class="quality-label">${label}</span>
            <button class="btn-dl-row" data-id="${v.id}">Download</button>
          `;
          row.querySelector("button").addEventListener("click", () => {
            triggerDownload(sourceUrl, v.id, "0", v.quality, v.directUrl);
          });
          qualitiesListEl.appendChild(row);
        });
      }

      // 2. Instagram Photos / Multi-Slide Carousels
      if (allPhotos.length > 0) {
        allPhotos.forEach((p, idx) => {
          const row = document.createElement("div");
          row.className = "quality-row";
          const label =
            p.sizeLabel ||
            (allPhotos.length > 1 ? `Slide ${idx + 1} (JPG)` : "Full HD Photo (JPG)");
          row.innerHTML = `
            <span class="quality-label">${label}</span>
            <button class="btn-dl-row" data-id="${p.id}">Download</button>
          `;
          row.querySelector("button").addEventListener("click", () => {
            triggerDownload(sourceUrl, p.id, "0", null, p.directUrl);
          });
          qualitiesListEl.appendChild(row);
        });
      }

      // 3. Instagram Audio (MP3)
      if (audioRes || data.hasAudio) {
        const audioRow = document.createElement("div");
        audioRow.className = "quality-row";
        audioRow.innerHTML = `
          <span class="quality-label">Audio (MP3)</span>
          <button class="btn-dl-row" data-id="${audioRes?.id || ''}">Download</button>
        `;
        audioRow.querySelector("button").addEventListener("click", () => {
          triggerDownload(sourceUrl, audioRes?.id || "", "1");
        });
        qualitiesListEl.appendChild(audioRow);
      }
    } else {
      // YouTube: Only display qualities that ACTUALLY EXIST for this video!
      const availableHeights = [...new Set(allVideos.map((v) => v.quality).filter(Boolean))].sort(
        (a, b) => b - a
      );

      if (availableHeights.length > 0) {
        availableHeights.forEach((q) => {
          const matchedRes = allVideos.find((v) => v.quality === q);
          let label = `${q}p MP4`;
          if (q >= 2160) label = "4K Ultra HD (MP4)";
          else if (q >= 1440) label = "2K Quad HD (MP4)";
          else if (q >= 1080) label = "1080p Full HD (MP4)";
          else if (q >= 720) label = "720p HD (MP4)";

          const row = document.createElement("div");
          row.className = "quality-row";
          row.innerHTML = `
            <span class="quality-label">${label}</span>
            <button class="btn-dl-row" data-id="${matchedRes?.id || ''}">Download</button>
          `;
          row.querySelector("button").addEventListener("click", () => {
            triggerDownload(sourceUrl, matchedRes?.id || "", "0", q);
          });
          qualitiesListEl.appendChild(row);
        });
      } else {
        const row = document.createElement("div");
        row.className = "quality-row";
        row.innerHTML = `
          <span class="quality-label">Best Quality (MP4)</span>
          <button class="btn-dl-row">Download</button>
        `;
        row.querySelector("button").addEventListener("click", () => {
          triggerDownload(sourceUrl, "", "0", 720);
        });
        qualitiesListEl.appendChild(row);
      }

      if (audioRes || data.hasAudio) {
        const audioRow = document.createElement("div");
        audioRow.className = "quality-row";
        audioRow.innerHTML = `
          <span class="quality-label">Audio (MP3)</span>
          <button class="btn-dl-row" data-id="${audioRes?.id || ''}">Download</button>
        `;
        audioRow.querySelector("button").addEventListener("click", () => {
          triggerDownload(sourceUrl, audioRes?.id || "", "1");
        });
        qualitiesListEl.appendChild(audioRow);
      }
    }

    btnOpenToolverse.onclick = () => {
      const encoded = encodeURIComponent(sourceUrl);
      const targetPage = isIg ? "instagram-reels-downloader" : "youtube-downloader";
      chrome.tabs.create({ url: `${TOOLVERSE_WEB}/${targetPage}?url=${encoded}` });
    };

    if (btnOpenToolverse.querySelector("span")) {
      btnOpenToolverse.querySelector("span").textContent = isIg
        ? "Open in Toolverse Instagram Downloader"
        : "Open Full Quality Table (4K / 1080p)";
    }

    if (btnDownloadSub) {
      btnDownloadSub.style.display = isIg ? "none" : "inline-flex";
    }

    const ytId = getYouTubeVideoId(sourceUrl);
    const safeTitle = (data.title || "video").replace(/[/\\?%*:|"<>#]/g, "-").slice(0, 70);

    if (btnDownloadThumb) {
      btnDownloadThumb.textContent = isIg ? "🖼️ Cover / Photo" : "🖼️ HD Thumbnail";
      btnDownloadThumb.onclick = () => {
        const thumbUrl = ytId
          ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`
          : data.thumbnail || "https://toolversee.pages.dev/icon.png";
        chrome.downloads.download({
          url: thumbUrl,
          filename: `${safeTitle}_thumb.jpg`,
          saveAs: true,
        });
      };
    }

    if (btnDownloadSub && !isIg) {
      btnDownloadSub.onclick = async () => {
        if (!ytId) {
          showError("Subtitles are currently available for YouTube videos.");
          return;
        }
        try {
          const btnOrigText = btnDownloadSub.textContent;
          btnDownloadSub.textContent = "Fetching .srt...";
          await downloadSubtitles(ytId, safeTitle);
          btnDownloadSub.textContent = btnOrigText;
        } catch (e) {
          showError(e.message || "No subtitles found for this video.");
          btnDownloadSub.textContent = "📝 Subtitles (.srt)";
        }
      };
    }

    cardEl.classList.remove("hidden");
  }

  function triggerDownload(url, formatId, isAudio, quality, directUrl) {
    const params = new URLSearchParams({
      url,
      audio: isAudio,
    });
    if (formatId) {
      params.set("format_id", formatId);
    }
    if (quality) {
      params.set("quality", String(quality));
    }
    if (directUrl) {
      params.set("direct_url", directUrl);
    }
    const downloadUrl = `${BACKEND_BASE}/api/download?${params.toString()}`;
    chrome.downloads.download({
      url: downloadUrl,
      saveAs: true,
    });
  }

  function isSpecificVideoUrl(url) {
    return /youtube\.com\/watch\?v=|youtu\.be\/[A-Za-z0-9_-]{11}|youtube\.com\/shorts\/|instagram\.com\/(?:reel|reels|p|stories|story)\//i.test(url);
  }

  // Pre-fill active video URL into the input without auto-fetching
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      const activeUrl = tabs[0].url;
      if (isSpecificVideoUrl(activeUrl)) {
        urlInput.value = activeUrl;
      }
    }
  });

  btnFetch.addEventListener("click", () => {
    const val = urlInput.value.trim();
    if (val) {
      fetchVideoInfo(val);
    }
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = urlInput.value.trim();
      if (val) fetchVideoInfo(val);
    }
  });
});

