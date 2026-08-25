import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sketchtask.app',
  appName: 'SketchTask',
  webDir: 'dist',
  server: {
    url: 'https://sketchtask-app.vercel.app',
    cleartext: true,
  },
  android: {
    backgroundColor: '#FBF9F4',
    allowMixedContent: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_sketchtask',
      iconColor: '#FEF08A',
      sound: 'beep.wav',
    },
  },
};

export default config;

