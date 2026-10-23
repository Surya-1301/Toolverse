package com.toolverse.app;

import com.getcapacitor.BridgeActivity;
import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.webkit.URLUtil;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "MainActivity";

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Register custom native plugins (no npm package required).
    registerPlugin(DownloadManagerPlugin.class);

    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView != null) {
      webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
      webView.setInitialScale(0);
      webView.getSettings().setUseWideViewPort(true);
      webView.getSettings().setLoadWithOverviewMode(true);
      webView.getSettings().setDomStorageEnabled(true);

      webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
        try {
          if (url == null || url.isEmpty()) return;
          String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
          DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
          if (dm != null) {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(filename);
            request.setDescription("Downloading " + filename);
            request.setNotificationVisibility(
              DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            request.allowScanningByMediaScanner();
            if (mimetype != null && !mimetype.isEmpty()) {
              request.setMimeType(mimetype);
            }
            dm.enqueue(request);
          }
        } catch (Exception e) {
          Log.e(TAG, "WebView DownloadListener error: " + e.getMessage());
        }
      });
    }
  }
}
