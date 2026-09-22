package com.anvimitra.erp;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdateInstaller")
public class AppUpdateInstallerPlugin extends Plugin {

    private static File downloadedApkFile = null;

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            InputStream input = null;
            OutputStream output = null;
            try {
                URL url = new URL(apkUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "MITRA-ERP-Android-Updater");
                connection.connect();

                // Handle HTTP redirects (GitHub releases redirect to AWS S3)
                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                    responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                    responseCode == 307 || responseCode == 308) {
                    String newUrl = connection.getHeaderField("Location");
                    if (newUrl != null && !newUrl.isEmpty()) {
                        connection.disconnect();
                        url = new URL(newUrl);
                        connection = (HttpURLConnection) url.openConnection();
                        connection.setInstanceFollowRedirects(true);
                        connection.setRequestProperty("User-Agent", "MITRA-ERP-Android-Updater");
                        connection.connect();
                    }
                }

                int fileLength = connection.getContentLength();
                input = new BufferedInputStream(connection.getInputStream(), 8192);

                File downloadDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir == null) {
                    downloadDir = getContext().getCacheDir();
                }
                if (!downloadDir.exists()) {
                    downloadDir.mkdirs();
                }

                File outputFile = new File(downloadDir, "MITRA-ERP-Update.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }
                output = new FileOutputStream(outputFile);

                byte[] data = new byte[8192];
                long total = 0;
                int count;
                long lastProgressReportTime = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    output.write(data, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastProgressReportTime > 150) {
                        lastProgressReportTime = now;
                        int percent = fileLength > 0 ? (int) ((total * 100) / fileLength) : 0;
                        JSObject progressData = new JSObject();
                        progressData.put("percent", percent);
                        progressData.put("bytesDownloaded", total);
                        progressData.put("totalBytes", fileLength > 0 ? fileLength : total);
                        notifyListeners("downloadProgress", progressData);
                    }
                }

                output.flush();
                downloadedApkFile = outputFile;

                JSObject completeData = new JSObject();
                completeData.put("percent", 100);
                completeData.put("bytesDownloaded", total);
                completeData.put("totalBytes", total);
                completeData.put("filePath", outputFile.getAbsolutePath());
                notifyListeners("downloadComplete", completeData);

                // Auto-trigger native Android installer prompt directly on device
                boolean installerTriggered = launchPackageInstaller(outputFile);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", outputFile.getAbsolutePath());
                res.put("installerTriggered", installerTriggered);
                call.resolve(res);

            } catch (Exception e) {
                JSObject errData = new JSObject();
                errData.put("error", e.getMessage() != null ? e.getMessage() : "Unknown download error");
                notifyListeners("downloadError", errData);
                call.reject("Download failed: " + e.getMessage());
            } finally {
                try {
                    if (output != null) output.close();
                    if (input != null) input.close();
                    if (connection != null) connection.disconnect();
                } catch (Exception ignored) {}
            }
        }).start();
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        File fileToInstall = downloadedApkFile;
        String path = call.getString("filePath");
        if (path != null && !path.isEmpty()) {
            File customFile = new File(path);
            if (customFile.exists()) {
                fileToInstall = customFile;
            }
        }

        if (fileToInstall == null || !fileToInstall.exists()) {
            File downloadDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadDir != null) {
                File defaultFile = new File(downloadDir, "MITRA-ERP-Update.apk");
                if (defaultFile.exists()) {
                    fileToInstall = defaultFile;
                }
            }
        }

        if (fileToInstall == null || !fileToInstall.exists()) {
            call.reject("No downloaded APK file found to install. Please download update first.");
            return;
        }

        boolean success = launchPackageInstaller(fileToInstall);
        JSObject res = new JSObject();
        res.put("success", success);
        call.resolve(res);
    }

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canInstall = getContext().getPackageManager().canRequestPackageInstalls();
        }
        JSObject res = new JSObject();
        res.put("canInstall", canInstall);
        call.resolve(res);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    private boolean launchPackageInstaller(File apkFile) {
        try {
            Context context = getContext();
            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
