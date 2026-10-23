package com.pigspeed.calc;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/* Shell around the published site: always the latest version, the same address for cloud sign-in,
   offline copy through the site's service worker; the bundled copy is only the very first launch without internet. */
public class MainActivity extends Activity {
    private static final String SITE = "https://vlades008.github.io/PigSpeed/";
    private WebView web;
    private boolean fellBack = false;

    private void openExternal(String url) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) { }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setSupportMultipleWindows(true);
        s.setUserAgentString(s.getUserAgentString() + " PigSpeedApp/1");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith(SITE) || u.startsWith("file:///android_asset")) return false;
                openExternal(u);
                return true;
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame() && !fellBack && r.getUrl().toString().startsWith(SITE)) {
                    fellBack = true;
                    v.loadUrl("file:///android_asset/index.html");
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean dialog, boolean gesture, Message msg) {
                WebView t = new WebView(MainActivity.this);
                t.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                        openExternal(r.getUrl().toString());
                        return true;
                    }
                    @Override
                    public void onPageStarted(WebView v, String url, Bitmap icon) {
                        if (url != null && !url.equals("about:blank")) { openExternal(url); v.stopLoading(); }
                    }
                });
                ((WebView.WebViewTransport) msg.obj).setWebView(t);
                msg.sendToTarget();
                return true;
            }
        });
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl(SITE);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
