package com.toolverse.app;

import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    public static final String CHANNEL_ID = "toolverse_downloads_channel";
    private static long lastDownloadIntentTimestamp = 0;

    public static void markDownloadIntent() {
        lastDownloadIntentTimestamp = System.currentTimeMillis();
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Toolverse Downloads",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Download progress and file opening notifications");
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public static void hideStatusBar(MainActivity activity) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(activity.getWindow(), activity.getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.hide(WindowInsetsCompat.Type.statusBars());
            insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }

    public static String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return String.format(java.util.Locale.US, "%.1f %s", bytes / Math.pow(1024, digitGroups), units[digitGroups]);
    }

    public static void showDownloadCompleteNotification(
        Context context,
        NotificationManagerCompat notificationManager,
        int notificationId,
        Uri fileUri,
        String absoluteFilePath,
        String filename,
        String mimeType
    ) {
        Intent viewIntent = new Intent(Intent.ACTION_VIEW);
        if (mimeType != null && !mimeType.isEmpty()) {
            viewIntent.setDataAndType(fileUri, mimeType);
        } else {
            viewIntent.setDataAndType(fileUri, "application/octet-stream");
        }
        viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

        PendingIntent viewPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            viewIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent deleteIntent = new Intent(context, DownloadActionReceiver.class);
        deleteIntent.setAction(DownloadActionReceiver.ACTION_DELETE);
        deleteIntent.putExtra(DownloadActionReceiver.EXTRA_NOTIFICATION_ID, notificationId);
        deleteIntent.putExtra(DownloadActionReceiver.EXTRA_FILE_URI, fileUri != null ? fileUri.toString() : "");
        deleteIntent.putExtra(DownloadActionReceiver.EXTRA_FILE_PATH, absoluteFilePath != null ? absoluteFilePath : "");
        deleteIntent.putExtra(DownloadActionReceiver.EXTRA_FILENAME, filename);

        PendingIntent deletePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 1,
            deleteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        try {
            NotificationCompat.Builder completeBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(filename)
                .setContentText("Download complete. Tap to open.")
                .setContentIntent(viewPendingIntent)
                .setAutoCancel(true)
                .setOngoing(false)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .addAction(0, "Open", viewPendingIntent)
                .addAction(android.R.drawable.ic_menu_delete, "Delete", deletePendingIntent);

            notificationManager.notify(notificationId, completeBuilder.build());
        } catch (SecurityException ignored) {
        }
    }

    public static Uri downloadUrlToDownloads(Context context, String urlString, String filename, String mimeType) throws Exception {
        createNotificationChannel(context);
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        int notificationId = (int) (System.currentTimeMillis() & 0xfffffff);

        NotificationCompat.Builder progressBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Downloading " + filename)
            .setContentText("Connecting...")
            .setProgress(0, 0, true)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        try {
            notificationManager.notify(notificationId, progressBuilder.build());
        } catch (SecurityException ignored) {}

        Uri fileUri = null;
        String absoluteFilePath = null;
        OutputStream os = null;
        InputStream is = null;
        HttpURLConnection conn = null;

        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(90000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; Toolverse) AppleWebKit/537.36");
            String cookies = CookieManager.getInstance().getCookie(urlString);
            if (cookies != null) {
                conn.setRequestProperty("Cookie", cookies);
            }

            int status = conn.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                String newUrl = conn.getHeaderField("Location");
                if (newUrl != null && !newUrl.isEmpty()) {
                    conn.disconnect();
                    url = new URL(newUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(30000);
                    conn.setReadTimeout(90000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; Toolverse) AppleWebKit/537.36");
                    if (cookies != null) conn.setRequestProperty("Cookie", cookies);
                    status = conn.getResponseCode();
                }
            }

            if (status >= 400) {
                throw new Exception("HTTP " + status + ": " + conn.getResponseMessage());
            }

            long totalBytes = conn.getContentLengthLong();
            if (mimeType == null || mimeType.isEmpty() || mimeType.equals("application/octet-stream")) {
                String serverMime = conn.getContentType();
                if (serverMime != null && !serverMime.isEmpty()) {
                    mimeType = serverMime.split(";")[0].trim();
                }
            }

            is = conn.getInputStream();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                if (mimeType != null && !mimeType.isEmpty()) {
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                }
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                fileUri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (fileUri == null) {
                    throw new Exception("Could not allocate file in MediaStore Downloads");
                }
                os = context.getContentResolver().openOutputStream(fileUri);
            } else {
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists()) dir.mkdirs();
                File file = new File(dir, filename);
                os = new FileOutputStream(file);
                absoluteFilePath = file.getAbsolutePath();
                context.sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(file)));
                try {
                    fileUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
                } catch (Exception ex) {
                    fileUri = Uri.fromFile(file);
                }
            }

            if (os == null) {
                throw new Exception("Could not open destination output stream");
            }

            byte[] buffer = new byte[16384];
            int read;
            long downloadedBytes = 0;
            long lastNotificationTime = System.currentTimeMillis();

            while ((read = is.read(buffer)) != -1) {
                os.write(buffer, 0, read);
                downloadedBytes += read;

                long now = System.currentTimeMillis();
                if (now - lastNotificationTime > 400) {
                    lastNotificationTime = now;
                    try {
                        if (totalBytes > 0) {
                            int percent = (int) ((downloadedBytes * 100) / totalBytes);
                            progressBuilder.setProgress(100, percent, false)
                                .setContentText(percent + "% (" + formatBytes(downloadedBytes) + " / " + formatBytes(totalBytes) + ")");
                        } else {
                            progressBuilder.setProgress(0, 0, true)
                                .setContentText(formatBytes(downloadedBytes) + " downloaded");
                        }
                        notificationManager.notify(notificationId, progressBuilder.build());
                    } catch (SecurityException ignored) {}
                }
            }

            os.flush();

        } catch (Exception e) {
            try {
                notificationManager.cancel(notificationId);
            } catch (SecurityException ignored) {}
            throw e;
        } finally {
            if (is != null) try { is.close(); } catch (Exception ignored) {}
            if (os != null) try { os.close(); } catch (Exception ignored) {}
            if (conn != null) try { conn.disconnect(); } catch (Exception ignored) {}
        }

        showDownloadCompleteNotification(context, notificationManager, notificationId, fileUri, absoluteFilePath, filename, mimeType);
        return fileUri;
    }

    public static void saveBytesToDownloads(Context context, byte[] bytes, String filename, String mimeType) throws Exception {
        createNotificationChannel(context);
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        int notificationId = (int) (System.currentTimeMillis() & 0xfffffff);

        // 1. Show download progress notification in status bar
        try {
            NotificationCompat.Builder progressBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle("Downloading " + filename)
                .setContentText("Saving file...")
                .setProgress(0, 0, true)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW);

            notificationManager.notify(notificationId, progressBuilder.build());
        } catch (SecurityException ignored) {
        }

        Uri fileUri = null;
        String absoluteFilePath = null;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            if (mimeType != null && !mimeType.isEmpty()) {
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
            }
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

            Uri uri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (OutputStream os = context.getContentResolver().openOutputStream(uri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                }
                fileUri = uri;
            } else {
                throw new Exception("Could not allocate file in MediaStore Downloads");
            }
        } else {
            File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(dir, filename);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(bytes);
                fos.flush();
            }
            absoluteFilePath = file.getAbsolutePath();
            context.sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(file)));
            try {
                fileUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            } catch (Exception ex) {
                fileUri = Uri.fromFile(file);
            }
        }

        showDownloadCompleteNotification(context, notificationManager, notificationId, fileUri, absoluteFilePath, filename, mimeType);
    }

    public class BlobDownloadInterface {
        @JavascriptInterface
        public void processBlobData(String base64Data, String filename, String mimeType) {
            new Thread(() -> {
                try {
                    markDownloadIntent();
                    byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                    saveBytesToDownloads(getApplicationContext(), bytes, filename, mimeType);
                    runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Downloaded " + filename + " to Downloads", Toast.LENGTH_SHORT).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Failed to save file: " + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }

        @JavascriptInterface
        public void downloadDirectUrl(String url, String filename, String mimeType) {
            new Thread(() -> {
                try {
                    markDownloadIntent();
                    downloadUrlToDownloads(getApplicationContext(), url, filename, mimeType);
                    runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Downloaded " + filename + " to Downloads", Toast.LENGTH_SHORT).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }

        @JavascriptInterface
        public void markDownloadIntent() {
            MainActivity.markDownloadIntent();
        }

        @JavascriptInterface
        public void requestAppPermissions() {
            runOnUiThread(() -> requestPermissionsOnFirstLaunch());
        }
    }

    public class ClipboardInterface {
        @JavascriptInterface
        public String readText() {
            try {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null && cm.hasPrimaryClip()) {
                    ClipData clip = cm.getPrimaryClip();
                    if (clip != null && clip.getItemCount() > 0) {
                        CharSequence text = clip.getItemAt(0).coerceToText(getApplicationContext());
                        return text != null ? text.toString() : "";
                    }
                }
            } catch (Exception ignored) {}
            return "";
        }

        @JavascriptInterface
        public boolean writeText(String text) {
            try {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    ClipData clip = ClipData.newPlainText("Toolverse", text != null ? text : "");
                    cm.setPrimaryClip(clip);
                    return true;
                }
            } catch (Exception ignored) {}
            return false;
        }
    }

    public void requestPermissionsOnFirstLaunch() {
        List<String> permissions = new ArrayList<>();

        // 1. Notification permission (Android 13+ / API 33+) for download completion & alerts
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        // 2. Photos & Media access (Android 13+ / API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_MEDIA_IMAGES);
            }
            if (checkSelfPermission(android.Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_MEDIA_VIDEO);
            }
            if (checkSelfPermission(android.Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_MEDIA_AUDIO);
            }
            if (Build.VERSION.SDK_INT >= 34) {
                String visualSelected = "android.permission.READ_MEDIA_VISUAL_USER_SELECTED";
                if (checkSelfPermission(visualSelected) != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(visualSelected);
                }
            }
        } else {
            // Android 12 and below (API <= 32)
            if (checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
                if (checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
                }
            }
        }

        if (!permissions.isEmpty()) {
            requestPermissions(permissions.toArray(new String[0]), 101);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);

        // Register custom native plugins
        registerPlugin(DownloadManagerPlugin.class);

        hideStatusBar(this);

        // Always ask for photos, files, and notification access on app launch
        requestPermissionsOnFirstLaunch();

        // Native download listener and blob downloader for Android WebView
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv == null && bridge != null) {
            wv = bridge.getWebView();
        }
        final WebView webView = wv;

        if (webView != null) {
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
            webView.setInitialScale(0);
            webView.getSettings().setUseWideViewPort(true);
            webView.getSettings().setLoadWithOverviewMode(true);
            webView.getSettings().setDomStorageEnabled(true);

            BlobDownloadInterface blobInterface = new BlobDownloadInterface();
            webView.addJavascriptInterface(blobInterface, "ToolverseBlobDownloader");
            webView.addJavascriptInterface(blobInterface, "PDFVerseBlobDownloader");

            ClipboardInterface clipboardInterface = new ClipboardInterface();
            webView.addJavascriptInterface(clipboardInterface, "ToolverseClipboard");

            webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                try {
                    if (url == null || url.isEmpty()) return;

                    // Ensure downloads only occur on explicit user download actions,
                    // not on background iframe or preview loads.
                    boolean isUserInitiated = (System.currentTimeMillis() - lastDownloadIntentTimestamp < 8000)
                        || (contentDisposition != null && contentDisposition.toLowerCase().contains("attachment"));

                    if (url.startsWith("blob:") || url.startsWith("data:")) {
                        if (!isUserInitiated) {
                            return;
                        }
                    }

                    // Handle blob: URIs by fetching in WebView and streaming base64 to Java
                    if (url.startsWith("blob:")) {
                        String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                        if (filename == null || filename.isEmpty() || filename.endsWith(".bin")) {
                            filename = "toolverse_file";
                        }
                        String finalSafeFilename = filename;
                        String finalMimeType = mimetype != null && !mimetype.isEmpty() ? mimetype : "application/octet-stream";

                        String js = "(function(){" +
                            "fetch('" + url + "')" +
                            ".then(function(r){ return r.arrayBuffer(); })" +
                            ".then(function(buf){" +
                            "  var bytes = new Uint8Array(buf);" +
                            "  var binary = '';" +
                            "  var len = bytes.byteLength;" +
                            "  var chunkSize = 8192;" +
                            "  for (var i = 0; i < len; i += chunkSize) {" +
                            "    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));" +
                            "  }" +
                            "  var b64 = btoa(binary);" +
                            "  var d = window.ToolverseBlobDownloader || window.PDFVerseBlobDownloader;" +
                            "  if (d) {" +
                            "    d.processBlobData(b64, '" + finalSafeFilename.replace("'", "\\'") + "', '" + finalMimeType + "');" +
                            "  }" +
                            "}).catch(function(err){" +
                            "  console.error('Blob download failed', err);" +
                            "});" +
                            "})();";

                        webView.post(() -> webView.evaluateJavascript(js, null));
                        return;
                    }

                    // Handle data: URIs by decoding base64
                    if (url.startsWith("data:")) {
                        int comma = url.indexOf(',');
                        if (comma != -1) {
                            String base64Data = url.substring(comma + 1);
                            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                            if (filename == null || filename.isEmpty() || filename.endsWith(".bin")) {
                                filename = "toolverse_file";
                            }
                            saveBytesToDownloads(getApplicationContext(), bytes, filename, mimetype);
                            Toast.makeText(getApplicationContext(), "Downloaded " + filename + " to Downloads", Toast.LENGTH_SHORT).show();
                        }
                        return;
                    }

                    // Handle standard HTTP and HTTPS URLs via native background streamer with status bar notifications
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                        if (filename == null || filename.isEmpty() || filename.endsWith(".bin")) {
                            filename = "toolverse_download";
                        }
                        String finalSafeFilename = filename;
                        String finalMime = mimetype != null && !mimetype.isEmpty() ? mimetype : "application/octet-stream";
                        new Thread(() -> {
                            try {
                                downloadUrlToDownloads(getApplicationContext(), url, finalSafeFilename, finalMime);
                                runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Downloaded " + finalSafeFilename + " to Downloads", Toast.LENGTH_SHORT).show());
                            } catch (Exception e) {
                                runOnUiThread(() -> Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
                            }
                        }).start();
                    } else {
                        Toast.makeText(getApplicationContext(), "Unsupported download URL scheme", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideStatusBar(this);
        }
    }
}
