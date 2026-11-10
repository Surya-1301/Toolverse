package com.toolverse.app;

import android.content.Context;
import android.util.Base64;
import android.webkit.URLUtil;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native download bridge — saves files to the device's public Downloads
 * with real-time download status bar progress and completion notifications
 * with "Open" and "Delete" actions.
 */
@CapacitorPlugin(name = "ToolverseDownload")
public class DownloadManagerPlugin extends Plugin {

  @PluginMethod
  public void downloadUrl(PluginCall call) {
    String url = call.getString("url");
    String filename = call.getString("filename", "download");
    String mimeType = call.getString("mimeType", "");

    if (url == null || url.isEmpty()) {
      call.reject("Missing url");
      return;
    }

    String guessed = URLUtil.guessFileName(url, null, mimeType);
    if (filename == null || filename.trim().isEmpty()) {
      filename = guessed;
    }
    filename = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    if (filename.isEmpty()) filename = "download";
    final String finalFilename = filename;
    final String finalMime = mimeType;

    new Thread(() -> {
      try {
        Context ctx = getContext();
        MainActivity.downloadUrlToDownloads(ctx, url, finalFilename, finalMime);
        JSObject ret = new JSObject();
        ret.put("id", System.currentTimeMillis());
        ret.put("filename", finalFilename);
        ret.put("path", finalFilename);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("Download failed: " + e.getMessage());
      }
    }).start();
  }

  @PluginMethod
  public void saveBase64(PluginCall call) {
    String data = call.getString("data");
    String filename = call.getString("filename", "download");
    String mimeType = call.getString("mimeType", "application/octet-stream");

    if (data == null || data.isEmpty()) {
      call.reject("Missing data");
      return;
    }

    filename = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    if (filename.isEmpty()) filename = "download";
    final String finalFilename = filename;
    final String finalMime = mimeType;

    new Thread(() -> {
      try {
        byte[] bytes = Base64.decode(data, Base64.DEFAULT);
        MainActivity.saveBytesToDownloads(getContext(), bytes, finalFilename, finalMime);

        JSObject ret = new JSObject();
        ret.put("filename", finalFilename);
        ret.put("path", finalFilename);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("Failed to save: " + e.getMessage());
      }
    }).start();
  }
}
