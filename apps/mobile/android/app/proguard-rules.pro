# ─── LifeFlow ProGuard rules ────────────────────────────────────────────────

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.**

# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class **$WhenMappings { <fields>; }
-dontwarn kotlin.**

# Auth0 (react-native-auth0)
-keep class com.auth0.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Notifee
-keep class io.invertase.notifee.** { *; }
-dontwarn io.invertase.**

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Navigation (react-native-screens + gesture-handler + safe-area)
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Sentry
-keep class io.sentry.** { *; }
-keep class io.sentry.android.** { *; }
-dontwarn io.sentry.**

# Keep native methods exposed to React Native JS bridge
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep BuildConfig
-keep class com.lifeflow.BuildConfig { *; }

# Preserve source file names and line numbers for crash reporting (Sentry)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Strip verbose log calls in release builds
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
