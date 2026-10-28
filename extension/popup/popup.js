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

  // Detect active tab on popup open
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      const activeUrl = tabs[0].url;
      if (isSupportedMediaUrl(activeUrl)) {
        urlInput.value = activeUrl;
        fetchVideoInfo(activeUrl);
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

