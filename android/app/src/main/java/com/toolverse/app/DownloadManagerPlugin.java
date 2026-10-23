package com.toolverse.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.URLUtil;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

/**
 * Native download bridge — saves files to the device's public Downloads
 * collection matching the PDFVerse download architecture.
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

    try {
      Context ctx = getContext();
      DownloadManager dm =
        (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);

      String guessed = URLUtil.guessFileName(url, null, mimeType);
      if (filename == null || filename.trim().isEmpty()) {
        filename = guessed;
      }
      filename = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
      if (filename.isEmpty()) filename = "download";

      File destDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
      if (!destDir.exists()) {
        destDir.mkdirs();
      }

      DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
      request.setTitle(filename);
      request.setDescription("Downloading " + filename);
      request.setNotificationVisibility(
        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
      request.setDestinationInExternalPublicDir(
        Environment.DIRECTORY_DOWNLOADS, filename);
      request.allowScanningByMediaScanner();
      if (mimeType != null && !mimeType.isEmpty()) {
        request.setMimeType(mimeType);
      }
      String cookies = CookieManager.getInstance().getCookie(url);
      if (cookies != null) {
        request.addRequestHeader("cookie", cookies);
      }

      long id = dm.enqueue(request);

      JSObject ret = new JSObject();
      ret.put("id", id);
      ret.put("filename", filename);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Download failed: " + e.getMessage());
    }
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

    try {
      byte[] bytes = Base64.decode(data, Base64.DEFAULT);
      MainActivity.saveBytesToDownloads(getContext(), bytes, filename, mimeType);

      JSObject ret = new JSObject();
      ret.put("filename", filename);
      ret.put("path", filename);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Failed to save: " + e.getMessage());
    }
  }
}
