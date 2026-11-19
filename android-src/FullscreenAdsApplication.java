package one.eternalgalaxy.chibi_wallet;

import android.app.Activity;
import android.app.Application;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import java.util.Map;
import java.util.WeakHashMap;

/**
 * Android 15/16 bắt buộc edge-to-edge cho mọi activity trong app theo
 * targetSdkVersion, không cho opt-out qua theme nữa (windowOptOutEdgeToEdgeEnforcement
 * chỉ có tác dụng ở API 35, bị bỏ ở API 36). Google Mobile Ads SDK (tới bản
 * đang dùng) chưa tự ẩn system bar đúng cách cho AdActivity trong trường hợp
 * này nên quảng cáo full screen bị hở phần status bar phía trên. AdActivity
 * là activity của Google Play Services, không sửa được code trực tiếp -> ép
 * activity đó qua immersive mode bằng ActivityLifecycleCallbacks.
 *
 * Nguyên nhân thật sự của khoảng hở: AdActivity dùng theme
 * Theme.Translucent (để crossfade mượt lúc mở ad) -> window của nó xuyên
 * thấu, chỗ nào view nội dung ad không vẽ phủ tới (phần tương ứng status
 * bar vừa ẩn) thì lộ thẳng Activity bên dưới (WebView của app) ra, không
 * phải chỉ là padding/insets. Ẩn system bar sớm (onActivityCreated) vẫn cần
 * nhưng không đủ -> ép thêm window background thành màu đặc (đen) để không
 * có gì xuyên thấu được nữa, bất kể theme/insets xử lý ra sao.
 *
 * Vẫn còn hở (report thực tế trên bản 1.2.6/10206): 3 callback lifecycle
 * (created/started/resumed) chỉ chạy 1 lần lúc Activity mới mở, nhưng GMA
 * SDK tự thay/relayout nội dung AdActivity không đồng bộ (ví dụ sau khi
 * creative load xong, muộn hơn cả 3 mốc trên) -> background đen/insets
 * consume bị áp từ trước đó không còn nguyên vẹn nữa. Gắn thêm
 * OnGlobalLayoutListener để ép lại forceImmersive() mỗi lần decorView
 * layout lại (bắt được mọi lần SDK đổi view trong suốt đời sống Activity,
 * không chỉ 1 lần lúc mở), và mở rộng layoutInDisplayCutoutMode để vẽ full
 * tới cả vùng notch/cutout (nếu máy có) luôn chứ không riêng status bar.
 */
public class FullscreenAdsApplication extends Application {

    private static final String AD_ACTIVITY_CLASS_NAME = "com.google.android.gms.ads.AdActivity";
    private final Map<Activity, ViewTreeObserver.OnGlobalLayoutListener> layoutListeners = new WeakHashMap<>();

    private static void forceImmersive(Activity activity) {
        if (!AD_ACTIVITY_CLASS_NAME.equals(activity.getClass().getName())) {
            return;
        }

        View decorView = activity.getWindow().getDecorView();
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        activity.getWindow().setBackgroundDrawable(new ColorDrawable(Color.BLACK));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attrs = activity.getWindow().getAttributes();
            attrs.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
            activity.getWindow().setAttributes(attrs);
        }

        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(activity.getWindow(), decorView);
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());

        decorView.setOnApplyWindowInsetsListener((view, insets) -> WindowInsetsCompat.CONSUMED.toWindowInsets());
        decorView.requestApplyInsets();
    }

    private void attachPersistentEnforcement(Activity activity) {
        if (!AD_ACTIVITY_CLASS_NAME.equals(activity.getClass().getName())) {
            return;
        }
        if (layoutListeners.containsKey(activity)) {
            return;
        }

        View decorView = activity.getWindow().getDecorView();
        ViewTreeObserver.OnGlobalLayoutListener listener = () -> forceImmersive(activity);
        decorView.getViewTreeObserver().addOnGlobalLayoutListener(listener);
        layoutListeners.put(activity, listener);
    }

    private void detachPersistentEnforcement(Activity activity) {
        ViewTreeObserver.OnGlobalLayoutListener listener = layoutListeners.remove(activity);
        if (listener != null) {
            activity.getWindow().getDecorView().getViewTreeObserver().removeOnGlobalLayoutListener(listener);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();

        registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
            @Override
            public void onActivityResumed(Activity activity) {
                forceImmersive(activity);
            }

            @Override
            public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                forceImmersive(activity);
                attachPersistentEnforcement(activity);
            }

            @Override
            public void onActivityStarted(Activity activity) {
                forceImmersive(activity);
            }

            @Override
            public void onActivityPaused(Activity activity) {
            }

            @Override
            public void onActivityStopped(Activity activity) {
            }

            @Override
            public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
            }

            @Override
            public void onActivityDestroyed(Activity activity) {
                detachPersistentEnforcement(activity);
            }
        });
    }
}
