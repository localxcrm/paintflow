'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import {
  isNativeApp,
  isPushSupported,
  registerNativePush,
  setupPushListeners,
  areNotificationsEnabled,
  saveDeviceToken,
} from '@/lib/capacitor-push';
import { toast } from 'sonner';

interface UseNativePushOptions {
  userId?: string;
  onNotification?: (notification: PushNotificationSchema) => void;
  autoRegister?: boolean;
}

export function useNativePush(options: UseNativePushOptions = {}) {
  const { userId, onNotification, autoRegister = true } = options;
  const router = useRouter();

  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  // Check support and status
  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const enabled = await areNotificationsEnabled();
        setIsEnabled(enabled);
      }
    };

    checkStatus();
  }, []);

  // Setup notification listeners
  useEffect(() => {
    if (!isNativeApp()) return;

    const handleNotificationReceived = (notification: PushNotificationSchema) => {
      // Show in-app toast for foreground notifications
      toast(notification.title || 'Nova notificacao', {
        description: notification.body,
        action: notification.data?.url
          ? {
              label: 'Ver',
              onClick: () => router.push(notification.data.url),
            }
          : undefined,
      });

      onNotification?.(notification);
    };

    const handleNotificationAction = (action: ActionPerformed) => {
      // Handle notification tap - navigate to relevant page
      const url = action.notification.data?.url;
      if (url) {
        router.push(url);
      }
    };

    const cleanup = setupPushListeners(handleNotificationReceived, handleNotificationAction);

    return cleanup;
  }, [router, onNotification]);

  // Auto-register on mount if enabled
  useEffect(() => {
    if (autoRegister && isNativeApp() && !deviceToken) {
      register();
    }
  }, [autoRegister]);

  // Register for push notifications
  const register = useCallback(async () => {
    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return null;
    }

    setIsRegistering(true);

    try {
      const token = await registerNativePush();

      if (token) {
        setDeviceToken(token);
        setIsEnabled(true);

        // Save token to server
        const saved = await saveDeviceToken(token, userId);
        if (!saved) {
          console.warn('Failed to save device token to server');
        }

        return token;
      }

      return null;
    } catch (error) {
      console.error('Error registering for push:', error);
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [userId]);

  // Refresh registration (e.g., after login)
  const refresh = useCallback(async () => {
    setDeviceToken(null);
    return register();
  }, [register]);

  return {
    isSupported,
    isEnabled,
    isRegistering,
    isNative: isNativeApp(),
    deviceToken,
    register,
    refresh,
  };
}
