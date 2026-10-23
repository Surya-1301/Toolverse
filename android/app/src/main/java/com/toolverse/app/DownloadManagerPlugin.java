package com.toolverse.app;

import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.URLUtil;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Native download bridge — saves files to the device's public Downloads
 * collection so they are visible in Files / Downloads and installable (APK).
 *
 * Two methods:
 *  - downloadUrl({ url, filename, mimeType }) — enqueues via system
 *    DownloadManager (handles http/https, redirects like GitHub releases,
 *    shows system notification, works in background).
 *  - saveBase64({ data, filename, mimeType }) — writes base64 content
 *    (client-generated blobs, data: URLs) to Downloads via MediaStore
 *    (API 29+) or legacy external public dir below that.
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

    if (filename == null || filename.trim().isEmpty()) {
      filename = "download";
    }
    filename = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    if (filename.isEmpty()) filename = "download";

    // Strip data: URL prefix if present.
    int comma = data.indexOf(",");
    if (data.startsWith("data:") && comma >= 0) {
      data = data.substring(comma + 1);
    }

    try {
      byte[] bytes = Base64.decode(data, Base64.DEFAULT);
      Context ctx = getContext();
      String savedPath;

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ContentResolver resolver = ctx.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri collection =
          MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri itemUri = resolver.insert(collection, values);
        if (itemUri == null) {
          call.reject("Could not create Downloads entry");
          return;
        }
        try (OutputStream out = resolver.openOutputStream(itemUri)) {
          if (out == null) {
            call.reject("Could not open output stream");
            return;
          }
          out.write(bytes);
        }
        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(itemUri, values, null, null);
        savedPath = itemUri.toString();
      } else {
        File dir = Environment.getExternalStoragePublicDirectory(
          Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists() && !dir.mkdirs()) {
          call.reject("Could not create Downloads dir");
          return;
        }
        File file = new File(dir, filename);
        try (FileOutputStream out = new FileOutputStream(file)) {
          out.write(bytes);
        }
        savedPath = file.getAbsolutePath();
        android.media.MediaScannerConnection.scanFile(
          ctx, new String[] { file.getAbsolutePath() }, new String[] { mimeType }, null);
      }

      JSObject ret = new JSObject();
      ret.put("path", savedPath);
      ret.put("filename", filename);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Save failed: " + e.getMessage());
    }
  }
}
