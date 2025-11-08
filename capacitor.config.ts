import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.accesototal.app',
  appName: 'accesototal',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#001e4c',
      splashFullScreen: true,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: false
    }
  },
  cordova: {
    preferences: {
     
    }
  },
server: {
  androidScheme: 'https',
  allowNavigation: ['api.balamtickets.com', 'https://api.balamtickets.com'],
  cleartext: true
}
};

export default config;
