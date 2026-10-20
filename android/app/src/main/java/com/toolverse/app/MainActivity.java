package com.toolverse.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Register custom native plugins (no npm package required).
    registerPlugin(DownloadManagerPlugin.class);

    // Make sure JS-driven navigation (window.location.href = /paste-view?id=...)
    // stays inside the Capacitor WebView and local storage / state works correctly.
    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView != null) {
      webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
      webView.setInitialScale(1);
      webView.getSettings().setDomStorageEnabled(true);
    }
  }
}
