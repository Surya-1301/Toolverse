// Toolverse Content Script: YouTube & Instagram Helper Button

(function () {
  "use strict";

  function injectYouTubeButton() {
    if (!window.location.pathname.startsWith("/watch")) return;
    if (document.getElementById("toolverse-yt-download-btn")) return;

    // Target the YouTube actions bar below the video
    const targetBar =
      document.querySelector("#actions #top-level-buttons-computed") ||
      document.querySelector("#actions-inner #top-level-buttons-computed") ||
      document.querySelector("#menu #top-level-buttons-computed");

    if (!targetBar) return;

    const btn = document.createElement("button");
    btn.id = "toolverse-yt-download-btn";
    btn.className = "yt-spec-button-shape-next yt-spec-button-shape-next--tonal";
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      background: #dc2626;
      color: #ffffff;
      padding: 0 16px;
      height: 36px;
      border-radius: 18px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      z-index: 1000;
      font-family: Roboto, Arial, sans-serif;
    `;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download HD</span>
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "#b91c1c";
      btn.style.transform = "scale(1.02)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "#dc2626";
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", () => {
      const currentUrl = encodeURIComponent(window.location.href);
      const toolverseUrl = `https://toolversee.pages.dev/youtube-downloader?url=${currentUrl}`;
      window.open(toolverseUrl, "_blank");
    });

    targetBar.appendChild(btn);
  }

  // Observe URL / page changes on YouTube (Single Page App navigation)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(injectYouTubeButton, 1000);
    }
  }, 1000);

  // Initial check on load
  setTimeout(injectYouTubeButton, 1500);
})();
