import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  "appId": "mx.accesototal.app",
  "appName": "accesototal",
  "bundledWebRuntime": false,
  "webDir": "www",
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": false,
      "showSpinner": false,
      "backgroundColor": "#001e4c",
      "splashFullScreen": true,
      "androidScaleType": "CENTER_CROP",
      "splashImmersive": false
    }
  },
  "cordova": {
    "preferences": {
      "ScrollEnabled": "false",
      "BackupWebStorage": "none",
      "AutoHideSplashScreen": "false",
      "FadeSplashScreenDuration": "100",
      "SplashShowOnlyFirstTime": "false",
      "SplashScreen": "background",
      "SplashScreenDelay": "7500",
      "YouTubeDataApiKey": "AIzaSyD6dRs9Qx6-An93puYMAFYi-onfFrlvFPw"
    }
  }
}

export default config;
