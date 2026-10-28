// Toolverse Extension Popup Logic

const BACKEND_BASE = "https://toolverse-yt-api-cyg1.onrender.com";
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Could not fetch video info.");
      }

      const data = await res.json();
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

    const resources = data.resources || [];
    const videoList = resources.filter((r) => !r.audioOnly).slice(0, 4);
    const audioRes = resources.find((r) => r.audioOnly);

    videoList.forEach((v) => {
      const row = document.createElement("div");
      row.className = "quality-row";
      row.innerHTML = `
        <span class="quality-label">${v.quality}p MP4</span>
        <button class="btn-dl-row" data-id="${v.id}">Download</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        triggerDownload(sourceUrl, v.id, "0");
      });
      qualitiesListEl.appendChild(row);
    });

    if (audioRes) {
      const row = document.createElement("div");
      row.className = "quality-row";
      row.innerHTML = `
        <span class="quality-label">Audio (MP3)</span>
        <button class="btn-dl-row" data-id="${audioRes.id}">Download</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        triggerDownload(sourceUrl, audioRes.id, "1");
      });
      qualitiesListEl.appendChild(row);
    }

    btnOpenToolverse.onclick = () => {
      const encoded = encodeURIComponent(sourceUrl);
      chrome.tabs.create({ url: `${TOOLVERSE_WEB}/youtube-downloader?url=${encoded}` });
    };

    const ytId = getYouTubeVideoId(sourceUrl);
    const safeTitle = (data.title || "video").replace(/[/\\?%*:|"<>#]/g, "-").slice(0, 70);

    if (btnDownloadThumb) {
      btnDownloadThumb.onclick = () => {
        const thumbUrl = ytId
          ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`
          : (data.thumbnail || "https://toolversee.pages.dev/icon.png");
        chrome.downloads.download({
          url: thumbUrl,
          filename: `${safeTitle}_thumb.jpg`,
          saveAs: true,
        });
      };
    }

    if (btnDownloadSub) {
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

  function triggerDownload(url, formatId, isAudio) {
    const params = new URLSearchParams({
      url,
      format_id: formatId,
      audio: isAudio,
    });
    const downloadUrl = `${BACKEND_BASE}/api/download?${params.toString()}`;
    chrome.downloads.download({
      url: downloadUrl,
      saveAs: true,
    });
  }

  function isSpecificVideoUrl(url) {
    return /youtube\.com\/watch\?v=|youtu\.be\/[A-Za-z0-9_-]{11}|youtube\.com\/shorts\/|instagram\.com\/(?:reel|reels|p)\//i.test(url);
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

