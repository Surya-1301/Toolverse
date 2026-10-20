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

    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView != null) {
      webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
      webView.setInitialScale(0);
      webView.getSettings().setUseWideViewPort(true);
      webView.getSettings().setLoadWithOverviewMode(true);
      webView.getSettings().setDomStorageEnabled(true);
    }
  }
}
