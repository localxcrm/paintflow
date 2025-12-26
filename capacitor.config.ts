import type { CapacitorConfig } from '@capacitor/cli';

// =====================================================
// CAPACITOR CONFIG FOR PAINTPRO SUB APP
// =====================================================
//
// The iOS app will load the web app from a URL (server mode).
// This means you need the Next.js app running somewhere:
// - Development: http://localhost:3000
// - Production: Your deployed Vercel/Railway URL
//
// To build for production:
// 1. Deploy your Next.js app to Vercel
// 2. Update the URL below to your production URL
// 3. Run: npx cap sync ios
// 4. Open Xcode: npx cap open ios
// =====================================================

// Set this to your production URL when deploying
// The middleware will handle redirecting to /sub/login if not authenticated
const SERVER_URL = 'http://localhost:3000/sub/dashboard';

const config: CapacitorConfig = {
  appId: 'com.paintpro.sub',
  appName: 'PaintPro Sub',
  webDir: 'out', // Not used in server mode, but required
  server: {
    url: SERVER_URL,
    cleartext: true, // Allow HTTP (for local dev)
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#f8fafc',
    path: 'ios',
    scheme: 'App',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // iOS-specific camera settings
      presentationStyle: 'fullScreen',
      saveToGallery: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'light',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
