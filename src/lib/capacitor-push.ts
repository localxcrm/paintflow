'use client';

import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor native app
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  if (isNativeApp()) {
    return true; // Native apps always support push
  }
  // Web fallback
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Register push notifications (native)
export async function registerNativePush(): Promise<string | null> {
  if (!isNativeApp()) {
    console.log('Not running in native app, skipping native push registration');
    return null;
  }

  try {
    // Check current permission status
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      // Request permission
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Register with APNS/FCM
    await PushNotifications.register();

    // Return promise that resolves with token
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration failed:', error);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return null;
  }
}

// Setup push notification listeners
export function setupPushListeners(
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationActionPerformed?: (action: ActionPerformed) => void
): () => void {
  if (!isNativeApp()) {
    return () => {}; // No-op cleanup for web
  }

  const cleanupFunctions: (() => void)[] = [];

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    onNotificationReceived?.(notification);
  }).then(handle => {
    cleanupFunctions.push(() => handle.remove());
  });

  // User tapped on notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push notification action performed:', action);
    onNotificationActionPerformed?.(action);
  }).then(handle => {
    cleanupFunctions.push(() => handle.remove());
  });

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(fn => fn());
  };
}

// Get delivered notifications (iOS only)
export async function getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
  if (!isNativeApp()) return [];

  try {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  } catch {
    return [];
  }
}

// Remove all delivered notifications
export async function removeAllDeliveredNotifications(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error removing notifications:', error);
  }
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  if (!isNativeApp()) {
    // Web fallback
    return Notification.permission === 'granted';
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive === 'granted';
  } catch {
    return false;
  }
}

// Send device token to server for storage
export async function saveDeviceToken(token: string, userId?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/push/device-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Capacitor.getPlatform(), // 'ios', 'android', or 'web'
        userId,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error('Error saving device token:', error);
    return false;
  }
}
