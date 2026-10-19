package com.toolverse.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Register custom native plugins (no npm package required).
    registerPlugin(DownloadManagerPlugin.class);
  }
}

