// Toolverse Chrome Extension - Background Service Worker

const BACKEND_BASE = "https://toolverse-yt-api-cyg1.onrender.com";
const TOOLVERSE_WEB = "https://toolversee.pages.dev";

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Setup Right-Click Context Menu
function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "toolverse-root",
      title: "⚡ Toolverse Media Downloader",
      contexts: ["page", "link", "video"],
    });

    chrome.contextMenus.create({
      id: "toolverse-open-web",
      parentId: "toolverse-root",
      title: "🚀 Open in Toolverse HD Downloader",
      contexts: ["page", "link", "video"],
    });

    chrome.contextMenus.create({
      id: "toolverse-quick-mp3",
      parentId: "toolverse-root",
      title: "🎵 Download as MP3 (Audio)",
      contexts: ["page", "link", "video"],
    });

    chrome.contextMenus.create({
      id: "toolverse-quick-thumb",
      parentId: "toolverse-root",
      title: "🖼️ Download 4K/HD Thumbnail",
      contexts: ["page", "link", "video"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenu();
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url;
  if (!targetUrl) return;

  const ytId = getYouTubeId(targetUrl);

  if (info.menuItemId === "toolverse-open-web") {
    const encoded = encodeURIComponent(targetUrl);
    chrome.tabs.create({ url: `${TOOLVERSE_WEB}/youtube-downloader?url=${encoded}` });
  } else if (info.menuItemId === "toolverse-quick-mp3") {
    const downloadUrl = `${BACKEND_BASE}/api/download?url=${encodeURIComponent(targetUrl)}&audio=1&audio_format=mp3`;
    chrome.downloads.download({
      url: downloadUrl,
      filename: `toolverse_${ytId || "audio"}.mp3`,
      saveAs: true,
    });
  } else if (info.menuItemId === "toolverse-quick-thumb") {
    if (ytId) {
      chrome.downloads.download({
        url: `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
        filename: `youtube_thumb_${ytId}.jpg`,
        saveAs: true,
      });
    } else {
      const encoded = encodeURIComponent(targetUrl);
      chrome.tabs.create({ url: `${TOOLVERSE_WEB}/youtube-downloader?url=${encoded}` });
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadMedia") {
    chrome.downloads.download(
      {
        url: request.url,
        filename: request.filename || "toolverse_download.mp4",
        saveAs: true,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      }
    );
    return true; // Keep message channel open for async response
  }

  if (request.action === "downloadThumbnail" && request.videoId) {
    chrome.downloads.download({
      url: `https://i.ytimg.com/vi/${request.videoId}/maxresdefault.jpg`,
      filename: `youtube_thumb_${request.videoId}.jpg`,
      saveAs: true,
    });
    sendResponse({ success: true });
    return true;
  }
});
