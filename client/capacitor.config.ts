import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sketchtask.app",
  appName: "SketchTask",
  webDir: "dist",
  // Do not set server.url here. Release APKs must load the bundled dist files
  // so the app can open and remain usable without an internet connection.
  android: {
    backgroundColor: "#FBF9F4",
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#FBF9F4",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_sketchtask",
      iconColor: "#FEF08A",
      sound: "beep.wav",
    },
  },
};

export default config;
