import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.za.pinin.app',
  appName: 'PinIn',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  plugins: {
    SplashScreen: {
      backgroundColor: '#ffffff',
      launchShowDuration: 0,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;
