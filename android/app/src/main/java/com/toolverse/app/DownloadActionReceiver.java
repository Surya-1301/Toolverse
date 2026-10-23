package com.toolverse.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.widget.Toast;

import java.io.File;

/**
 * Handles actions from download notifications (e.g. Delete & move to recycle bin).
 */
public class DownloadActionReceiver extends BroadcastReceiver {
    public static final String ACTION_DELETE = "com.toolverse.app.ACTION_DELETE_DOWNLOAD";
    public static final String EXTRA_FILE_URI = "extra_file_uri";
    public static final String EXTRA_FILE_PATH = "extra_file_path";
    public static final String EXTRA_NOTIFICATION_ID = "extra_notification_id";
    public static final String EXTRA_FILENAME = "extra_filename";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_DELETE.equals(intent.getAction())) return;

        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1);
        String uriStr = intent.getStringExtra(EXTRA_FILE_URI);
        String filePath = intent.getStringExtra(EXTRA_FILE_PATH);
        String filename = intent.getStringExtra(EXTRA_FILENAME);
        if (filename == null || filename.isEmpty()) {
            filename = "File";
        }

        // 1. Dismiss notification immediately
        if (notificationId != -1) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(notificationId);
            }
        }

        boolean removed = false;
        boolean movedToTrash = false;

        // 2. Try MediaStore / ContentResolver (move to recycle bin if Android 11+)
        if (uriStr != null && !uriStr.isEmpty()) {
            try {
                Uri uri = Uri.parse(uriStr);
                ContentResolver resolver = context.getContentResolver();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    try {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.MediaColumns.IS_TRASHED, 1);
                        int updated = resolver.update(uri, values, null, null);
                        if (updated > 0) {
                            removed = true;
                            movedToTrash = true;
                        }
                    } catch (Exception ex) {
                        // Fall through to delete
                    }
                }

                if (!removed) {
                    int deleted = resolver.delete(uri, null, null);
                    if (deleted > 0) {
                        removed = true;
                    }
                }
            } catch (Exception e) {
                // Fall through to file path
            }
        }

        // 3. Try direct file deletion if path was provided
        if (!removed && filePath != null && !filePath.isEmpty()) {
            try {
                File file = new File(filePath);
                if (file.exists()) {
                    removed = file.delete();
                }
            } catch (Exception ignored) {}
        }

        // 4. Toast feedback
        String toastText;
        if (movedToTrash) {
            toastText = "Moved " + filename + " to recycle bin";
        } else if (removed) {
            toastText = "Deleted " + filename;
        } else {
            toastText = "Could not delete " + filename;
        }
        Toast.makeText(context.getApplicationContext(), toastText, Toast.LENGTH_SHORT).show();
    }
}

