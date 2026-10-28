// Toolverse Chrome Extension - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("Toolverse Video & Media Downloader installed successfully.");
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
});
