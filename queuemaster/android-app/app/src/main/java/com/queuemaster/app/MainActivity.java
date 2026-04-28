package com.queuemaster.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private LinearLayout errorView;
    private TextView errorText;
    private SharedPreferences prefs;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Keep screen on (Tablet im Laden soll nicht ausgehen)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        prefs     = getSharedPreferences("queuemaster", MODE_PRIVATE);
        webView   = findViewById(R.id.webview);
        errorView = findViewById(R.id.errorView);
        errorText = findViewById(R.id.errorText);

        setupWebView();
        loadServerUrl();
    }

    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                errorView.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError("Server nicht erreichbar.\n\nIst der PC-Server gestartet?\nSind PC und Tablet im selben WLAN?");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; // alles im WebView laden
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        // JavaScript → Android-Bridge (z.B. zum Einstellungs-Öffnen)
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
    }

    private void loadServerUrl() {
        String serverUrl = prefs.getString("server_url", "");
        if (serverUrl == null || serverUrl.isEmpty()) {
            showServerSetupDialog();
            return;
        }
        // Tablet-App lädt IMMER die Tablet-Seite
        String fullUrl = serverUrl.replaceAll("/+$", "") + "/tablet.html";
        webView.loadUrl(fullUrl);
    }

    private void showError(String msg) {
        webView.setVisibility(View.GONE);
        errorView.setVisibility(View.VISIBLE);
        errorText.setText(msg);
    }

    public void onRetryClicked(View v) {
        loadServerUrl();
    }

    public void onSettingsClicked(View v) {
        showServerSetupDialog();
    }

    private void showServerSetupDialog() {
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (20 * getResources().getDisplayMetrics().density);
        container.setPadding(pad, pad, pad, pad);

        final EditText urlInput = new EditText(this);
        urlInput.setHint("http://192.168.1.100:3000");
        urlInput.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        urlInput.setText(prefs.getString("server_url", "http://192.168.1.100:3000"));

        TextView lbl = new TextView(this);
        lbl.setText("Server-URL eingeben:\n(die IP vom PC wo der Server läuft)");
        lbl.setPadding(0, 0, 0, 16);

        container.addView(lbl);
        container.addView(urlInput);

        new AlertDialog.Builder(this)
            .setTitle("QueueMaster Einstellungen")
            .setView(container)
            .setPositiveButton("Verbinden", (dialog, which) -> {
                String url = urlInput.getText().toString().trim();
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "http://" + url;
                }
                prefs.edit().putString("server_url", url).apply();
                loadServerUrl();
            })
            .setNegativeButton("Abbrechen", null)
            .setCancelable(prefs.getString("server_url", "").length() > 0)
            .show();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Zurück-Taste: im WebView zurücknavigieren
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    // Long-press Menu: Einstellungen öffnen
    @Override
    public boolean onKeyLongPress(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_MENU) {
            showServerSetupDialog();
            return true;
        }
        return super.onKeyLongPress(keyCode, event);
    }

    // JavaScript-Bridge-Klasse
    private class AndroidBridge {
        @JavascriptInterface
        public void openSettings() {
            runOnUiThread(() -> showServerSetupDialog());
        }
        @JavascriptInterface
        public void switchToPage(String page) {
            runOnUiThread(() -> {
                prefs.edit().putString("page", page).apply();
                loadServerUrl();
            });
        }
    }
}
