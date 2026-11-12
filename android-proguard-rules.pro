# Cordova nạp plugin qua Class.forName() theo đúng tên package khai báo
# trong config.xml <feature>, nên các class này phải giữ nguyên tên qua R8.
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin
-keepclassmembers class * extends org.apache.cordova.CordovaPlugin {
    public <init>(...);
}

# WebView gọi ngược vào Java qua @JavascriptInterface bằng tên method.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 3 plugin hiện dùng, nạp qua tên class đầy đủ trong config.xml.
-keep class admob.plus.cordova.** { *; }
-keep class de.appplant.cordova.plugin.localnotification.** { *; }
-keep class org.apache.cordova.device.** { *; }

# Play Services Ads đã có consumer proguard rules riêng trong AAR, giữ thêm
# cho chắc với phần SDK dùng reflection để resolve ad format.
-keep class com.google.android.gms.ads.** { *; }
